import React, { useState, useMemo } from 'react';
import type { Customer, Invoice, InvoiceStatus } from '../types';
import { Card, Button, Icon, Badge } from './Common';
import { calculateInvoiceTotal, calculateStatus } from '../hooks/useInvoices';

interface CustomerDetailPageProps {
    customer: Customer;
    invoices: Invoice[];
    onNavigateBack: () => void;
    onCollectInvoice: (invoiceId: number) => void;
    onPreviewInvoice: (invoice: Invoice) => void;
}

const KpiCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <Card className="p-4 text-center">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
    </Card>
);

export const CustomerDetailPage: React.FC<CustomerDetailPageProps> = ({ customer, invoices, onNavigateBack, onCollectInvoice, onPreviewInvoice }) => {
    
    const stats = useMemo(() => {
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
                    Back to Customers
                </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <KpiCard title="Total Spent" value={stats.totalSpent} />
                <KpiCard title="Total Invoices" value={stats.totalInvoices} />
                <KpiCard title="Avg. Invoice Value" value={stats.avgInvoiceValue} />
            </div>

            <Card>
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-lg">Invoice History</h3>
                </div>
                <div>
                    <InvoicesTab invoices={invoices} onPreview={onPreviewInvoice} onCollect={onCollectInvoice}/>
                </div>
            </Card>
        </div>
    );
};

const InvoicesTab: React.FC<{invoices: Invoice[], onPreview: (inv: Invoice) => void, onCollect: (id: number) => void}> = ({ invoices, onPreview, onCollect }) => (
    <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left">
             <thead className="bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-600 dark:text-slate-400">
                <tr>
                    <th className="p-4 font-semibold">Invoice #</th>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold text-right">Amount</th>
                    <th className="p-4 font-semibold text-center">Status</th>
                    <th className="p-4 font-semibold">Actions</th>
                </tr>
            </thead>
            <tbody>
                {invoices.map(inv => <InvoiceRow key={inv.id} invoice={inv} onPreview={onPreview} onCollect={onCollect}/>)}
            </tbody>
        </table>
        {invoices.length === 0 && <p className="p-8 text-center text-slate-500">No invoices found for this customer.</p>}
    </div>
);

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
  if (status === 'paid') return <Badge color="green">Paid</Badge>;
  if (status === 'partially_paid') return <Badge color="amber">Partial</Badge>;
  return <Badge color="red">Unpaid</Badge>;
};
