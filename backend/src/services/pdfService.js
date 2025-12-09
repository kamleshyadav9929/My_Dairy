const PDFDocument = require('pdfkit');

/**
 * Generate customer statement PDF
 */
function generateCustomerStatement(customer, entries, payments, summary, dateRange) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(20).font('Helvetica-Bold')
                .text('Milk Passbook Statement', { align: 'center' });
            
            doc.moveDown();
            
            // Date range
            doc.fontSize(10).font('Helvetica')
                .text(`Period: ${dateRange.from} to ${dateRange.to}`, { align: 'center' });
            
            doc.moveDown();

            // Customer info
            doc.fontSize(12).font('Helvetica-Bold')
                .text('Customer Details');
            doc.fontSize(10).font('Helvetica')
                .text(`Name: ${customer.name}`)
                .text(`AMCU ID: ${customer.amcu_customer_id}`)
                .text(`Phone: ${customer.phone || 'N/A'}`);
            
            doc.moveDown();

            // Summary
            doc.fontSize(12).font('Helvetica-Bold')
                .text('Summary');
            doc.fontSize(10).font('Helvetica')
                .text(`Total Milk: ${summary.totalLitres.toFixed(2)} L`)
                .text(`Total Amount: ₹${summary.totalAmount.toFixed(2)}`)
                .text(`Total Payments: ₹${summary.totalPayments.toFixed(2)}`)
                .text(`Outstanding Balance: ₹${summary.balance.toFixed(2)}`);
            
            doc.moveDown();

            // Entries table header
            doc.fontSize(12).font('Helvetica-Bold')
                .text('Milk Entries');
            doc.moveDown(0.5);

            // Table header
            const tableTop = doc.y;
            const tableLeft = 50;
            
            doc.fontSize(8).font('Helvetica-Bold');
            doc.text('Date', tableLeft, tableTop);
            doc.text('Shift', tableLeft + 70, tableTop);
            doc.text('Qty(L)', tableLeft + 100, tableTop);
            doc.text('Fat', tableLeft + 140, tableTop);
            doc.text('SNF', tableLeft + 170, tableTop);
            doc.text('Rate', tableLeft + 200, tableTop);
            doc.text('Amount', tableLeft + 240, tableTop);

            // Draw line
            doc.moveTo(tableLeft, tableTop + 12)
                .lineTo(tableLeft + 290, tableTop + 12)
                .stroke();

            // Table rows
            let y = tableTop + 20;
            doc.font('Helvetica').fontSize(8);

            for (const entry of entries.slice(0, 50)) { // Limit to 50 entries per page
                if (y > 700) {
                    doc.addPage();
                    y = 50;
                }

                doc.text(entry.date, tableLeft, y);
                doc.text(entry.shift === 'M' ? 'Morning' : 'Evening', tableLeft + 70, y);
                doc.text(entry.quantity_litre.toFixed(2), tableLeft + 100, y);
                doc.text(entry.fat?.toFixed(1) || '-', tableLeft + 140, y);
                doc.text(entry.snf?.toFixed(1) || '-', tableLeft + 170, y);
                doc.text(`₹${entry.rate_per_litre.toFixed(2)}`, tableLeft + 200, y);
                doc.text(`₹${entry.amount.toFixed(2)}`, tableLeft + 240, y);

                y += 15;
            }

            // Payments section if any
            if (payments && payments.length > 0) {
                doc.addPage();
                doc.fontSize(12).font('Helvetica-Bold')
                    .text('Payments Received');
                doc.moveDown(0.5);

                const payTableTop = doc.y;
                doc.fontSize(8).font('Helvetica-Bold');
                doc.text('Date', tableLeft, payTableTop);
                doc.text('Amount', tableLeft + 80, payTableTop);
                doc.text('Mode', tableLeft + 150, payTableTop);
                doc.text('Reference', tableLeft + 220, payTableTop);

                doc.moveTo(tableLeft, payTableTop + 12)
                    .lineTo(tableLeft + 300, payTableTop + 12)
                    .stroke();

                let py = payTableTop + 20;
                doc.font('Helvetica');

                for (const payment of payments) {
                    doc.text(payment.date, tableLeft, py);
                    doc.text(`₹${payment.amount.toFixed(2)}`, tableLeft + 80, py);
                    doc.text(payment.mode, tableLeft + 150, py);
                    doc.text(payment.reference || '-', tableLeft + 220, py);
                    py += 15;
                }
            }

            // Footer
            doc.fontSize(8).font('Helvetica')
                .text(
                    `Generated on ${new Date().toLocaleDateString('en-IN')}`,
                    50,
                    doc.page.height - 50,
                    { align: 'center' }
                );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate daily collection report PDF
 */
function generateDailyReport(date, entries, totals, dairyName) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(18).font('Helvetica-Bold')
                .text(dairyName || 'Dairy', { align: 'center' });
            doc.fontSize(14)
                .text('Daily Collection Report', { align: 'center' });
            doc.fontSize(10).font('Helvetica')
                .text(`Date: ${date}`, { align: 'center' });
            
            doc.moveDown();

            // Summary
            doc.fontSize(12).font('Helvetica-Bold')
                .text('Summary');
            doc.fontSize(10).font('Helvetica')
                .text(`Total Entries: ${totals.count}`)
                .text(`Total Milk: ${totals.litres.toFixed(2)} L`)
                .text(`Total Amount: ₹${totals.amount.toFixed(2)}`);
            
            doc.moveDown();

            // Entries table
            doc.fontSize(12).font('Helvetica-Bold')
                .text('Entries');
            doc.moveDown(0.5);

            const tableTop = doc.y;
            const tableLeft = 50;
            
            doc.fontSize(7).font('Helvetica-Bold');
            doc.text('Time', tableLeft, tableTop);
            doc.text('Customer', tableLeft + 40, tableTop);
            doc.text('Shift', tableLeft + 120, tableTop);
            doc.text('Type', tableLeft + 150, tableTop);
            doc.text('Qty', tableLeft + 185, tableTop);
            doc.text('Fat', tableLeft + 215, tableTop);
            doc.text('SNF', tableLeft + 240, tableTop);
            doc.text('Rate', tableLeft + 265, tableTop);
            doc.text('Amount', tableLeft + 295, tableTop);

            doc.moveTo(tableLeft, tableTop + 10)
                .lineTo(tableLeft + 340, tableTop + 10)
                .stroke();

            let y = tableTop + 15;
            doc.font('Helvetica').fontSize(7);

            for (const entry of entries) {
                if (y > 700) {
                    doc.addPage();
                    y = 50;
                }

                doc.text(entry.time?.substring(0, 5) || '-', tableLeft, y);
                doc.text((entry.customer_name || '').substring(0, 15), tableLeft + 40, y);
                doc.text(entry.shift, tableLeft + 120, y);
                doc.text(entry.milk_type, tableLeft + 150, y);
                doc.text(entry.quantity_litre.toFixed(1), tableLeft + 185, y);
                doc.text(entry.fat?.toFixed(1) || '-', tableLeft + 215, y);
                doc.text(entry.snf?.toFixed(1) || '-', tableLeft + 240, y);
                doc.text(entry.rate_per_litre.toFixed(1), tableLeft + 265, y);
                doc.text(entry.amount.toFixed(0), tableLeft + 295, y);

                y += 12;
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generateCustomerStatement,
    generateDailyReport
};
