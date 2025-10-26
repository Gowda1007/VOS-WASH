import React from 'react';
import type { Invoice } from '../types';

interface InvoicePreviewProps {
  invoiceData: Invoice;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoiceData }) => {
  const { financials, totals, services, customerName, customerAddress, customerPhone, invoiceNumber, invoiceDate } = invoiceData;

  const hasFinancials = financials.oldBalance.included || financials.advancePaid.included || financials.nowPaid.included;
  const finalLabel = hasFinancials ? "Balance Due" : "Grand Total";

  return (
    <div id="invoice-preview-container" className="print-container">
      <div id="invoice-preview-content" className="p-6 bg-white dark:bg-slate-800 max-w-full shadow-lg rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
        <header className="flex justify-between items-start pb-4 border-b dark:border-slate-600">
            <div className="flex items-center space-x-3">
                <img src="/logo-sm.png" alt="VOS WASH Logo" className="w-16 h-16" />
                <div>
                    <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400">VOS WASH</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">(Clean Everything)</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Uttarahalli, Bengaluru - 61</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">+919845418725 / 6363178431</p>
                </div>
            </div>
            <div className="text-right">
                <h2 className="text-3xl font-bold uppercase text-slate-700 dark:text-slate-300">Invoice</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400"># {invoiceNumber}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Date: {invoiceDate}</p>
            </div>
        </header>

        <section className="my-6">
             <h3 className="font-semibold text-slate-500 dark:text-slate-400 text-sm mb-1">Bill To</h3>
             <p className="font-bold text-slate-800 dark:text-slate-100">{customerName}</p>
             <p className="text-slate-600 dark:text-slate-300">{customerAddress}</p>
             <p className="text-slate-600 dark:text-slate-300">{customerPhone}</p>
        </section>

        <table className="w-full text-left mb-8">
          <thead className="bg-slate-100 dark:bg-slate-700">
            <tr>
              <th className="p-3 font-semibold text-sm text-slate-600 dark:text-slate-300">Service</th>
              <th className="p-3 font-semibold text-sm text-slate-600 dark:text-slate-300 text-center">Qty</th>
              <th className="p-3 font-semibold text-sm text-slate-600 dark:text-slate-300 text-right">Price</th>
              <th className="p-3 font-semibold text-sm text-slate-600 dark:text-slate-300 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s, i) => (
              <tr key={i} className="border-b dark:border-slate-700">
                <td className="p-3">{s.name}</td>
                <td className="p-3 text-center">{s.quantity}</td>
                <td className="p-3 text-right">₹{s.price.toFixed(2)}</td>
                <td className="p-3 text-right font-semibold">₹{s.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
            <div className="w-full sm:w-1/2 text-slate-700 dark:text-slate-300 space-y-2 text-sm">
                <div className="flex justify-between"><p>Subtotal:</p><p>₹{totals.subtotal.toFixed(2)}</p></div>
                <div className="flex justify-between"><p>GST (18%):</p><p>+ ₹{totals.tax.toFixed(2)}</p></div>
                <div className="flex justify-between pb-2 border-b dark:border-slate-600"><p>Discount:</p><p>- ₹{totals.discount.toFixed(2)}</p></div>
                <div className="flex justify-between font-bold text-lg pt-2"><p>Service Total:</p><p>₹{totals.total.toFixed(2)}</p></div>
                
                {hasFinancials && (
                <div className="pt-4 space-y-2 border-t dark:border-slate-600 mt-4">
                    {financials.oldBalance.included && <div className="flex justify-between text-red-600 dark:text-red-400"><p>Old Balance Due:</p><p>+ ₹{financials.oldBalance.amount.toFixed(2)}</p></div>}
                    {financials.advancePaid.included && <div className="flex justify-between text-green-600 dark:text-green-400"><p>Advance Paid:</p><p>- ₹{financials.advancePaid.amount.toFixed(2)}</p></div>}
                    {financials.nowPaid.included && <div className="flex justify-between text-green-600 dark:text-green-400"><p>Amount Paid Today:</p><p>- ₹{financials.nowPaid.amount.toFixed(2)}</p></div>}
                </div>
                )}
                
                <div className="flex justify-between font-extrabold text-2xl mt-4 pt-4 border-t-2 border-slate-800 dark:border-slate-300 text-slate-800 dark:text-slate-100">
                    <p>{finalLabel}:</p>
                    <p>₹{totals.remainingBalance.toFixed(2)}</p>
                </div>
            </div>
        </div>
        <footer className="mt-12 pt-4 border-t dark:border-slate-600 text-center text-xs text-slate-500 dark:text-slate-400">
            <p>Thank you for choosing VOS WASH! This is a computer-generated invoice.</p>
        </footer>
      </div>
      <style>{`
        @media print {
            body * { visibility: hidden; }
            .print-container, .print-container * { visibility: visible; }
            #invoice-preview-content {
                color: #000 !important;
                background-color: #fff !important;
            }
            .print-container {
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