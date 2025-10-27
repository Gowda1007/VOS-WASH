import React from 'react';
import type { Invoice } from '../types';
import { calculateInvoiceTotal, calculateRemainingBalance } from '../hooks/useInvoices';
import { Logo, Vari } from './Common';

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
      {/* 
        This is the A4 container that will be captured for PDF.
        It uses w-full and an aspect ratio to maintain its shape.
        Content inside uses responsive units (sm:, md:) to scale down gracefully.
      */}
      <div id="invoice-preview-content" className="relative w-full mx-auto bg-white text-gray-800 shadow-lg font-sans aspect-[1/1.414] flex flex-col p-4 sm:p-6 md:p-8 text-[6pt] sm:text-[7pt] md:text-[8pt]">
        
        {/* Main Content Area */}
        <div className="flex-grow">
          {/* Header */}
          <header className="text-center mb-6 border-b pb-4">
              <Vari className="w-28 mx-auto mb-2" />
              <div className="flex items-center justify-center">
                  <Logo className="w-20" />
                  <div className="ml-2">
                      <h1 className="text-4xl sm:text-2xl md:text-3xl font-bold text-blue-700 tracking-normal">VOS WASH</h1>
                      <p className="text-[6pt] sm:text-[7pt] md:text-[8pt] text-right text-gray-600">(Clean Everything)</p>
                  </div>
              </div>
          </header>
          
          {/* Bill To / Invoice Details */}
          <section className="flex justify-between items-start mb-4 md:mb-6">
            <div>
              <h2 className="font-bold text-gray-500 mb-1">BILL TO:</h2>
              <p className="font-semibold text-gray-800">{customerName}</p>
              <p className="text-gray-600">{customerAddress && customerAddress !== 'N/A' ? customerAddress : ''}</p>
              <p className="text-gray-600">{customerPhone}</p>
            </div>
            <div className="text-right">
              <h2 className="text-base sm:text-lg font-bold text-gray-800">INVOICE</h2>
              <p className="text-gray-600"><strong>Invoice #:</strong> {invoiceNumber}</p>
              <p className="text-gray-600"><strong>Date:</strong> {invoiceDate}</p>
              <div className="mt-1 pt-1 border-t border-dashed">
                <p className="font-semibold text-gray-700">Uttarahalli, Bengaluru - 61</p>
                <p className="text-gray-600">+919845418725 / 6363178431</p>
              </div>
            </div>
          </section>
          
          {/* Services Table */}
          <section>
              <table className="w-full text-left">
                  <thead className="border-b-2 border-blue-600 text-gray-500">
                      <tr>
                          <th className="pb-1 font-semibold">Sl No.</th>
                          <th className="pb-1 font-semibold">SERVICE</th>
                          <th className="pb-1 font-semibold text-center">QTY</th>
                          <th className="pb-1 font-semibold text-right">PRICE</th>
                          <th className="pb-1 font-semibold text-right">TOTAL</th>
                      </tr>
                  </thead>
                  <tbody>
                      {services.map((s, i) => (
                          <tr key={i} className="border-b border-gray-200">
                              <td className="py-1">{i + 1}</td>
                              <td className="py-1">{s.name}</td>
                              <td className="py-1 text-center">{s.quantity}</td>
                              <td className="py-1 text-right">₹{s.price.toFixed(2)}</td>
                              <td className="py-1 text-right font-semibold">₹{(s.price * s.quantity).toFixed(2)}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </section>

          {/* Totals Section */}
          <section className="flex justify-end mt-2 md:mt-4">
              <div className="w-1/2 sm:w-2/3 md:w-1/2 max-w-[280px] space-y-1">
                  <div className="flex justify-between"><span>Subtotal:</span> <span>₹{subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>GST (18%):</span> <span>+ ₹{tax.toFixed(2)}</span></div>
                  <div className="flex justify-between border-b border-dashed pb-1"><span>Discount (GST):</span> <span>- ₹{discount.toFixed(2)}</span></div>
                  
                  <div className="flex justify-between font-bold text-xs sm:text-sm pt-1 border-b-2 border-dashed border-gray-400 pb-1">
                      <span className="text-blue-700">NEW TOTAL:</span>
                      <span className="text-blue-700">₹{serviceTotal.toFixed(2)}</span>
                  </div>
                  
                  {oldBalance && oldBalance.amount > 0 && <div className="flex justify-between pt-1"><span>Old Balance:</span> <span>+ ₹{oldBalance.amount.toFixed(2)} {formatDateForDisplay(oldBalance.date)}</span></div>}
                  {advancePaid && advancePaid.amount > 0 && <div className="flex justify-between"><span>Advance Paid:</span> <span>- ₹{advancePaid.amount.toFixed(2)} {formatDateForDisplay(advancePaid.date)}</span></div>}
                  {payments.map((p, i) => <div key={i} className="flex justify-between"><span>Now Paid:</span> <span>- ₹{p.amount.toFixed(2)}</span></div>)}
                  
                  <div className="border-t-2 border-dashed border-gray-400 mt-2 pt-2">
                       <div className="bg-blue-100 dark:bg-blue-900/50 rounded p-1 sm:p-2 flex justify-between items-center font-bold text-sm sm:text-base text-blue-800 dark:text-blue-300">
                          <span>BALANCE:</span>
                          <span>₹{balanceDue.toFixed(2)}</span>
                      </div>
                  </div>
              </div>
          </section>
        </div>
        
        {/* Footer */}
        <footer className="w-full text-center text-[5pt] sm:text-[6pt] md:text-[7pt] text-gray-500 pt-2">
             <hr className="mb-2"/>
            <p>This is a computer-generated invoice and does not require a signature.</p>
            <p>Thank you for choosing VOS WASH!</p>
        </footer>

      </div>
      <style>{`
        #invoice-preview-content {
            box-sizing: border-box; /* Ensures padding is included in width/height */
        }
        @media print {
            body * { visibility: hidden; }
            .print-hidden { display: none; }
            #invoice-preview-container, #invoice-preview-container * { 
                visibility: visible; 
            }
            #invoice-preview-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: auto; 
                min-height: 100%; 
                padding: 1cm;
                color: #000 !important;
                background-color: #fff !important;
                box-shadow: none !important;
                border: none !important;
                aspect-ratio: unset;
                font-size: 9pt;
            }
        }
      `}</style>
    </div>
  );
};
