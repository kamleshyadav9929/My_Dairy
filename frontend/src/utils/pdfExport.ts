import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PassbookEntry {
  date: string;
  type: 'entry' | 'payment' | 'advance';
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

interface CustomerInfo {
  name: string;
  amcuId: string;
  phone?: string;
}

interface PassbookData {
  customer: CustomerInfo;
  entries: PassbookEntry[];
  summary: {
    totalLitres: number;
    totalAmount: number;
    totalPayments: number;
    totalAdvances: number;
    balance: number;
  };
  period: {
    from: string;
    to: string;
  };
}

// Helper to format currency without special symbols (for PDF compatibility)
const formatAmount = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '-';
  const val = Math.abs(amount);
  return `Rs. ${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export function generatePassbookPDF(data: PassbookData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo
  const textDark: [number, number, number] = [30, 41, 59];
  const textLight: [number, number, number] = [100, 116, 139];
  
  // ============ HEADER ============
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Logo/Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('My Dairy', 15, 20);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Customer Passbook Statement', 15, 30);
  
  // Customer Info (right side)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(data.customer.name, pageWidth - 15, 15, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Customer ID: ${data.customer.amcuId}`, pageWidth - 15, 24, { align: 'right' });
  
  // Period
  const periodFrom = formatDate(data.period.from);
  const periodTo = formatDate(data.period.to);
  doc.text(`Period: ${periodFrom} to ${periodTo}`, pageWidth - 15, 33, { align: 'right' });
  
  // ============ SUMMARY SECTION ============
  let yPos = 55;
  
  doc.setTextColor(...textDark);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Account Summary', 15, yPos);
  
  yPos += 5;
  
  // Summary table with proper formatting
  const summaryData = [
    ['Total Milk Quantity', `${(data.summary.totalLitres || 0).toFixed(2)} Litres`],
    ['Total Milk Value (Debit)', formatAmount(data.summary.totalAmount)],
    ['Total Payments (Credit)', formatAmount(data.summary.totalPayments)],
    ['Total Advances', formatAmount(data.summary.totalAdvances)],
    ['Closing Balance', formatAmount(data.summary.balance)],
  ];
  
  autoTable(doc, {
    startY: yPos,
    body: summaryData,
    theme: 'plain',
    styles: { 
      fontSize: 10, 
      cellPadding: 4,
      textColor: textDark,
    },
    columnStyles: {
      0: { fontStyle: 'normal', cellWidth: 60, textColor: textLight },
      1: { fontStyle: 'bold', cellWidth: 50, halign: 'left' },
    },
    margin: { left: 15 },
  });
  
  // ============ TRANSACTIONS TABLE ============
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setTextColor(...textDark);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Transaction History', 15, yPos);
  
  yPos += 5;
  
  // Transform and format table data
  const tableData = data.entries.map(entry => {
    const typeLabel = entry.type === 'entry' ? 'Milk Entry' : 
                      entry.type === 'payment' ? 'Payment' : 'Advance';
    
    return [
      formatDate(entry.date),
      typeLabel,
      entry.description || '-',
      entry.debit > 0 ? formatAmount(entry.debit) : '-',
      entry.credit > 0 ? formatAmount(entry.credit) : '-',
      formatAmount(entry.balance),
    ];
  });
  
  autoTable(doc, {
    startY: yPos,
    head: [['Date', 'Type', 'Details', 'Debit', 'Credit', 'Balance']],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: primaryColor,
      fontSize: 9,
      fontStyle: 'bold',
      cellPadding: 4,
      halign: 'center',
    },
    bodyStyles: { 
      fontSize: 8,
      cellPadding: 3,
      textColor: textDark,
    },
    columnStyles: {
      0: { cellWidth: 28, halign: 'center' },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 55 },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 15, right: 15 },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });
  
  // ============ FOOTER ============
  const finalY = (doc as any).lastAutoTable.finalY;
  const footerY = Math.min(finalY + 20, doc.internal.pageSize.getHeight() - 15);
  
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} | My Dairy Management System`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );
  
  // Android-compatible PDF opening
  // Get PDF as base64 data URL and open in new tab
  const pdfDataUrl = doc.output('datauristring');
  
  // Try to open in new window/tab - works on Android Chrome
  const newWindow = window.open();
  if (newWindow) {
    newWindow.document.write(`
      <html>
        <head>
          <title>Passbook PDF</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { margin: 0; padding: 0; }
            iframe { width: 100%; height: 100vh; border: none; }
          </style>
        </head>
        <body>
          <iframe src="${pdfDataUrl}"></iframe>
        </body>
      </html>
    `);
    newWindow.document.close();
  } else {
    // Fallback: Create download link for browsers that block popups
    const link = document.createElement('a');
    link.href = pdfDataUrl;
    link.download = `Passbook_${data.customer.amcuId}.pdf`;
    link.click();
  }
}

