import React, { useState, useMemo } from 'react';
import type { Customer, Invoice, Order, OrderStatus, InvoiceStatus } from '../types';
import { PageHeader, Card, Button, Icon, Badge } from './Common';
import { InvoicePreview } from './InvoicePreview';
import { calculateInvoiceTotal, calculateStatus, calculateRemainingBalance } from '../hooks/useInvoices';

interface CustomerDetailPageProps {
    customer: Customer;
    invoices: Invoice[];
    orders: Order[];
    onNavigateBack: () => void;
    onCollectInvoice: (invoiceId: number) => void;
}

const KpiCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <Card className="p-4 text-center">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
    </Card>
);

export const CustomerDetailPage: React.FC<CustomerDetailPageProps> = ({ customer, invoices, orders, onNavigateBack, onCollectInvoice }) => {
    const [activeTab, setActiveTab] = useState<'invoices' | 'orders'>('invoices');
    const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

    const stats = useMemo(() => {
        const totalSpent = invoices.reduce((sum, inv) => sum + calculateInvoiceTotal(inv.services), 0);
        const avgInvoiceValue = invoices.length > 0 ? totalSpent / invoices.length : 0;
        return {
            totalSpent: `₹${totalSpent.toLocaleString('en-IN')}`,
            totalInvoices: invoices.length,
            totalOrders: orders.length,
            avgInvoiceValue: `₹${avgInvoiceValue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        };
    }, [invoices, orders]);
    
    if (previewInvoice) {
        return (
            <div>
                <Button onClick={() => setPreviewInvoice(null)} variant="secondary" className="mb-4">
                    <Icon name="arrow-left" className="w-5 h-5"/>
                    Back to Customer Details
                </Button>
                <InvoicePreview invoiceData={previewInvoice} />
            </div>
        )
    }

    return (
        <div>
            <PageHeader title={customer.name} subtitle={customer.phone}>
                <Button onClick={onNavigateBack} variant="secondary">
                    <Icon name="arrow-left" className="w-5 h-5"/>
                    Back to Customers
                </Button>
            </PageHeader>
            
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-2xl">{customer.address}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <KpiCard title="Total Spent" value={stats.totalSpent} />
                <KpiCard title="Total Invoices" value={stats.totalInvoices} />
                <KpiCard title="Total Orders" value={stats.totalOrders} />
                <KpiCard title="Avg. Invoice Value" value={stats.avgInvoiceValue} />
            </div>

            <Card>
                <div className="border-b border-slate-200 dark:border-slate-700">
                    <nav className="flex space-x-6 px-6" aria-label="Tabs">
                         <TabButton label="Invoices" isActive={activeTab === 'invoices'} onClick={() => setActiveTab('invoices')} />
                         <TabButton label="Orders" isActive={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                    </nav>
                </div>
                <div>
                    {activeTab === 'invoices' && <InvoicesTab invoices={invoices} onPreview={setPreviewInvoice} onCollect={onCollectInvoice}/>}
                    {activeTab === 'orders' && <OrdersTab orders={orders} />}
                </div>
            </Card>
        </div>
    );
};

const TabButton: React.FC<{label: string, isActive: boolean, onClick: () => void}> = ({label, isActive, onClick}) => (
    <button onClick={onClick} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition ${isActive ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
        {label}
    </button>
)

const InvoicesTab: React.FC<{invoices: Invoice[], onPreview: (inv: Invoice) => void, onCollect: (id: number) => void}> = ({ invoices, onPreview, onCollect }) => (
    <div className="overflow-x-auto">
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

const OrdersTab: React.FC<{orders: Order[]}> = ({ orders }) => (
     <div className="overflow-x-auto">
        <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-600 dark:text-slate-400">
                <tr>
                    <th className="p-4 font-semibold">Order #</th>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Products</th>
                    <th className="p-4 font-semibold text-right">Amount</th>
                    <th className="p-4 font-semibold text-center">Status</th>
                </tr>
            </thead>
            <tbody>
                {orders.map(order => (
                    <tr key={order.id} className="border-b border-slate-200 dark:border-slate-700">
                         <td className="p-4 font-semibold">#{order.id.toString().slice(-6)}</td>
                         <td className="p-4 text-sm">{order.orderDate}</td>
                         <td className="p-4 text-sm">{order.products.map(p => `${p.name} (x${p.quantity})`).join(', ')}</td>
                         <td className="p-4 text-right font-semibold">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                         <td className="p-4 text-center"><OrderStatusBadge status={order.status}/></td>
                    </tr>
                ))}
            </tbody>
        </table>
         {orders.length === 0 && <p className="p-8 text-center text-slate-500">No orders found for this customer.</p>}
    </div>
);


const StatusBadge: React.FC<{status: InvoiceStatus}> = ({ status }) => {
  if (status === 'paid') return <Badge color="green">Paid</Badge>;
  if (status === 'partially_paid') return <Badge color="amber">Partial</Badge>;
  return <Badge color="red">Unpaid</Badge>;
};

const OrderStatusBadge: React.FC<{status: OrderStatus}> = ({ status }) => {
  switch(status) {
    case 'pending_payment': return <Badge color="amber">Pending Payment</Badge>;
    case 'processing': return <Badge color="blue">Processing</Badge>;
    case 'shipped': return <Badge color="green">Shipped</Badge>;
    case 'cancelled': return <Badge color="red">Cancelled</Badge>;
    default: return <Badge color="slate">Unknown</Badge>;
  }
};