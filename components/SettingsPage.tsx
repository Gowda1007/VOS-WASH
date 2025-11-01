import React, { useState } from 'react';
import type { ServiceSets, CustomerType } from '../types';
import { Card, Button, Icon } from './Common';
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../hooks/useLanguage';
import type { AppSettings } from '../types';

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

  const handleServiceChange = (type: CustomerType, index: number, field: 'name' | 'price', value: string | number) => {
    const newSets = { ...currentSets };
    const services = [...newSets[type]];
    services[index] = { ...services[index], [field]: value };
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
    <div className="space-y-6 max-w-4xl mx-auto">
        <p className="text-slate-500 dark:text-slate-400">{t('customize-services-and-settings')}</p>
      
        <Card>
          <div className="p-6 space-y-4">
              <h4 className="font-bold text-lg">{t('app-settings')}</h4>
              <label htmlFor="upiId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('upi-id-label')}</label>
                 <input 
                    type="text" 
                    id="upiId" 
                    value={currentAppSettings.upiId}
                    onChange={(e) => setCurrentAppSettings(prev => ({ ...prev, upiId: e.target.value }))}
                    className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" 
                />
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-lg p-6 pb-2">{t('service-prices')}</h4>
              <nav className="flex space-x-1 p-2 pt-0" aria-label="Tabs">
                  {customerTypesForTabs.map(type => (
                      <button
                          key={type}
                          onClick={() => setActiveTab(type)}
                          className={`capitalize px-3 py-2 text-sm font-medium rounded-md transition ${activeTab === type ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                      >
                          {t(type)}
                      </button>
                  ))}
              </nav>
          </div>
          <div className="p-4 space-y-3">
              {currentSets[activeTab]?.map((service, index) => (
                  <div key={index} className="flex items-center gap-2">
                      <input
                          type="text"
                          value={service.name}
                          onChange={(e) => handleServiceChange(activeTab, index, 'name', e.target.value)}
                          placeholder={t('service-name-placeholder', 'Goods/Service Name')}
                          className="block w-0 flex-grow px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                      />
                      <input
                          type="number"
                          value={service.price || ''}
                          onChange={(e) => handleServiceChange(activeTab, index, 'price', parseFloat(e.target.value) || 0)}
                          placeholder={t('price-placeholder')}
                          className="block w-24 px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                      />
                      <button onClick={() => handleDeleteService(activeTab, index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full" aria-label={t('delete-service-aria', 'Delete goods/service')}>
                          <Icon name="trash" className="w-5 h-5" />
                      </button>
                  </div>
              ))}
              <Button onClick={() => handleAddService(activeTab)} variant="secondary" className="w-full mt-2">
                  <Icon name="plus" className="w-5 h-5" />
                  {t('add-service-for', 'Add Service for {customerType}').replace('{customerType}', t(activeTab))}
              </Button>
          </div>
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
            <Button onClick={handleSaveSettings}>{t('save-settings')}</Button>
          </div>
        </Card>
    </div>
  );
};