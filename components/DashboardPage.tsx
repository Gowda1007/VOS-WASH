import React, { useEffect, useRef, useState } from 'react';
import type { AnalyticsData, Invoice, PendingOrder } from '../types';
import { filterAndGroupInvoicesForChart } from '../services/analyticsService';
import { Card, Badge, Icon, Button, EmptyState } from './Common';
import { calculateInvoiceTotal, calculateStatus } from '../hooks/useInvoices';
import { CUSTOMER_TYPE_LABELS } from '../constants';

declare global {
    interface Window { Chart: any; }
}

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.ComponentProps<typeof Icon>['name']; color: string }> = ({ title, value, icon, color }) => (
    <Card className="p-4">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
            <div className={`p-3 rounded-full bg-opacity-20 ${color.replace('text', 'bg').replace('-600', '-100')} dark:${color.replace('text', 'bg').replace('-600', '-900')} dark:bg-opacity-30`}>
                <Icon name={icon} className={`w-6 h-6 ${color}`} />
            </div>
        </div>
    </Card>
);

type ChartPeriod = 'day' | 'week' | 'month';

interface DashboardPageProps {
    analytics: AnalyticsData;
    recentInvoices: Invoice[];
    pendingOrders: PendingOrder[];
    onPreviewInvoice: (invoice: Invoice) => void;
    onGenerateInvoice: (order: PendingOrder) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ analytics, recentInvoices, pendingOrders, onPreviewInvoice, onGenerateInvoice }) => {
    const barChartRef = useRef<HTMLCanvasElement>(null);
    const barChartInstanceRef = useRef<any>(null);
    const pieChartRef = useRef<HTMLCanvasElement>(null);
    const pieChartInstanceRef = useRef<any>(null);
    const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('month');
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDarkMode(mediaQuery.matches);
        const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);
    
    // Bar Chart Effect
    useEffect(() => {
        if (!barChartRef.current || typeof window.Chart === 'undefined') return;
        const ctx = barChartRef.current.getContext('2d');
        if (!ctx) return;
        if (barChartInstanceRef.current) barChartInstanceRef.current.destroy();

        const data = filterAndGroupInvoicesForChart(chartPeriod, recentInvoices);
        const chartColors = {
            grid: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            ticks: isDarkMode ? '#cbd5e1' : '#64748b',
        };

        barChartInstanceRef.current = new window.Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Revenue',
                    data: data.datasets[0].data,
                    backgroundColor: 'rgba(79, 70, 229, 0.8)',
                    borderColor: 'rgb(79, 70, 229)',
                    borderWidth: 1,
                    borderRadius: 4,
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false, labels: { color: chartColors.ticks } } }, 
                scales: { 
                    y: { 
                        beginAtZero: true,
                        grid: { color: chartColors.grid },
                        ticks: { color: chartColors.ticks }
                    },
                    x: {
                        grid: { color: chartColors.grid },
                        ticks: { color: chartColors.ticks }
                    }
                } 
            }
        });
        return () => barChartInstanceRef.current?.destroy();
    }, [chartPeriod, recentInvoices, isDarkMode]);

    // Pie Chart Effect
     useEffect(() => {
        if (!pieChartRef.current || typeof window.Chart === 'undefined') return;
        const ctx = pieChartRef.current.getContext('2d');
        if (!ctx) return;
        if (pieChartInstanceRef.current) pieChartInstanceRef.current.destroy();

        const data = analytics.revenueByCustomerType;
        const chartColors = {
            ticks: isDarkMode ? '#cbd5e1' : '#64748b',
            border: isDarkMode ? '#1e293b' : '#fff'
        };

        pieChartInstanceRef.current = new window.Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [CUSTOMER_TYPE_LABELS.customer, CUSTOMER_TYPE_LABELS.garage_service_station, CUSTOMER_TYPE_LABELS.dealer],
                datasets: [{
                    data: [data.customer, data.garage_service_station, data.dealer],
                    backgroundColor: ['#6366f1', '#38bdf8', '#fbbf24'],
                    borderColor: chartColors.border,
                    borderWidth: 2,
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { 
                        position: 'bottom',
                        labels: { color: chartColors.ticks }
                    } 
                } 
            }
        });
        return () => pieChartInstanceRef.current?.destroy();
    }, [analytics.revenueByCustomerType, isDarkMode]);

    return (
        <div className="space-y-8">
            <p className="text-slate-500 dark:text-slate-400">Welcome back! Here's your business overview.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <KpiCard title="Total Revenue" value={`₹${analytics.totalRevenue.toLocaleString('en-IN')}`} icon="chart-pie" color="text-green-600 dark:text-green-400" />
                <KpiCard title="Collected" value={`₹${analytics.totalPayments.toLocaleString('en-IN')}`} icon="banknotes" color="text-blue-600 dark:text-blue-400" />
                <KpiCard title="Unpaid Balance" value={`₹${analytics.unpaidBalance.toLocaleString('en-IN')}`} icon="document-text" color="text-red-600 dark:text-red-400" />
                <KpiCard title="Total Invoices" value={analytics.totalInvoices} icon="document-duplicate" color="text-slate-600 dark:text-slate-400" />
            </div>

            {pendingOrders.length > 0 && (
                <Card>
                    <div className="p-6 border-b dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Pending Orders</h3>
                    </div>
                    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                        {pendingOrders.map(order => (
                             <li key={order.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <p className="font-semibold text-indigo-600 dark:text-indigo-400">{order.customerName}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{order.customerPhone} &bull; {order.orderDate}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{order.services.map(s => s.name).join(', ')}</p>
                                </div>
                                <div className="flex items-center gap-4 self-end sm:self-auto">
                                    <div className='text-right'>
                                        <p className="text-xs">Advance</p>
                                        <p className="font-semibold">₹{order.advancePaid.amount}</p>
                                    </div>
                                    <Button onClick={() => onGenerateInvoice(order)} variant="primary">
                                        Generate Invoice
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-4 md:p-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Revenue Trend</h3>
                     <div className="flex space-x-2 mb-4">
                        {(['day', 'week', 'month'] as ChartPeriod[]).map(p => (
                             <button key={p} onClick={() => setChartPeriod(p)} className={`px-3 py-1 text-sm font-semibold rounded-full transition ${chartPeriod === p ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
                        ))}
                    </div>
                    <div className="h-80"><canvas ref={barChartRef}></canvas></div>
                </Card>

                <div className="flex flex-col gap-6">
                    <Card className="p-6 flex-1">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Revenue by Type</h3>
                        <div className="h-60"><canvas ref={pieChartRef}></canvas></div>
                    </Card>
                    <Card className="p-6 flex-1">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Top Services</h3>
                        <div className="space-y-3">
                            {analytics.topServices.length > 0 ? analytics.topServices.map(([name, count]) => (
                                <div key={name} className="flex justify-between items-center text-sm">
                                    <p className="font-medium text-slate-700 dark:text-slate-300">{name}</p>
                                    <span className="font-bold text-slate-800 dark:text-slate-100">{count}</span>
                                </div>
                            )) : <p className="text-slate-500 dark:text-slate-400 text-center text-sm">No service data yet.</p>}
                        </div>
                    </Card>
                </div>
            </div>
             <Card>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Recent Invoices</h3>
                </div>
                 <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                     {recentInvoices.length > 0 ? recentInvoices.map(inv => <InvoiceListItem key={inv.id} invoice={inv} onPreview={onPreviewInvoice} />)
                     : (
                        <div className='p-4'>
                            <EmptyState icon="document-text" title="No Recent Invoices" message="Your latest invoices will appear here once created." />
                        </div>
                     )}
                </ul>
            </Card>
        </div>
    );
};


const InvoiceListItem: React.FC<{ invoice: Invoice; onPreview: (invoice: Invoice) => void; }> = ({ invoice, onPreview }) => {
    const totalAmount = calculateInvoiceTotal(invoice.services);
    const status = calculateStatus(invoice);
    
    return (
        <li>
            <button onClick={() => onPreview(invoice)} className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div>
                    <p className="font-semibold text-indigo-600 dark:text-indigo-400">{invoice.customerName}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">#{invoice.invoiceNumber} &bull; {invoice.invoiceDate}</p>
                </div>
                <div className="text-right">
                     <p className="font-bold text-slate-800 dark:text-slate-100">₹{totalAmount.toLocaleString('en-IN')}</p>
                    {status === 'paid' && <Badge color="green">Paid</Badge>}
                    {status === 'partially_paid' && <Badge color="amber">Partial</Badge>}
                    {status === 'unpaid' && <Badge color="red">Unpaid</Badge>}
                </div>
            </button>
        </li>
    );
}