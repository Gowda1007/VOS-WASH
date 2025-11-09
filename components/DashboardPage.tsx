 
import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { AnalyticsData, Invoice, PendingOrder } from '../types';
import { filterAndGroupInvoicesForChart } from '../services/analyticsService';
import { Card, Badge, Icon, Button, EmptyState } from './Common';
import { calculateInvoiceTotal, calculateStatus } from '../hooks/useInvoices';
import { useLanguage } from '../hooks/useLanguage';
import Chart from 'chart.js/auto'; // Dynamically imported

// No longer need declare global for window object, import directly
// declare global {
//     interface Window { Chart: any; }
// }

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.ComponentProps<typeof Icon>['name']; color: string }> = ({ title, value, icon, color }) => {
    const valueString = String(value);
    let fontSizeClass = 'text-3xl';

    // Logic to shrink font size for large numbers (up to 7 digits or more)
    if (valueString.length > 10) {
        fontSizeClass = 'text-xl';
    } else if (valueString.length > 7) {
        fontSizeClass = 'text-2xl';
    }

    return (
        <Card className="p-4">
            <div className="flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                    <div className={`p-2 rounded-full bg-opacity-20 ${color.replace('text', 'bg').replace('-600', '-100')} dark:${color.replace('text', 'bg').replace('-600', '-900')} dark:bg-opacity-30`}>
                        <Icon name={icon} className={`w-5 h-5 ${color}`} />
                    </div>
                </div>
                <p className={`${fontSizeClass} font-bold ${color} truncate`}>{value}</p>
            </div>
        </Card>
    );
};

type ChartPeriod = 'day' | 'week' | 'month';

interface DashboardPageProps {
    analytics: AnalyticsData;
    recentInvoices: Invoice[];
    pendingOrders: PendingOrder[];
    onPreviewInvoice: (invoice: Invoice) => void;
    onGenerateInvoice: (order: PendingOrder) => void;
    onDeleteOrder: (orderId: string) => void;
    onNavigateToUnpaid: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ analytics, recentInvoices, pendingOrders, onPreviewInvoice, onGenerateInvoice, onDeleteOrder, onNavigateToUnpaid }) => {
    const barChartRef = useRef<HTMLCanvasElement>(null);
    const barChartInstanceRef = useRef<any>(null);
    const pieChartRef = useRef<HTMLCanvasElement>(null);
    const pieChartInstanceRef = useRef<any>(null);
    const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('month');
    
    const { t } = useLanguage();

    const sortedPendingOrders = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // For date comparison without time

        const ordersWithData = pendingOrders.map(order => ({
            ...order,
            totalAmount: calculateInvoiceTotal(order.services),
            dueDateObj: order.dueDate ? new Date(order.dueDate) : null,
        }));

        return ordersWithData.sort((a, b) => {
            // 1. Urgent status
            if (a.isUrgent && !b.isUrgent) return -1;
            if (!a.isUrgent && b.isUrgent) return 1;

            const aDueDate = a.dueDateObj;
            const bDueDate = b.dueDateObj;

            // 2. Due date presence (orders with due dates first)
            if (aDueDate && !bDueDate) return -1;
            if (!aDueDate && bDueDate) return 1;
            if (!aDueDate && !bDueDate) return b.totalAmount - a.totalAmount; // Fallback to amount

            // 3. Overdue status
            const aIsOverdue = aDueDate! < now;
            const bIsOverdue = bDueDate! < now;
            if (aIsOverdue && !bIsOverdue) return -1;
            if (!aIsOverdue && bIsOverdue) return 1;

            // 4. Due date proximity (closer dates first)
            const timeDiffA = aDueDate!.getTime() - now.getTime();
            const timeDiffB = bDueDate!.getTime() - now.getTime();
            if (timeDiffA !== timeDiffB) return timeDiffA - timeDiffB;

            // 5. Order value (higher value first)
            return b.totalAmount - a.totalAmount;
        });
    }, [pendingOrders]);
    
    useEffect(() => {
        if (!barChartRef.current || typeof Chart === 'undefined') return; // Use Chart directly
        const ctx = barChartRef.current.getContext('2d');
        if (!ctx) return;
        if (barChartInstanceRef.current) barChartInstanceRef.current.destroy();

        const data = filterAndGroupInvoicesForChart(chartPeriod, recentInvoices);
        const chartColors = {
            grid: 'rgba(0, 0, 0, 0.1)',
            ticks: '#64748b',
        };

        barChartInstanceRef.current = new Chart(ctx, { // Use Chart directly
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: t('total-revenue'),
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
    }, [chartPeriod, recentInvoices, t]);

     useEffect(() => {
        if (!pieChartRef.current || typeof Chart === 'undefined') return; // Use Chart directly
        const ctx = pieChartRef.current.getContext('2d');
        if (!ctx) return;
        if (pieChartInstanceRef.current) pieChartInstanceRef.current.destroy();

        const data = analytics.revenueByCustomerType;
        const chartColors = {
            ticks: '#64748b',
            border: '#fff'
        };

        pieChartInstanceRef.current = new Chart(ctx, { // Use Chart directly
            type: 'doughnut',
            data: {
                labels: [t('customer'), t('garage_service_station'), t('dealer')],
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
    }, [analytics.revenueByCustomerType, t]);

    return (
        <div className="space-y-8">
            <p className="text-slate-500 dark:text-slate-400">{t('welcome-back')}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <KpiCard title={t('total-revenue')} value={`₹${analytics.totalRevenue.toLocaleString('en-IN')}`} icon="chart-up-circle" color="text-green-600 dark:text-green-400" />
                <KpiCard title={t('collected')} value={`₹${analytics.totalPayments.toLocaleString('en-IN')}`} icon="cash-banknote" color="text-blue-600 dark:text-blue-400" />
                <div onClick={onNavigateToUnpaid} className="cursor-pointer">
                    <KpiCard title={t('unpaid-balance')} value={`₹${analytics.unpaidBalance.toLocaleString('en-IN')}`} icon="hourglass" color="text-red-600 dark:text-red-400" />
                </div>
                <KpiCard title={t('total-invoices')} value={analytics.totalInvoices} icon="document-check" color="text-slate-600 dark:text-slate-400" />
            </div>

            {pendingOrders.length > 0 && (
                <Card>
                    <div className="p-6 border-b dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('pending-orders')}</h3>
                    </div>
                    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                        {sortedPendingOrders.map(order => {
                            const today = new Date();
                            today.setHours(0,0,0,0);
                            const isOverdue = order.dueDate ? new Date(order.dueDate) < today : false;
                            const dueDateObj = order.dueDate ? new Date(order.dueDate) : null;
                            const formattedDueDate = dueDateObj ? dueDateObj.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

                             return (
                                <li key={order.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="grow">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-semibold text-indigo-600 dark:text-indigo-400">{order.customerName}</p>
                                            {order.isUrgent && <Badge color="red">{t('urgent-badge', 'Urgent')}</Badge>}
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{order.customerPhone}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('order-date-label')}: {order.orderDate}</p>
                                        {order.dueDate && 
                                            <p className={`text-sm mt-1 font-semibold text-red-600 ${isOverdue ? 'font-bold' : ''}`}>
                                                {t('due-date')}: {formattedDueDate}
                                            </p>
                                        }
                                    </div>
                                    <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
                                        <div className='text-right grow sm:grow-0'>
                                            <p className="text-xs">{t('advance-paid')}</p>
                                            <p className="font-semibold">₹{order.advancePaid.amount.toLocaleString('en-IN')}</p>
                                        </div>
                                        <Button onClick={() => onGenerateInvoice(order)} variant="primary" className="py-2! px-3! text-sm">
                                            {t('generate-invoice')}
                                        </Button>
                                        <button onClick={(e) => { e.stopPropagation(); onDeleteOrder(order.id); }} className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors" title={t('delete')}>
                                            <Icon name="trash" className="w-5 h-5"/>
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-4 md:p-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">{t('revenue-trend')}</h3>
                     <div className="flex space-x-2 mb-4">
                        {(['day', 'week', 'month'] as ChartPeriod[]).map(p => (
                             <button key={p} onClick={() => setChartPeriod(p)} className={`px-3 py-1 text-sm font-semibold rounded-full transition capitalize ${chartPeriod === p ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>{t(p)}</button>
                        ))}
                    </div>
                    <div className="h-80"><canvas ref={barChartRef}></canvas></div>
                </Card>

                <div className="flex flex-col gap-6">
                    <Card className="p-6 flex-1">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">{t('revenue-by-type')}</h3>
                        <div className="h-60"><canvas ref={pieChartRef}></canvas></div>
                    </Card>
                    <Card className="p-6 flex-1">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">{t('top-services')}</h3>
                        <div className="space-y-3">
                            {analytics.topServices.length > 0 ? analytics.topServices.map(([name, count]) => (
                                <div key={name} className="flex justify-between items-center text-sm">
                                    <p className="font-medium text-slate-700 dark:text-slate-300">{t(name)}</p>
                                    <span className="font-bold text-slate-800 dark:text-slate-100">{count}</span>
                                </div>
                            )) : <p className="text-slate-500 dark:text-slate-400 text-center text-sm">{t('no-service-data')}</p>}
                        </div>
                    </Card>
                </div>
            </div>
             <Card>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('recent-invoices')}</h3>
                </div>
                 <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                     {recentInvoices.length > 0 ? recentInvoices.slice(0, 3).map((inv, index) => <InvoiceListItem key={inv.invoiceNumber || index} invoice={inv} onPreview={onPreviewInvoice} />)
                     : (
                        <div key="empty-state" className='p-4'>
                            <EmptyState icon="document-text" title={t('no-invoices-found')} message={t('no-invoices-found-message', "Your latest invoices will appear here once created.")} />
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
    const { t } = useLanguage();
    
    return (
        <li>
            <button onClick={() => onPreview(invoice)} className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div>
                    <p className="font-semibold text-indigo-600 dark:text-indigo-400">{invoice.customerName}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">#{invoice.invoiceNumber} &bull; {invoice.invoiceDate}</p>
                </div>
                <div className="text-right">
                     <p className="font-bold text-slate-800 dark:text-slate-100">₹{totalAmount.toLocaleString('en-IN')}</p>
                    {status === 'paid' && <Badge color="green">{t('paid')}</Badge>}
                    {status === 'partially_paid' && <Badge color="amber">{t('partially_paid')}</Badge>}
                    {status === 'unpaid' && <Badge color="red">{t('unpaid')}</Badge>}
                </div>
            </button>
        </li>
    );
}