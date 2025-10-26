import { useLocalStorage } from './useLocalStorage';
import type { AppSettings } from '../types';
import { APP_SETTINGS_STORAGE_KEY } from '../constants';

export const useAppSettings = () => {
    const [settings, setSettings] = useLocalStorage<AppSettings>(APP_SETTINGS_STORAGE_KEY, {
        upiId: 'your-upi-id@okhdfcbank',
    });

    const saveSettings = (newSettings: AppSettings) => {
        setSettings(newSettings);
    };

    return { settings, saveSettings };
};
