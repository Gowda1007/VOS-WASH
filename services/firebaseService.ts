import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// NOTE: Actual Firebase configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyBn-7g3hAbK0yLMCWQ4ajOkXuJeaV1yXkg",
  authDomain: "vos-wash.firebaseapp.com",
  projectId: "vos-wash",
  storageBucket: "vos-wash.firebasestorage.app",
  messagingSenderId: "40964626919",
  appId: "1:40964626919:android:0ad2353f4daca239f74542",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Enable offline persistence (crucial for mobile apps)
// This should only be called once.
try {
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log("Firestore persistence enabled successfully.");
    })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one.
        console.warn("Firestore persistence failed: Multiple tabs open.");
      } else if (err.code === 'unimplemented') {
        // The browser doesn't support all of the features required for persistence.
        console.warn("Firestore persistence failed: Browser unsupported.");
      } else {
        console.error("Firestore persistence failed:", err);
      }
    });
} catch (e) {
  console.warn("IndexedDB persistence initialization skipped (likely server-side render or unsupported environment).");
}

// We will use the 'db' export in apiService.ts