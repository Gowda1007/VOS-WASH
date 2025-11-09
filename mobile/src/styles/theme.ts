// Theme matching web app's Tailwind CSS design system
// Indigo = #4f46e5 (primary), Slate backgrounds, Green/Red/Amber status colors

export const colors = {
  // Primary colors - Indigo from web app
  primary: '#4f46e5',        // bg-indigo-600
  primaryDark: '#4338ca',    // bg-indigo-700
  primaryLight: '#6366f1',   // bg-indigo-500
  
  // Status colors matching web badges
  success: '#10b981',        // bg-green-500
  error: '#ef4444',          // bg-red-500
  warning: '#f59e0b',        // bg-amber-500
  info: '#3b82f6',           // bg-blue-500
  
  // Background colors - matching dark mode support
  background: '#f8fafc',     // bg-slate-50
  surface: '#ffffff',        // bg-white
  surfaceDark: '#1e293b',    // dark:bg-slate-800
  
  // Text colors
  text: '#0f172a',           // text-slate-800
  textSecondary: '#64748b',  // text-slate-500
  textLight: '#94a3b8',      // text-slate-400
  textDark: '#1e293b',       // dark:text-slate-100 equivalent
  
  // Border colors
  border: '#e2e8f0',         // border-slate-200
  borderDark: '#334155',     // dark:border-slate-700
  borderLight: '#f1f5f9',    // border-slate-100
  
  // Badge status colors (with opacity for backgrounds)
  statusPaid: '#10b981',     // green
  statusUnpaid: '#ef4444',   // red
  statusPartial: '#f59e0b',  // amber
  
  // Utility colors
  disabled: '#cbd5e1',       // text-slate-300
  white: '#ffffff',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  // Matching web h1-h4, body text sizes
  h1: { fontSize: 30, fontWeight: 'bold' as const },
  h2: { fontSize: 24, fontWeight: 'bold' as const },
  h3: { fontSize: 20, fontWeight: '600' as const },
  h4: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: 'normal' as const },
  bodySmall: { fontSize: 14, fontWeight: 'normal' as const },
  caption: { fontSize: 12, fontWeight: 'normal' as const },
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
