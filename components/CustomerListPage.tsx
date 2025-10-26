import React, { useState, useMemo } from 'react';
import type { Customer, Invoice } from '../types';
import { Card, Button, Icon, EmptyState } from './Common';
import { calculateInvoiceTotal } from '../hooks/useInvoices';
import { exportToCSV } from '../services/exportService';
import { useToast } from '../hooks/useToast';

interface CustomerListPageProps {
    customers: Customer[];
    invoices: Invoice[];
    onViewCustomer: (customer: Customer) => void;
}

interface CustomerWithStats extends Customer {
    invoiceCount: number;
    totalSpent: number;
}

export const CustomerListPage: React.FC<CustomerListPageProps> = ({ customers, invoices, onViewCustomer }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const toast = useToast();

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

    const handleExport = () => {
        const headers = ['Name', 'Phone', 'Address', 'Total Invoices', 'Total Spent (₹)'];
        const data = filteredCustomers.map(c => [
            c.name,
            c.phone,
            c.address,
            c.invoiceCount,
            c.totalSpent,
        ]);
        exportToCSV(headers, data, `vos-wash-customers-${new Date().toISOString().split('T')[0]}.csv`);
        toast.success('Customer data saved to your Downloads folder.');
    };

    const hasCustomers = customers.length > 0;
    const hasSearchResults = filteredCustomers.length > 0;

    return (
        <div className="space-y-6">
            <p className="text-slate-500 dark:text-slate-400">{`You have ${customers.length} unique customers.`}</p>

            <Card>
                <div className="p-4 flex flex-col md:flex-row gap-4 border-b border-slate-200 dark:border-slate-700 items-start">
                     <div className="flex-grow w-full">
                        <input
                            type="search"
                            placeholder="Search by name or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                        />
                    </div>
                     <div className="w-full md:w-auto">
                        <Button onClick={handleExport} variant="secondary" className="w-full">
                            <Icon name="document-duplicate" className="w-5 h-5" />
                            Export CSV
                        </Button>
                    </div>
                </div>
                
                {/* Mobile Card View */}
                <div className="md:hidden">
                    {hasSearchResults ? (
                        <div className="p-4 space-y-4">
                            {filteredCustomers.map(customer => <CustomerCard key={customer.phone} customer={customer} onView={onViewCustomer} />)}
                        </div>
                    ) : (
                         <EmptyState 
                            icon="users" 
                            title={hasCustomers ? "No Customers Found" : "You have no customers"} 
                            message={hasCustomers ? "Try a different search term." : "Create a new invoice to add your first customer."} 
                        />
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    {hasCustomers ? (
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
                                {hasSearchResults ? (
                                    filteredCustomers.map(customer => (
                                        <CustomerRow key={customer.phone} customer={customer} onView={onViewCustomer} />
                                    ))
                                ) : (
                                    <tr><td colSpan={4}>
                                        <EmptyState icon="users" title="No Customers Found" message="Your search returned no results." />
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <EmptyState 
                            icon="users" 
                            title="You have no customers" 
                            message="Create a new invoice to add your first customer." 
                        />
                    )}
                </div>
            </Card>
        </div>
    );
};

const CustomerRow: React.FC<{ customer: CustomerWithStats; onView: (c: Customer) => void }> = ({ customer, onView }) => (
    <tr onClick={() => onView(customer)} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
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

const CustomerCard: React.FC<{ customer: CustomerWithStats; onView: (c: Customer) => void }> = ({ customer, onView }) => (
    <div onClick={() => onView(customer)} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer active:bg-slate-100 dark:active:bg-slate-700/50">
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