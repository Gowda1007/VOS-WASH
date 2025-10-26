import React, { useMemo, useState } from 'react';
import type { Invoice } from '../types';
import { useAuth } from '../hooks/useAuth';
import { PageHeader, Card, Badge, Button, Icon } from './Common';
import { InvoicePreview } from './InvoicePreview';
import { calculateInvoiceTotal, calculateStatus } from '../hooks/useInvoices';

interface CustomerDashboardProps {
  customerPhone: string;
  allInvoices: Invoice[];
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ customerPhone, allInvoices }) => {
    const { logout } = useAuth();
    const [view, setView] = useState<'invoices' | 'request' | 'preview'>('invoices');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    const customerInvoices = useMemo(() => {
        return allInvoices
            .filter(inv => inv.customerPhone === customerPhone)
            .map(inv => ({
                ...inv,
                totalAmount: calculateInvoiceTotal(inv.services),
                status: calculateStatus(inv),
            }))
            .sort((a, b) => b.id - a.id);
    }, [allInvoices, customerPhone]);

    const customerName = customerInvoices.length > 0 ? customerInvoices[0].customerName : 'Customer';
    
    const handlePreview = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setView('preview');
    };

    const renderContent = () => {
        if (view === 'preview' && selectedInvoice) {
            return (
                <div>
                    <Button onClick={() => setView('invoices')} variant="secondary" className="mb-4">
                        <Icon name="arrow-left" className="w-5 h-5"/>
                        Back to My Invoices
                    </Button>
                    <InvoicePreview invoiceData={selectedInvoice} />
                </div>
            );
        }

        if (view === 'request') {
            return (
                <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Request a Service</h2>
                    <p className="mb-4 text-slate-600 dark:text-slate-300">Need another wash? Contact us directly!</p>
                    <div className="space-y-4">
                        <a href="tel:+919845418725" className="block w-full text-center p-4 bg-blue-500 text-white rounded-lg font-semibold">Call: +91 98454 18725</a>
                        <a href="tel:+916363178431" className="block w-full text-center p-4 bg-green-500 text-white rounded-lg font-semibold">Call: +91 63631 78431</a>
                    </div>
                </Card>
            );
        }

        return (
            <Card>
                <div className="p-6">
                    <h2 className="text-2xl font-bold">My Invoices</h2>
                </div>
                {customerInvoices.length > 0 ? (
                    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                        {customerInvoices.map(inv => (
                            <li key={inv.id} className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-slate-100">Invoice #{inv.invoiceNumber}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{inv.invoiceDate}</p>
                                    </div>
                                    <div className="flex items-center gap-4 self-end sm:self-center">
                                         <div className="text-right">
                                             <p className="font-bold text-lg text-slate-800 dark:text-slate-100">₹{inv.totalAmount.toLocaleString('en-IN')}</p>
                                             <StatusBadge status={inv.status} />
                                         </div>
                                        <Button onClick={() => handlePreview(inv)} variant="secondary">View</Button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="p-8 text-center text-slate-500 dark:text-slate-400">You have no invoices yet.</p>
                )}
            </Card>
        );
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 md:p-8">
            <header className="max-w-5xl mx-auto mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Welcome, {customerName}!</h1>
                        <p className="text-slate-500 dark:text-slate-400">Your personal VOS WASH portal.</p>
                    </div>
                    <Button onClick={logout} variant="secondary">Logout</Button>
                </div>
            </header>
            <main className="max-w-5xl mx-auto">
                 <div className="flex gap-2 mb-6">
                    <button onClick={() => setView('invoices')} className={`px-4 py-2 font-semibold rounded-lg ${view === 'invoices' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700'}`}>My Invoices</button>
                    <button onClick={() => setView('request')} className={`px-4 py-2 font-semibold rounded-lg ${view === 'request' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700'}`}>Request Service</button>
                 </div>
                 {renderContent()}
            </main>
        </div>
    );
};

const StatusBadge: React.FC<{status: any}> = ({ status }) => {
  if (status === 'paid') return <Badge color="green">Paid</Badge>;
  if (status === 'partially_paid') return <Badge color="amber">Partial</Badge>;
  return <Badge color="red">Unpaid</Badge>;
};
