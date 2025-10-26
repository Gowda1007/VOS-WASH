import React, { useState } from 'react';
import type { ServiceSets, CustomerType, ManageableService, AppSettings } from '../types';
import { PageHeader, Card, Button, Icon } from './Common';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { CUSTOMER_TYPE_LABELS } from '../constants';

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
    <div>
      <PageHeader
        title="Settings"
        subtitle="Customize services, app settings, and manage your account."
      >
        <Button onClick={handleSaveChanges}>
            <Icon name="document-duplicate" className="w-5 h-5"/>
            Save All Changes
        </Button>
      </PageHeader>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
           <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Service Prices</h3>
            <Card>
              <div className="border-b border-slate-200 dark:border-slate-700">
                <div className="overflow-x-auto">
                    <nav className="flex space-x-2 sm:space-x-6 px-4 sm:px-6" aria-label="Tabs">
                      {(Object.keys(CUSTOMER_TYPE_LABELS) as CustomerType[]).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`flex-shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition ${
                            activeTab === tab
                              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-500'
                          }`}
                        >
                          {CUSTOMER_TYPE_LABELS[tab]}
                        </button>
                      ))}
                    </nav>
                </div>
              </div>

              <div className="p-4 md:p-6">
                <div className="space-y-4">
                  {currentSets[activeTab].map((service, index) => (
                    <ServiceRow
                      key={index}
                      service={service}
                      onChange={(field, value) => handleServiceChange(activeTab, index, field, value)}
                      onDelete={() => handleDeleteService(activeTab, index)}
                    />
                  ))}
                </div>
                <Button onClick={() => handleAddService(activeTab)} variant="secondary" className="mt-6">
                  <Icon name="plus" className="w-5 h-5"/>
                  Add Service
                </Button>
              </div>
            </Card>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Application</h3>
           <div className="space-y-8">
              <Card className="p-4 md:p-6">
                 <h4 className="text-lg font-semibold mb-2">Payment Details</h4>
                  <div>
                      <label htmlFor="upiId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">UPI ID</label>
                      <input 
                        type="text" 
                        id="upiId" 
                        value={currentAppSettings.upiId}
                        onChange={(e) => setCurrentAppSettings(prev => ({...prev, upiId: e.target.value}))}
                        className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" 
                        placeholder="your-name@oksbi"
                      />
                  </div>
              </Card>

               <Card className="p-4 md:p-6">
                   <h4 className="text-lg font-semibold mb-2">Account</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                    You can logout from the 'Options' menu in the sidebar.
                 </p>
              </Card>
           </div>
        </div>
      </div>
    </div>
  );
};

interface ServiceRowProps {
  service: ManageableService;
  onChange: (field: 'name' | 'price', value: string | number) => void;
  onDelete: () => void;
}

const ServiceRow: React.FC<ServiceRowProps> = ({ service, onChange, onDelete }) => (
  <div className="flex flex-col sm:flex-row items-center gap-2">
    <input
      type="text"
      value={service.name}
      onChange={(e) => onChange('name', e.target.value)}
      className="flex-grow w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
      placeholder="Service Name"
    />
    <input
      type="number"
      value={service.price || ''}
      onChange={(e) => onChange('price', parseFloat(e.target.value) || 0)}
      className="w-full sm:w-32 px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
      placeholder="Price (₹)"
    />
    <button onClick={onDelete} className="p-3 text-red-600 dark:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">
      <Icon name="trash" className="w-5 h-5" />
    </button>
  </div>
);