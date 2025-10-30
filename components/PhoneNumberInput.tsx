import React from 'react';
import { TextInput, StyleSheet, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface PhoneNumberInputProps {
    value: string;
    onChange: (value: string) => void;
    isDarkMode: boolean; // Prop to pass theme for styling
}

export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({ value, onChange, isDarkMode }) => {
    const handleChangeText = (text: string) => {
        // Only allow digits and limit to 10 characters
        const formattedText = text.replace(/\D/g, '').slice(0, 10);
        onChange(formattedText);
    };

    return (
        <TextInput
            style={[
                styles.input,
                isDarkMode ? styles.inputDark : styles.inputLight
            ]}
            keyboardType="phone-pad" // Specific keyboard for phone numbers
            maxLength={10}
            value={value}
            onChangeText={handleChangeText}
            placeholder="Enter 10-digit phone number"
            placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
            accessibilityLabel="Phone number input"
        />
    );
};

const styles = StyleSheet.create({
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        width: '100%',
        height: 50, // Standard height for input
    },
    inputLight: {
        borderColor: '#cbd5e1', // border-slate-300
        backgroundColor: '#ffffff', // bg-white
        color: '#1e293b', // text-slate-800
    },
    inputDark: {
        borderColor: '#475569', // dark:border-slate-600
        backgroundColor: '#0f172a', // dark:bg-slate-900
        color: '#f8fafc', // dark:text-slate-200
    },
});