import { useState, useEffect, useRef } from 'react';
import { entryApi, customerApi } from '../lib/api';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  FileText, 
  Download, 
  Loader2, 
  Calendar, 
  FileSpreadsheet,
  Printer,
  BookOpen
} from 'lucide-react';

interface PassbookData {
  entries: any[];
  payments: any[];
  openingBalance: number;
  closingBalance: number;
  summary: {
    totalMilk: number;
    totalAmount: number;
    totalPaid: number;
  };
}

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [pdfDate, setPdfDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Export States
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Passbook States
  const [customers, setCustomers] = useState<{value: string, label: string, subLabel: string}[]>([]);
  const [passbookCustomerId, setPassbookCustomerId] = useState('');
  const [passbookFrom, setPassbookFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [passbookTo, setPassbookTo] = useState(new Date().toISOString().split('T')[0]);
  const [showPassbookModal, setShowPassbookModal] = useState(false);
  const [passbookData, setPassbookData] = useState<PassbookData | null>(null);
  const [isLoadingPassbook, setIsLoadingPassbook] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Passbook_${passbookCustomerId}_${passbookFrom}`,
  });

  const handleDownloadPdf = async () => {
    if (!passbookData) return;
    setIsDownloadingPdf(true);

    try {
      const customerName = customers.find(c => c.value === passbookCustomerId)?.label || 'Unknown';
      const amcuId = customers.find(c => c.value === passbookCustomerId)?.subLabel?.substring(1) || '';
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('My Dairy', 14, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text('MANAGEMENT SYSTEM', 14, 26);
      
      doc.setFontSize(14);
      doc.setTextColor(150);
      doc.text('PASSBOOK STATEMENT', pageWidth - 14, 20, { align: 'right' });
      
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 14, 26, { align: 'right' });
      
      // Line separator
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.5);
      doc.line(14, 32, pageWidth - 14, 32);
      
      // Customer Details Box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 38, pageWidth - 28, 28, 3, 3, 'F');
      
      doc.setTextColor(0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Customer Details', 18, 45);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(customerName, 18, 54);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`AMCU ID: #${amcuId}`, 18, 60);
      
      // Statement Period (right side)
      doc.setTextColor(100);
      doc.text('Statement Period', pageWidth - 18, 45, { align: 'right' });
      
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${new Date(passbookFrom).toLocaleDateString()} - ${new Date(passbookTo).toLocaleDateString()}`, pageWidth - 18, 54, { align: 'right' });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`${passbookData.entries?.length || 0} entries found`, pageWidth - 18, 60, { align: 'right' });
      
      // Summary Cards
      let yPos = 75;
      const cardWidth = (pageWidth - 42) / 3;
      
      // Total Milk Card
      doc.setFillColor(239, 246, 255); // blue-50
      doc.roundedRect(14, yPos, cardWidth, 22, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(96, 165, 250); // blue-400
      doc.text('TOTAL MILK', 18, yPos + 8);
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'bold');
      doc.text(`${passbookData.summary?.totalMilk?.toFixed(2) || '0.00'} L`, 18, yPos + 17);
      
      // Total Amount Card
      doc.setFillColor(236, 253, 245); // emerald-50
      doc.roundedRect(14 + cardWidth + 7, yPos, cardWidth, 22, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(16, 185, 129); // emerald-500
      doc.text('TOTAL AMOUNT', 18 + cardWidth + 7, yPos + 8);
      doc.setFontSize(14);
      doc.setTextColor(4, 120, 87); // emerald-700
      doc.setFont('helvetica', 'bold');
      doc.text(`Rs.${passbookData.summary?.totalAmount?.toFixed(0) || '0'}`, 18 + cardWidth + 7, yPos + 17);
      
      // Paid Amount Card
      doc.setFillColor(238, 242, 255); // indigo-50
      doc.roundedRect(14 + (cardWidth + 7) * 2, yPos, cardWidth, 22, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(129, 140, 248); // indigo-400
      doc.text('PAID AMOUNT', 18 + (cardWidth + 7) * 2, yPos + 8);
      doc.setFontSize(14);
      doc.setTextColor(67, 56, 202); // indigo-700
      doc.setFont('helvetica', 'bold');
      doc.text(`Rs.${passbookData.summary?.totalPaid?.toFixed(0) || '0'}`, 18 + (cardWidth + 7) * 2, yPos + 17);
      
      // Transactions Table
      yPos = 105;
      doc.setTextColor(150);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('DETAILED TRANSACTIONS', 14, yPos);
      
      const tableData = passbookData.entries?.map((entry: any) => [
        new Date(entry.date).toLocaleDateString(),
        entry.shift === 'M' ? 'Morning' : 'Evening',
        `${entry.quantity_litre} L`,
        entry.fat || '-',
        entry.snf || '-',
        `Rs.${entry.rate_per_litre}`,
        `Rs.${entry.amount.toFixed(2)}`
      ]) || [];
      
      autoTable(doc, {
        startY: yPos + 5,
        head: [['Date', 'Shift', 'Qty', 'Fat', 'SNF', 'Rate', 'Amount']],
        body: tableData.length > 0 ? tableData : [['No entries found for this period', '', '', '', '', '', '']],
        foot: tableData.length > 0 ? [[
          'Period Totals', 
          '', 
          `${passbookData.summary?.totalMilk?.toFixed(2)} L`,
          '',
          '',
          '',
          `Rs.${passbookData.summary?.totalAmount?.toFixed(2) || '0.00'}`
        ]] : undefined,
        theme: 'striped',
        headStyles: { 
          fillColor: [15, 23, 42], 
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        footStyles: {
          fillColor: [248, 250, 252],
          textColor: [4, 120, 87],
          fontStyle: 'bold',
          fontSize: 9
        },
        styles: { 
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 22 },
          2: { cellWidth: 18, halign: 'right' },
          3: { cellWidth: 15, halign: 'right' },
          4: { cellWidth: 15, halign: 'right' },
          5: { cellWidth: 22, halign: 'right' },
          6: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
        }
      });
      
      // Payments Table (if any)
      if (passbookData.payments && passbookData.payments.length > 0) {
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        
        doc.setTextColor(150);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('PAYMENT HISTORY', 14, finalY);
        
        const paymentData = passbookData.payments.map((payment: any) => [
          new Date(payment.date).toLocaleDateString(),
          payment.mode,
          payment.reference || '-',
          `Rs.${payment.amount}`
        ]);
        
        autoTable(doc, {
          startY: finalY + 5,
          head: [['Date', 'Mode', 'Reference', 'Amount']],
          body: paymentData,
          theme: 'striped',
          headStyles: { 
            fillColor: [100, 116, 139], 
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9
          },
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: {
            3: { halign: 'right', textColor: [79, 70, 229], fontStyle: 'bold' }
          }
        });
      }
      
      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 15, { align: 'center' });
      doc.text('This is a computer generated statement and does not require a signature.', pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      // Save PDF
      doc.save(`Passbook_${customerName}_${passbookFrom}.pdf`);
      
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please use the Print button instead.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await customerApi.getAll({ limit: 1000 });
      setCustomers(res.data.customers.map((c: any) => ({
        value: c.id.toString(),
        label: c.name,
        subLabel: `#${c.amcu_customer_id}`
      })));
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const generatePassbook = async () => {
    if (!passbookCustomerId) return;
    setIsLoadingPassbook(true);
    try {
      const res = await customerApi.getPassbook(parseInt(passbookCustomerId), { 
        from: passbookFrom, 
        to: passbookTo 
      });
      setPassbookData(res.data);
      setShowPassbookModal(true);
    } catch (error) {
      console.error('Failed to generate passbook:', error);
      alert('Failed to generate passbook data');
    } finally {
      setIsLoadingPassbook(false);
    }
  };

  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      const res = await entryApi.exportCsv({ from: dateFrom, to: dateTo });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `milk_entries_${dateFrom}_${dateTo}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const res = await entryApi.exportPdf({ date: pdfDate });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `daily_report_${pdfDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">
            Reports Center
          </h1>
          <p className="text-slate-500 mt-1">Generate and download business reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Passbook Generation Card */}
        <div className="group relative bg-white border border-slate-200 rounded-3xl p-6 overflow-hidden hover:border-blue-500/30 transition-all duration-300 lg:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          
          <div className="relative flex flex-col h-full">
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                <BookOpen className="w-7 h-7" />
              </div>
              <div className="bg-blue-500/10 text-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Passbook
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">Customer Passbook</h2>
            <p className="text-slate-500 mb-6 text-sm leading-relaxed">
              Generate a printable passbook statement for any customer.
            </p>

            <div className="mt-auto space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</label>
                <Select
                  value={passbookCustomerId}
                  onChange={setPassbookCustomerId}
                  options={customers}
                  placeholder="Select Customer"
                  searchable
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                   <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">From</label>
                   <input type="date" value={passbookFrom} onChange={(e) => setPassbookFrom(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">To</label>
                   <input type="date" value={passbookTo} onChange={(e) => setPassbookTo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
              </div>

              <button
                onClick={generatePassbook}
                disabled={isLoadingPassbook || !passbookCustomerId}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-500/25 font-bold disabled:opacity-50 disabled:cursor-not-allowed group-hover:translate-y-[-2px]"
              >
                {isLoadingPassbook ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
                Generate Passbook
              </button>
            </div>
          </div>
        </div>

        {/* CSV Export Card */}
        <div className="group relative bg-white border border-slate-200 rounded-3xl p-6 overflow-hidden hover:border-emerald-500/30 transition-all duration-300 lg:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          
          <div className="relative flex flex-col h-full">
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <div className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Export
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">Export Data</h2>
            <p className="text-slate-500 mb-6 text-sm leading-relaxed">
              Download complete logs in CSV format.
            </p>

            <div className="mt-auto space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                   <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">From</label>
                   <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">To</label>
                   <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
              </div>

              <button
                onClick={handleExportCsv}
                disabled={isExportingCsv}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/25 font-bold group-hover:translate-y-[-2px]"
              >
                {isExportingCsv ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                Download CSV
              </button>
            </div>
          </div>
        </div>

        {/* PDF Export Card */}
        <div className="group relative bg-white border border-slate-200 rounded-3xl p-6 overflow-hidden hover:border-red-500/30 transition-all duration-300 lg:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          
          <div className="relative flex flex-col h-full">
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400">
                <FileText className="w-7 h-7" />
              </div>
              <div className="bg-red-500/10 text-red-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Daily Report
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">Daily Summary</h2>
            <p className="text-slate-500 mb-6 text-sm leading-relaxed">
              Generate a printable daily report breakdown.
            </p>

            <div className="mt-auto space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Report Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={pdfDate}
                    onChange={(e) => setPdfDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

               <div className="h-10"></div> {/* Spacer */}

              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all shadow-lg shadow-red-500/25 font-bold group-hover:translate-y-[-2px]"
              >
                {isExportingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
                Generate PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Passbook Modal */}
      <Modal
        isOpen={showPassbookModal}
        onClose={() => setShowPassbookModal(false)}
        title="Passbook Preview" 
      >
        {passbookData && (
          <div className="flex flex-col h-[80vh]">
            {/* Toolbar */}
            <div className="flex flex-wrap justify-end mb-4 gap-2">
              <button
                onClick={() => setShowPassbookModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Close
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="px-4 py-2 text-sm bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
                title="Download as PDF"
              >
                {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download PDF
              </button>
              <button
                onClick={() => handlePrint()}
                className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-auto bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div 
                ref={printRef} 
                className="bg-white p-8 max-w-[210mm] mx-auto min-h-[297mm] shadow-sm print:shadow-none print:w-full print:p-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-6 mb-8">
                   <div className="flex items-center gap-4">
                      <img 
                        src="/logo.png" 
                        alt="Logo" 
                        className="w-16 h-16 rounded-xl object-cover" 
                        onError={(e) => e.currentTarget.style.display = 'none'} 
                      />
                      <div>
                         <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">My Dairy</h1>
                         <p className="text-slate-500 font-medium text-sm mt-1 uppercase tracking-widest">Management System</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <h2 className="text-xl font-bold text-slate-400 uppercase tracking-widest">Passbook Statement</h2>
                      <p className="text-slate-500 text-sm mt-1">Generated: {new Date().toLocaleDateString()}</p>
                   </div>
                </div>

                {/* Customer Details Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 flex flex-col md:flex-row justify-between gap-6">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Customer Details</p>
                    <p className="text-2xl font-bold text-slate-900 mb-1">
                      {customers.find(c => c.value === passbookCustomerId)?.label}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium bg-white px-2 py-1 rounded-md border border-slate-200 w-fit">
                      <span className="text-slate-400">AMCU ID:</span>
                      <span className="text-indigo-600">#{customers.find(c => c.value === passbookCustomerId)?.subLabel?.substring(1)}</span>
                    </div>
                  </div>
                  <div className="text-right md:text-right">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Statement Period</p>
                     <p className="text-xl font-bold text-slate-900">
                        {new Date(passbookFrom).toLocaleDateString()} <span className="text-slate-400 mx-2">-</span> {new Date(passbookTo).toLocaleDateString()}
                     </p>
                     <div className="mt-2 text-sm text-slate-500">
                        {passbookData.entries?.length || 0} entries found
                     </div>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-6 mb-8 print:grid-cols-3">
                  <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Total Milk</p>
                    <p className="text-2xl font-bold text-slate-900 flex items-baseline gap-1">
                       {passbookData.summary?.totalMilk?.toFixed(2) || '0.00'} 
                       <span className="text-base text-slate-500 font-medium">Litre</span>
                    </p>
                  </div>
                  <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2">Total Amount</p>
                    <p className="text-2xl font-bold text-emerald-700">₹{passbookData.summary?.totalAmount?.toFixed(0) || '0'}</p>
                  </div>
                  <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Paid Amount</p>
                    <p className="text-2xl font-bold text-indigo-700">₹{passbookData.summary?.totalPaid?.toFixed(0) || '0'}</p>
                  </div>
                </div>

                {/* Main Table */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Detailed Transactions</h3>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-900">
                        <th className="py-3 text-left font-bold text-slate-900 border-b-2 border-slate-800 w-[15%]">Date</th>
                        <th className="py-3 text-left font-bold text-slate-900 border-b-2 border-slate-800 w-[15%]">Shift</th>
                        <th className="py-3 text-right font-bold text-slate-900 border-b-2 border-slate-800 w-[10%]">Qty</th>
                        <th className="py-3 text-right font-bold text-slate-900 border-b-2 border-slate-800 w-[10%]">Fat</th>
                        <th className="py-3 text-right font-bold text-slate-900 border-b-2 border-slate-800 w-[10%]">SNF</th>
                        <th className="py-3 text-right font-bold text-slate-900 border-b-2 border-slate-800 w-[15%]">Rate</th>
                        <th className="py-3 text-right font-bold text-slate-900 border-b-2 border-slate-800 w-[15%]">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {passbookData.entries?.map((entry: any, i: number) => (
                        <tr key={i} className="group hover:bg-slate-50">
                          <td className="py-3 text-slate-600 font-medium">{new Date(entry.date).toLocaleDateString()}</td>
                          <td className="py-3 text-slate-600">
                             <span className={`px-2 py-0.5 rounded text-xs font-bold ${entry.shift === 'M' ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                {entry.shift === 'M' ? 'Morning' : 'Evening'}
                             </span>
                          </td>
                          <td className="py-3 text-right text-slate-900 font-bold">{entry.quantity_litre} L</td>
                          <td className="py-3 text-right text-slate-600">{entry.fat || '-'}</td>
                          <td className="py-3 text-right text-slate-600">{entry.snf || '-'}</td>
                          <td className="py-3 text-right text-slate-600">₹{entry.rate_per_litre}</td>
                          <td className="py-3 text-right font-bold text-slate-900">₹{entry.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                      {(!passbookData.entries || passbookData.entries.length === 0) && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 bg-slate-50 rounded-b-xl italic">
                             No milk entries found for this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="border-t-2 border-slate-900 bg-slate-50">
                      <tr>
                        <td colSpan={2} className="py-4 pl-4 font-bold text-slate-900">Period Totals</td>
                        <td className="py-4 text-right font-bold text-slate-900">{passbookData.summary?.totalMilk?.toFixed(2)} L</td>
                        <td colSpan={3}></td>
                        <td className="py-4 text-right font-bold text-emerald-700 text-lg">₹{passbookData.summary?.totalAmount?.toFixed(2) || '0.00'}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                {/* Payments Section in Print */}
                {passbookData.payments && passbookData.payments.length > 0 && (
                  <div className="mb-12">
                     <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Payment History</h3>
                     <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-300">
                          <th className="py-2 text-left font-bold text-slate-700 w-[20%]">Date</th>
                          <th className="py-2 text-left font-bold text-slate-700 w-[20%]">Mode</th>
                          <th className="py-2 text-left font-bold text-slate-700 w-[40%]">Reference</th>
                          <th className="py-2 text-right font-bold text-slate-700 w-[20%]">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {passbookData.payments.map((payment: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-2 text-slate-600">{new Date(payment.date).toLocaleDateString()}</td>
                            <td className="py-2 text-slate-600 capitalize">
                               <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-bold text-slate-600">{payment.mode}</span>
                            </td>
                            <td className="py-2 text-slate-600 font-mono text-xs">{payment.reference || '-'}</td>
                            <td className="py-2 text-right font-bold text-indigo-600">₹{payment.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* Footer */}
                <div className="mt-auto border-t border-slate-200 pt-8 text-center text-xs text-slate-400">
                  <p className="font-medium text-slate-500 mb-1">Thank you for your business!</p>
                  <p>This is a computer generated statement and does not require a signature.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
