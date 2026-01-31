import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Switch, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { colors, spacing, typography } from '../styles/theme';
import { Button } from '../components';
import type { CustomerType, ManageableService, PendingOrder, Service } from '../core/types';
import { useCustomers } from '../hooks/useCustomers';
import { useServices } from '../hooks/useServices';
import { usePendingOrders } from '../hooks/usePendingOrders';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const customerTypes: CustomerType[] = ['customer', 'garage_service_station', 'dealer'];

export const TakeOrderScreen: React.FC = () => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { customers, addOrUpdateCustomer } = useCustomers();
  const { serviceSets } = useServices();
  const { addPendingOrder } = usePendingOrders();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', customerType: 'customer' as CustomerType });
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [isUrgent, setIsUrgent] = useState(false);
  const [advancePaid, setAdvancePaid] = useState({ amount: 0, date: '' });
  const [dueDate, setDueDate] = useState('');
  const [customService, setCustomService] = useState({ name: '', price: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const progressAnim = useRef(new Animated.Value((step / 3) * 100)).current;

  // Auto-fill advance paid date with today's date in DD/MM/YYYY format on step 3
  useEffect(() => {
    if (step === 3 && !advancePaid.date) {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      setAdvancePaid(prev => ({ ...prev, date: `${dd}/${mm}/${yyyy}` }));
    }
  }, [step]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (step / 3) * 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step, progressAnim]);

  useEffect(() => {
    if (customer.phone.length === 10) {
      const existing = customers.find(c => c.phone === customer.phone);
      if (existing) setCustomer(prev => ({ ...prev, name: existing.name, address: existing.address }));
    }
  }, [customer.phone, customers]);

  useEffect(() => { setSelectedServices([]); }, [customer.customerType]);

  // Helpers: date masking (DD/MM/YYYY) and validation
  const formatDateInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  const isValidDateDMY = (value: string) => {
    const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return false;
    const dd = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const yyyy = parseInt(m[3], 10);
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yyyy < 1900) return false;
    const d = new Date(yyyy, mm - 1, dd);
    return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
  };

  const dmyToISO = (dmy: string): string => {
    const m = dmy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return '';
    return `${m[3]}-${m[2]}-${m[1]}`;
  };

  const availableServices = useMemo(() => {
    const all = serviceSets[customer.customerType] || [];
    return all.filter((ps: ManageableService) => !selectedServices.some(ss => ss.name === ps.name && !ss.isCustom));
  }, [serviceSets, customer.customerType, selectedServices]);

  const addService = (svc: ManageableService) => {
    setSelectedServices(prev => [...prev, { ...svc, quantity: 1, isCustom: false }]);
  };
  const addCustomService = () => {
    const parsedPrice = parseFloat(customService.price.trim());
    if (!customService.name.trim() || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error(t('valid-service-name-price'));
      return;
    }
    setSelectedServices(prev => [...prev, { name: customService.name.trim(), price: parsedPrice, quantity: 1, isCustom: true }]);
    setCustomService({ name: '', price: '' });
  };
  const removeService = (index: number) => setSelectedServices(prev => prev.filter((_, i) => i !== index));
  const changeQty = (index: number, qty: number) => setSelectedServices(prev => prev.map((s, i) => i===index ? { ...s, quantity: Math.max(1, qty||1) } : s));

  const handleNext = () => {
    if (step === 1) {
      const digits = customer.phone.replace(/\D/g, '');
      if (!customer.name.trim()) {
        toast.error(t('enter-valid-name', 'Customer name is required'));
        return;
      }
      if (digits.length !== 10) {
        toast.error(t('enter-valid-phone', 'Enter a valid phone number'));
        return;
      }
      if (!customer.address.trim()) {
        toast.error(t('enter-valid-address', 'Customer address is required'));
        return;
      }
    }
    if (step === 2) {
      const valid = selectedServices.filter(s => s.name && s.price > 0 && s.quantity > 0);
      if (valid.length === 0) {
        toast.error(t('add-at-least-one-service'));
        return;
      }
    }
    setStep(p => p + 1);
  };

  const handleBack = () => setStep(p => Math.max(1, p-1));

  const saveOrder = async () => {
    if (!advancePaid.amount || advancePaid.amount <= 0) {
      toast.error(t('enter-advance-amount'));
      return;
    }
    if (dueDate && !isValidDateDMY(dueDate)) {
      toast.error(t('enter-valid-date', 'Enter a valid date as DD/MM/YYYY'));
      return;
    }

    setIsProcessing(true);
    try {
      // Use ISO format for dates
      const todayISO = new Date().toISOString().slice(0, 10);
      const dueDateISO = dueDate ? dmyToISO(dueDate) : undefined;

      const order: Omit<PendingOrder, 'id'> = {
        orderDate: todayISO,
        customerName: customer.name.trim(),
        customerPhone: customer.phone,
        customerAddress: customer.address.trim(),
        customerType: customer.customerType,
        services: selectedServices,
        advancePaid: { amount: advancePaid.amount, date: todayISO },
        dueDate: dueDateISO,
        isUrgent,
      };

      const newOrder = await addPendingOrder(order);

      if (dueDateISO && newOrder?.id) {
        try {
          const { notificationAdapter } = await import('../adapters');
          const dueDateTime = new Date(dueDateISO);
          dueDateTime.setHours(9, 0, 0, 0); // 9 AM on due date
          const now = new Date();
          if (dueDateTime > now) {
            await notificationAdapter.scheduleNotification?.({
              title: t('order-due-reminder', 'Order Due Reminder'),
              body: `${customer.name.trim()} - ${t('due-today', 'Due today')}`,
              data: { orderId: newOrder.id, type: 'order-due' },
              trigger: { date: dueDateTime },
            });
          }
        } catch (e) {
          console.warn('Failed to schedule notification:', e);
        }
      }

      try {
        const customerRecord = {
          phone: customer.phone,
          name: customer.name.trim(),
          address: customer.address.trim(),
          customerType: customer.customerType,
        };
        await addOrUpdateCustomer(customerRecord);
      } catch (custErr) {
        console.warn('Failed to auto-sync customer from order:', custErr);
      }

      toast.success(t('order-saved-successfully'));
      navigation.goBack();
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error(t('error-saving-order', 'Could not save order. Please try again.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Header with Progress */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg, backgroundColor: colors.white }]}> 
        <View style={styles.headerTop}>
          <MaterialIcons name="shopping-cart" size={28} color={colors.primary} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{t('page-title-take-order')}</Text>
            <Text style={styles.headerSubtitle}>
              {step === 1 ? t('customer-details') : step === 2 ? t('services-and-items') : t('advance-and-delivery')}
            </Text>
          </View>
        </View>
        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {step===1 && (
          <View style={styles.stepCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('customer-phone')} *</Text>
              <View style={styles.inputWithIcon}>
                <MaterialIcons name="phone" size={20} color={colors.textSecondary} />
                <TextInput 
                  style={styles.input} 
                  placeholder={t('customer-phone')} 
                  keyboardType="number-pad" 
                  maxLength={10}
                  value={customer.phone} 
                  onChangeText={v=>{
                    const digits = v.replace(/\D/g, '').slice(0, 10);
                    setCustomer(p=>({...p, phone: digits}));
                  }} 
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('customer-name')} *</Text>
              <View style={styles.inputWithIcon}>
                <MaterialIcons name="person" size={20} color={colors.textSecondary} />
                <TextInput 
                  style={styles.input} 
                  placeholder={t('customer-name')} 
                  value={customer.name} 
                  onChangeText={v=>setCustomer(p=>({...p, name:v}))} 
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('customer-address')} *</Text>
              <View style={styles.inputWithIcon}>
                <MaterialIcons name="location-on" size={20} color={colors.textSecondary} />
                <TextInput 
                  style={styles.input} 
                  placeholder={t('customer-address')} 
                  value={customer.address} 
                  onChangeText={v=>setCustomer(p=>({...p, address:v}))} 
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('customer-type')} *</Text>
              <View style={styles.chipsRow}>
                {customerTypes.map(type => (
                  <TouchableOpacity 
                    key={type} 
                    onPress={()=>setCustomer(p=>({...p, customerType: type}))} 
                    style={[styles.chip, customer.customerType===type && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, customer.customerType===type && styles.chipTextActive]}>{t(type)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {step===2 && (
          <View style={styles.stepCard}>
            <Text style={styles.sectionTitle}>{t('selected-services')}</Text>
            {selectedServices.length===0 && <Text style={styles.emptyText}>{t('no-services-added')}</Text>}
            {selectedServices.map((svc, idx)=>(
              <View key={idx} style={styles.serviceRow}>
                <View style={{flex:1}}>
                  <Text style={styles.serviceName}>{t(svc.name)}</Text>
                  <Text style={styles.serviceMeta}>₹{svc.price} × {svc.quantity} = ₹{svc.price * svc.quantity}</Text>
                </View>
                <TextInput 
                  style={styles.qtyInput} 
                  keyboardType="number-pad" 
                  value={String(svc.quantity)} 
                  onChangeText={v=>changeQty(idx, parseInt(v||'1',10))} 
                />
                <TouchableOpacity onPress={()=>removeService(idx)}>
                  <MaterialIcons name="delete" size={24} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            
            <Text style={[styles.sectionTitle,{marginTop:spacing.lg}]}>{t('add-services')}</Text>
            <View style={styles.wrapRow}>
              {availableServices.map(s => (
                <TouchableOpacity 
                  key={s.name} 
                  onPress={()=>addService(s)} 
                  style={styles.serviceChip}
                >
                  <Text style={styles.serviceChipText}>{t(s.name)}</Text>
                  <Text style={styles.serviceChipPrice}>₹{s.price}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={[styles.sectionTitle,{marginTop:spacing.lg}]}>{t('custom-service')}</Text>
            <View style={styles.customServiceRow}>
              <TextInput 
                style={[styles.input,{flex:1}]} 
                placeholder={t('service-name-placeholder','Service Name')} 
                value={customService.name} 
                onChangeText={v=>setCustomService(p=>({...p,name:v}))} 
                placeholderTextColor={colors.textSecondary}
              />
              <TextInput 
                style={[styles.input,{width:100}]} 
                placeholder={t('price-placeholder','Price')} 
                keyboardType="number-pad" 
                value={customService.price} 
                onChangeText={v=>setCustomService(p=>({...p,price:v}))} 
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity onPress={addCustomService} style={styles.addButton}>
                <MaterialIcons name="add-circle" size={32} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step===3 && (
          <View style={styles.stepCard}>
            <Text style={[styles.sectionTitle, { marginBottom: spacing.lg, textAlign: 'center' }]}>
              {t('advance-and-delivery', 'Advance & Delivery')}
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('enter-advance-amount')} *</Text>
              <View style={styles.inputWithIcon}>
                <MaterialIcons name="currency-rupee" size={20} color={colors.textSecondary} />
                <TextInput 
                  style={styles.input} 
                  placeholder={t('amount-placeholder')} 
                  keyboardType="number-pad" 
                  value={advancePaid.amount ? String(advancePaid.amount) : ''} 
                  onChangeText={v => {
                    const parsed = parseFloat(v);
                    setAdvancePaid(p => ({ ...p, amount: Number.isNaN(parsed) ? 0 : parsed }));
                  }} 
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('advance-paid-date','Advance Paid Date')}</Text>
              <Text style={styles.infoText}>{advancePaid.date || t('today', 'Today')}</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('promised-delivery-date')}</Text>
              <View style={styles.inputWithIcon}>
                <MaterialIcons name="local-shipping" size={20} color={colors.textSecondary} />
                <TextInput 
                  style={styles.input} 
                  placeholder={t('promised-delivery-date','DD/MM/YYYY')} 
                  keyboardType="number-pad"
                  maxLength={10}
                  value={dueDate} 
                  onChangeText={(v)=> setDueDate(formatDateInput(v))} 
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <MaterialIcons name="priority-high" size={20} color={isUrgent ? colors.error : colors.textSecondary} />
                <Text style={styles.switchLabel}>{t('urgent-order')}</Text>
              </View>
              <Switch value={isUrgent} onValueChange={setIsUrgent} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer with Navigation */}
      <View style={styles.footer}>
        {step > 1 && (
          <Button
            variant="secondary"
            onPress={handleBack}
            style={styles.footerButton}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.text} />
            <Text style={styles.footerButtonText}>{t('back')}</Text>
          </Button>
        )}
        {step < 3 && (
          <Button
            onPress={handleNext}
            style={styles.footerButton}
          >
            <Text style={styles.footerButtonText}>{t('next')}</Text>
            <MaterialIcons name="arrow-forward" size={20} color={colors.white} />
          </Button>
        )}
        {step === 3 && (
          <Button onPress={saveOrder} style={styles.footerButton} loading={isProcessing}>
            <MaterialIcons name="save" size={20} color={colors.white} />
            <Text style={styles.footerButtonText}>{isProcessing ? t('saving', 'Saving...') : t('save-order')}</Text>
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.white,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  stepCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  infoText: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
    color: colors.text,
    ...typography.body,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  serviceName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  serviceMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  qtyInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.text,
    width: 60,
    textAlign: 'center',
    ...typography.body,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  serviceChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  serviceChipText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  serviceChipPrice: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  customServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addButton: {
    padding: spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  switchLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  footerButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
});
