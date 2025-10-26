
import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="border-b-4 border-blue-600 pb-4 mb-6">
            <div className="text-center mb-2">
                <img src="/vari.png" alt="Sri Vari" className="w-40 mx-auto" />
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full">
                <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                    <img src="/logo-sm.png" alt="VOS WASH Logo" className="w-22 h-16" />
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold text-blue-700 sm:text-3xl">VOS WASH</h1>
                        <p className="text-right text-sm text-gray-600">(Clean Everything)</p>
                    </div>
                </div>
                <div className="text-right text-gray-600 text-xs sm:text-sm">
                    <p className="font-semibold">Uttarahalli, Bengaluru - 61</p>
                    <p>+919845418725 / 6363178431</p>
                </div>
            </div>
        </header>
    );
};
