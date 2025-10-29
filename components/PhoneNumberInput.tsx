import React, { useRef, createRef } from 'react';

interface PhoneNumberInputProps {
    value: string;
    onChange: (value: string) => void;
}

export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({ value, onChange }) => {
    const inputsRef = useRef<Array<React.RefObject<HTMLInputElement>>>(
        Array.from({ length: 10 }, () => createRef<HTMLInputElement>())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const newDigits = value.split('');
        const { value: inputValue } = e.target;
        
        if (!/^\d*$/.test(inputValue)) return; // Only allow digits

        newDigits[index] = inputValue.slice(-1); // Take only the last digit entered
        onChange(newDigits.join(''));

        if (inputValue && index < 9) {
            inputsRef.current[index + 1].current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
            inputsRef.current[index - 1].current?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 10);
        if (pastedData) {
            onChange(pastedData.padEnd(10, ' ')); // Pad to ensure length is 10 for split
            const focusIndex = Math.min(pastedData.length, 9);
            inputsRef.current[focusIndex].current?.focus();
        }
    };

    return (
        <div className="flex gap-1 md:gap-2" onPaste={handlePaste}>
            {Array.from({ length: 10 }).map((_, index) => (
                <input
                    key={index}
                    ref={inputsRef.current[index]}
                    type="tel"
                    maxLength={1}
                    value={value[index] || ''}
                    onChange={(e) => handleInputChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="block w-full h-12 text-center text-lg font-semibold border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                    aria-label={`Digit ${index + 1}`}
                />
            ))}
        </div>
    );
};
