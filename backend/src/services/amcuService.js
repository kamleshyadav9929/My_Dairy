const { supabase } = require('../config/supabase');
const rateService = require('./rateService');

let serialPort = null;
let isConnected = false;
let lineBuffer = '';
let currentPacket = {};

// Event emitter for notifying about new entries
const EventEmitter = require('events');
const amcuEvents = new EventEmitter();

/**
 * Initialize the AMCU serial port connection
 */
async function initialize() {
    // Skip on Vercel serverless (no serial port access)
    if (process.env.VERCEL) {
        console.log('AMCU: Serial port disabled on Vercel serverless');
        return false;
    }

    if (process.env.AMCU_ENABLED !== 'true') {
        console.log('AMCU service disabled via AMCU_ENABLED=false');
        return false;
    }

    const portName = process.env.AMCU_PORT || 'COM4';
    const baudRate = parseInt(process.env.AMCU_BAUD) || 9600;

    try {
        // Dynamic import for serialport
        const { SerialPort } = await import('serialport');
        const { ReadlineParser } = await import('@serialport/parser-readline');

        serialPort = new SerialPort({
            path: portName,
            baudRate: baudRate,
            autoOpen: false
        });

        const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

        serialPort.on('open', () => {
            isConnected = true;
            console.log(`AMCU connected on ${portName} at ${baudRate} baud`);
            amcuEvents.emit('status', { connected: true, port: portName });
        });

        serialPort.on('close', () => {
            isConnected = false;
            console.log('AMCU disconnected');
            amcuEvents.emit('status', { connected: false, port: portName });
        });

        serialPort.on('error', (err) => {
            isConnected = false;
            console.error('AMCU serial port error:', err.message);
            amcuEvents.emit('error', err);
        });

        parser.on('data', (line) => {
            processLine(line.trim());
        });

        // Open the port
        serialPort.open((err) => {
            if (err) {
                console.error('Failed to open AMCU port:', err.message);
                console.log('AMCU service will run in simulation mode');
                isConnected = false;
            }
        });

        return true;
    } catch (error) {
        console.error('Failed to initialize AMCU service:', error.message);
        console.log('AMCU service will run in simulation mode');
        return false;
    }
}

/**
 * Process a line received from AMCU
 */
function processLine(line) {
    if (!line) return;

    // Log raw data
    logRawPacket(line, false, null);

    if (line === 'END') {
        // End of packet, process the collected data
        processPacket();
        return;
    }

    // Parse key:value pairs
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim().toUpperCase();
        const value = line.substring(colonIndex + 1).trim();
        
        // CLEAR PACKET on CID detection to prevent data leakage between farmers
        // CID marks the start of a new farmer's data
        if (key === 'CID') {
            currentPacket = {}; // Clear any stale data from previous farmer
            console.log('[AMCU] New farmer detected, packet cleared');
        }
        
        currentPacket[key] = value;
    }
}

/**
 * Process a complete packet and create milk entry
 */
async function processPacket() {
    const packet = { ...currentPacket };
    currentPacket = {};

    try {
        const parsedData = parsePacket(packet);
        
        if (parsedData) {
            const entry = await createMilkEntry(parsedData);
            
            // Log successful parse
            logRawPacket(JSON.stringify(packet), true, null);
            
            // Emit event for real-time updates
            amcuEvents.emit('entry', entry);
            
            console.log('AMCU entry created:', entry.id);
        }
    } catch (error) {
        console.error('Error processing AMCU packet:', error.message);
        logRawPacket(JSON.stringify(packet), false, error.message);
        
        // EMIT ERROR EVENT so frontend can beep/alert the operator
        amcuEvents.emit('error', {
            type: error.message.includes('rate') || error.message.includes('amount') ? 'RATE_ERROR' : 'PARSE_ERROR',
            message: error.message,
            packet: packet,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Parse AMCU packet into structured data
 */
function parsePacket(packet) {
    const required = ['CID', 'QTY'];
    
    for (const field of required) {
        if (!packet[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    }

    return {
        customerId: packet.CID,
        quantityLitre: parseFloat(packet.QTY) || 0,
        fat: parseFloat(packet.FAT) || null,
        snf: parseFloat(packet.SNF) || null,
        clr: parseFloat(packet.CLR) || null,
        amount: parseFloat(packet.AMT) || null,
        shift: packet.SHIFT || (new Date().getHours() < 12 ? 'M' : 'E'),
        milkType: packet.MILK || 'COW',
        date: packet.DATE || new Date().toISOString().split('T')[0],
        time: packet.TIME || new Date().toTimeString().split(' ')[0]
    };
}

/**
 * Create milk entry from parsed AMCU data (using Supabase)
 */
async function createMilkEntry(data) {
    // Find customer by AMCU ID
    const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id, milk_type_default')
        .eq('amcu_customer_id', data.customerId)
        .single();

    if (customerError || !customer) {
        throw new Error(`Customer not found with AMCU ID: ${data.customerId}`);
    }

    const milkType = data.milkType || customer.milk_type_default || 'COW';
    
    // Calculate rate if not provided
    let ratePerLitre = null;
    let amount = data.amount;
    
    if (data.fat && data.snf) {
        ratePerLitre = await rateService.calculateRate(milkType, data.fat, data.snf);
    } else {
        ratePerLitre = await rateService.calculateRate(milkType, 4.0, 8.5); // Default values
    }
    
    if (!amount) {
        // CRITICAL: Reject entries with zero rate (no matching rate card)
        if (!ratePerLitre || ratePerLitre <= 0) {
            throw new Error(`No rate card found for ${milkType} milk with Fat: ${data.fat || 4.0}%, SNF: ${data.snf || 8.5}%. Configure rate cards first.`);
        }
        amount = rateService.calculateAmount(data.quantityLitre, ratePerLitre);
    } else {
        // If amount is provided, calculate rate from it
        ratePerLitre = Math.round((amount / data.quantityLitre) * 100) / 100;
    }
    
    // Final validation: Ensure amount is not zero
    if (!amount || amount <= 0) {
        throw new Error('Cannot create entry with ₹0 amount. Check rate card configuration.');
    }

    // Insert milk entry using Supabase
    const { data: entry, error: insertError } = await supabase
        .from('milk_entries')
        .insert({
            customer_id: customer.id,
            date: data.date,
            time: data.time,
            shift: data.shift,
            milk_type: milkType,
            quantity_litre: data.quantityLitre,
            fat: data.fat,
            snf: data.snf,
            clr: data.clr,
            rate_per_litre: ratePerLitre,
            amount: amount,
            source: 'AMCU'
        })
        .select()
        .single();

    if (insertError) {
        throw new Error(`Failed to create entry: ${insertError.message}`);
    }

    return {
        id: entry.id,
        customerId: customer.id,
        amcuCustomerId: data.customerId,
        date: data.date,
        time: data.time,
        shift: data.shift,
        milkType,
        quantityLitre: data.quantityLitre,
        fat: data.fat,
        snf: data.snf,
        clr: data.clr,
        ratePerLitre,
        amount,
        source: 'AMCU'
    };
}

/**
 * Simulate AMCU data (for testing)
 */
async function simulateEntry(data) {
    try {
        const entry = await createMilkEntry(data);
        amcuEvents.emit('entry', entry);
        return entry;
    } catch (error) {
        logRawPacket(JSON.stringify(data), false, error.message);
        throw error;
    }
}

/**
 * Log raw AMCU packet (using Supabase)
 */
async function logRawPacket(rawText, parsedOk, errorMessage) {
    try {
        await supabase
            .from('amcu_logs')
            .insert({
                raw_text: rawText,
                parsed_ok: parsedOk,
                error_message: errorMessage
            });
    } catch (error) {
        console.error('Failed to log AMCU packet:', error.message);
    }
}

/**
 * Get connection status
 */
function getStatus() {
    return {
        connected: isConnected,
        enabled: process.env.AMCU_ENABLED === 'true',
        port: process.env.AMCU_PORT || 'COM4',
        baudRate: parseInt(process.env.AMCU_BAUD) || 9600
    };
}

/**
 * Get recent AMCU logs
 */
async function getRecentLogs(limit = 100) {
    const { data, error } = await supabase
        .from('amcu_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
    
    if (error) {
        console.error('Failed to get AMCU logs:', error.message);
        return [];
    }
    return data || [];
}

/**
 * Close the serial port
 */
function close() {
    if (serialPort && serialPort.isOpen) {
        serialPort.close();
    }
}

module.exports = {
    initialize,
    simulateEntry,
    getStatus,
    getRecentLogs,
    close,
    events: amcuEvents
};
