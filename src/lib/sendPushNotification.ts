import '@/lib/firebase-admin'; // Ensures Firebase Admin SDK is initialized
import { getMessaging } from 'firebase-admin/messaging';
import prisma from "@/lib/prisma";

export async function sendPushNotification(userId: string, title: string, body: string) {
  try {
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
          title, 
          body, 
          badgeCount: String(totalUnreadCount) 
        },
        tokens: tokens,
      };

      await getMessaging().sendMulticast(message);
      console.log("Push notification sent successfully for user:", userId);
    }
  } catch (pushError) {
    console.error("Failed to send push notification:", pushError);
  }
}

