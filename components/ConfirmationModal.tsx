import React, { useState, useEffect } from 'react';
import type { Invoice } from '../types';

export interface ConfirmModalState {
  isOpen: boolean;
  action?: 'delete' | 'collect';
  invoice?: Invoice;
  title?: string;
  message?: string;
  onConfirm?: (amount: number) => Promise<void>;
}

interface ConfirmationModalProps {
  state: ConfirmModalState;
  setState: React.Dispatch<React.SetStateAction<ConfirmModalState>>;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ state, setState }) => {
  const { isOpen, action, invoice, title, message, onConfirm } = state;
  const [amount, setAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (action === 'collect' && invoice) {
      setAmount(invoice.totals.remainingBalance);
    } else {
      setAmount(0);
    }
  }, [action, invoice]);

  if (!isOpen) return null;

  const handleClose = () => setState({ isOpen: false });

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsLoading(true);
      try {
        await onConfirm(amount);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const buttonColor = action === 'delete' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">{title}</h3>
        <p className="text-slate-700 dark:text-slate-300 mb-4">{message}</p>
        
        {action === 'collect' && (
          <div className="mb-4">
            <label htmlFor="confirmAmountInput" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Enter Amount (₹):</label>
            <input 
              type="number" 
              id="confirmAmountInput" 
              value={amount || ''}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
            />
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={handleClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 px-4 py-2 rounded-md font-semibold">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={isLoading} className={`${buttonColor} text-white px-4 py-2 rounded-md font-semibold disabled:opacity-50 transition`}>
            {isLoading ? 'Processing...' : (action === 'delete' ? 'Confirm Delete' : 'Confirm Collection')}
          </button>
        </div>
      </div>
    </div>
  );
};