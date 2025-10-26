import React, { useState, useMemo } from 'react';
import type { Invoice, InvoiceStatus } from '../types';
import { PageHeader, Card, Badge, Button, Icon } from './Common';
import { InvoicePreview } from './InvoicePreview';
import { downloadPDF } from '../services/pdfService';

interface InvoiceListPageProps {
  invoices: Invoice[];
  onDelete: (id: number) => void;
  onCollect: (id: number) => void;
}

type FilterStatus = 'all' | InvoiceStatus;

export const InvoiceListPage: React.FC<InvoiceListPageProps> = ({ invoices, onDelete, onCollect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(inv => {
        const query = searchQuery.toLowerCase();
        const matchesQuery = inv.customerName.toLowerCase().includes(query) ||
                             inv.customerPhone.includes(query) ||
                             inv.invoiceNumber.toLowerCase().includes(query);
        const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
        return matchesQuery && matchesStatus;
      });
  }, [invoices, searchQuery, filterStatus]);
  
  if (previewInvoice) {
    return (
        <div>
            <Button onClick={() => setPreviewInvoice(null)} variant="secondary" className="mb-4">
                <Icon name="arrow-left" className="w-5 h-5"/>
                Back to Invoices
            </Button>
            <InvoicePreview invoiceData={previewInvoice} />
            <div className="flex justify-center mt-6">
                <Button onClick={() => downloadPDF(previewInvoice, document.getElementById('invoice-preview-content'))} variant="primary">
                    Download PDF
                </Button>
            </div>
        </div>
    )
  }

  return (
    <div>
      <PageHeader title="Invoices" subtitle={`You have ${invoices.length} total invoices.`} />
      
      <Card>
        <div className="p-4 flex flex-col md:flex-row gap-4 border-b border-slate-200 dark:border-slate-700">
            <input
              type="search"
              placeholder="Search by name, phone, or invoice #"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
            />
            <div className="flex items-center gap-2 flex-wrap">
                {(['all', 'unpaid', 'partially_paid', 'paid'] as FilterStatus[]).map(status => (
                    <FilterButton 
                        key={status} 
                        label={status.replace('_', ' ')}
                        isActive={filterStatus === status}
                        onClick={() => setFilterStatus(status)}
                    />
                ))}
            </div>
        </div>
        
        {/* Mobile Card View */}
        <div className="md:hidden">
          <div className="p-4 space-y-4">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map(inv => (
                <InvoiceCard key={inv.id} invoice={inv} onDelete={onDelete} onCollect={onCollect} onPreview={setPreviewInvoice}/>
              ))
            ) : (
              <p className="text-center py-12 text-slate-500 dark:text-slate-400">No invoices found.</p>
            )}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
                    <tr>
                        <th className="p-4 font-semibold">Customer</th>
                        <th className="p-4 font-semibold">Date</th>
                        <th className="p-4 font-semibold text-right">Amount</th>
                        <th className="p-4 font-semibold text-center">Status</th>
                        <th className="p-4 font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredInvoices.length > 0 ? (
                        filteredInvoices.map(inv => (
                            <InvoiceRow key={inv.id} invoice={inv} onDelete={onDelete} onCollect={onCollect} onPreview={setPreviewInvoice}/>
                        ))
                    ) : (
                        <tr><td colSpan={5} className="text-center py-12 text-slate-500 dark:text-slate-400">No invoices found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </Card>
    </div>
  );
};

const FilterButton: React.FC<{label: string; isActive: boolean; onClick: () => void}> = ({label, isActive, onClick}) => (
    <button onClick={onClick} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition capitalize ${isActive ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600'}`}>
        {label}
    </button>
);

const InvoiceRow: React.FC<{invoice: Invoice, onDelete: (id: number) => void, onCollect: (id: number) => void, onPreview: (inv: Invoice) => void}> = ({ invoice, onDelete, onCollect, onPreview }) => (
    <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td className="p-4">
            <div className="font-semibold text-slate-800 dark:text-slate-100">{invoice.customerName}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">#{invoice.invoiceNumber}</div>
        </td>
        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{invoice.invoiceDate}</td>
        <td className="p-4 font-semibold text-slate-800 dark:text-slate-100 text-right">₹{invoice.totals.total.toLocaleString('en-IN')}</td>
        <td className="p-4 text-center">
            <StatusBadge status={invoice.status} />
        </td>
        <td className="p-4">
            <ActionButtons invoice={invoice} onCollect={onCollect} onDelete={onDelete} onPreview={onPreview} />
        </td>
    </tr>
);

const InvoiceCard: React.FC<{invoice: Invoice, onDelete: (id: number) => void, onCollect: (id: number) => void, onPreview: (inv: Invoice) => void}> = ({ invoice, onDelete, onCollect, onPreview }) => (
  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
    <div className="flex justify-between items-start">
      <div>
        <p className="font-bold text-slate-800 dark:text-slate-100">{invoice.customerName}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">#{invoice.invoiceNumber}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{invoice.invoiceDate}</p>
      </div>
      <StatusBadge status={invoice.status} />
    </div>
    <div className="flex justify-between items-end mt-4">
      <p className="text-xl font-bold text-slate-800 dark:text-slate-100">₹{invoice.totals.total.toLocaleString('en-IN')}</p>
      <ActionButtons invoice={invoice} onCollect={onCollect} onDelete={onDelete} onPreview={onPreview} />
    </div>
  </div>
);

const ActionButtons: React.FC<{invoice: Invoice, onDelete: (id: number) => void, onCollect: (id: number) => void, onPreview: (inv: Invoice) => void}> = ({ invoice, onCollect, onDelete, onPreview }) => (
  <div className="flex items-center gap-2">
      <button onClick={() => onPreview(invoice)} className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400" title="Preview"><Icon name="document-text" className="w-5 h-5"/></button>
      <button onClick={() => onCollect(invoice.id)} disabled={invoice.status === 'paid'} className="text-slate-500 hover:text-green-600 dark:hover:text-green-400 disabled:opacity-30 disabled:hover:text-slate-500" title="Collect Payment"><Icon name="plus-circle" className="w-5 h-5"/></button>
      <button onClick={() => onDelete(invoice.id)} className="text-slate-500 hover:text-red-600 dark:hover:text-red-400" title="Delete"><Icon name="trash" className="w-5 h-5"/></button>
  </div>
);

const StatusBadge: React.FC<{status: InvoiceStatus}> = ({ status }) => {
  if (status === 'paid') return <Badge color="green">Paid</Badge>;
  if (status === 'partially_paid') return <Badge color="amber">Partial</Badge>;
  return <Badge color="red">Unpaid</Badge>;
};
