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

// Component to render financial entries like Old Balance, Advance Paid, etc.
const FinancialEntry: React.FC<{
  label: string;
  amount: number;
  date?: string;
  sign: '+' | '-';
  color: 'red' | 'green' | 'blue';
}> = ({ label, amount, date, sign, color }) => {
  const colorClasses = {
    red: 'text-red-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
  };

  return (
    <div className={`flex justify-between mb-2 ${colorClasses[color]}`}>
      <span>{label} {formatDateForDisplay(date)}</span>
      <span>{sign} ₹{amount.toFixed(2)}</span>
    </div>
  );
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
        Content inside uses responsive units to scale down gracefully.
      */}
      <div id="invoice-preview-content" className="relative w-full mx-auto bg-white text-gray-800 shadow-xl font-sans aspect-[1/1.414] flex flex-col p-6 sm:p-8 text-sm">
        
        {/* Main Content Area */}
        <div className="flex-grow">
          {/* Header */}
          <header className="text-center mb-6 border-b pb-4">
              <Vari className="w-28 mx-auto mb-2" />
              <div className="flex items-center justify-center">
                  <Logo className="w-20" />
                  <div className="flex flex-col">
                      <h1 className="text-4xl font-bold text-blue-700">VOS WASH</h1>
                      <p className="text-right">(Clean Everything)</p>
                  </div>
              </div>
          </header>
          
          {/* Bill To / Invoice Details */}
          <section className="flex flex-col sm:flex-row justify-between items-start mb-6 text-sm">
            <div>
              <h2 className="font-bold text-gray-700 mb-1">BILL TO:</h2>
              <p>{customerName}</p>
              <p>{customerAddress && customerAddress !== 'N/A' ? customerAddress : ''}</p>
              <p>{customerPhone}</p>
            </div>
            <div className="text-right mt-4 sm:mt-0">
              <h2 className="text-xl font-bold uppercase text-gray-700">Invoice</h2>
              <p className="text-gray-500 text-xs"><strong>Invoice #:</strong> {invoiceNumber}</p>
              <p className="text-gray-500 text-xs"><strong>Date:</strong> {invoiceDate}</p>
              <div className="mt-2 pt-2 border-t border-dashed">
                <p className="font-semibold text-xs">Uttarahalli, Bengaluru - 61</p>
                <p className="text-xs">+919845418725 / 6363178431</p>
              </div>
            </div>
          </section>
          
          {/* Services Table */}
          <section className="mb-8">
              <table className="w-full text-left text-sm border border-blue-600 rounded-lg overflow-hidden">
                  <thead className="bg-blue-600 text-white border-b-2 border-blue-800">
                      <tr>
                          <th className="p-2 font-semibold text-sm">Sl No.</th>
                          <th className="p-2 font-semibold text-sm">SERVICE</th>
                          <th className="p-2 font-semibold text-sm text-center">QTY</th>
                          <th className="p-2 font-semibold text-sm text-right">PRICE</th>
                          <th className="p-2 font-semibold text-sm text-right">TOTAL</th>
                      </tr>
                  </thead>
                  <tbody>
                      {services.map((s, i) => (
                          <tr key={i} className={`border-b border-gray-200 ${i % 2 === 0 ? 'bg-white' : 'bg-blue-50'}`}>
                              <td className="p-2 text-sm">{i + 1}</td>
                              <td className="p-2 text-sm">{s.name}</td>
                              <td className="p-2 text-center text-sm">{s.quantity}</td>
                              <td className="p-2 text-right text-sm">₹{s.price.toFixed(2)}</td>
                              <td className="p-2 text-right text-sm font-semibold text-gray-800">₹{(s.price * s.quantity).toFixed(2)}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </section>

          {/* Totals Section */}
          <section className="flex justify-end mt-auto">
              <div className="w-full sm:w-1/2 text-sm">
                  <div className="flex justify-between text-gray-700 mb-1"><p>Subtotal (Service Cost):</p><p>₹{subtotal.toFixed(2)}</p></div>
                  <div className="flex justify-between text-gray-700 mb-2"><p>GST (18%):</p><p>+ ₹{tax.toFixed(2)}</p></div>
                  <div className="flex justify-between text-gray-700 mb-2 border-b border-dashed pb-2"><p>Discount (Equal to GST):</p><p>- ₹{discount.toFixed(2)}</p></div>
                  
                  <div className="flex justify-between text-lg mt-2 pt-2 border-b-2 border-dashed border-gray-400 font-extrabold text-blue-700">
                      <p>SERVICE TOTAL:</p>
                      <p>₹{serviceTotal.toFixed(2)}</p>
                  </div>
                  
                  <div className="mt-4 pt-2 border-b-2 border-dashed border-gray-400 pb-2">
                    {oldBalance && oldBalance.amount > 0 && 
                        <FinancialEntry label="Old Balance (Arrears)" amount={oldBalance.amount} date={oldBalance.date} sign="+" color="red" />}
                    {advancePaid && advancePaid.amount > 0 &&
                        <FinancialEntry label="Advance Paid (Earlier)" amount={advancePaid.amount} date={advancePaid.date} sign="-" color="green" />}
                    {payments.map((p, i) => 
                        <FinancialEntry key={i} label="Now Paid (Today)" amount={p.amount} date={p.date} sign="-" color="blue" />)}
                  </div>
                  
                  <div className="flex justify-between font-extrabold text-2xl mt-4 pt-2 border-t-4 border-blue-600 bg-blue-50 p-2 rounded-lg shadow-inner">
                      <p className="text-blue-800">BALANCE DUE:</p>
                      <p className="text-blue-800">₹{balanceDue.toFixed(2)}</p>
                  </div>
              </div>
          </section>
        </div>
        
        {/* Footer */}
        <footer className="w-full text-center text-xs text-gray-500 mt-8 pt-4 border-t">
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
