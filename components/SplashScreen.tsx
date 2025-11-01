import React from "react";
import { Vari, Logo } from "./Common";
import { useLanguage } from "../hooks/useLanguage";

export const SplashScreen = () => {
  const { t } = useLanguage();

  return (
    <div
      className="flex flex-col items-center justify-center h-screen w-screen bg-white dark:bg-slate-900"
    >
      <style>
        {`
          @keyframes fade-in-scale {
            0% { opacity: 0; transform: scale(0.9); }
            100% { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in-scale {
            animation: fade-in-scale 1.5s ease-out forwards;
          }
          @keyframes loading-bar {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          .loading-bar-fill {
            animation: loading-bar 2s infinite linear;
          }
        `}
      </style>

      <div className="relative flex flex-col items-center justify-center animate-fade-in-scale">
        <Vari className="w-64 mb-4" />
        <div className="flex items-center gap-4 my-4">
            <Logo className="w-24" />
            <div className="flex flex-col">
                 <h1 className="text-4xl font-extrabold text-blue-700 dark:text-blue-400">
                    {t('app-name')}
                </h1>
                <p className="text-xl text-right text-slate-600 dark:text-slate-400">
                    {t('app-tagline')}
                </p>
            </div>
        </div>

        <div className="absolute top-full mt-8 w-48 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="loading-bar-fill h-full bg-blue-600 dark:bg-blue-400"></div>
        </div>
      </div>
    </div>
  );
};