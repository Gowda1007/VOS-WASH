import React, { useState, useMemo } from 'react';
import type { Invoice, Payment } from '../types';
import { PageHeader, Card, Icon, Badge } from './Common';
import { calculateInvoiceTotal, calculateTotalPaid } from '../hooks/useInvoices';

interface DayBookPageProps {
    invoices: Invoice[];
    onPreviewInvoice: (invoice: Invoice) => void;
    onCollectInvoice: (invoiceId: number) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <Card className="p-4 text-center">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
    </Card>
);

const toISODateString = (date: Date) => {
    return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
};

export const DayBookPage: React.FC<DayBookPageProps> = ({ invoices, onPreviewInvoice, onCollectInvoice }) => {
    const [selectedDate, setSelectedDate] = useState(toISODateString(new Date()));

    const dayBookData = useMemo(() => {
        const date = new Date(selectedDate);
        date.setHours(date.getHours() + 5, 30); // Adjust for timezone if needed
        const dateString = date.toLocaleDateString("en-IN");

        const invoicesForDay = invoices.filter(inv => inv.invoiceDate === dateString);
        
        const paymentsForDay: (Payment & { invoice: Invoice })[] = [];
        invoices.forEach(inv => {
            inv.payments.forEach(p => {
                if (p.date === dateString) {
                    paymentsForDay.push({ ...p, invoice: inv });
                }
            });
        });

        const revenue = invoicesForDay.reduce((sum, inv) => sum + calculateInvoiceTotal(inv.services), 0);
        const collections = paymentsForDay.reduce((sum, p) => sum + p.amount, 0);
        const cashCollections = paymentsForDay.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0);
        const upiCollections = paymentsForDay.filter(p => p.method === 'upi').reduce((sum, p) => sum + p.amount, 0);

        return {
            date: dateString,
            invoices: invoicesForDay,
            payments: paymentsForDay,
            stats: {
                revenue,
                collections,
                newInvoices: invoicesForDay.length,
                cashCollections,
                upiCollections
            }
        };
    }, [selectedDate, invoices]);

    return (
        <div>
            <PageHeader title="Day Book" subtitle="View a financial summary for any day." />
            
            <div className="mb-6">
                 <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={e => setSelectedDate(e.target.value)}
                    className="px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" 
                />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard title="Total Revenue" value={`₹${dayBookData.stats.revenue.toLocaleString('en-IN')}`} />
                <StatCard title="Total Collections" value={`₹${dayBookData.stats.collections.toLocaleString('en-IN')}`} />
                <StatCard title="New Invoices" value={dayBookData.stats.newInvoices} />
                 <StatCard title="Cash / UPI" value={`₹${dayBookData.stats.cashCollections} / ₹${dayBookData.stats.upiCollections}`} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <div className="p-4 border-b dark:border-slate-700">
                        <h3 className="font-bold text-lg">Invoices Created</h3>
                    </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-sm text-slate-500 dark:text-slate-400"><tr><th className="p-3 font-semibold">Customer</th><th className="p-3 font-semibold text-right">Amount</th><th></th></tr></thead>
                            <tbody>
                                {dayBookData.invoices.map(inv => (
                                    <tr key={inv.id} className="border-t dark:border-slate-700">
                                        <td className="p-3">{inv.customerName}</td>
                                        <td className="p-3 text-right font-semibold">₹{calculateInvoiceTotal(inv.services)}</td>
                                        <td className="p-3 text-right"><button onClick={() => onPreviewInvoice(inv)}><Icon name="eye" className="w-5 h-5"/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {dayBookData.invoices.length === 0 && <p className="p-8 text-center text-slate-500">No invoices were created on this day.</p>}
                     </div>
                </Card>
                 <Card>
                    <div className="p-4 border-b dark:border-slate-700">
                        <h3 className="font-bold text-lg">Payments Collected</h3>
                    </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead className="text-sm text-slate-500 dark:text-slate-400"><tr><th className="p-3 font-semibold">From</th><th className="p-3 font-semibold text-right">Amount</th><th className="p-3 font-semibold text-center">Method</th></tr></thead>
                           <tbody>
                                {dayBookData.payments.map((p, i) => (
                                     <tr key={`${p.invoice.id}-${i}`} className="border-t dark:border-slate-700">
                                        <td className="p-3">{p.invoice.customerName} <span className="text-xs text-slate-400">(#{p.invoice.invoiceNumber})</span></td>
                                        <td className="p-3 text-right font-semibold">₹{p.amount}</td>
                                        <td className="p-3 text-center"><Badge color={p.method === 'cash' ? 'green' : 'blue'}>{p.method}</Badge></td>
                                    </tr>
                                ))}
                           </tbody>
                        </table>
                         {dayBookData.payments.length === 0 && <p className="p-8 text-center text-slate-500">No payments were collected on this day.</p>}
                     </div>
                </Card>
            </div>
        </div>
    );
};
