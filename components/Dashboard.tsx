
import React, { useEffect, useRef, useState } from 'react';
import type { AnalyticsData, Invoice } from '../types';
import { filterAndGroupInvoicesForChart } from '../services/analyticsService';
import { useInvoices } from '../hooks/useInvoices';

declare global {
    interface Window {
        Chart: any;
    }
}

const KpiCard: React.FC<{ title: string; value: string | number; icon: string; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-indigo-500 hover:shadow-xl transition duration-300 transform hover:scale-[1.03]">
        <p className="text-xs text-gray-500 font-medium">{title}</p>
        <div className="flex items-center justify-between mt-1">
            <span className={`text-2xl md:text-3xl font-extrabold ${color}`}>{value}</span>
            <span className="text-2xl opacity-50">{icon}</span>
        </div>
    </div>
);

type ChartPeriod = 'day' | 'week' | 'month';

export const Dashboard: React.FC<{ analytics: AnalyticsData }> = ({ analytics }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);
    const { invoices } = useInvoices();
    const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('month');

    useEffect(() => {
        if (!chartRef.current) return;
        
        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;
        
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }
        
        if (typeof window.Chart === 'undefined') {
            console.error("Chart.js is not loaded");
            return;
        }

        const data = filterAndGroupInvoicesForChart(chartPeriod, invoices);

        const titleMap = {
            day: 'Revenue by Hour (Today)',
            week: 'Revenue by Day (This Week)',
            month: 'Revenue by Day (This Month)'
        };

        chartInstanceRef.current = new window.Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Total Revenue (₹)',
                    data: data.datasets[0].data,
                    backgroundColor: '#60a5fa',
                    borderColor: '#2563eb',
                    borderWidth: 1,
                    borderRadius: 5,
                    hoverBackgroundColor: '#2563eb',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: titleMap[chartPeriod], font: { size: 16 } }
                },
                scales: { y: { beginAtZero: true, title: { display: true, text: 'Revenue (₹)' } } }
            }
        });

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chartPeriod, invoices]);


    const ChartPeriodButton: React.FC<{ period: ChartPeriod, label: string }> = ({ period, label }) => (
        <button
            onClick={() => setChartPeriod(period)}
            className={`rounded-full shadow-lg transition duration-200 ease-in-out font-bold py-2 px-4 ${chartPeriod === period ? 'bg-blue-600 text-white shadow-xl' : 'bg-gray-200 text-gray-700 shadow-md'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-1 sm:p-4">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-amber-600">Performance Overview</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <KpiCard title="Total Invoices" value={analytics.totalInvoices} icon="📄" color="text-indigo-600" />
                <KpiCard title="Gross Revenue" value={`₹${analytics.totalRevenue.toLocaleString('en-IN')}`} icon="💰" color="text-green-600" />
                <KpiCard title="Total Collected" value={`₹${analytics.totalPayments.toLocaleString('en-IN')}`} icon="💸" color="text-blue-600" />
                <KpiCard title="Avg. Inv. Value" value={analytics.totalInvoices > 0 ? `₹${(analytics.totalRevenue / analytics.totalInvoices).toFixed(2)}` : '₹0'} icon="📊" color="text-gray-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-2xl border-t-4 border-amber-500">
                    <h3 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Financial Flow Trends (Revenue)</h3>
                    <div className="flex space-x-2 sm:space-x-3 mb-6">
                       <ChartPeriodButton period="day" label="Daily" />
                       <ChartPeriodButton period="week" label="Weekly" />
                       <ChartPeriodButton period="month" label="Monthly" />
                    </div>
                    <div className="h-80 w-full">
                        <canvas ref={chartRef}></canvas>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="bg-gray-50 p-4 sm:p-6 rounded-xl shadow-inner flex-1">
                        <h3 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Payment Breakdown</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 rounded-md bg-white shadow-sm border-l-4 border-red-400">
                                <p className="font-semibold text-gray-700 text-sm">Old Balance Collected:</p>
                                <p className="font-extrabold text-red-600">₹{analytics.totalOldBalance.toFixed(2)}</p>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-md bg-white shadow-sm border-l-4 border-green-400">
                                <p className="font-semibold text-gray-700 text-sm">Advance Paid Used:</p>
                                <p className="font-extrabold text-green-600">₹{analytics.totalAdvancePaid.toFixed(2)}</p>
                            </div>
                             <div className="flex justify-between items-center p-3 rounded-md bg-white shadow-sm border-l-4 border-indigo-400">
                                <p className="font-semibold text-gray-700 text-sm">New Payments:</p>
                                <p className="font-extrabold text-indigo-600">₹{analytics.totalPayments.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl flex-1 border-b-4 border-blue-500">
                        <h3 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Top Services</h3>
                        <div className="space-y-3 text-sm">
                            {analytics.topServices.length > 0 ? (
                                analytics.topServices.map(([name, count], index) => (
                                    <div key={name} className={`flex justify-between items-center pb-2 ${index < analytics.topServices.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                        <p className="font-medium text-gray-700">{index + 1}. {name}</p>
                                        <span className="font-bold text-lg text-blue-700">{count}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center">No service data available yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
