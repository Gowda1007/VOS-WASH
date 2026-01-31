import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { RawMaterial } from '../core/types/investmentTypes';
import { getRawMaterialService } from '../services';

interface RawMaterialContextType {
  rawMaterials: RawMaterial[];
  loading: boolean;
  error: string | null;
  fetchRawMaterials: () => Promise<void>;
  addRawMaterial: (newRawMaterial: RawMaterial) => Promise<RawMaterial>;
  updateRawMaterial: (updatedRawMaterial: RawMaterial) => Promise<RawMaterial>;
  deleteRawMaterial: (id: string) => Promise<void>;
}

const RawMaterialContext = createContext<RawMaterialContextType | undefined>(undefined);

interface RawMaterialProviderProps {
  children: ReactNode;
  initialRawMaterials?: RawMaterial[];
  initialLoading?: boolean;
  initialError?: string | null;
}

export const RawMaterialProvider: React.FC<RawMaterialProviderProps> = ({
  children,
  initialRawMaterials = [],
  initialLoading = false, // Default to false if no explicit initial loading is provided
  initialError = null,
}) => {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(initialRawMaterials);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(initialError);

  // Effect to update internal state when initial props change
  useEffect(() => {
    setRawMaterials(initialRawMaterials);
    setLoading(initialLoading);
    setError(initialError);
  }, [initialRawMaterials, initialLoading, initialError]);

  const fetchRawMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRawMaterialService().getRawMaterials();
      setRawMaterials(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch raw materials');
    } finally {
      setLoading(false);
    }
  }, []); // Dependencies for fetchRawMaterials remain the same

  const addRawMaterial = useCallback(async (newRawMaterial: RawMaterial) => {
    try {
      const added = await getRawMaterialService().addRawMaterial(newRawMaterial);
      // No full fetch after add, rely on API response if it sends back updated list.
      // If API only returns added item, manually update local state.
      // Assuming API returns the updated list or the added item, and we just need to add/update it.
      // Current apiService.addRawMaterial returns the added RawMaterial.
      setRawMaterials(prev => [...prev, added]); // Optimistic update
      // A full refresh could still be triggered if desired for full sync, but not automatically here.
      // await fetchRawMaterials(); // Removed automatic full refresh after add
      return added;
    } catch (err: any) {
      setError(err.message || 'Failed to add raw material');
      throw err;
    }
  }, []); // Removed fetchRawMaterials from dependency

  const updateRawMaterial = useCallback(async (updatedRawMaterial: RawMaterial) => {
    try {
      const updated = await getRawMaterialService().updateRawMaterial(updatedRawMaterial);
      setRawMaterials(prev => prev.map(rm => rm.id === updated.id ? updated : rm)); // Optimistic update
      // await fetchRawMaterials(); // Removed automatic full refresh after update
      return updated;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update raw material';
      if (errorMessage.includes('404')) {
        console.warn(`[RawMaterialContext] 404 error detected during update. Triggering full re-fetch.`);
        await fetchRawMaterials(); // Re-sync state on 404 data integrity issue
      }
      setError(errorMessage);
      throw err;
    }
  }, [fetchRawMaterials]); // Added fetchRawMaterials dependency

  const deleteRawMaterial = useCallback(async (id: string) => {
    try {
      await getRawMaterialService().deleteRawMaterial(id);
      setRawMaterials(prev => prev.filter(rm => rm.id !== id)); // Optimistic delete
      // await fetchRawMaterials(); // Removed automatic full refresh after delete
    } catch (err: any) {
      setError(err.message || 'Failed to delete raw material');
      throw err;
    }
  }, []); // Removed fetchRawMaterials from dependency

  return (
    <RawMaterialContext.Provider value={{
      rawMaterials,
      loading,
      error,
      fetchRawMaterials,
      addRawMaterial,
      updateRawMaterial,
      deleteRawMaterial,
    }}>
      {children}
    </RawMaterialContext.Provider>
  );
};

export const useRawMaterials = () => {
  const context = useContext(RawMaterialContext);
  if (context === undefined) {
    throw new Error('useRawMaterials must be used within a RawMaterialProvider');
  }
  return context;
};