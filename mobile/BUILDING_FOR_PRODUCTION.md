# Building VOS WASH for Production

## 🎯 Important: Notifications in Expo Go vs Production

### Development (Expo Go)
- ⚠️ Notifications are **limited** in Expo Go (expected behavior)
- ✅ All other features work normally
- ℹ️ Warning messages are suppressed in the app

### Production Build
- ✅ **Full notification support** including:
  - Daily motivational notifications (7 AM & 7 PM)
  - Payment reminders
  - Download/share confirmations
  - All notification features work perfectly

---

## 📱 Building Production APK/IPA

### Option 1: EAS Build (Recommended)

#### Prerequisites
```bash
npm install -g eas-cli
eas login
```

#### Build Android APK
```bash
cd mobile
eas build --platform android --profile preview
```

#### Build Android AAB (for Play Store)
```bash
cd mobile
eas build --platform android --profile production
```

#### Build iOS (requires Apple Developer account)
```bash
cd mobile
eas build --platform ios --profile production
```

### Option 2: Local Development Build

#### Android
```bash
cd mobile
npx expo run:android --variant release
```

This will:
1. Build a development APK with full notification support
2. Install it on your connected device/emulator
3. Enable all production features including notifications

#### iOS (macOS only)
```bash
cd mobile
npx expo run:ios --configuration Release
```

---

## 🔧 EAS Build Configuration

Your `eas.json` should contain:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  }
}
```

---

## 🧪 Testing Notifications in Production Build

After installing the production build:

1. **Daily Motivational Notifications**: 
   - Scheduled automatically at 7:00 AM and 7:00 PM
   - Contains dynamic business metrics

2. **Manual Test**:
   - Create an invoice and download/share
   - You should see system notifications

3. **Permission Check**:
   - App will request notification permissions on first launch
   - Grant permissions to enable all features

---

## 📋 Checklist Before Building

- [ ] Test all features in Expo Go (except notifications)
- [ ] Update version in `app.json`
- [ ] Update `versionCode` (Android) / `buildNumber` (iOS)
- [ ] Configure signing certificates (for production)
- [ ] Test on physical device after build
- [ ] Verify notification permissions work
- [ ] Test PDF download and share functionality

---

## 🆘 Troubleshooting

### "Notifications not working in production"
1. Check app has notification permissions
2. Verify device notification settings
3. Check Android notification channels are enabled

### "Build failed"
1. Clear cache: `npx expo start --clear`
2. Delete node_modules: `rm -rf node_modules && npm install`
3. Check EAS build logs for specific errors

### "APK too large"
1. Enable Proguard (Android)
2. Use AAB format for Play Store (automatic optimization)
3. Remove unused assets

---

## 📚 Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [expo-notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Android Notification Channels](https://docs.expo.dev/push-notifications/push-notifications-setup/#android)

---

## ✨ Features That Work in Production

✅ Daily motivational notifications (7 AM & 7 PM)  
✅ Payment collection notifications  
✅ Download PDF with notification  
✅ Share invoices via WhatsApp/other apps  
✅ Offline mode with sync  
✅ Multi-language support (English/Kannada)  
✅ Customer management  
✅ Invoice generation  
✅ Raw material tracking  
✅ Analytics dashboard  

---

**Note**: The warnings you see in Expo Go are expected and will not appear in production builds. All notification features are fully functional in production! 🚀
