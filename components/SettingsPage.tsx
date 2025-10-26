import React, { useState } from 'react';
import type { ServiceSets, CustomerType, ManageableService } from '../types';
import { PageHeader, Card, Button, Icon } from './Common';
import { useAuth } from '../hooks/useAuth';

interface SettingsPageProps {
  serviceSets: ServiceSets;
  onSave: (newServiceSets: ServiceSets) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ serviceSets: initialServiceSets, onSave }) => {
  const [currentSets, setCurrentSets] = useState<ServiceSets>(initialServiceSets);
  const [activeTab, setActiveTab] = useState<CustomerType>('customer');
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
    onSave(currentSets);
    alert('Services saved successfully!');
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Customize services and manage your account."
      >
        <Button onClick={handleSaveChanges}>
            <Icon name="document-duplicate" className="w-5 h-5"/>
            Save Changes
        </Button>
      </PageHeader>

      <Card>
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="-mb-px flex space-x-6 px-6" aria-label="Tabs">
            {(['customer', 'garage', 'dealer'] as CustomerType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition capitalize ${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                {tab} Services
              </button>
            ))}
          </nav>
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

      <div className="mt-8">
        <PageHeader title="Account" />
        <Card className="p-4 md:p-6">
            <Button onClick={logout} variant="danger">
                <Icon name="logout" className="w-5 h-5"/>
                Logout
            </Button>
        </Card>
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
  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-700">
    <input
      type="text"
      value={service.name}
      onChange={e => onChange('name', e.target.value)}
      className="w-full flex-grow px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
      placeholder="Service Name"
    />
    <input
      type="number"
      value={service.price}
      onChange={e => onChange('price', parseFloat(e.target.value) || 0)}
      className="w-full sm:w-32 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
      placeholder="Price"
    />
    <Button onClick={onDelete} variant="danger" className="w-full sm:w-auto">
        <Icon name="trash" className="w-5 h-5" />
        <span className="sm:hidden ml-2">Delete</span>
    </Button>
  </div>
);
