import type { ServiceSets } from '../types';
import { SERVICES_STORAGE_KEY, DEFAULT_SERVICE_SETS } from '../constants';
import { useLocalStorage } from './useLocalStorage';

export const useServices = () => {
    const [serviceSets, setServiceSets] = useLocalStorage<ServiceSets>(SERVICES_STORAGE_KEY, DEFAULT_SERVICE_SETS);

    const saveServiceSets = (newServiceSets: ServiceSets) => {
        setServiceSets(newServiceSets);
    };

    return { serviceSets, saveServiceSets };
};