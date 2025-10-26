import React, { useState, useMemo } from 'react';
import type { Customer, Invoice } from '../types';
import { PageHeader, Card } from './Common';
import { calculateInvoiceTotal } from '../hooks/useInvoices';

interface CustomerListPageProps {
    customers: Customer[];
    invoices: Invoice[];
}

interface CustomerWithStats extends Customer {
    invoiceCount: number;
    totalSpent: number;
}

export const CustomerListPage: React.FC<CustomerListPageProps> = ({ customers, invoices }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const customersWithStats = useMemo(() => {
        return customers.map(customer => {
            const customerInvoices = invoices.filter(inv => inv.customerPhone === customer.phone);
            const totalSpent = customerInvoices.reduce((sum, inv) => sum + calculateInvoiceTotal(inv.services), 0);
            return {
                ...customer,
                invoiceCount: customerInvoices.length,
                totalSpent,
            };
        }).sort((a, b) => b.totalSpent - a.totalSpent);
    }, [customers, invoices]);
    
    const filteredCustomers = useMemo(() => {
        const query = searchQuery.toLowerCase();
        if (!query) return customersWithStats;
        return customersWithStats.filter(c =>
            c.name.toLowerCase().includes(query) || c.phone.includes(query)
        );
    }, [searchQuery, customersWithStats]);

    return (
        <div>
            <PageHeader
                title="Customers"
                subtitle={`You have ${customers.length} unique customers.`}
            />

            <Card>
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <input
                        type="search"
                        placeholder="Search by name or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-1/3 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                    />
                </div>
                
                {/* Mobile Card View */}
                <div className="md:hidden">
                    <div className="p-4 space-y-4">
                        {filteredCustomers.length > 0 ? (
                           filteredCustomers.map(customer => <CustomerCard key={customer.phone} customer={customer} />)
                        ) : (
                           <p className="text-center py-12 text-slate-500 dark:text-slate-400">No customers found.</p>
                        )}
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
                            <tr>
                                <th className="p-4 font-semibold">Name</th>
                                <th className="p-4 font-semibold">Contact</th>
                                <th className="p-4 font-semibold text-center">Invoices</th>
                                <th className="p-4 font-semibold text-right">Total Spent</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map(customer => (
                                    <CustomerRow key={customer.phone} customer={customer} />
                                ))
                            ) : (
                                <tr><td colSpan={4} className="text-center py-12 text-slate-500 dark:text-slate-400">No customers found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

const CustomerRow: React.FC<{ customer: CustomerWithStats }> = ({ customer }) => (
    <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td className="p-4">
            <div className="font-semibold text-slate-800 dark:text-slate-100">{customer.name}</div>
        </td>
        <td className="p-4">
            <div className="text-sm text-slate-600 dark:text-slate-300">{customer.phone}</div>
            {customer.address && customer.address !== 'N/A' && <div className="text-xs text-slate-500 dark:text-slate-400">{customer.address}</div>}
        </td>
        <td className="p-4 text-center text-sm text-slate-600 dark:text-slate-300">{customer.invoiceCount}</td>
        <td className="p-4 font-semibold text-slate-800 dark:text-slate-100 text-right">₹{customer.totalSpent.toLocaleString('en-IN')}</td>
    </tr>
);

const CustomerCard: React.FC<{ customer: CustomerWithStats }> = ({ customer }) => (
    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-start">
            <div>
                <p className="font-bold text-slate-800 dark:text-slate-100">{customer.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{customer.phone}</p>
                {customer.address && customer.address !== 'N/A' && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{customer.address}</p>}
            </div>
            <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400">Invoices</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200">{customer.invoiceCount}</p>
            </div>
        </div>
        <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-700 text-right">
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Spent</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">₹{customer.totalSpent.toLocaleString('en-IN')}</p>
        </div>
    </div>
);