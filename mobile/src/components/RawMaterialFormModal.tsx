import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { v4 as uuidv4 } from 'uuid';
import { MaterialIcons } from '@expo/vector-icons';
import { Modal, Button } from './Common';
import { colors, spacing, typography } from '../styles/theme';
import { useLanguage } from '../context/LanguageContext';
import type { RawMaterial } from '../core/types/investmentTypes';
import { useToast } from '../context/ToastContext';

interface RawMaterialFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rawMaterial: RawMaterial) => void;
  initialData?: RawMaterial | null;
}
 
 const capitalizeFirstLetter = (str: string) => {
   if (!str) return '';
   return str.charAt(0).toUpperCase() + str.slice(1);
 };
 
 export const RawMaterialFormModal: React.FC<RawMaterialFormModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialData,
}) => {
  const { t } = useLanguage();
  const toast = useToast();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('item');
  const [customUnit, setCustomUnit] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [date, setDate] = useState(new Date());
  const [supplier, setSupplier] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setQuantity(String(initialData.quantity));
      const knownUnits = ['item', 'kg', 'liter', 'meter', 'gallon', 'unit', 'roll'];
      if (knownUnits.includes(initialData.unit)) {
        setUnit(initialData.unit);
        setCustomUnit('');
      } else {
        setUnit('custom');
        setCustomUnit(initialData.unit);
      }
      setCostPerUnit(String(initialData.costPerUnit));
      setDate(new Date(initialData.date));
      setSupplier(initialData.supplier || '');
    } else {
      // Reset form if no initial data
      setName('');
      setQuantity('');
      setUnit('item');
      setCustomUnit('');
      setCostPerUnit('');
      setDate(new Date());
      setSupplier('');
    }
  }, [initialData]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !quantity.trim() || !costPerUnit.trim()) {
      toast.error(t('please-fill-all-fields', 'Please fill all required fields.'));
      return;
    }
    
    if (unit === 'custom' && !customUnit.trim()) {
      toast.error(t('please-enter-custom-unit', 'Please enter a custom unit.'));
      return;
    }
    
    const numQuantity = parseFloat(quantity);
    const numCostPerUnit = parseFloat(costPerUnit);

    if (isNaN(numQuantity) || numQuantity <= 0) {
      toast.error(t('invalid-quantity', 'Please enter a valid quantity.'));
      return;
    }

    if (isNaN(numCostPerUnit) || numCostPerUnit <= 0) {
      toast.error(t('invalid-cost', 'Please enter a valid cost per unit.'));
      return;
    }

    const totalCost = parseFloat(quantity) * parseFloat(costPerUnit);
    const finalUnit = unit === 'custom' ? customUnit.trim() : unit;

    const newRawMaterial: RawMaterial = {
      id: initialData?.id || uuidv4(),
      name,
      quantity: parseFloat(quantity),
      // When editing, if new quantity is greater than current remaining, increase remaining by the difference.
      // If new quantity is less than current remaining, cap remaining at new quantity.
      // If adding new, remainingQuantity is same as quantity.
      remainingQuantity: initialData
        ? (parseFloat(quantity) > initialData.quantity
          ? (initialData.remainingQuantity || 0) + (parseFloat(quantity) - initialData.quantity)
          : Math.min((initialData.remainingQuantity || 0), parseFloat(quantity)))
        : parseFloat(quantity),
      unit: finalUnit,
      costPerUnit: parseFloat(costPerUnit),
      totalCost,
      date: date.toISOString(),
      supplier: supplier || undefined,
    };
    setIsProcessing(true);
    try {
      await onSubmit(newRawMaterial);
    } catch (e) {
      console.error('Error in RawMaterialFormModal onSubmit:', e);
      toast.error(t('error-submitting', 'Error processing request.'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={initialData ? t('edit-raw-material-title') : t('raw-material-form-title')}>
      <ScrollView contentContainerStyle={styles.modalContent}>
        <Text style={styles.label}>{t('raw-material-name')}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t('enter-raw-material-name', 'e.g., Washing Liquid')}
        />

        <Text style={styles.label}>{t('quantity')}</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          placeholder={t('enter-quantity', 'e.g., 10')}
          keyboardType="numeric"
        />

        <Text style={styles.label}>{t('unit-type')}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={unit}
            onValueChange={(itemValue) => setUnit(itemValue)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label={t('item', 'Item')} value="item" />
            <Picker.Item label={t('kg', 'Kg')} value="kg" />
            <Picker.Item label={t('liter', 'Liter')} value="liter" />
            <Picker.Item label={t('meter', 'Meter')} value="meter" />
            <Picker.Item label={t('gallon', 'Gallon')} value="gallon" />
            <Picker.Item label={t('unit', 'Unit')} value="unit" />
            <Picker.Item label={t('roll', 'Roll')} value="roll" />
            <Picker.Item label={t('custom-unit', 'Custom Unit')} value="custom" />
          </Picker>
        </View>
        
        {unit === 'custom' && (
          <>
            <Text style={styles.label}>{t('custom-unit-name', 'Custom Unit Name')}</Text>
            <TextInput
              style={styles.input}
              value={customUnit}
              onChangeText={setCustomUnit}
              placeholder={t('enter-custom-unit', 'e.g., Bottle, Packet, Box')}
            />
          </>
        )}

        <Text style={styles.label}>{t('cost-per-unit')}</Text>
        <TextInput
          style={styles.input}
          value={costPerUnit}
          onChangeText={setCostPerUnit}
          placeholder={t('enter-cost-per-unit', 'e.g., 50.00')}
          keyboardType="numeric"
        />

        <Text style={styles.label}>{t('purchase-date')}</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
          <Text style={styles.datePickerButtonText}>{date.toLocaleDateString()}</Text>
          <MaterialIcons name="calendar-today" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        <Text style={styles.label}>{t('supplier-name')}</Text>
        <TextInput
          style={styles.input}
          value={supplier}
          onChangeText={setSupplier}
          placeholder={t('enter-supplier-name', 'e.g., Chemical Traders')}
        />

        <View style={styles.actions}>
          <Button variant="secondary" onPress={onClose}>{t('cancel')}</Button>
          <Button variant="primary" onPress={handleSubmit} loading={isProcessing}>{initialData ? t('update-purchase') : t('add-purchase')}</Button>
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    padding: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: typography.body.fontSize,
    color: colors.text,
    backgroundColor: colors.white,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  pickerItem: {
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    backgroundColor: colors.white,
  },
  datePickerButtonText: {
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.sm,
  },
});