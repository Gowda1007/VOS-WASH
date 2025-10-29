import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './hooks/useToast';
import { ThemeProvider } from './hooks/useTheme';
import { LanguageProvider } from './hooks/useLanguage';

// Import the libraries that were previously loaded via CDN and expose them globally
import html2canvas from 'html2canvas'; // This usually attaches to window.html2canvas
import { jsPDF } from 'jspdf'; // This needs to be explicitly attached
import Chart from 'chart.js/auto'; // chart.js/auto usually registers itself on window.Chart

// Explicitly attach to window if they don't do it automatically or for clarity
if (typeof window !== 'undefined') {
  window.html2canvas = html2canvas;
  window.jspdf = { jsPDF }; // jsPDF is a named export, so bundle it as an object
  window.Chart = Chart;
}

// Declare Chart on window to satisfy TypeScript
declare global {
  interface Window {
    Chart: any;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);