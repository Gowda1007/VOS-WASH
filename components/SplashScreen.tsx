import React from 'react';
import { Logo } from './Common';

export const SplashScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-100 dark:bg-slate-900 overflow-hidden">
      <div className="relative flex flex-col items-center justify-center animate-fade-in-scale">
        <div className="absolute -top-12 opacity-10 dark:opacity-5 text-slate-500">
            <Logo className="w-48 h-48" />
        </div>
        <div className="flex items-center space-x-4 z-10">
          <Logo className="w-24 h-24 text-blue-700 dark:text-blue-400"/>
          <div>
            <h1 className="text-4xl font-extrabold text-blue-700 dark:text-blue-400">VOS WASH</h1>
            <p className="text-right text-lg text-slate-600 dark:text-slate-400">(Clean Everything)</p>
          </div>
        </div>
        <div className="absolute bottom-[-4rem] text-slate-400 dark:text-slate-600 text-sm font-medium">
          Loading...
        </div>
      </div>
      <style>{`
        @keyframes fade-in-scale {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};