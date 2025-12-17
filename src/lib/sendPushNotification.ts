import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import prisma from "@/lib/prisma";

// Initialization logic is now self-contained within this module
function ensureFirebaseInitialized() {
  // Check if the default app is already initialized
  if (getApps().length === 0) {
    const serviceAccountKeyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
    if (serviceAccountKeyBase64) {
      try {
        const serviceAccountKeyJson = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf-8');
        const serviceAccount = JSON.parse(serviceAccountKeyJson);
        initializeApp({ credential: cert(serviceAccount) });
        console.log("Firebase Admin SDK initialized successfully (from sendPushNotification).");
      } catch (error) {
        console.error("Error initializing Firebase Admin SDK (from sendPushNotification):", error);
      }
    } else {
      console.warn("Firebase Admin SDK not initialized (from sendPushNotification): `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64` env var is missing.");
    }
  }
}

export async function sendPushNotification(userId: string, title: string, body: string) {
  try {
    // Ensure the SDK is initialized before trying to use it
    ensureFirebaseInitialized();

    const fcmTokens = await prisma.fcmToken.findMany({ where: { userId } });

    if (fcmTokens.length > 0) {
      // Calculate unread count from both notifications and inquiries
      const unreadNotifications = await prisma.notification.count({
        where: { userId, read: false },
      });
      
      const unreadInquiries = await prisma.inquiry.count({
        where: {
          userId,
          isResolved: true, // Admin has replied
          isReadByUser: false, // User has not read it
        },
      });

      const totalUnreadCount = unreadNotifications + unreadInquiries;

      const tokens = fcmTokens.map(t => t.token);
      
      const message = {
        data: { 
          title: title || '새 알림', 
          body, 
          badgeCount: String(totalUnreadCount) 
        },
        tokens: tokens,
      };

      // Now that we're sure the app is initialized, get the messaging service and send.
      await getMessaging().sendEachForMulticast(message);
      console.log("Push notification sent successfully for user:", userId);
    }
  } catch (pushError) {
    console.error("Failed to send push notification:", pushError);
  }
}

