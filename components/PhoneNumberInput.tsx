import React from 'react';

interface PhoneNumberInputProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({ value, onChange, className = '' }) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, ''); // Remove non-digits
        const limitedValue = rawValue.slice(0, 10); // Limit to 10 digits
        onChange(limitedValue);
    };

    return (
        <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400">+91</span>
            <input
                type="tel"
                maxLength={10}
                value={value}
                onChange={handleInputChange}
                className={`block w-full h-12 pl-12 pr-4 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 ${className}`}
                placeholder="Phone Number (10 digits)"
                aria-label="Phone Number"
            />
        </div>
    );
};
