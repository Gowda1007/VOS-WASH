
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Invoice } from '../types';
import { Card, Button, Icon } from './Common';
import { calculateInvoiceTotal, calculateTotalPaid } from '../hooks/useInvoices';
import { downloadPDF } from '../services/pdfService';
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../hooks/useLanguage';
import Chart from 'chart.js/auto'; // Dynamically imported

// No longer need declare global for window object, import directly
// declare global { interface Window { Chart: any; } }

type ReportPeriod = 'this_month' | 'last_month' | 'this_year';

export const ReportsPage: React.FC<{ invoices: Invoice[] }> = ({ invoices }) => {
    const [period, setPeriod] = useState<ReportPeriod>('this_month');
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);
    const { t } = useLanguage();
    const toast = useToast();

    const filteredData = useMemo(() => {
        const now = new Date();
        let startDate: Date;
        let endDate = new Date(now);

        switch (period) {
            case 'this_month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'last_month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'this_year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
        }

        const filteredInvoices = invoices.filter(inv => {
            const [day, month, year] = inv.invoiceDate.split('/').map(Number);
            const invDate = new Date(year, month - 1, day);
            return invDate >= startDate && invDate <= endDate;
        });

        const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + calculateInvoiceTotal(inv.services), 0);
        const totalCollected = filteredInvoices.reduce((sum, inv) => sum + calculateTotalPaid(inv.payments), 0);

        return {
            invoices: filteredInvoices,
            stats: {
                totalRevenue,
                totalCollected,
                invoiceCount: filteredInvoices.length,
            },
        };
    }, [invoices, period]);

    useEffect(() => {
        if (!chartRef.current || typeof Chart === 'undefined') return; // Use Chart directly
        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;
        if (chartInstanceRef.current) chartInstanceRef.current.destroy();

        const data = filteredData.invoices;
        const labels: string[] = [];
        const revenueData: number[] = [];
        const collectedData: number[] = [];
        const dataMap = new Map<string, { revenue: number, collected: number }>();

        if (period === 'this_year') {
             const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
             months.forEach(m => dataMap.set(m, { revenue: 0, collected: 0 }));
             data.forEach(inv => {
                 const [,, year] = inv.invoiceDate.split('/').map(Number);
                 if (year === new Date().getFullYear()) {
                     const monthIndex = parseInt(inv.invoiceDate.split('/')[1], 10) - 1;
                     const key = months[monthIndex];
                     const entry = dataMap.get(key)!;
                     entry.revenue += calculateInvoiceTotal(inv.services);
                     entry.collected += calculateTotalPaid(inv.payments);
                 }
             });
        } else {
            const date = new Date();
            if (period === 'last_month') date.setMonth(date.getMonth() - 1);
            const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
            for(let i = 1; i <= daysInMonth; i++) dataMap.set(String(i), { revenue: 0, collected: 0 });
            data.forEach(inv => {
                const day = parseInt(inv.invoiceDate.split('/')[0], 10);
                const key = String(day);
                const entry = dataMap.get(key);
                if (entry) {
                    entry.revenue += calculateInvoiceTotal(inv.services);
                    entry.collected += calculateTotalPaid(inv.payments);
                }
            });
        }

        dataMap.forEach((value, key) => {
            labels.push(key);
            revenueData.push(value.revenue);
            collectedData.push(value.collected);
        });
        
        const chartColors = {
            grid: 'rgba(0, 0, 0, 0.1)',
            ticks: '#64748b',
        };

        chartInstanceRef.current = new Chart(ctx, { // Use Chart directly
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: t('total-revenue'), data: revenueData, backgroundColor: 'rgba(79, 70, 229, 0.8)' },
                    { label: t('collected'), data: collectedData, backgroundColor: 'rgba(5, 150, 105, 0.8)' }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: chartColors.grid }, ticks: { color: chartColors.ticks } }, x: { grid: { color: chartColors.grid }, ticks: { color: chartColors.ticks } } }, plugins: { legend: { labels: { color: chartColors.ticks } } } }
        });
        return () => chartInstanceRef.current?.destroy();
    }, [filteredData, period, t]);
    
    const handleDownload = async () => {
        const reportElement = document.getElementById('report-content');
        if (reportElement) {
           const titleElement = document.createElement('h1');
           const periodText = t(period);
           titleElement.innerText = t('report-title').replace('{period}', periodText);
           titleElement.className = 'text-2xl font-bold mb-4 text-black p-4 sm:p-6';
           reportElement.prepend(titleElement);

           const fakeInvoiceForFilename = { invoiceNumber: period, customerName: 'Report' };
           await downloadPDF(fakeInvoiceForFilename as Invoice, reportElement);
           reportElement.removeChild(titleElement);
           toast.success(t('export-success-message'));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <p className="text-slate-500 dark:text-slate-400">{t('analyze-revenue-and-collections')}</p>
                <div className="flex gap-2">
                    {(['this_month', 'last_month', 'this_year'] as ReportPeriod[]).map(p => (
                        <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 text-sm font-semibold rounded-lg capitalize transition ${period === p ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700'}`}>{t(p)}</button>
                    ))}
                </div>
            </div>
            
            <div id="report-content-wrapper">
                 <div className="text-right mb-4">
                    <Button onClick={handleDownload} variant="secondary"><Icon name="document-duplicate" className="w-5 h-5" /> {t('download-pdf')}</Button>
                </div>
                <div id="report-content" className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <StatCard title={t('total-revenue')} value={`₹${filteredData.stats.totalRevenue.toLocaleString()}`} />
                        <StatCard title={t('collected')} value={`₹${filteredData.stats.totalCollected.toLocaleString()}`} />
                        <StatCard title={t('invoices-issued')} value={filteredData.stats.invoiceCount} />
                    </div>
                    
                    <h3 className="text-xl font-bold mb-4">{t('cashflow-trend')}</h3>
                    <div className="h-96">
                        <canvas ref={chartRef}></canvas>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value }: { title: string, value: string | number }) => (
    <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg">
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
);