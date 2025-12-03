import prisma from "@/lib/prisma";
import { adminMessaging } from "@/lib/firebase-admin";

export async function sendPushNotification(userId: string, title: string, body: string) {
  try {
    const fcmTokens = await prisma.fcmToken.findMany({ where: { userId } });

    if (fcmTokens.length > 0) {
      const unreadCount = await prisma.notification.count({
        where: { userId, read: false },
      });

      const messagePayload = {
        notification: { title, body },
        data: { badgeCount: String(unreadCount) },
      };

      const tokens = fcmTokens.map(t => t.token);
      await adminMessaging.sendToDevice(tokens, messagePayload);
      console.log("Push notification sent successfully for user:", userId);
    }
  } catch (pushError) {
    console.error("Failed to send push notification:", pushError);
  }
}
