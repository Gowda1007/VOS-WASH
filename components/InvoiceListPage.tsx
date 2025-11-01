import React, { useState, useMemo } from 'react';
import type { Invoice, InvoiceStatus } from '../types';
import { Card, Badge, Button, Icon, EmptyState } from './Common';
import { calculateInvoiceTotal, calculateStatus, calculateRemainingBalance, calculateTotalPaid } from '../hooks/useInvoices';
import { downloadListAsPDF } from '../services/pdfService'; // Updated import
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../hooks/useLanguage';

interface InvoiceListPageProps {
  invoices: Invoice[];
  onDelete: (id: number) => void;
  onCollect: (id: number) => void;
  onPreview: (invoice: Invoice) => void;
  initialFilter?: 'all' | InvoiceStatus | 'outstanding';
}

type FilterStatus = 'all' | InvoiceStatus;

const parseDate = (dateString: string): Date | null => {
    const parts = dateString.split('/');
    if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return null;
};

export const InvoiceListPage: React.FC<InvoiceListPageProps> = ({ invoices, onDelete, onCollect, onPreview, initialFilter = 'all' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | InvoiceStatus | 'outstanding'>(initialFilter);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const toast = useToast();
  const { t } = useLanguage();

  const processedInvoices = useMemo(() => {
    return invoices.map(inv => ({
      ...inv,
      totalAmount: calculateInvoiceTotal(inv.services),
      status: calculateStatus(inv),
    }));
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return processedInvoices
      .filter(inv => {
        const query = searchQuery.toLowerCase();
        const matchesQuery = inv.customerName.toLowerCase().includes(query) ||
                             inv.customerPhone.includes(query) ||
                             inv.invoiceNumber.toLowerCase().includes(query);
        
        const matchesStatus = filterStatus === 'all' ||
                              (filterStatus === 'outstanding' && (inv.status === 'unpaid' || inv.status === 'partially_paid')) ||
                              inv.status === filterStatus;
        
        const matchesDate = (() => {
            if (!dateRange.start && !dateRange.end) return true;
            const invDate = parseDate(inv.invoiceDate);
            if (!invDate) return false;

            const startDate = dateRange.start ? new Date(dateRange.start) : null;
            const endDate = dateRange.end ? new Date(dateRange.end) : null;

            if (startDate) startDate.setHours(0, 0, 0, 0);
            if (endDate) endDate.setHours(23, 59, 59, 999);

            if (startDate && endDate) return invDate >= startDate && invDate <= endDate;
            if (startDate) return invDate >= startDate;
            if (endDate) return invDate <= endDate;
            return true;
        })();

        return matchesQuery && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        const dateA = parseDate(a.invoiceDate) || new Date(0);
        const dateB = parseDate(b.invoiceDate) || new Date(0);
        return dateB.getTime() - dateA.getTime(); // Sort by date descending
      });
  }, [processedInvoices, searchQuery, filterStatus, dateRange]);
  
  const handleExport = async () => {
    const headers = [t('invoice-number', 'Invoice #'), t('invoice-date', 'Date'), t('customer-name'), t('customer-phone'), t('total-amount'), t('paid-amount'), t('balance-due-label'), t('status', 'Status')];
    const data = filteredInvoices.map(inv => [
      inv.invoiceNumber,
      inv.invoiceDate,
      inv.customerName,
      inv.customerPhone,
      `₹${inv.totalAmount.toLocaleString('en-IN')}`,
      `₹${calculateTotalPaid(inv.payments).toLocaleString('en-IN')}`,
      `₹${calculateRemainingBalance(inv).toLocaleString('en-IN')}`,
      t(inv.status), // Translate status for PDF
    ]);
    const filename = `vos-wash-invoices-${new Date().toISOString().split('T')[0]}.pdf`;
    const title = t('invoice-list-report-title', 'VOS WASH Invoice List Report');
    await downloadListAsPDF(headers, data, filename, title);
    toast.success(t('export-pdf-success-message', 'Invoice list exported to PDF.'));
  };

  return (
    <div className="space-y-6">
       <p className="text-slate-500 dark:text-slate-400">{t('you-have-total-invoices', 'You have {count} total invoices.').replace('{count}', invoices.length.toString())}</p>

      <Card>
        <div className="p-4 flex flex-col md:flex-row gap-4 border-b border-slate-200 dark:border-slate-700 items-start">
            <div className="flex-grow w-full">
                <input
                  type="search"
                  placeholder={t('search-invoices-placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                />
            </div>
            <div className="w-full md:w-auto">
                 <Button onClick={handleExport} variant="secondary" className="w-full">
                    <Icon name="document-duplicate" className="w-5 h-5" />
                    {t('export-pdf', 'Export PDF')}
                </Button>
            </div>
        </div>
        <div className="p-4 flex flex-col sm:flex-row gap-4 border-b border-slate-200 dark:border-slate-700">
             <div className="flex flex-col sm:flex-row gap-2 flex-grow">
                <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" />
                <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                {(['all', 'unpaid', 'partially_paid', 'paid'] as FilterStatus[]).map(status => (
                    <FilterButton 
                        key={status} 
                        label={t(status)}
                        isActive={filterStatus === status}
                        onClick={() => setFilterStatus(status)}
                    />
                ))}
            </div>
        </div>
        
        <div className="md:hidden">
          <div className="p-4 space-y-4">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map(inv => (
                <InvoiceCard key={inv.id} invoice={inv} onDelete={onDelete} onCollect={onCollect} onPreview={onPreview}/>
              ))
            ) : (
                <EmptyState icon="document-text" title={t('no-invoices-found')} message={t('adjust-filters-message')} />
            )}
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
                    <tr>
                        <th className="p-4 font-semibold">{t('customer-name')}</th>
                        <th className="p-4 font-semibold">{t('invoice-date', 'Date')}</th>
                        <th className="p-4 font-semibold text-right">{t('invoice-total', 'Amount')}</th>
                        <th className="p-4 font-semibold text-center">{t('status', 'Status')}</th>
                        <th className="p-4 font-semibold">{t('actions', 'Actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredInvoices.length > 0 ? (
                        filteredInvoices.map(inv => (
                            <InvoiceRow key={inv.id} invoice={inv} onDelete={onDelete} onCollect={onCollect} onPreview={onPreview}/>
                        ))
                    ) : (
                        <tr><td colSpan={5}>
                           <EmptyState icon="document-text" title={t('no-invoices-found')} message={t('adjust-filters-message')} />
                        </td></tr>
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

const InvoiceRow: React.FC<{invoice: any, onDelete: (id: number) => void, onCollect: (id: number) => void, onPreview: (inv: Invoice) => void}> = ({ invoice, onDelete, onCollect, onPreview }) => (
    <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td className="p-4">
            <div className="font-semibold text-slate-800 dark:text-slate-100">{invoice.customerName}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">#{invoice.invoiceNumber}</div>
        </td>
        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{invoice.invoiceDate}</td>
        <td className="p-4 font-semibold text-slate-800 dark:text-slate-100 text-right">₹{invoice.totalAmount.toLocaleString('en-IN')}</td>
        <td className="p-4 text-center">
            <StatusBadge status={invoice.status} />
        </td>
        <td className="p-4">
            <ActionButtons invoice={invoice} onCollect={onCollect} onDelete={onDelete} onPreview={onPreview} />
        </td>
    </tr>
);

const InvoiceCard: React.FC<{invoice: any, onDelete: (id: number) => void, onCollect: (id: number) => void, onPreview: (inv: Invoice) => void}> = ({ invoice, onDelete, onCollect, onPreview }) => (
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
      <p className="text-xl font-bold text-slate-800 dark:text-slate-100">₹{invoice.totalAmount.toLocaleString('en-IN')}</p>
      <ActionButtons invoice={invoice} onCollect={onCollect} onDelete={onDelete} onPreview={onPreview} />
    </div>
  </div>
);

const ActionButtons: React.FC<{invoice: any, onDelete: (id: number) => void, onCollect: (id: number) => void, onPreview: (inv: Invoice) => void}> = ({ invoice, onCollect, onDelete, onPreview }) => (
  <div className="flex items-center gap-2">
      <button onClick={() => onPreview(invoice)} className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400" title="View"><Icon name="eye" className="w-5 h-5"/></button>
      <button onClick={() => onCollect(invoice.id)} disabled={invoice.status === 'paid'} className="text-slate-500 hover:text-green-600 dark:hover:text-green-400 disabled:opacity-30 disabled:hover:text-slate-500" title="Collect Payment"><Icon name="banknotes" className="w-5 h-5"/></button>
      <button onClick={() => onDelete(invoice.id)} className="text-slate-500 hover:text-red-600 dark:hover:text-red-400" title="Delete"><Icon name="trash" className="w-5 h-5"/></button>
  </div>
);

const StatusBadge: React.FC<{status: InvoiceStatus}> = ({ status }) => {
  const { t } = useLanguage();
  if (status === 'paid') return <Badge color="green">{t('paid')}</Badge>;
  if (status === 'partially_paid') return <Badge color="amber">{t('partially_paid')}</Badge>;
  return <Badge color="red">{t('unpaid')}</Badge>;
};