import React from 'react';
import type { Invoice, Payment } from '../types';
import { calculateInvoiceTotal, calculateTotalPaid, calculateRemainingBalance } from '../hooks/useInvoices';

interface InvoicePreviewProps {
  invoiceData: Invoice;
}

// Helper to format dates consistently as (dd-mm-yyyy) for display
const formatDateForDisplay = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    try {
        // Handles yyyy-mm-dd from date inputs
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [y, m, d] = dateStr.split('-');
            return `(${d}-${m}-${y})`;
        }
        // Handles dd/mm/yyyy from invoiceDate/paymentDate
        if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
             const [d, m, y] = dateStr.split('/');
             return `(${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y})`;
        }
    } catch (e) {
        // If parsing fails, return original as-is
    }
    // Fallback for other text like "As per last invoice"
    return `(${dateStr})`;
};


export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoiceData }) => {
  const { services, customerName, customerAddress, customerPhone, invoiceNumber, invoiceDate, payments, oldBalance, advancePaid } = invoiceData;

  const serviceTotal = calculateInvoiceTotal(services);
  const balanceDue = calculateRemainingBalance(invoiceData);

  // Original logic for tax/discount display
  const subtotal = services.reduce((sum, s) => sum + (s.price * s.quantity), 0);
  const tax = subtotal * 0.18;
  const discount = tax;

  const hasFinancialAdjustments = (oldBalance && oldBalance.amount > 0) || (advancePaid && advancePaid.amount > 0) || (payments && payments.length > 0);
  const finalTotalLabel = hasFinancialAdjustments ? "REMAINING BALANCE" : "GRAND TOTAL";
  const newServiceTotalLabel = (finalTotalLabel === "GRAND TOTAL") ? "TOTAL" : "NEW SERVICE TOTAL";

  const FinancialEntry: React.FC<{ label: string; amount: number; date?: string; sign: '+' | '-'; color: 'red' | 'green' | 'blue' }> = ({ label, amount, date, sign, color }) => (
    <div className="flex justify-between text-gray-700 mb-2">
      <p>{label}:</p>
      <p><span className={`font-semibold text-${color}-500`}>{sign}</span> ₹{amount.toFixed(2)} {formatDateForDisplay(date)}</p>
    </div>
  );

  return (
    <div id="invoice-preview-container">
      {/* This is the visual A4 page and the element that will be captured for PDF */}
      <div id="invoice-preview-content" className="w-full max-w-3xl aspect-[210/297] mx-auto bg-white text-gray-800 shadow-lg p-6 sm:p-8 overflow-hidden">
        
        <div className="text-center mb-6 border-b pb-4">
          <div className="w-40 h-16 bg-slate-200 mx-auto mb-2 flex items-center justify-center text-slate-400 text-sm">Sri Vari Logo</div>
          <div className="flex items-center justify-center">
            <div className="w-22 h-16 bg-slate-200 mr-3 flex items-center justify-center text-slate-400 text-sm">VOS Logo</div>
            <div className="flex flex-col">
              <h1 className="text-4xl font-bold text-blue-700">VOS WASH</h1>
              <p className="text-right text-sm">(Clean Everything)</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6 text-sm">
          <div>
            <h2 className="font-bold text-gray-700 mb-1">BILL TO:</h2>
            <p>{customerName}</p>
            <p>{customerAddress}</p>
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
        </div>
        
        <table className="w-full text-left mb-8 text-sm border border-blue-600 rounded-lg overflow-hidden">
          <thead className="bg-blue-600 text-white border-b-2 border-blue-800">
            <tr>
              <th className="p-2 font-semibold text-sm">SL NO.</th>
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
        
        <div className="flex justify-end">
          <div className="w-full sm:w-1/2 text-sm">
            <div className="flex justify-between text-gray-700 mb-1">
              <p>Subtotal (Service Cost):</p>
              <p>₹{subtotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-between text-gray-700 mb-2">
              <p>GST (18%):</p>
              <p>+ ₹{tax.toFixed(2)}</p>
            </div>
            <div className="flex justify-between text-gray-700 mb-2 border-b border-dashed pb-2">
              <p>Discount (Equal to GST):</p>
              <p>- ₹{discount.toFixed(2)}</p>
            </div>
            <div className="flex justify-between text-lg mt-2 pt-2 border-b-2 border-dashed border-gray-400 font-extrabold text-blue-700">
              <p>{newServiceTotalLabel}:</p>
              <p>₹{serviceTotal.toFixed(2)}</p>
            </div>
            
            <div className="mt-4 pt-2 border-b-2 border-dashed border-gray-400 pb-2">
              {oldBalance && oldBalance.amount > 0 && (
                <FinancialEntry label="Old Balance (Arrears)" amount={oldBalance.amount} date={oldBalance.date} sign="+" color="red" />
              )}
              {advancePaid && advancePaid.amount > 0 && (
                <FinancialEntry label="Advance Paid (Earlier)" amount={advancePaid.amount} date={advancePaid.date} sign="-" color="green" />
              )}
              {payments.map((p, i) => {
                 const paymentLabel = `Now Paid (${p.method})`;
                 return <FinancialEntry key={i} label={paymentLabel} amount={p.amount} date={p.date} sign="-" color="blue" />
              })}
            </div>

            <div className="flex justify-between font-extrabold text-2xl mt-4 pt-2 border-t-4 border-blue-600 bg-blue-50 p-2 rounded-lg shadow-inner">
              <p className="text-blue-800">{finalTotalLabel}:</p>
              <p className="text-blue-800">₹{balanceDue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
          <p>This is a computer-generated invoice and does not require a signature.</p>
          <p>Thank you for choosing VOS WASH!</p>
        </div>
        <div className="mt-8 pt-4 border-t-2 border-gray-300 text-center">
          <p className="font-bold text-gray-700 text-lg mb-1">Our Premium Services</p>
          <p className="text-xs text-gray-700">
            <span className="text-gray-600 font-semibold">Rubbing Polish</span> | 
            <span className="text-gray-600 font-semibold">Detailing</span> | 
            <span className="text-gray-600 font-semibold">Fiber Shine Wash</span> | 
            <span className="text-gray-600 font-semibold">Interior Cleaning</span> | 
            <span className="text-gray-600 font-semibold">PPF & Ceramic</span> | 
            <span className="text-gray-600 font-semibold">Overall Body Wash</span> | 
            <span className="text-gray-600 font-semibold">Headlight Bright Wash</span> 
          </p>
        </div>
      </div>
      <style>{`
        @media print {
            body * { visibility: hidden; }
            .print-hidden { display: none; }
            #invoice-preview-container, #invoice-preview-container * { visibility: visible; }
            #invoice-preview-content {
                color: #000 !important;
                background-color: #fff !important;
                box-shadow: none !important;
                border: none !important;
                width: 100%;
                height: 100%;
                aspect-ratio: unset;
            }
            #invoice-preview-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
            }
        }
      `}</style>
    </div>
  );
};