import { useState, useEffect } from 'react';
import type { AppSettings } from '../types';
import * as apiService from '../services/apiService';

const defaultSettings: AppSettings = {
    upiId: 'your-upi-id@okhdfcbank',
};

export const useAppSettings = () => {
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);

    useEffect(() => {
        const fetchSettings = async () => {
            const data = await apiService.getSettings();
            setSettings(data);
        };
        fetchSettings();
    }, []);

    const saveSettings = async (newSettings: AppSettings) => {
        const savedSettings = await apiService.saveSettings(newSettings);
        setSettings(savedSettings);
    };

    return { settings, saveSettings };
};