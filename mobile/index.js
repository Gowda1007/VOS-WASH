import 'react-native-get-random-values'; // Must be imported first
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import * as Application from 'expo-application';

// Suppress expo-notifications warnings in Expo Go BEFORE any modules load
// These warnings are expected in development and won't appear in production builds
const isExpoGo = Application.applicationName === 'Expo Go';
if (isExpoGo) {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = function(...args) {
    const message = String(args[0] || '');
    if (
      message.includes('expo-notifications') ||
      message.includes('Expo Go') ||
      message.includes('development build') ||
      message.includes('Android Push notifications') ||
      message.includes('remote notifications') ||
      message.includes('functionality is not fully supported')
    ) {
      return; // Suppress these warnings
    }
    originalWarn.apply(console, args);
  };
  
  console.error = function(...args) {
    const message = String(args[0] || '');
    if (
      message.includes('expo-notifications') ||
      message.includes('Android Push notifications') ||
      message.includes('remote notifications')
    ) {
      return; // Suppress these errors
    }
    originalError.apply(console, args);
  };
  
  // Show a single helpful message instead
  console.log('📱 Running in Expo Go - Full notifications will work in production builds');
}

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
