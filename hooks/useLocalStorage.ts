import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAsyncStorage<T>(key: string, initialValue: T): [T, (value: T | ((prevState: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(initialValue);
    const [isLoaded, setIsLoaded] = useState(false); // To ensure value is loaded before first render/use

    useEffect(() => {
        const loadValue = async () => {
            try {
                const item = await AsyncStorage.getItem(key);
                setStoredValue(item ? JSON.parse(item) : initialValue);
            } catch (error) {
                console.error(`Error reading from AsyncStorage key "${key}":`, error);
                setStoredValue(initialValue);
            } finally {
                setIsLoaded(true);
            }
        };
        loadValue();
    }, [key, initialValue]);

    const setValue = async (value: T | ((prevState: T) => T)) => {
        try {
            // If function, call it with current storedValue, else use value directly
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error writing to AsyncStorage key "${key}":`, error);
        }
    };

    return [storedValue, setValue];
}