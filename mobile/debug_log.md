
# VOS WASH Module Debug Log

This log tracks the systematic inspection of all files in `mobile/src/` to find the root cause of 'TypeError: Cannot read property 'prototype' of undefined'.

## Inspection Status

- Current File Index: 5

## Files to Inspect (Total 76)

**[x] mobile/src/constants.ts**
**[x] mobile/src/adapters/index.ts**
**[x] mobile/src/adapters/nativeNotificationAdapter.ts**
**[x] mobile/src/adapters/nativePdfAdapter.ts**
**[x] mobile/src/adapters/nativeQrAdapter.ts**
**[x] mobile/src/adapters/nativeShareAdapter.ts**
**[x] mobile/src/adapters/nativeStorageAdapter.ts**
**[x] mobile/src/assets/assetLoader.ts**
**[x] mobile/src/assets/kannadaMotivationalNotifications.json**
**[x] mobile/src/components/AppHeader.tsx**
**[x] mobile/src/components/AppSplash.tsx**
**[x] mobile/src/components/Common.tsx**
**[x] mobile/src/components/CustomerCard.tsx**
**[x] 14. mobile/src/components/CustomerDetailsStep.tsx**
**[x] 15. mobile/src/components/FinancialsStep.tsx**
**[x] 16. mobile/src/components/FloatingActionButton.tsx**
**[x] mobile/src/components/index.ts**
**[x] mobile/src/components/InvoiceCard.tsx**
**[x] mobile/src/components/InvoicePreviewModal.tsx**
**[x] 20. mobile/src/components/LoadingOverlay.tsx**
**[x] 21. mobile/src/components/NavigationDrawer.tsx**
**[x] mobile/src/components/OrderCard.tsx**
**[x] mobile/src/components/PaymentCollectionStep.tsx**
**[x] mobile/src/components/PaymentModal.tsx**
**[x] mobile/src/components/RawMaterialFormModal.tsx**
**[x] mobile/src/components/ServiceSelectionStep.tsx**
**[x] 27. mobile/src/components/StatCard.tsx**
**[x] 28. mobile/src/components/UnifiedInvoicePreview.tsx**
**[x] 29. mobile/src/context/LanguageContext.tsx**
**[x] 30. mobile/src/context/RawMaterialContext.tsx**
**[x] 31. mobile/src/context/ToastContext.tsx**
**[x] 32. mobile/src/core/index.ts**
**[x] 33. mobile/src/core/invoiceLayout.ts**
**[x] 34. mobile/src/core/adapters/notificationAdapter.ts**
**[x] 35. mobile/src/core/adapters/pdfAdapter.ts**
**[x] 36. mobile/src/core/adapters/qrAdapter.ts**
**[x] 37. mobile/src/core/adapters/shareAdapter.ts**
**[x] 38. mobile/src/core/adapters/storageAdapter.ts**
**[x] 39. mobile/src/core/services/apiService.ts**
**[x] 40. mobile/src/core/services/rawMaterialService.ts**
**[x] 41. mobile/src/core/services/syncService.ts**
**[x] 42. mobile/src/core/types/index.ts**
**[x] 43. mobile/src/core/types/investmentTypes.ts**
**[x] 44. mobile/src/core/utils/appMetricsFetcher.ts**
**[x] 45. mobile/src/core/utils/invoiceRenderer.ts**
**[x] 46. mobile/src/core/utils/invoiceUtils.ts**
**[x] 47. mobile/src/core/utils/motivationalNotificationUtils.ts**
**[x] 48. mobile/src/hooks/index.ts**
**[x] 49. mobile/src/hooks/useAppSettings.ts**
**[x] 50. mobile/src/hooks/useCustomers.ts**
**[x] 51. mobile/src/hooks/useInvoices.ts**
**[x] 52. mobile/src/hooks/useNetworkStatus.ts**
**[x] 53. mobile/src/hooks/usePendingOrders.ts**
**[x] 54. mobile/src/hooks/useServices.ts**
**[x] 55. mobile/src/screens/CustomerDetailScreen.tsx**
**[x] 56. mobile/src/screens/CustomersScreen.tsx**
**[x] mobile/src/screens/DashboardScreen.tsx**
**[x] mobile/src/screens/index.ts**
**[x] mobile/src/screens/InvoicePreviewScreen.tsx**
**[x] 60. mobile/src/screens/InvoicesScreen.tsx**
**[x] 61. mobile/src/screens/NewInvoiceScreen.tsx**
**[x] 62. mobile/src/screens/OrdersScreen.tsx**
**[x] 63. mobile/src/screens/RawMaterialsScreen.tsx**
**[x] 64. mobile/src/screens/SettingsScreen.tsx**
**[x] 65. mobile/src/screens/TakeOrderScreen.tsx**
**[x] 66. mobile/src/services/index.ts**
**[x] 67. mobile/src/services/realtimeClient.ts**
**[x] 68. mobile/src/styles/theme.ts**

## Preliminary Findings (Root-Cause Candidates)

- Updated: `expo-file-system` in SDK 54 exports the new class-based API (`Paths`, `Directory`, `File`). The import in `mobile/src/adapters/nativeStorageAdapter.ts` is valid for our versions (`expo ~54.0.25`, `expo-file-system ~19.0.19`). The earlier hypothesis about “non-existent APIs” is withdrawn.

- Prime suspect now: dependency/version mismatch causing TurboModule failures (e.g., `TurboModuleRegistry.getEnforcing('PlatformConstants')`). `package.json` pins `react@19.1.0` and `react-native@0.81.5`, which can be incompatible with Expo SDK 54’s expected versions. Such mismatches can produce early red screens and cryptic "prototype of undefined" errors during module evaluation.

- Additional risk (runtime, not import-time): `mobile/src/adapters/nativePdfAdapter.ts` uses legacy `expo-file-system` methods from the main entry (`deleteAsync`, `copyAsync`, `makeDirectoryAsync`, `readAsStringAsync`). In SDK 54 those main-entry functions are deprecated and documented to throw at runtime. This won’t cause the initial red screen but can break PDF flows later unless routed via `expo-file-system/legacy` or migrated to the new `File`/`Directory` API.

- Other areas: `realtimeClient` and notifications are guarded; assets load via `assetLoader` are stable; no import-time side effects observed in components checked above (CustomerDetailsStep, FinancialsStep, FloatingActionButton, LoadingOverlay, NavigationDrawer) or in `kannadaMotivationalNotifications.json`.

## Next Steps (Before Fixing)

- Align dependencies to Expo SDK 54:
	- Install Expo-compatible `react`, `react-native`, and `react-native-reanimated` via `npx expo install` to resolve TurboModule errors and the initial red screen.
	- Clear bundler cache and restart dev: `npx expo start -c`.

- Stabilize file operations used by PDF flows:
	- Short-term: import legacy methods from `expo-file-system/legacy` where used in `nativePdfAdapter.ts` and `assetLoader.ts` reads.
	- Long-term: migrate file handling to the new `File`/`Directory` API to avoid legacy entrypoint.

- Optional validation: after dependency alignment, if a red screen persists, temporarily stub construction/use of adapters one by one (starting with storage and PDF) to isolate any additional offenders.
