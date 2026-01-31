import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles/theme';
import { useLanguage } from '../context/LanguageContext';
import type { ManageableService, Service } from '../core/types';

export interface ServiceSelectionStepProps {
  selected: Service[];
  onChange: (next: Service[]) => void;
  available: ManageableService[];
}

export const validateSelectedServices = (services: Service[]): { valid: boolean; errors: string[] } => {
  const filtered = services.filter(s => s.name && s.price > 0 && s.quantity > 0);
  return { valid: filtered.length > 0, errors: filtered.length > 0 ? [] : ['no-services'] };
};

export const ServiceSelectionStep: React.FC<ServiceSelectionStepProps> = ({ selected, onChange, available }) => {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [customService, setCustomService] = useState<{ name: string; price: string }>({ name: '', price: '' });

  const remainingPredefined = useMemo(() => {
    return available.filter(ps => !selected.some(ss => ss.name === ps.name && !ss.isCustom));
  }, [available, selected]);

  const addPredefined = (svc: ManageableService) => {
    onChange([...selected, { ...svc, quantity: 1, isCustom: false }]);
  };

  const addCustom = () => {
    const price = parseFloat(customService.price);
    if (!customService.name || !price || price <= 0) return;
    onChange([...selected, { name: customService.name, price, quantity: 1, isCustom: true }]);
    setCustomService({ name: '', price: '' });
    setModalOpen(false);
  };

  const removeAt = (index: number) => {
    const copy = [...selected];
    copy.splice(index, 1);
    onChange(copy);
  };

  const updateQty = (index: number, qty: number) => {
    const copy = [...selected];
    copy[index] = { ...copy[index], quantity: Math.max(1, qty || 1) };
    onChange(copy);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('services-and-items')}</Text>

      <View style={{ gap: spacing.sm }}>
        {selected.length === 0 && (
          <Text style={styles.emptyText}>{t('no-services-added')}</Text>
        )}
        {selected.map((service, index) => (
          <View key={`${service.name}-${index}`} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{t(service.name)}</Text>
              <Text style={styles.itemMeta}>{t('price-label')} ₹{service.price}</Text>
            </View>
            <Text style={styles.qtyLabel}>{t('qty-label', 'Qty')}</Text>
            <TextInput
              style={styles.qtyInput}
              keyboardType="number-pad"
              value={String(service.quantity)}
              onChangeText={(v) => updateQty(index, parseInt(v || '1', 10))}
            />
            <TouchableOpacity onPress={() => removeAt(index)}>
              <MaterialIcons name="delete" size={22} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>{t('add-services')}</Text>
      <View style={styles.wrapRow}>
        {remainingPredefined.map((svc) => (
          <TouchableOpacity key={svc.name} onPress={() => addPredefined(svc)} style={styles.chip}>
            <Text style={styles.chipText}>{t(svc.name)} (₹{svc.price})</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => setModalOpen(true)}>
        <MaterialIcons name="add" size={20} color={colors.primary} />
        <Text style={styles.secondaryButtonText}>{t('add-custom-service')}</Text>
      </TouchableOpacity>

      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('add-custom-service')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('service-name-placeholder', 'Goods/Service Name')}
              value={customService.name}
              onChangeText={(name) => setCustomService((p) => ({ ...p, name }))}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder={t('price-placeholder', 'Price')}
              keyboardType="numeric"
              value={customService.price}
              onChangeText={(price) => setCustomService((p) => ({ ...p, price }))}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={() => setModalOpen(false)}>
                <Text style={styles.secondaryButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]} onPress={addCustom}>
                <Text style={styles.primaryButtonText}>{t('add-services')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  title: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  emptyText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6, borderBottomWidth: 1, borderColor: colors.borderLight },
  itemName: { ...typography.bodySmall, color: colors.text },
  itemMeta: { ...typography.caption, color: colors.textSecondary },
  qtyLabel: { ...typography.caption, color: colors.text },
  qtyInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: spacing.sm, color: colors.text, width: 60, textAlign: 'center' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  sectionLabel: { ...typography.body, color: colors.text, fontWeight: '600', marginBottom: spacing.sm },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  chipText: { ...typography.caption, color: colors.text },
  secondaryButton: { backgroundColor: colors.surface, borderRadius: 8, padding: spacing.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.md },
  secondaryButtonText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg, width: '100%', maxWidth: 400 },
  modalTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.md, color: colors.text, backgroundColor: colors.white },
  modalButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  primaryButton: { backgroundColor: colors.primary, borderRadius: 8, padding: spacing.md, alignItems: 'center' },
  primaryButtonText: { ...typography.body, color: colors.white, fontWeight: '600' },
});

export default ServiceSelectionStep;
