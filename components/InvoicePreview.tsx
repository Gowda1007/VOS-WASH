
import React, { useRef, useEffect } from 'react';
import type { Invoice, Language } from '../types';
import { calculateInvoiceTotal, calculateRemainingBalance } from '../hooks/useInvoices';
import { Logo, Vari } from './Common';
import { useLanguage } from '../hooks/useLanguage';

// Removed global declarations for html2canvas, jspdf, Chart
// They are now either imported where needed or handled by the bundling process.
// declare global {
//     interface Window {
//         html2canvas: any;
//         jspdf: any;
//         Chart: any;
//     }
// }

const useResponsiveScaling = (
    contentRef: React.RefObject<HTMLDivElement>,
    wrapperRef: React.RefObject<HTMLDivElement>,
    baseWidth: number
) => {
    useEffect(() => {
        const wrapper = wrapperRef.current;
        const content = contentRef.current;
        if (!wrapper || !content) return;

        const observer = new ResizeObserver(entries => {
            // Defer the execution to the next frame to avoid ResizeObserver loop errors.
            window.requestAnimationFrame(() => {
                if (!wrapper || !content) return;
                for (const entry of entries) {
                    const wrapperWidth = entry.contentRect.width;
                    if (wrapperWidth > 0) {
                        const scale = wrapperWidth / baseWidth;
                        content.style.transform = `scale(${scale})`;
                        wrapper.style.height = `${(baseWidth * 1.414) * scale}px`;
                    }
                }
            });
        });

        observer.observe(wrapper);
        return () => observer.disconnect();
    }, [contentRef, wrapperRef, baseWidth]);
};

const formatDateForDisplay = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return `(${dateStr})`;
    if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
         const [d, m, y] = dateStr.split('/');
         return `(${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')})`;
    }
    return `(${dateStr})`;
};

const FinancialEntry: React.FC<{
  label: string;
  amount: number;
  date?: string;
  sign: '+' | '-';
  color: 'red' | 'green' | 'blue';
}> = ({ label, amount, date, sign, color }) => {
  const colorClasses = {
    red: 'text-red-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
  };

  return (
    <div className={`flex justify-between mb-2 text-lg ${colorClasses[color]}`}>
      <span>{label} {formatDateForDisplay(date)}</span>
      <span>{sign} ₹{amount.toFixed(2)}</span>
    </div>
  );
};


export const InvoicePreview: React.FC<{ invoiceData: Invoice, language?: Language }> = ({ invoiceData, language = 'en' }) => {
  const { services, customerName, customerAddress, customerPhone, invoiceNumber, invoiceDate, payments, oldBalance, advancePaid } = invoiceData;
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const BASE_INVOICE_WIDTH = 800;
  const { invoiceT } = useLanguage();
  const t = (key: string) => invoiceT(key, language);

  useResponsiveScaling(contentRef, wrapperRef, BASE_INVOICE_WIDTH);

  const serviceTotal = calculateInvoiceTotal(services);
  const balanceDue = calculateRemainingBalance(invoiceData);
  const subtotal = services.reduce((sum, s) => sum + (s.price * s.quantity), 0);
  const tax = subtotal * 0.18;
  const discount = tax;

  const hasFinancialDetails = (oldBalance && oldBalance.amount > 0) || 
                              (advancePaid && advancePaid.amount > 0) || 
                              (payments && payments.some(p => p.amount > 0));

  return (
    <div id="invoice-preview-container" ref={wrapperRef} className="w-full relative">
      <div 
        id="invoice-preview-content" 
        ref={contentRef}
        className="absolute top-0 left-0 bg-white text-gray-800 shadow-xl font-sans flex flex-col transform-gpu"
        style={{ width: `${BASE_INVOICE_WIDTH}px`, height: `${BASE_INVOICE_WIDTH * 1.414}px`, transformOrigin: 'top left' }}
      >
        <div className="p-12 m-0 flex-grow flex flex-col">
            <div className="flex-grow">
              <header className="text-center mb-5 border-b pb-4">
                  <Vari className="w-56 mx-auto mb-2" />
                  <div className="flex items-center justify-center">
                      <Logo className="w-24" />
                      <div className="flex flex-col">
                          <h1 className="text-5xl font-bold text-blue-700">{t('app-name-invoice')}</h1>
                          <p className="text-xl text-right">{t('app-tagline')}</p>
                      </div>
                  </div>
              </header>
              
              <section className="flex justify-between items-start mb-4 text-lg">
                <div>
                  <h2 className="font-bold text-xl text-gray-700 mb-2">{t('bill-to')}</h2>
                  <p>{customerName}</p>
                  <p>{customerAddress && customerAddress !== 'N/A' ? customerAddress : ''}</p>
                  <p>{customerPhone}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold uppercase text-gray-700">{t('invoice-header')}</h2>
                  <p className="text-gray-500"><strong>{t('invoice-number')}</strong> {invoiceNumber}</p>
                  <p className="text-gray-500"><strong>{t('date')}</strong> {invoiceDate}</p>
                  <div className="pt-1 border-t border-dashed">
                    <p className="font-semibold">{t('business-address')}</p>
                    <p>+919845418725 / 6363178431</p>
                  </div>
                </div>
              </section>
              
              <section className="mb-8">
                  <table className="w-full text-left border border-blue-600 rounded-lg overflow-hidden">
                      <thead className="bg-blue-600 text-white border-b-2 border-blue-800">
                          <tr>
                              <th className="p-1.5 font-semibold">{t('sl-no')}</th>
                              <th className="p-1.5 font-semibold">{t('service')}</th>
                              <th className="p-1.5 font-semibold text-center">{t('qty')}</th>
                              <th className="p-1.5 font-semibold text-right">{t('price')}</th>
                              <th className="p-1.5 font-semibold text-right">{t('total')}</th>
                          </tr>
                      </thead>
                      <tbody>
                          {services.map((s, i) => (
                              <tr key={i} className={`border-b border-gray-200 ${i % 2 === 0 ? 'bg-white' : 'bg-blue-50'}`}>
                                  <td className="p-1.5">{i + 1}</td>
                                  <td className="p-1.5">{t(s.name)}</td>
                                  <td className="p-1.5 text-center">{s.quantity}</td>
                                  <td className="p-1.5 text-right">₹{s.price.toFixed(2)}</td>
                                  <td className="p-1.5 text-right font-semibold text-gray-800">₹{(s.price * s.quantity).toFixed(2)}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </section>

              <section className="flex justify-end mt-auto text-lg">
                  <div className="w-1/2 ">
                      <div className="flex justify-between text-gray-700 mb-1"><p>{t('subtotal')}</p><p>₹{subtotal.toFixed(2)}</p></div>
                      <div className="flex justify-between text-gray-700 mb-1"><p>{t('gst')}</p><p>+ ₹{tax.toFixed(2)}</p></div>
                      <div className="flex justify-between text-gray-700 mb-1 border-b border-dashed "><p>{t('discount')}</p><p>- ₹{discount.toFixed(2)}</p></div>
                      
                      <div className={`flex justify-between text-lg mt-1 pt-1 font-extrabold text-blue-700`}>
                          <p>{hasFinancialDetails ? t('service-total') : t('grand-total')}</p>
                          <p>₹{serviceTotal.toFixed(2)}</p>
                      </div>
                      
                      {hasFinancialDetails && (
                          <div className="mt-2 pt-2 border-t border-b border-dashed border-gray-400 pb-2">
                            {oldBalance && oldBalance.amount > 0 && 
                                <FinancialEntry label={t('old-balance')} amount={oldBalance.amount} date={oldBalance.date} sign="+" color="red" />}
                            {advancePaid && advancePaid.amount > 0 &&
                                <FinancialEntry label={t('advance-paid')} amount={advancePaid.amount} date={advancePaid.date} sign="-" color="green" />}
                            {payments.map((p, i) => 
                                <FinancialEntry key={i} label={t('now-paid')} amount={p.amount} date={p.date} sign="-" color="blue" />)}
                          </div>
                      )}
                      
                      {hasFinancialDetails && (
                          <div className="flex justify-between font-extrabold text-xl mt-2 pt-2 border-t-4 border-double border-blue-600">
                              <p className="text-blue-800">{t('balance-due')}</p>
                              <p className="text-blue-800">₹{balanceDue.toFixed(2)}</p>
                          </div>
                       )}
                  </div>
              </section>
            </div>
            
            <footer className="w-full text-center text-sm text-gray-500 mt-8 pt-2 border-t">
                <p>{t('footer-generated')}</p>
                <p>{t('footer-thanks')}</p>
                <p className="mt-1 text-base leading-tight tracking-tighter font-medium text-blue-700">
                    {t('footer-services')}
                </p>
            </footer>
        </div>
      </div>
      <style>{`
        #invoice-preview-content {
            box-sizing: border-box;
        }
        @media print {
            body * { visibility: hidden; }
            .print-hidden { display: none; }
            #invoice-preview-container, #invoice-preview-container * { 
                visibility: visible; 
            }
            #invoice-preview-container {
                height: auto !important;
            }
            #invoice-preview-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100% !important;
                height: auto !important; 
                min-height: 100%;
                transform: scale(1) !important;
                padding: 1cm;
                color: #000 !important;
                background-color: #fff !important;
                box-shadow: none !important;
                border: none !important;
                font-size: 9pt;
            }
        }
      `}</style>
    </div>
  );
};