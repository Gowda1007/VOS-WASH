import { useMemo } from 'react';
import { Customer } from '../core/types';

export const useDynamicPricing = (customer?: Customer, serviceName?: string) => {
    const pricingSuggestion = useMemo(() => {
        if (!customer) return null;

        let suggestion = null;
        let reason = null;

        // 1. Loyalty Discount (Simple logic: if trustScore is high)
        if (customer.trustScore && customer.trustScore > 80) {
            suggestion = { type: 'discount', value: 0.10, label: '10% Loyalty Discount' };
            reason = 'High Trust Score Customer';
        }

        // 2. Bulk Order Logic (for Garages)
        // In real app, check quantity. Here we simulate based on customer type
        if (customer.customerType === 'garage_service_station') {
            suggestion = { type: 'bulk', value: 0.15, label: '15% Bulk Rate' };
            reason = 'Garage / Service Station Rate';
        }

        return suggestion ? { ...suggestion, reason } : null;
    }, [customer, serviceName]);

    return pricingSuggestion;
};
