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
        {/* Service Prices Section */}
        <div>
           <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Service Prices</h3>
            <Card>
              <div className="border-b border-slate-200 dark:border-slate-700">
                  <nav className="flex space-x-1 p-2" aria-label="Tabs">
                      {(Object.keys(CUSTOMER_TYPE_LABELS) as CustomerType[]).map(type => (
                          <button
                              key={type}
                              onClick={() => setActiveTab(type)}
                              className={`capitalize px-3 py-2 text-sm font-medium rounded-md transition ${activeTab === type ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                          >
                              {CUSTOMER_TYPE_LABELS[type]}
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
                              placeholder="Service Name"
                              className="block flex-grow px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                          />
                          <input
                              type="number"
                              value={service.price || ''}
                              onChange={(e) => handleServiceChange(activeTab, index, 'price', parseFloat(e.target.value) || 0)}
                              placeholder="Price"
                              className="block w-24 px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                          />
                          <button onClick={() => handleDeleteService(activeTab, index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full" aria-label="Delete service">
                              <Icon name="trash" className="w-5 h-5" />
                          </button>
                      </div>
                  ))}
                  <Button onClick={() => handleAddService(activeTab)} variant="secondary" className="w-full mt-2">
                      <Icon name="plus" className="w-5 h-5" />
                      Add Service for {CUSTOMER_TYPE_LABELS[activeTab]}
                  </Button>
              </div>
            </Card>
        </div>
        
        {/* App & Account Settings Section */}
        <div className="space-y-8">
             <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">App Settings</h3>
                <Card className="p-6">
                     <label htmlFor="upiId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">UPI ID for Customer Payments</label>
                     <input 
                        type="text" 
                        id="upiId" 
                        value={currentAppSettings.upiId}
                        onChange={(e) => setCurrentAppSettings(prev => ({ ...prev, upiId: e.target.value }))}
                        className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" 
                    />
                </Card>
            </div>
             <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Account</h3>
                 <Card className="p-6">
                    <Button onClick={logout} variant="danger" className="w-full">
                        <Icon name="logout" className="w-5 h-5"/>
                        Logout from Admin Account
                    </Button>
                 </Card>
             </div>
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <Button onClick={handleSaveChanges}>
              Save All Changes
          </Button>
      </div>
    </div>
  );
};