
import React, { useState, useMemo } from 'react';
// Fix: Import createRoot from react-dom/client to handle dynamic rendering for PDF generation.
import { createRoot } from 'react-dom/client';
import type { Invoice } from '../types';
import { InvoicePreview } from './InvoicePreview';
import { downloadPDF } from '../services/pdfService';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  onDelete: (id: number) => void;
  onCollect: (id: number) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, invoices, onDelete, onCollect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return invoices
      .filter(inv => inv.customerPhone.includes(query) || inv.invoiceNumber.toLowerCase().includes(query))
      .sort((a, b) => b.id - a.id);
  }, [searchQuery, invoices]);

  if (!isOpen) return null;

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col">
        <header className="p-4 border-b flex justify-between items-center bg-gray-100">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-700">Invoice History</h2>
          <button onClick={() => { onClose(); setSelectedInvoice(null); }} className="text-gray-500 hover:text-gray-900 text-3xl leading-none">&times;</button>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* List View */}
          <div className={`w-full lg:w-1/3 flex flex-col p-4 border-r overflow-y-auto ${selectedInvoice ? 'hidden md:flex' : 'flex'}`}>
            <input
              type="search"
              placeholder="Search by Phone or Invoice #"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex-grow space-y-3">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map(inv => (
                  <InvoiceListItem key={inv.id} invoice={inv} onSelect={handleSelectInvoice} onDelete={onDelete} onCollect={onCollect} />
                ))
              ) : (
                <p className="text-center text-gray-500">No invoices found.</p>
              )}
            </div>
          </div>
          
          {/* Detail View */}
          <div className={`w-full lg:w-2/3 p-2 sm:p-6 overflow-y-auto bg-gray-50 ${selectedInvoice ? 'block' : 'hidden md:block'}`}>
            {selectedInvoice ? (
                <div>
                     <button onClick={() => setSelectedInvoice(null)} className="md:hidden bg-blue-500 text-white px-3 py-1 rounded-md mb-4 text-sm">← Back to List</button>
                    <InvoicePreview invoiceData={selectedInvoice} />
                </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                  <p className="text-center text-gray-500 p-4 border-dashed border-2 rounded-lg">
                    Select an invoice from the list to view its details.
                  </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InvoiceListItem: React.FC<{ invoice: Invoice; onSelect: (invoice: Invoice) => void; onDelete: (id: number) => void; onCollect: (id: number) => void; }> = ({ invoice, onSelect, onDelete, onCollect }) => {
    const balance = invoice.totals.remainingBalance;
    const balanceColor = balance > 0 ? 'text-red-600' : 'text-green-600';
    const collectDisabled = balance <= 0;

    return (
        <div className="p-3 border rounded-lg shadow-sm bg-white">
            <div onClick={() => onSelect(invoice)} className="cursor-pointer">
                <p className="font-bold text-blue-700 text-lg">{invoice.customerName}</p>
                <p className="text-xs text-gray-500">Inv #: {invoice.invoiceNumber}</p>
                <p className="text-sm text-indigo-600">{invoice.customerPhone}</p>
                <p className="text-xs text-gray-500">Date: {invoice.invoiceDate} | Balance: <span className={`${balanceColor} font-semibold`}>₹{balance.toFixed(2)}</span></p>
            </div>
            <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t">
                <button onClick={() => onSelect(invoice)} className="history-btn bg-blue-500">🔎 Details</button>
                <button onClick={() => onCollect(invoice.id)} disabled={collectDisabled} className={`history-btn bg-green-500 ${collectDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>💰 Collect</button>
                <button onClick={() => onDelete(invoice.id)} className="history-btn bg-red-500">🗑️ Delete</button>
                <button onClick={() => {
                    const tempDiv = document.createElement('div');
                    document.body.appendChild(tempDiv);
                    // Fix: Use the imported createRoot function instead of require.
                    const root = createRoot(tempDiv);
                    root.render(<div className="absolute -left-[9999px]"><InvoicePreview invoiceData={invoice}/></div>);
                    setTimeout(() => {
                        downloadPDF(invoice, tempDiv.querySelector('#invoice-preview-content'));
                        root.unmount();
                        document.body.removeChild(tempDiv);
                    }, 100);
                }} className="history-btn bg-indigo-500">⬇️ PDF</button>
            </div>
            <style>{`.history-btn { @apply text-white px-2 py-1 rounded-md text-xs font-semibold shadow-sm; }`}</style>
        </div>
    );
};
