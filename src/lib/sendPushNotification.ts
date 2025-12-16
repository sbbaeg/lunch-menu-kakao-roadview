import prisma from "@/lib/prisma";
import { adminMessaging } from "@/lib/firebase-admin";

export async function sendPushNotification(userId: string, title: string, body: string) {
  try {
    const fcmTokens = await prisma.fcmToken.findMany({ where: { userId } });

    if (fcmTokens.length > 0 && adminMessaging) {
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
          title, 
          body, 
          badgeCount: String(totalUnreadCount) 
        },
        tokens: tokens,
      };

      await adminMessaging.sendMulticast(message);
      console.log("Push notification sent successfully for user:", userId);
    } else if (!adminMessaging) {
      console.warn("Firebase Admin SDK is not initialized. Cannot send push notification.");
    }
  } catch (pushError) {
    console.error("Failed to send push notification:", pushError);
  }
}

