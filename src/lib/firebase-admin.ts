import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { getAuth, Auth } from 'firebase-admin/auth';

const serviceAccountKeyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;

let adminMessaging: Messaging | undefined;
let adminAuth: Auth | undefined;

if (getApps().length === 0) {
  if (serviceAccountKeyBase64) {
    try {
      const serviceAccountKeyJson = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(serviceAccountKeyJson);

      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log("Firebase Admin SDK initialized successfully.");
      
      adminMessaging = getMessaging();
      adminAuth = getAuth();

    } catch (error) {
      console.error("Error initializing Firebase Admin SDK:", error);
    }
  } else {
    console.warn("Firebase Admin SDK not initialized. `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64` env var is missing.");
  }
} else {
    // App is already initialized, just get the services
    adminMessaging = getMessaging();
    adminAuth = getAuth();
}

export { adminMessaging, adminAuth };
