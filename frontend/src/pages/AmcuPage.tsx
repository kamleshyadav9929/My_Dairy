import { useState, useEffect, useRef, useCallback } from 'react';
import { amcuApi, customerApi, entryApi } from '../lib/api';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Loader2,
  Terminal,
  Users,
  Database,
  Radio,
  Usb,
  Check,
  X,
  AlertTriangle,
  Zap
} from 'lucide-react';

// Web Serial API type declarations for TypeScript
declare global {
  interface Navigator {
    serial: {
      requestPort(): Promise<SerialPort>;
    };
  }
  interface SerialPort {
    readable: ReadableStream | null;
    writable: WritableStream | null;
    open(options: { baudRate: number; dataBits?: number; parity?: string; stopBits?: number }): Promise<void>;
    close(): Promise<void>;
  }
}

interface AmcuStatus {
  connected: boolean;
  enabled: boolean;
  port: string;
  baudRate: number;
}

interface AmcuLog {
  id: number;
  raw_text: string;
  parsed_ok: number;
  error_message: string | null;
  created_at: string;
}

interface Customer {
  id: number;
  amcu_customer_id: string;
  name: string;
}

interface ParsedData {
  customerId: string;
  customerName?: string;
  weight: number;
  fat: number;
  snf?: number;
  rate?: number;
  amount?: number;
  shift?: string;
  milkType?: string;
  date?: string;
  time?: string;
}

// Check if Web Serial API is available
const isWebSerialSupported = 'serial' in navigator;

export default function AmcuPage() {
  // Backend status and logs - kept for potential future use
  const [, setStatus] = useState<AmcuStatus | null>(null);
  const [, setLogs] = useState<AmcuLog[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  
  // Serial port state
  const [serialPort, setSerialPort] = useState<SerialPort | null>(null);
  const [isSerialConnected, setIsSerialConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [serialData, setSerialData] = useState<string[]>([]);
  const [lastParsedData, setLastParsedData] = useState<ParsedData | null>(null);
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);
  const [autoCreate, setAutoCreate] = useState(false);
  const [entriesCreated, setEntriesCreated] = useState(0);
  
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const autoCreateRef = useRef(autoCreate);
  autoCreateRef.current = autoCreate; // Keep ref in sync with state
  
  const [simData, setSimData] = useState({
    customerId: '',
    quantityLitre: '5',
    fat: '4.5',
    snf: '8.5',
    milkType: 'COW',
    shift: new Date().getHours() < 12 ? 'M' : 'E'
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll serial logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serialData]);

  const loadData = async () => {
    try {
      // Load customers first - this should always work
      const customersRes = await customerApi.getAll({ limit: 500 });
      setCustomers(customersRes.data.customers || []);
      
      // Load AMCU-specific data separately (may fail if AMCU not enabled)
      try {
        const [statusRes, logsRes] = await Promise.all([
          amcuApi.getStatus(),
          amcuApi.getLogs(50)
        ]);
        setStatus(statusRes.data);
        setLogs(logsRes.data.logs || []);
      } catch (amcuError) {
        console.warn('AMCU service not available:', amcuError);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Parse AMCU data - supports multiple formats
  // Format 1: "ID,WEIGHT,FAT,SNF" e.g., "246,4.4,6.5,8.5"
  // Format 2: "ID,WEIGHT,FAT,SNF,RATE,AMOUNT" e.g., "246,4.4,6.5,8.5,61.55,270.82"
  // Format 3: Key:Value pairs (one per line)
  const parseAmcuData = (line: string): ParsedData | null => {
    try {
      const trimmed = line.trim();
      
      // Skip empty lines and headers
      if (!trimmed || trimmed.includes('दुग्ध') || trimmed.includes('RAMPUR')) {
        return null;
      }
      
      // Try comma-separated format first
      if (trimmed.includes(',')) {
        const parts = trimmed.split(',');
        if (parts.length >= 3) {
          const parsed: ParsedData = {
            customerId: parts[0].trim(),
            weight: parseFloat(parts[1]) || 0,
            fat: parseFloat(parts[2]) || 0,
          };
          if (parts[3]) parsed.snf = parseFloat(parts[3]) || undefined;
          if (parts[4]) parsed.rate = parseFloat(parts[4]) || undefined;
          if (parts[5]) parsed.amount = parseFloat(parts[5]) || undefined;
          
          // Validate - must have valid customer ID and weight
          if (parsed.customerId && parsed.weight > 0) {
            return parsed;
          }
        }
      }
      
      // Try key:value format (like slip)
      // Look for patterns like "सदस्य कोड: 246" or "वजन (ली.): 04.4"
      if (trimmed.includes(':')) {
        // This will be accumulated over multiple lines
        // Store in buffer and parse when we have all fields
        return null;
      }
      
      // Try space/tab separated
      const spaceParts = trimmed.split(/\s+/);
      if (spaceParts.length >= 3) {
        const nums = spaceParts.filter(p => !isNaN(parseFloat(p))).map(p => parseFloat(p));
        if (nums.length >= 3) {
          return {
            customerId: spaceParts[0],
            weight: nums[0],
            fat: nums[1],
            snf: nums[2],
            rate: nums[3],
            amount: nums[4]
          };
        }
      }
      
    } catch (e) {
      console.error('Parse error:', e);
    }
    return null;
  };

  // Connect to Serial Port
  const connectSerialPort = async () => {
    if (!isWebSerialSupported) {
      alert('Web Serial API not supported. Please use Chrome or Edge browser.');
      return;
    }

    try {
      setIsConnecting(true);
      
      // Request port from user
      const port = await navigator.serial.requestPort();
      
      // Open port with common AMCU settings
      await port.open({ 
        baudRate: 9600,
        dataBits: 8,
        parity: 'none',
        stopBits: 1
      });
      
      setSerialPort(port);
      setIsSerialConnected(true);
      setSerialData(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✓ Connected to serial port`]);
      
      // Start reading
      readSerialData(port);
      
    } catch (error) {
      const err = error as Error;
      console.error('Serial connection failed:', err);
      setSerialData(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✗ Connection failed: ${err.message}`]);
    } finally {
      setIsConnecting(false);
    }
  };

  // Read data from serial port
  const readSerialData = useCallback(async (port: SerialPort) => {
    if (!port.readable) return;
    
    const decoder = new TextDecoderStream();
    // Ignore the promise result as we're using the reader instead
    void port.readable.pipeTo(decoder.writable);
    const reader = decoder.readable.getReader();
    readerRef.current = reader;
    
    let buffer = '';
    
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim()) {
            const timestamp = new Date().toLocaleTimeString();
            setSerialData(prev => [...prev.slice(-100), `[${timestamp}] ${line.trim()}`]);
            
            // Try to parse as AMCU data
            const parsed = parseAmcuData(line);
            if (parsed) {
              setLastParsedData(parsed);
              setSerialData(prev => [...prev, `[${timestamp}] ✓ Parsed: Customer ${parsed.customerId}, ${parsed.weight}L, Fat ${parsed.fat}%${parsed.snf ? `, SNF ${parsed.snf}%` : ''}${parsed.rate ? `, Rate ₹${parsed.rate}` : ''}`]);
              
              // Auto-create entry if enabled
              if (autoCreateRef.current) {
                setSerialData(prev => [...prev, `[${timestamp}] ⚡ Auto-creating entry...`]);
                createEntryRef.current(parsed);
              }
            }
          }
        }
      }
    } catch (error) {
      const err = error as Error;
      if (err.name !== 'AbortError') {
        console.error('Read error:', err);
        setSerialData(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✗ Read error: ${err.message}`]);
      }
    }
  }, []);

  // Disconnect serial port
  const disconnectSerialPort = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      if (serialPort) {
        await serialPort.close();
        setSerialPort(null);
      }
      setIsSerialConnected(false);
      setSerialData(prev => [...prev, `[${new Date().toLocaleTimeString()}] Disconnected`]);
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  // Create entry from parsed AMCU data
  const createEntryFromAmcu = async (parsedData?: ParsedData) => {
    const data = parsedData || lastParsedData;
    if (!data) return;
    
    // Find customer by AMCU ID
    const customer = customers.find(c => c.amcu_customer_id === data.customerId);
    if (!customer) {
      setSerialData(prev => [...prev, `[${new Date().toLocaleTimeString()}] ⚠ Customer ${data.customerId} not found!`]);
      if (!parsedData) alert(`Customer with AMCU ID ${data.customerId} not found!`);
      return;
    }
    
    setIsCreatingEntry(true);
    try {
      await entryApi.create({
        customerId: customer.id,
        date: new Date().toISOString().split('T')[0],
        shift: data.shift || (new Date().getHours() < 12 ? 'M' : 'E'),
        milkType: data.milkType || 'COW',
        quantityLitre: data.weight,
        fat: data.fat,
        snf: data.snf,
        ratePerLitre: data.rate,
        amount: data.amount  // Pass amount directly from AMCU
      });
      
      setSerialData(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✓ Entry created for ${customer.name} - ₹${data.amount || (data.weight * (data.rate || 0)).toFixed(2)}`]);
      setEntriesCreated(prev => prev + 1);
      if (!parsedData) setLastParsedData(null);
      loadData();
    } catch (error) {
      const err = error as Error;
      console.error('Failed to create entry:', err);
      setSerialData(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✗ Failed to create entry: ${err.message}`]);
      if (!parsedData) alert('Failed to create entry: ' + err.message);
    } finally {
      setIsCreatingEntry(false);
    }
  };

  // Ref for auto-create callback to avoid stale closures
  const createEntryRef = useRef(createEntryFromAmcu);
  createEntryRef.current = createEntryFromAmcu;

  const handleSimulate = async () => {
    if (!simData.customerId) return alert('Select a customer');
    setIsSimulating(true);
    try {
      await amcuApi.simulate({
        customerId: simData.customerId,
        quantityLitre: parseFloat(simData.quantityLitre),
        fat: parseFloat(simData.fat),
        snf: parseFloat(simData.snf),
        milkType: simData.milkType,
        shift: simData.shift
      });
      loadData();
    } catch (error) {
      console.error('Simulation failed:', error);
      alert('Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            AMCU Console
          </h1>
          <p className="text-slate-500 mt-1">Real-time serial port connection & data capture</p>
        </div>
        <div className="flex items-center gap-2">
          {isWebSerialSupported ? (
            isSerialConnected ? (
              <button 
                onClick={disconnectSerialPort}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all font-medium shadow-sm"
              >
                <X className="w-4 h-4" />
                Disconnect
              </button>
            ) : (
              <button 
                onClick={connectSerialPort}
                disabled={isConnecting}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all font-medium shadow-sm disabled:opacity-50"
              >
                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Usb className="w-4 h-4" />}
                {isConnecting ? 'Connecting...' : 'Connect AMCU'}
              </button>
            )
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-100 text-amber-700 rounded-xl text-sm">
              <AlertTriangle className="w-4 h-4" />
              Use Chrome/Edge for serial
            </div>
          )}
          <button 
            onClick={loadData} 
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all border border-slate-200 font-medium shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Status Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Serial Connection Status Card */}
            <div className={`relative overflow-hidden rounded-2xl p-6 border transition-all ${
              isSerialConnected 
                ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                : 'bg-slate-50 border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm font-medium mb-1 ${isSerialConnected ? 'text-emerald-600' : 'text-slate-500'}`}>
                    Serial Connection
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {isSerialConnected ? 'CONNECTED' : 'DISCONNECTED'}
                  </h3>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="text-xs text-slate-600 bg-white px-2 py-1 rounded-lg w-fit border border-slate-200 flex items-center gap-1">
                      <Usb className="w-3 h-3" />
                      <span>Web Serial API</span>
                    </div>
                    {entriesCreated > 0 && (
                      <div className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg font-bold">
                        {entriesCreated} entries
                      </div>
                    )}
                  </div>
                  {/* Auto-Create Toggle */}
                  {isSerialConnected && (
                    <button
                      onClick={() => setAutoCreate(!autoCreate)}
                      className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        autoCreate 
                          ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                          : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Zap className={`w-3.5 h-3.5 ${autoCreate ? 'animate-pulse' : ''}`} />
                      Auto-Create: {autoCreate ? 'ON' : 'OFF'}
                    </button>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isSerialConnected ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'
                }`}>
                  {isSerialConnected ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
                </div>
              </div>
              {/* Pulse Effect */}
              {isSerialConnected && (
                <span className="absolute top-4 right-4 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              )}
            </div>

            {/* Last Captured Data Card */}
            <div className={`rounded-2xl p-6 border transition-all ${
              lastParsedData 
                ? 'bg-purple-50 border-purple-200' 
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm font-medium mb-1 ${lastParsedData ? 'text-purple-600' : 'text-slate-500'}`}>
                    Last Captured Data
                  </p>
                  {lastParsedData ? (
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-slate-900">ID: {lastParsedData.customerId}</p>
                      <div className="flex gap-3 text-sm text-slate-600">
                        <span><strong>{lastParsedData.weight}</strong>L</span>
                        <span>Fat: <strong>{lastParsedData.fat}%</strong></span>
                        <span>SNF: <strong>{lastParsedData.snf}%</strong></span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-slate-400">No data captured</p>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  lastParsedData ? 'bg-purple-100 text-purple-600' : 'bg-slate-200 text-slate-400'
                }`}>
                  <Database className="w-6 h-6" />
                </div>
              </div>
              {lastParsedData && (
                <button
                  onClick={() => createEntryFromAmcu()}
                  disabled={isCreatingEntry}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                >
                  {isCreatingEntry ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Create Entry
                </button>
              )}
            </div>
          </div>

          {/* Serial Terminal */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[400px]">
            <div className="bg-slate-800 border-b border-slate-700 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isSerialConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <span className="ml-2 text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-3 h-3" />
                  Serial Monitor {isSerialConnected ? '(9600 baud)' : '(disconnected)'}
                </span>
              </div>
              <button
                onClick={() => setSerialData([])}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 font-mono text-xs space-y-1 bg-slate-900">
              {serialData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <Usb className="w-8 h-8 mb-2 opacity-50" />
                  <p>Click "Connect AMCU" to start</p>
                  <p className="text-slate-600 mt-1">Expected format: ID,WEIGHT,FAT,SNF</p>
                </div>
              ) : (
                serialData.map((line, i) => (
                  <div key={i} className={`${
                    line.includes('✓') ? 'text-emerald-400' : 
                    line.includes('✗') ? 'text-red-400' : 
                    'text-slate-300'
                  }`}>
                    {line}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

        {/* Simulation Panel (for testing without hardware) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Manual Entry</h3>
              <p className="text-xs text-slate-500">Test without AMCU hardware</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</label>
              <div className="relative">
                <select
                  value={simData.customerId}
                  onChange={(e) => setSimData({ ...simData, customerId: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all appearance-none"
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.amcu_customer_id}>
                      {c.name} (#{c.amcu_customer_id})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty (L)</label>
                <input
                  type="number"
                  step="0.1"
                  value={simData.quantityLitre}
                  onChange={(e) => setSimData({ ...simData, quantityLitre: e.target.value })}
                  className="w-full mt-2 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Milk Type</label>
                <select
                  value={simData.milkType}
                  onChange={(e) => setSimData({ ...simData, milkType: e.target.value })}
                  className="w-full mt-2 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 appearance-none"
                >
                  <option value="COW">Cow</option>
                  <option value="BUFFALO">Buffalo</option>
                  <option value="MIXED">Mixed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fat %</label>
                <input
                  type="number"
                  step="0.1"
                  value={simData.fat}
                  onChange={(e) => setSimData({ ...simData, fat: e.target.value })}
                  className="w-full mt-2 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SNF %</label>
                <input
                  type="number"
                  step="0.1"
                  value={simData.snf}
                  onChange={(e) => setSimData({ ...simData, snf: e.target.value })}
                  className="w-full mt-2 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                />
              </div>
            </div>

            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all shadow-lg shadow-purple-500/25 font-bold disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isSimulating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Radio className="w-5 h-5 group-hover:animate-pulse" />}
              <span>Create Entry</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
