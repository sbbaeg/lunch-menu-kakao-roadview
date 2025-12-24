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

export async function sendPushNotification(userId: string, title: string, body: string, notificationData?: { [key: string]: string }) {
  console.log(`[Push] Starting to send notification for userId: ${userId}`);
  try {
    // Ensure the SDK is initialized before trying to use it
    ensureFirebaseInitialized();

    const fcmTokens = await prisma.fcmToken.findMany({ where: { userId } });
    console.log(`[Push] Found ${fcmTokens.length} tokens for user.`);

    if (fcmTokens.length > 0) {
      const unreadNotifications = await prisma.notification.count({
        where: { userId, read: false },
      });
      
      const unreadInquiries = await prisma.inquiry.count({
        where: {
          userId,
          isResolved: true,
          isReadByUser: false,
        },
      });

      const totalUnreadCount = unreadNotifications + unreadInquiries;
      console.log(`[Push] Calculated badge count: ${totalUnreadCount}`);

      const tokens = fcmTokens.map(t => t.token);
      
      const message = {
        data: { 
          title: title || '새 알림', 
          body, 
          badgeCount: String(totalUnreadCount),
          ...(notificationData || {}), // Merge additional data like URL
        },
        tokens: tokens,
      };
      
      console.log('[Push] Constructed message payload:', JSON.stringify(message, null, 2));

      const response = await getMessaging().sendEachForMulticast(message);
      console.log('[Push] Received response from Firebase:', JSON.stringify(response, null, 2));
      
      if (response.failureCount > 0) {
        console.error(`[Push] Failed to send to ${response.failureCount} tokens.`);
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`  - Token[${idx}]: ${tokens[idx]}, Error: ${resp.error?.message}`);
          }
        });
      }
      
      console.log("[Push] Notification process completed for user:", userId);

    }
  } catch (pushError) {
    console.error("[Push] A critical error occurred in sendPushNotification function:", pushError);
  }
}

