// src/lib/awardBadge.ts
import prisma from '@/lib/prisma';
import { sendPushNotification } from './sendPushNotification';

/**
 * Awards a badge to a user if they don't already have it,
 * and sends a notification.
 * @param userId - The ID of the user to award the badge to.
 * @param badgeName - The name of the badge to award.
 */
export async function awardBadge(userId: string, badgeName: string) {
  console.log(`[awardBadge] Attempting to award badge "${badgeName}" to user ${userId}.`);
  try {
    const badge = await prisma.badge.findUnique({ where: { name: badgeName } });

    if (!badge) {
      console.warn(`[awardBadge] Badge with name "${badgeName}" not found in DB. Aborting.`);
      return;
    }
    console.log(`[awardBadge] Found badge: ${badge.name} (ID: ${badge.id})`);

    const existingUserBadge = await prisma.userBadge.findFirst({
      where: {
        userId: userId,
        badgeId: badge.id,
      },
    });

    if (existingUserBadge) {
      console.log(`[awardBadge] User ${userId} already has the badge "${badgeName}". No action taken.`);
      return;
    }

    console.log(`[awardBadge] User does not have the badge. Proceeding to award it.`);
    // 1. Award the badge
    await prisma.userBadge.create({
      data: {
        userId: userId,
        badgeId: badge.id,
      },
    });
    console.log(`[awardBadge] Successfully created UserBadge entry.`);

    // 2. Create a notification in the database
    const newNotification = await prisma.notification.create({
      data: {
        userId,
        type: 'NEW_BADGE',
        message: `축하합니다! '${badge.name}' 뱃지를 획득하셨습니다!`,
      },
    });
    console.log(`[awardBadge] Successfully created Notification entry (ID: ${newNotification.id}).`);

    // 3. Send a push notification
    await sendPushNotification(
      userId,
      '새로운 뱃지 획득!',
      `'${badge.name}' 뱃지를 획득하셨습니다!`,
      {
        action: 'OPEN_BADGE_MANAGEMENT', // Instruct client to open badge dialog
        notificationId: newNotification.id.toString(),
        type: 'NEW_BADGE', // Add this line to identify badge notifications
      }
    );
    console.log(`[awardBadge] Push notification process initiated for user ${userId}.`);

    console.log(`[awardBadge] Successfully awarded badge "${badgeName}" to user ${userId}.`);

  } catch (error) {
    console.error(`[awardBadge] Error awarding badge "${badgeName}" to user ${userId}:`, error);
  }
}
