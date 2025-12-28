import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface PDFData {
  customer: {
    name: string;
    amcuId: string;
  };
  entries: any[];
  summary: {
    totalLitres: number;
    totalAmount: number;
    totalPayments: number;
    balance: number;
  };
  period: {
    from: string;
    to: string;
  };
}

export const generatePassbookPDF = async (data: PDFData) => {
  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #1e293b; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
          .title { font-size: 24px; font-bold; color: #4f46e5; margin: 0; }
          .subtitle { font-size: 14px; color: #64748b; margin-top: 5px; }
          
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 15px; rounded: 10px; }
          .info-item { font-size: 12px; }
          .info-label { color: #64748b; font-weight: bold; margin-bottom: 2px; }
          .info-value { font-size: 14px; font-weight: bold; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 11px; }
          th { background-color: #f1f5f9; text-align: left; padding: 10px; color: #475569; border-bottom: 1px solid #e2e8f0; }
          td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
          
          .summary-card { background-color: #1e293b; color: white; padding: 20px; border-radius: 15px; margin-top: 20px; }
          .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; }
          .summary-total { font-size: 18px; font-weight: bold; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; }
          
          .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 50px; }
          .badge { padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: bold; }
          .badge-milk { background: #e0e7ff; color: #4338ca; }
          .badge-payment { background: #ecfdf5; color: #065f46; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">My Dairy</h1>
          <p class="subtitle">Official Passbook Statement</p>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">CUSTOMER NAME</div>
            <div class="info-value">${data.customer.name}</div>
          </div>
          <div class="info-item">
            <div class="info-label">CUSTOMER ID</div>
            <div class="info-value">${data.customer.amcuId}</div>
          </div>
          <div class="info-item">
            <div class="info-label">STATEMENT PERIOD</div>
            <div class="info-value">${data.period.from} to ${data.period.to}</div>
          </div>
          <div class="info-item">
            <div class="info-label">GENERATED ON</div>
            <div class="info-value">${new Date().toLocaleDateString('en-IN')}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>DATE</th>
              <th>TYPE</th>
              <th>DESCRIPTION</th>
              <th>DEBIT</th>
              <th>CREDIT</th>
              <th>BALANCE</th>
            </tr>
          </thead>
          <tbody>
            ${data.entries.map(entry => `
              <tr>
                <td>${entry.date}</td>
                <td><span class="badge ${entry.type === 'entry' ? 'badge-milk' : 'badge-payment'}">${entry.type.toUpperCase()}</span></td>
                <td>${entry.description}</td>
                <td>${entry.debit > 0 ? '₹' + entry.debit : '-'}</td>
                <td>${entry.credit > 0 ? '₹' + entry.credit : '-'}</td>
                <td>₹${entry.balance}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary-card">
          <div class="summary-row">
            <span>Total Milk Quantity</span>
            <span>${data.summary.totalLitres.toFixed(2)} L</span>
          </div>
          <div class="summary-row">
            <span>Total Milk Amount</span>
            <span>₹${data.summary.totalAmount.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>Total Payments Received</span>
            <span>₹${data.summary.totalPayments.toFixed(2)}</span>
          </div>
          <div class="summary-total">
            <span>Closing Balance</span>
            <span>₹${data.summary.balance.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          This is a computer generated statement. No signature required.
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
};
