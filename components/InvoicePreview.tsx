import React from 'react';
import type { Invoice } from '../types';
import { calculateInvoiceTotal, calculateRemainingBalance } from '../hooks/useInvoices';

interface InvoicePreviewProps {
  invoiceData: Invoice;
}

// Helper to format dates consistently as (YYYY-MM-DD) for display
const formatDateForDisplay = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    // Handles yyyy-mm-dd from date inputs
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return `(${dateStr})`;
    }
    // Handles dd/mm/yyyy from saved invoiceDate/paymentDate
    if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
         const [d, m, y] = dateStr.split('/');
         return `(${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')})`;
    }
    return `(${dateStr})`;
};


export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoiceData }) => {
  const { services, customerName, customerAddress, customerPhone, invoiceNumber, invoiceDate, payments, oldBalance, advancePaid } = invoiceData;

  const serviceTotal = calculateInvoiceTotal(services);
  const balanceDue = calculateRemainingBalance(invoiceData);

  const subtotal = services.reduce((sum, s) => sum + (s.price * s.quantity), 0);
  const tax = subtotal * 0.18;
  const discount = tax;

  return (
    <div id="invoice-preview-container">
      {/* This is the A4 container that will be captured for PDF */}
      <div id="invoice-preview-content" className="w-full max-w-3xl mx-auto bg-white text-gray-800 shadow-lg p-8 font-sans overflow-hidden">
        
        {/* Header */}
        <header className="text-center mb-8">
             <div className="w-48 mx-auto mb-2 flex items-center justify-center text-slate-400 text-sm" >
                <img src="data:image/png;base64,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" alt="Sri Vari Logo" className="object-contain h-full" />
             </div>
             <div className="flex items-center justify-center space-x-3">
                 <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 text-xs">VOS Logo</div>
                 <div>
                    <h1 className="text-4xl font-bold text-blue-700 tracking-wide">VOS WASH</h1>
                    <p className="text-sm text-gray-600">(Clean Everything)</p>
                 </div>
             </div>
        </header>

        
        
        {/* Bill To / Invoice Details */}
        <section className="flex justify-between items-start mb-8 text-sm">
          <div>
            <h2 className="font-bold text-gray-500 mb-1">BILL TO:</h2>
            <p className="font-semibold text-gray-800">{customerName}</p>
            <p className="text-gray-600">{customerAddress && customerAddress !== 'N/A' ? customerAddress : ''}</p>
            <p className="text-gray-600">{customerPhone}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-800">INVOICE</h2>
            <p className="text-gray-600"><strong>Invoice #:</strong> {invoiceNumber}</p>
            <p className="text-gray-600"><strong>Date:</strong> {invoiceDate}</p>
            <div className="mt-2 pt-2 border-t border-dashed">
              <p className="font-semibold text-gray-700">Uttarahalli, Bengaluru - 61</p>
              <p className="text-gray-600">+919845418725 / 6363178431</p>
            </div>
          </div>
        </section>
        
        {/* Services Table */}
        <section>
            <table className="w-full text-left text-sm">
                <thead className="border-b-2 border-blue-600 text-gray-500">
                    <tr>
                        <th className="pb-2 font-semibold">Sl No.</th>
                        <th className="pb-2 font-semibold">SERVICE</th>
                        <th className="pb-2 font-semibold text-center">QTY</th>
                        <th className="pb-2 font-semibold text-right">PRICE</th>
                        <th className="pb-2 font-semibold text-right">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {services.map((s, i) => (
                        <tr key={i} className="border-b border-gray-200">
                            <td className="py-2">{i + 1}</td>
                            <td className="py-2">{s.name}</td>
                            <td className="py-2 text-center">{s.quantity}</td>
                            <td className="py-2 text-right">₹{s.price.toFixed(2)}</td>
                            <td className="py-2 text-right font-semibold">₹{(s.price * s.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>

        {/* Totals Section */}
        <section className="flex justify-end mt-6">
            <div className="w-full max-w-xs text-sm space-y-2">
                <div className="flex justify-between"><span>Subtotal (Service Cost):</span> <span>₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>GST (18%):</span> <span>+ ₹{tax.toFixed(2)}</span></div>
                <div className="flex justify-between border-b border-dashed pb-2"><span>Discount (Equal to GST):</span> <span>- ₹{discount.toFixed(2)}</span></div>
                
                <div className="flex justify-between font-bold text-base pt-2 border-b-2 border-dashed border-gray-400 pb-2">
                    <span className="text-blue-700">NEW SERVICE TOTAL:</span>
                    <span className="text-blue-700">₹{serviceTotal.toFixed(2)}</span>
                </div>
                
                {oldBalance && oldBalance.amount > 0 && <div className="flex justify-between pt-2"><span>Old Balance (Arrears):</span> <span>+ ₹{oldBalance.amount.toFixed(2)} {formatDateForDisplay(oldBalance.date)}</span></div>}
                {advancePaid && advancePaid.amount > 0 && <div className="flex justify-between"><span>Advance Paid (Earlier):</span> <span>- ₹{advancePaid.amount.toFixed(2)} {formatDateForDisplay(advancePaid.date)}</span></div>}
                {payments.map((p, i) => <div key={i} className="flex justify-between"><span>Now Paid (Today):</span> <span>- ₹{p.amount.toFixed(2)}</span></div>)}
                
                <div className="border-t-2 border-dashed border-gray-400 mt-2 pt-2">
                     <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-3 flex justify-between items-center font-extrabold text-xl text-blue-800 dark:text-blue-300">
                        <span>REMAINING BALANCE:</span>
                        <span>₹{balanceDue.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </section>
        
        {/* Footer */}
        <footer className="absolute bottom-8 left-8 right-8 text-center text-xs text-gray-500">
             <hr className="mb-4"/>
            <p>This is a computer-generated invoice and does not require a signature.</p>
            <p>Thank you for choosing VOS WASH!</p>
        </footer>
      </div>
      <style>{`
        @media print {
            body * { visibility: hidden; }
            .print-hidden { display: none; }
            #invoice-preview-container, #invoice-preview-container * { visibility: visible; }
            #invoice-preview-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                padding: 2rem;
                color: #000 !important;
                background-color: #fff !important;
                box-shadow: none !important;
                border: none !important;
                aspect-ratio: unset;
            }
        }
      `}</style>
    </div>
  );
};