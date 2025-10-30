import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import type { ServiceSets, CustomerType, AppSettings } from '../types';
import { Card, Button, Icon } from './Common';
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';

interface SettingsPageProps {
  serviceSets: ServiceSets;
  onSaveServices: (newServiceSets: ServiceSets) => void;
  appSettings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

const customerTypesForTabs: CustomerType[] = ['customer', 'garage_service_station', 'dealer'];

export const SettingsPage: React.FC<SettingsPageProps> = ({ serviceSets: initialServiceSets, onSaveServices, appSettings: initialAppSettings, onSaveSettings }) => {
  const [currentSets, setCurrentSets] = useState<ServiceSets>(initialServiceSets);
  const [currentAppSettings, setCurrentAppSettings] = useState<AppSettings>(initialAppSettings);
  const [activeTab, setActiveTab] = useState<CustomerType>('customer');
  const toast = useToast();
  const { t } = useLanguage();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  const handleServiceChange = (type: CustomerType, index: number, field: 'name' | 'price', value: string | number) => {
    const newSets = { ...currentSets };
    const services = [...newSets[type]];
    // Ensure value for price is parsed as number
    services[index] = { ...services[index], [field]: field === 'price' ? parseFloat(value as string) || 0 : value };
    newSets[type] = services;
    setCurrentSets(newSets);
  };

  const handleAddService = (type: CustomerType) => {
    const newSets = { ...currentSets };
    newSets[type] = [...newSets[type], { name: t('new-service'), price: 0 }];
    setCurrentSets(newSets);
  };

  const handleDeleteService = (type: CustomerType, index: number) => {
    const newSets = { ...currentSets };
    const services = [...newSets[type]];
    services.splice(index, 1);
    newSets[type] = services;
    setCurrentSets(newSets);
  };

  const handleSaveSettings = () => {
    onSaveServices(currentSets);
    onSaveSettings(currentAppSettings);
    toast.success(t('settings-saved-success'));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.descriptionText, isDarkMode ? styles.textSlate400 : styles.textSlate500]}>{t('customize-services-and-settings')}</Text>
      
        <Card style={styles.cardMargin}>
          <View style={styles.appSettingsSection}>
              <Text style={[styles.sectionTitle, isDarkMode ? styles.textLight : styles.textDark]}>{t('app-settings')}</Text>
              <Text style={[styles.label, isDarkMode ? styles.textSlate300 : styles.textSlate700]}>{t('upi-id-label')}</Text>
                 <TextInput 
                    value={currentAppSettings.upiId}
                    onChangeText={(text) => setCurrentAppSettings(prev => ({ ...prev, upiId: text }))}
                    style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]} 
                    placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                />
          </View>
          <View style={[styles.servicePricesSection, isDarkMode ? styles.borderSlate700 : styles.borderSlate200]}>
              <Text style={[styles.sectionTitle, styles.pb2, isDarkMode ? styles.textLight : styles.textDark]}>{t('service-prices')}</Text>
              <View style={styles.tabsContainer}>
                  {customerTypesForTabs.map(type => (
                      <TouchableOpacity
                          key={type}
                          onPress={() => setActiveTab(type)}
                          style={[
                            styles.tabButton,
                            activeTab === type ? (isDarkMode ? styles.tabActiveDark : styles.tabActiveLight) : (isDarkMode ? styles.tabInactiveDark : styles.tabInactiveLight)
                          ]}
                      >
                          <Text style={[
                            styles.tabButtonText,
                            activeTab === type ? (isDarkMode ? styles.tabTextActiveDark : styles.tabTextActiveLight) : (isDarkMode ? styles.tabTextInactiveDark : styles.tabTextInactiveLight)
                          ]}>
                              {t(type)}
                          </Text>
                      </TouchableOpacity>
                  ))}
              </View>
          </View>
          <View style={styles.serviceListContainer}>
              {currentSets[activeTab]?.map((service, index) => (
                  <View key={index} style={styles.serviceItem}>
                      <TextInput
                          value={service.name}
                          onChangeText={(text) => handleServiceChange(activeTab, index, 'name', text)}
                          placeholder={t('service-name-placeholder', 'Goods/Service Name')}
                          style={[styles.serviceNameInput, isDarkMode ? styles.inputDark : styles.inputLight]}
                          placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                      />
                      <TextInput
                          keyboardType="numeric"
                          value={service.price === 0 ? '' : service.price.toString()}
                          onChangeText={(text) => handleServiceChange(activeTab, index, 'price', text)}
                          placeholder={t('price-placeholder')}
                          style={[styles.servicePriceInput, isDarkMode ? styles.inputDark : styles.inputLight]}
                          placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                      />
                      <TouchableOpacity onPress={() => handleDeleteService(activeTab, index)} style={styles.deleteButton} accessibilityLabel={t('delete-service-aria', 'Delete goods/service')}>
                          <Icon name="trash" size={20} style={styles.deleteIcon} />
                      </TouchableOpacity>
                  </View>
              ))}
              <Button onPress={() => handleAddService(activeTab)} variant="secondary" style={styles.addServiceButton}>
                  <Icon name="plus" size={20} style={isDarkMode ? styles.iconDark : styles.iconLight} />
                  <Text>{t('add-service-for', 'Add Service for {customerType}').replace('{customerType}', t(activeTab))}</Text>
              </Button>
          </View>
          <View style={[styles.saveSettingsContainer, isDarkMode ? styles.borderSlate700 : styles.borderSlate200]}>
            <Button onPress={handleSaveSettings}>{t('save-settings')}</Button>
          </View>
        </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 24, // space-y-6
    },
    descriptionText: {
        fontSize: 14,
        marginBottom: 24, // space-y-6 at top
    },
    textSlate500: { color: '#64748b' }, // text-slate-500
    textSlate400: { color: '#94a3b8' }, // dark:text-slate-400

    cardMargin: {
        marginBottom: 24,
    },
    appSettingsSection: {
        padding: 24, // p-6
        paddingBottom: 16, // Adjust padding
        gap: 8, // space-y-4 for inputs
    },
    sectionTitle: {
        fontSize: 18, // text-lg
        fontWeight: 'bold',
        marginBottom: 16, // mb-4
    },
    pb2: {
        paddingBottom: 8, // pb-2
    },
    textLight: { color: '#f8fafc' }, // dark:text-slate-100
    textDark: { color: '#1e293b' }, // text-slate-800

    label: {
        fontSize: 14, // text-sm
        fontWeight: '500', // font-medium
        marginBottom: 4, // mb-1
    },
    textSlate300: { color: '#cbd5e1' }, // dark:text-slate-300
    textSlate700: { color: '#475569' }, // text-slate-700

    input: {
        width: '100%', // block w-full
        paddingHorizontal: 16, // px-4
        paddingVertical: 12, // py-3
        fontSize: 16, // text-base
        borderWidth: 1,
        borderRadius: 8, // rounded-lg
    },
    inputLight: {
        borderColor: '#cbd5e1', // border-slate-300
        backgroundColor: '#ffffff', // bg-white
        color: '#1e293b', // text-slate-800
    },
    inputDark: {
        borderColor: '#475569', // dark:border-slate-600
        backgroundColor: '#0f172a', // dark:bg-slate-900
        color: '#f8fafc', // dark:text-slate-200
    },
    
    servicePricesSection: {
        borderTopWidth: 1,
        padding: 24, // p-6
        paddingBottom: 0, // pt-0
    },
    borderSlate200: { borderColor: '#e2e8f0' },
    borderSlate700: { borderColor: '#334155' },

    tabsContainer: {
        flexDirection: 'row',
        paddingVertical: 8, // p-2
        paddingTop: 0, // pt-0
    },
    tabButton: {
        paddingHorizontal: 12, // px-3
        paddingVertical: 8, // py-2
        borderRadius: 6, // rounded-md
        // transitionDuration: 200, // FIX: Removed web-specific property
    },
    tabButtonText: {
        fontSize: 14, // text-sm
        fontWeight: '500', // font-medium
        textTransform: 'capitalize',
    },
    tabActiveLight: {
        backgroundColor: '#e0e7ff', // bg-indigo-100
    },
    tabTextActiveLight: {
        color: '#4f46e5', // text-indigo-700
    },
    tabInactiveLight: {
        // text-slate-500 hover:bg-slate-100
    },
    tabTextInactiveLight: {
        color: '#64748b',
    },
    tabActiveDark: {
        backgroundColor: 'rgba(79, 70, 229, 0.2)', // dark:bg-indigo-900/50
    },
    tabTextActiveDark: {
        color: '#93c5fd', // dark:text-indigo-300
    },
    tabInactiveDark: {
        // dark:text-slate-400 dark:hover:bg-slate-700
    },
    tabTextInactiveDark: {
        color: '#94a3b8',
    },

    serviceListContainer: {
        padding: 16, // p-4
        gap: 12, // space-y-3
    },
    serviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // gap-2
    },
    serviceNameInput: {
        flexGrow: 1, // w-0 flex-grow
    },
    servicePriceInput: {
        width: 96, // w-24
    },
    deleteButton: {
        padding: 8, // p-2
        borderRadius: 9999, // rounded-full
    },
    deleteIcon: {
        color: '#ef4444', // text-red-500
    },
    iconDark: { color: '#e2e8f0' }, // dark:text-slate-200
    iconLight: { color: '#1e293b' }, // text-slate-800

    addServiceButton: {
        width: '100%',
        marginTop: 8, // mt-2
    },
    saveSettingsContainer: {
        padding: 16, // p-4
        borderTopWidth: 1,
        alignItems: 'flex-end',
    },
});