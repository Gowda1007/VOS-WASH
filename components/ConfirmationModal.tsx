import React, { useState, useEffect } from 'react';
import type { Invoice, PaymentMethod, AppSettings, PendingOrder, Customer, ConfirmModalState } from '../types';
import { calculateRemainingBalance } from '../hooks/useInvoices';
import { useLanguage } from '../hooks/useLanguage';

interface ConfirmationModalProps {
  state: ConfirmModalState;
  setState: React.Dispatch<React.SetStateAction<ConfirmModalState>>;
  appSettings: AppSettings;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ state, setState, appSettings }) => {
  const { isOpen, action, invoice, title, message, onConfirm } = state;
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (action === 'collect' && invoice) {
      setAmount(calculateRemainingBalance(invoice));
    } else {
      setAmount(0);
    }
    setMethod('cash');
  }, [action, invoice]);

  if (!isOpen) return null;

  const handleClose = () => setState({ isOpen: false });

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsLoading(true);
      try {
        if (action === 'collect') {
            await onConfirm(amount, method);
        } else {
            await onConfirm();
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const generateQrCodeUrl = () => {
    if (!appSettings.upiId || !amount || amount <= 0) return null;
    const payeeName = "VOS WASH";
    const upiUrl = `upi://pay?pa=${appSettings.upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;
  };

  const qrCodeUrl = generateQrCodeUrl();
  const buttonColor = action === 'delete' || action === 'deleteOrder' || action === 'deleteCustomer' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">{title}</h3>
        <p className="text-slate-700 dark:text-slate-300 mb-4">{message}</p>
        
        {action === 'collect' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="confirmAmountInput" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('enter-amount')}</label>
              <input 
                type="number" 
                id="confirmAmountInput" 
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
              />
            </div>
             <div>
              <label htmlFor="paymentMethod" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('payment-method')}</label>
               <div className="relative">
                  <select 
                    id="paymentMethod" 
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                    className="appearance-none block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                      <option value="cash">{t('cash')}</option>
                      <option value="upi">{t('upi')}</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-700 dark:text-slate-300">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
              </div>
            </div>
            {action === 'collect' && method === 'upi' && (
              <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 text-center">
                {qrCodeUrl ? (
                  <>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{t('scan-to-pay', 'Scan to pay ₹{amount}').replace('{amount}', amount.toString())}</p>
                    <img src={qrCodeUrl} alt="UPI QR Code" className="mx-auto rounded-lg w-48 h-48" />
                    <p className="mt-2 font-semibold text-slate-800 dark:text-slate-200">{appSettings.upiId}</p>
                  </>
                ) : (
                  <p className="text-slate-500">{t('enter-valid-amount-qr')}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={handleClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 px-4 py-2 rounded-md font-semibold">
            {t('cancel')}
          </button>
          <button onClick={handleConfirm} disabled={isLoading || (action === 'collect' && amount <= 0)} className={`${buttonColor} text-white px-4 py-2 rounded-md font-semibold disabled:opacity-50 transition`}>
            {isLoading ? t('processing') : (action === 'delete' || action === 'deleteOrder' || action === 'deleteCustomer' ? t('confirm-delete') : t('confirm-collection'))}
          </button>
        </div>
      </div>
    </div>
  );
};