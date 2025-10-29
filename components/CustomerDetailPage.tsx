import React from 'react';
import type { Customer, Invoice, InvoiceStatus } from '../types';
import { Card, Button, Icon, Badge } from './Common';
import { calculateInvoiceTotal, calculateStatus } from '../hooks/useInvoices';
import { useLanguage } from '../hooks/useLanguage';

interface CustomerDetailPageProps {
    customer: Customer;
    invoices: Invoice[];
    onNavigateBack: () => void;
    onCollectInvoice: (invoiceId: number) => void;
    onPreviewInvoice: (invoice: Invoice) => void;
    onDeleteCustomer: (customer: Customer) => void; // New prop
}

const KpiCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <Card className="p-4 text-center">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
    </Card>
);

export const CustomerDetailPage: React.FC<CustomerDetailPageProps> = ({ customer, invoices, onNavigateBack, onCollectInvoice, onPreviewInvoice, onDeleteCustomer }) => {
    const { t } = useLanguage();
    
    const stats = React.useMemo(() => {
        const totalSpent = invoices.reduce((sum, inv) => sum + calculateInvoiceTotal(inv.services), 0);
        const avgInvoiceValue = invoices.length > 0 ? totalSpent / invoices.length : 0;
        return {
            totalSpent: `₹${totalSpent.toLocaleString('en-IN')}`,
            totalInvoices: invoices.length,
            avgInvoiceValue: `₹${avgInvoiceValue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        };
    }, [invoices]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                 <div>
                    <p className="text-slate-500 dark:text-slate-400">{customer.phone}</p>
                    <p className="text-slate-600 dark:text-slate-400 max-w-2xl">{customer.address}</p>
                </div>
                <Button onClick={onNavigateBack} variant="secondary">
                    <Icon name="arrow-left" className="w-5 h-5"/>
                    {t('back-to-customers', 'Back to Customers')}
                </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <KpiCard title={t('total-spent', 'Total Spent')} value={stats.totalSpent} />
                <KpiCard title={t('total-invoices')} value={stats.totalInvoices} />
                <KpiCard title={t('avg-invoice-value', 'Avg. Invoice Value')} value={stats.avgInvoiceValue} />
            </div>

            <Card>
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-lg">{t('invoice-history', 'Invoice History')}</h3>
                </div>
                <div>
                    <InvoicesTab invoices={invoices} onPreview={onPreviewInvoice} onCollect={onCollectInvoice}/>
                </div>
            </Card>

            <div className="text-center mt-6">
                <Button onClick={() => onDeleteCustomer(customer)} variant="danger">
                    <Icon name="trash" className="w-5 h-5"/>
                    {t('delete-customer')}
                </Button>
            </div>
        </div>
    );
};

const InvoicesTab: React.FC<{invoices: Invoice[], onPreview: (inv: Invoice) => void, onCollect: (id: number) => void}> = ({ invoices, onPreview, onCollect }) => {
    const { t } = useLanguage();
    return (
    <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left">
             <thead className="bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-600 dark:text-slate-400">
                <tr>
                    <th className="p-4 font-semibold">{t('invoice-number', 'Invoice #')}</th>
                    <th className="p-4 font-semibold">{t('invoice-date', 'Date')}</th>
                    <th className="p-4 font-semibold text-right">{t('amount', 'Amount')}</th>
                    <th className="p-4 font-semibold text-center">{t('status', 'Status')}</th>
                    <th className="p-4 font-semibold">{t('actions', 'Actions')}</th>
                </tr>
            </thead>
            <tbody>
                {invoices.map(inv => <InvoiceRow key={inv.id} invoice={inv} onPreview={onPreview} onCollect={onCollect}/>)}
            </tbody>
        </table>
        {invoices.length === 0 && <p className="p-8 text-center text-slate-500">{t('no-invoices-for-customer', 'No invoices found for this customer.')}</p>}
    </div>
)};

const InvoiceRow: React.FC<{invoice: Invoice, onPreview: (inv: Invoice) => void, onCollect: (id: number) => void}> = ({ invoice, onPreview, onCollect }) => {
    const total = calculateInvoiceTotal(invoice.services);
    const status = calculateStatus(invoice);
    return (
        <tr className="border-b border-slate-200 dark:border-slate-700">
            <td className="p-4 font-semibold">#{invoice.invoiceNumber}</td>
            <td className="p-4 text-sm">{invoice.invoiceDate}</td>
            <td className="p-4 text-right font-semibold">₹{total.toLocaleString('en-IN')}</td>
            <td className="p-4 text-center"><StatusBadge status={status}/></td>
            <td className="p-4">
                <div className="flex items-center gap-2">
                    <button onClick={() => onPreview(invoice)} className="text-slate-500 hover:text-indigo-600" title="View"><Icon name="eye" className="w-5 h-5"/></button>
                    <button onClick={() => onCollect(invoice.id)} disabled={status === 'paid'} className="text-slate-500 hover:text-green-600 disabled:opacity-30" title="Collect Payment"><Icon name="banknotes" className="w-5 h-5"/></button>
                </div>
            </td>
        </tr>
    );
}

const StatusBadge: React.FC<{status: InvoiceStatus}> = ({ status }) => {
  const { t } = useLanguage();
  if (status === 'paid') return <Badge color="green">{t('paid')}</Badge>;
  if (status === 'partially_paid') return <Badge color="amber">{t('partially_paid')}</Badge>;
  return <Badge color="red">{t('unpaid')}</Badge>;
};