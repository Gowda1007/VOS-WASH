import React, { useState } from 'react';
import type { ServiceSets, CustomerType, ManageableService, AppSettings } from '../types';
import { Card, Button, Icon } from './Common';
import { useToast } from '../hooks/useToast';
import { CUSTOMER_TYPE_LABELS } from '../constants';
import { useAuth } from '../hooks/useAuth';

interface SettingsPageProps {
  serviceSets: ServiceSets;
  onSaveServices: (newServiceSets: ServiceSets) => void;
  appSettings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ serviceSets: initialServiceSets, onSaveServices, appSettings: initialAppSettings, onSaveSettings }) => {
  const [currentSets, setCurrentSets] = useState<ServiceSets>(initialServiceSets);
  const [currentAppSettings, setCurrentAppSettings] = useState<AppSettings>(initialAppSettings);
  const [activeTab, setActiveTab] = useState<CustomerType>('customer');
  const toast = useToast();
  const { logout } = useAuth();

  const handleServiceChange = (type: CustomerType, index: number, field: 'name' | 'price', value: string | number) => {
    const newSets = { ...currentSets };
    const services = [...newSets[type]];
    services[index] = { ...services[index], [field]: value };
    newSets[type] = services;
    setCurrentSets(newSets);
  };

  const handleAddService = (type: CustomerType) => {
    const newSets = { ...currentSets };
    newSets[type] = [...newSets[type], { name: 'New Service', price: 0 }];
    setCurrentSets(newSets);
  };

  const handleDeleteService = (type: CustomerType, index: number) => {
    const newSets = { ...currentSets };
    const services = [...newSets[type]];
    services.splice(index, 1);
    newSets[type] = services;
    setCurrentSets(newSets);
  };

  const handleSaveChanges = () => {
    onSaveServices(currentSets);
    onSaveSettings(currentAppSettings);
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="space-y-6">
        <p className="text-slate-500 dark:text-slate-400">Customize services, app settings, and manage your account.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
           <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Service Prices</h3>
            <Card>
              <div className="border-b border-slate-200 dark:border-slate-700">