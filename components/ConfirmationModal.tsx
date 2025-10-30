import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Platform, Alert, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
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
        handleClose(); // Close modal on successful confirmation
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
  const buttonBackgroundColor = action === 'delete' || action === 'deleteOrder' || action === 'deleteCustomer' ? styles.bgRed : styles.bgGreen;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isOpen}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {action === 'collect' && (
            <View style={styles.formSpace}>
              <View>
                <Text style={styles.label}>{t('enter-amount')}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={amount === 0 ? '' : amount.toString()}
                  onChangeText={(text) => setAmount(parseFloat(text) || 0)}
                />
              </View>
              <View>
                <Text style={styles.label}>{t('payment-method')}</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={method}
                    onValueChange={(itemValue) => setMethod(itemValue as PaymentMethod)}
                    style={styles.picker}
                    // itemStyle={styles.pickerItem} // itemStyle is not supported on Android.
                  >
                    <Picker.Item label={t('cash')} value="cash" />
                    <Picker.Item label={t('upi')} value="upi" />
                  </Picker>
                </View>
              </View>
              {action === 'collect' && method === 'upi' && (
                <View style={styles.qrCodeContainer}>
                  {qrCodeUrl ? (
                    <>
                      <Text style={styles.qrCodeText}>{t('scan-to-pay', 'Scan to pay ₹{amount}').replace('{amount}', amount.toString())}</Text>
                      <Image source={{ uri: qrCodeUrl }} style={styles.qrCodeImage} />
                      <Text style={styles.upiIdText}>{appSettings.upiId}</Text>
                    </>
                  ) : (
                    <Text style={styles.noQrCodeText}>{t('enter-valid-amount-qr')}</Text>
                  )}
                </View>
              )}
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleClose} style={[styles.button, styles.cancelButton]}>
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={isLoading || (action === 'collect' && amount <= 0)}
              style={[styles.button, buttonBackgroundColor, (isLoading || (action === 'collect' && amount <= 0)) && styles.disabledButton]}
            >
              <Text style={styles.buttonText}>
                {isLoading ? t('processing') : (action === 'delete' || action === 'deleteOrder' || action === 'deleteCustomer' ? t('confirm-delete') : t('confirm-collection'))}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 50,
  },
  modalContent: {
    backgroundColor: '#ffffff', // bg-white
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '100%',
    maxWidth: 400,
    padding: 24, // p-6
  },
  title: {
    fontSize: 20, // text-xl
    fontWeight: 'bold',
    color: '#1e293b', // text-slate-800
    marginBottom: 16, // mb-4
    paddingBottom: 8, // pb-2
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0', // border-b border-slate-200
  },
  message: {
    color: '#334155', // text-slate-700
    marginBottom: 16, // mb-4
  },
  formSpace: {
    gap: 16, // space-y-4
  },
  label: {
    fontSize: 12, // text-sm
    fontWeight: '600', // font-semibold
    color: '#334155', // text-slate-700
    marginBottom: 4, // mb-1
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1', // border-slate-300
    borderRadius: 8,
    paddingHorizontal: 16, // px-4
    paddingVertical: 12, // py-3
    fontSize: 16, // text-base
    backgroundColor: '#ffffff', // bg-white
    color: '#1e293b', // text-slate-800
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#cbd5e1', // border-slate-300
    borderRadius: 8,
    backgroundColor: '#ffffff', // bg-white
    overflow: 'hidden',
  },
  picker: {
    height: 50, // Arbitrary height for picker
    width: '100%',
    color: '#1e293b', // text-slate-800
  },
  pickerItem: {
    fontSize: 16, // text-base
  },
  qrCodeContainer: {
    marginTop: 16, // mt-4
    padding: 16, // p-4
    borderRadius: 8,
    backgroundColor: '#f8fafc', // bg-slate-50
    borderWidth: 1,
    borderColor: '#e2e8f0', // border-slate-200
    alignItems: 'center',
  },
  qrCodeText: {
    fontSize: 12, // text-sm
    color: '#475569', // text-slate-600
    marginBottom: 8, // mb-2
  },
  qrCodeImage: {
    width: 192, // w-48
    height: 192, // h-48
    borderRadius: 8,
    resizeMode: 'contain',
  },
  upiIdText: {
    marginTop: 8, // mt-2
    fontWeight: '600', // font-semibold
    color: '#1e293b', // text-slate-800
  },
  noQrCodeText: {
    color: '#64748b', // text-slate-500
    height: 240, // Match QR code image height for centering
    textAlignVertical: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12, // gap-3
    marginTop: 24, // mt-6
  },
  button: {
    paddingHorizontal: 16, // px-4
    paddingVertical: 10, // py-2
    borderRadius: 6, // rounded-md
    fontWeight: '600', // font-semibold
    // transitionDuration: 200, // FIX: Removed web-specific property
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#e2e8f0', // bg-slate-200
  },
  cancelButtonText: {
    color: '#1e293b', // text-slate-800
    fontWeight: '600',
  },
  bgRed: {
    backgroundColor: '#dc2626', // bg-red-600
  },
  bgGreen: {
    backgroundColor: '#22c55e', // bg-green-600
  },
  disabledButton: {
    opacity: 0.5,
  },
});