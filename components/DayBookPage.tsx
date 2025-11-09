import React, { useState, useMemo } from 'react';
import type { Invoice, Payment } from '../types';
import { Card, Icon, Badge } from './Common';
import { calculateInvoiceTotal } from '../hooks/useInvoices';
import { useLanguage } from '../hooks/useLanguage';

interface DayBookPageProps {
    invoices: Invoice[];
    onPreviewInvoice: (invoice: Invoice) => void;
    onCollectInvoice: (invoiceId: string) => void;
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

export const DayBookPage: React.FC<DayBookPageProps> = ({ invoices, onPreviewInvoice }) => {
    const [selectedDate, setSelectedDate] = useState(toISODateString(new Date()));
    const { t } = useLanguage();

    const dayBookData = useMemo(() => {
        const date = new Date(selectedDate);
        date.setHours(date.getHours() + 5, 30);
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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                 <p className="text-slate-500 dark:text-slate-400">{t('day-book-description')}</p>
                 <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={e => setSelectedDate(e.target.value)}
                    className="block w-full sm:w-auto px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" 
                />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title={t('total-revenue')} value={`₹${dayBookData.stats.revenue.toLocaleString('en-IN')}`} />
                <StatCard title={t('collected')} value={`₹${dayBookData.stats.collections.toLocaleString('en-IN')}`} />
                <StatCard title={t('new-invoices')} value={dayBookData.stats.newInvoices} />
                 <StatCard title={t('cash-upi', 'Cash / UPI')} value={`₹${dayBookData.stats.cashCollections} / ₹${dayBookData.stats.upiCollections}`} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <div className="p-4 border-b dark:border-slate-700">
                        <h3 className="font-bold text-lg">{t('invoices-created')}</h3>
                    </div>
                     <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left">
                            <thead className="text-sm text-slate-500 dark:text-slate-400"><tr><th className="p-3 font-semibold">{t('customer-name')}</th><th className="p-3 font-semibold text-right">{t('amount', 'Amount')}</th><th></th></tr></thead>
                            <tbody>
                                {dayBookData.invoices.map(inv => (
                                    <tr key={inv.invoiceNumber} className="border-t dark:border-slate-700">
                                        <td className="p-3">{inv.customerName} <span className="text-xs text-slate-400">(#{inv.invoiceNumber})</span></td>
                                        <td className="p-3 text-right font-semibold">₹{calculateInvoiceTotal(inv.services)}</td>
                                        <td className="p-3 text-right"><button onClick={() => onPreviewInvoice(inv)}><Icon name="eye" className="w-5 h-5"/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {dayBookData.invoices.length === 0 && <p className="p-8 text-center text-slate-500">{t('no-invoices-on-day')}</p>}
                     </div>
                </Card>
                 <Card>
                    <div className="p-4 border-b dark:border-slate-700">
                        <h3 className="font-bold text-lg">{t('payments-collected')}</h3>
                    </div>
                     <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left">
                           <thead className="text-sm text-slate-500 dark:text-slate-400"><tr><th className="p-3 font-semibold">{t('from', 'From')}</th><th className="p-3 font-semibold text-right">{t('amount', 'Amount')}</th><th className="p-3 font-semibold text-center">{t('payment-method')}</th></tr></thead>
                           <tbody>
                                {dayBookData.payments.map((p, i) => (
                                     <tr key={`${p.invoice.invoiceNumber}-${i}`} className="border-t dark:border-slate-700">
                                        <td className="p-3">{p.invoice.customerName} <span className="text-xs text-slate-400">(#{p.invoice.invoiceNumber})</span></td>
                                        <td className="p-3 text-right font-semibold">₹{p.amount}</td>
                                        <td className="p-3 text-center"><Badge color={p.method === 'cash' ? 'green' : 'blue'}>{p.method}</Badge></td>
                                    </tr>
                                ))}
                           </tbody>
                        </table>
                         {dayBookData.payments.length === 0 && <p className="p-8 text-center text-slate-500">{t('no-payments-on-day')}</p>}
                     </div>
                </Card>
            </div>
        </div>
    );
};