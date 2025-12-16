import { initializeApp, getApps, cert } from 'firebase-admin/app';

const serviceAccountKeyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;

// This module should only be imported on the server side.
// It ensures the Firebase Admin SDK is initialized once.

if (getApps().length === 0) {
  if (serviceAccountKeyBase64) {
    try {
      const serviceAccountKeyJson = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(serviceAccountKeyJson);

      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log("Firebase Admin SDK initialized successfully.");

    } catch (error) {
      console.error("Error initializing Firebase Admin SDK:", error);
    }
  } else {
    console.warn("Firebase Admin SDK not initialized. `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64` env var is missing.");
  }
}
