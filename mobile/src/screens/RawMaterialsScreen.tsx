import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { colors, spacing, typography } from '../styles/theme';
import { useRawMaterials } from '../context/RawMaterialContext';
import type { RawMaterial } from '../core/types/investmentTypes'; // Ensure correct import
import { RawMaterialFormModal } from '../components/RawMaterialFormModal';
import { Modal, Button } from '../components/Common';

interface RawMaterialCardProps {
  rawMaterial: RawMaterial;
  onEdit: (rawMaterial: RawMaterial) => void;
  onDelete: (id: string) => void;
  onRecordUsage: (id: string, amount: number) => void; // New callback
}

const capitalizeFirstLetter = (str: string) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Format numbers in Indian style with smart decimals
const formatNumber = (num: number): string => {
  if (Math.abs(num) >= 100000) {
    return Math.round(num).toLocaleString('en-IN');
  }
  return num.toFixed(2);
};

const RawMaterialCard: React.FC<RawMaterialCardProps> = ({ rawMaterial, onEdit, onDelete, onRecordUsage }) => {
  const { t } = useLanguage();
  const toast = useToast();
  const [usageInput, setUsageInput] = useState('');
  const [isSubmittingUsage, setIsSubmittingUsage] = useState(false);
  
  // Translate unit names
  const getTranslatedUnit = (unit: string) => {
    const unitKey = unit.toLowerCase();
    // Check if translation exists, otherwise use the unit as-is
    return t(unitKey, unit);
  };
  
  const handleUsageSubmit = async () => {
    const amount = parseFloat(usageInput);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('invalid-amount', 'Please enter a valid usage amount.'));
      return;
    }
    
    if (amount > (rawMaterial.remainingQuantity || 0)) {
      toast.error(t('invalid-usage-amount', 'Invalid amount. Cannot exceed remaining quantity.'));
      return;
    }

    setIsSubmittingUsage(true);
    try {
      await onRecordUsage(rawMaterial.id, amount);
      setUsageInput('');
    } catch (error) {
      // Error handling is managed by context, but we need to stop loading if it fails.
      console.error('Usage submission failed:', error);
    } finally {
      setIsSubmittingUsage(false);
    }
  };

  const isLowStock = (rawMaterial.remainingQuantity || 0) / (rawMaterial.quantity || 1) < 0.25;

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.infoRow}>
        <Text style={cardStyles.name}>{capitalizeFirstLetter(rawMaterial.name)}</Text>
        <Text style={cardStyles.cost}>₹{(rawMaterial.totalCost || 0).toFixed(2)}</Text>
      </View>
      <Text style={cardStyles.details}>{t('purchased-quantity', 'Purchased Quantity')}: {rawMaterial.quantity} {getTranslatedUnit(rawMaterial.unit)}</Text>
      <Text style={[cardStyles.details, cardStyles.remainingQuantity, isLowStock && cardStyles.lowStock]}>
        {t('remaining-quantity', 'Remaining Quantity')}: {(rawMaterial.remainingQuantity || 0).toFixed(2)} {getTranslatedUnit(rawMaterial.unit)}
      </Text>
      {isLowStock && (
        <Text style={cardStyles.lowStockText}>
          <MaterialIcons name="warning" size={14} color={colors.warning} /> {t('low-stock-warning', 'Low stock!')}
        </Text>
      )}
      <Text style={cardStyles.details}>{t('cost-per-unit')}: ₹{(rawMaterial.costPerUnit || 0).toFixed(2)}</Text>
      {rawMaterial.supplier && <Text style={cardStyles.details}>{t('supplier')}: {capitalizeFirstLetter(rawMaterial.supplier)}</Text>}
      <Text style={cardStyles.date}>{new Date(rawMaterial.date).toLocaleDateString()}</Text>
      
      {rawMaterial.remainingQuantity > 0 && (
        <View style={cardStyles.usageRow}>
          <TextInput
            style={cardStyles.usageInput}
            value={usageInput}
            onChangeText={v => setUsageInput(v.replace(/[^0-9.]/g, ''))}
            keyboardType="numeric"
            placeholder={t('use-placeholder', 'Use ({unit})').replace('{unit}', getTranslatedUnit(rawMaterial.unit))}
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity
            onPress={handleUsageSubmit}
            style={cardStyles.useButton}
            disabled={!usageInput || parseFloat(usageInput) <= 0 || isSubmittingUsage}
          >
            {isSubmittingUsage ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={cardStyles.useButtonText}>{t('record-usage', 'Record Usage')}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={cardStyles.actions}>
        <TouchableOpacity onPress={() => onEdit(rawMaterial)} style={cardStyles.actionButton}>
          <MaterialIcons name="edit" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(rawMaterial.id)} style={cardStyles.actionButton}>
          <MaterialIcons name="delete" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    marginHorizontal: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  name: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  cost: {
    ...typography.body,
    fontWeight: '700',
    color: colors.success,
  },
  details: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  remainingQuantity: {
    fontWeight: '600',
    color: colors.success,
  },
  actionButton: {
    padding: spacing.xs,
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  usageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: typography.body.fontSize,
    color: colors.text,
    backgroundColor: colors.white,
  },
  useButton: {
    backgroundColor: colors.info,
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  useButtonText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '600',
  },
  lowStock: {
    color: colors.warning,
  },
  lowStockText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
});

export const RawMaterialsScreen: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { rawMaterials, loading, error, addRawMaterial, updateRawMaterial, deleteRawMaterial } = useRawMaterials();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRawMaterial, setEditingRawMaterial] = useState<RawMaterial | null>(null);
  const [rawMaterialToDelete, setRawMaterialToDelete] = useState<RawMaterial | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleRecordUsage = async (id: string, amount: number) => {
    const materialToUpdate = rawMaterials.find(rm => rm.id === id);
    console.log('[RecordUsage] Attempting usage record:', {
      id,
      amount,
      materialToUpdate,
      rawMaterials,
    });
    if (!materialToUpdate) {
      console.warn('[RecordUsage] No raw material found for id:', id);
      return;
    }

    // Ensure we don't drop below zero, though validation is in the card too
    const newRemainingQuantity = Math.max(0, (materialToUpdate.remainingQuantity || 0) - amount);

    try {
      console.log('[RecordUsage] Updating raw material:', {
        ...materialToUpdate,
        remainingQuantity: newRemainingQuantity,
      });
      await updateRawMaterial({
        ...materialToUpdate,
        remainingQuantity: newRemainingQuantity
      });
      toast.success(t('usage-recorded-successfully', `Usage of ${amount} ${materialToUpdate.unit} recorded successfully!`));
    } catch (e) {
      // Error is already handled by useRawMaterials state and displayed on screen
      console.error('[RecordUsage] Failed to update raw material usage:', e);
      toast.error(t('usage-record-failed', 'Failed to record usage. Please try again.'));
    }
  };

  const handleAddEdit = (material: RawMaterial) => {
    if (editingRawMaterial) {
      updateRawMaterial(material);
    } else {
      // Server will generate the ID from MongoDB _id
      addRawMaterial(material);
    }
    setIsModalVisible(false);
    setEditingRawMaterial(null);
  };

  const onEditPress = (material: RawMaterial) => {
    setEditingRawMaterial(material);
    setIsModalVisible(true);
  };

  const onDeletePress = (id: string) => {
    const rm = rawMaterials.find(r => r.id === id);
    if (rm) {
      setRawMaterialToDelete(rm);
    }
  };

  const handleDeleteConfirmation = async () => {
    if (!rawMaterialToDelete) return;

    setIsDeleting(true);
    try {
      await deleteRawMaterial(rawMaterialToDelete.id);
      setRawMaterialToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text>{t('loading-raw-materials', 'Loading Raw Materials...')}</Text>
      </View>
    );
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  
  const filteredRawMaterials = useMemo(() => {
    const targetMonth = currentMonth.getMonth();
    const targetYear = currentMonth.getFullYear();

    return rawMaterials.filter(rm => {
      // rawMaterial.date is an ISO date string
      const rmDate = new Date(rm.date);
      return rmDate.getMonth() === targetMonth && rmDate.getFullYear() === targetYear;
    });
  }, [rawMaterials, currentMonth]);

  const totalSpent = filteredRawMaterials.reduce((sum, rm) => sum + (rm.totalCost || 0), 0);
  
  const formattedMonth = currentMonth.toLocaleString(t('locale', 'en-US'), { month: 'long', year: 'numeric' });
  const isCurrentMonth = currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear();

  if (error) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{t('error-loading-raw-materials', 'Error loading Raw Materials:')} {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.headerTitle}>{t('raw-materials', 'Raw Materials')}</Text>
      </View>
      <View style={styles.summaryCard}>
        <View style={styles.periodNavigation}>
          <TouchableOpacity onPress={goToPreviousMonth}>
            <MaterialIcons name="arrow-back-ios" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.periodText}>{formattedMonth} {isCurrentMonth && `(${t('current-month', 'Current Month')})`}</Text>
          <TouchableOpacity onPress={goToNextMonth} disabled={isCurrentMonth}>
            <MaterialIcons
              name="arrow-forward-ios"
              size={20}
              color={isCurrentMonth ? colors.border : colors.text}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.summaryTitle}>{t('total-spent-raw-materials', 'Total Spent on Raw Materials')}</Text>
        <Text style={styles.totalSpentValue}>₹{formatNumber(totalSpent)}</Text>
      </View>
      <FlatList
        data={filteredRawMaterials}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RawMaterialCard
            rawMaterial={item}
            onEdit={onEditPress}
            onDelete={onDeletePress} // Use local onDeletePress function
            onRecordUsage={handleRecordUsage}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="inventory" size={60} color={colors.border} />
            <Text style={styles.emptyStateText}>{t('no-raw-materials', 'No Raw Materials Added Yet')}</Text>
            <Text style={styles.emptyStateSubText}>{t('add-your-first-raw-material', 'Tap the + button to add your first raw material.')}</Text>
          </View>
        }
      />
      <RawMaterialFormModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleAddEdit}
        initialData={editingRawMaterial}
      />
      
      {/* Raw Material Delete Confirmation Modal */}
      <Modal
        visible={!!rawMaterialToDelete}
        onClose={() => setRawMaterialToDelete(null)}
        title={t('confirm-deletion-title', 'Confirm Deletion')}
        footer={
          <>
            <Button variant="secondary" onPress={() => setRawMaterialToDelete(null)} disabled={isDeleting}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button variant="danger" onPress={handleDeleteConfirmation} loading={isDeleting}>
              {t('confirm-delete', 'Confirm Delete')}
            </Button>
          </>
        }
      >
        <Text style={styles.modalText}>
          {t('confirm-raw-material-deletion-message', 'Are you sure you want to permanently delete raw material {name}? This action cannot be undone.').replace('{name}', rawMaterialToDelete?.name || '')}
        </Text>
      </Modal>

      {/* Floating Add Button */}
      <TouchableOpacity 
        style={styles.floatingAddButton} 
        onPress={() => { setEditingRawMaterial(null); setIsModalVisible(true); }}
      >
        <MaterialIcons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    alignItems: 'center',
  },
  periodNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  periodText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  summaryTitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  totalSpentValue: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: 32,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyStateSubText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  modalText: { // Added style for consistency with App.tsx modals
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.md,
  }
});