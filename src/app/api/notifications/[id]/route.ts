
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const notificationId = parseInt(params.id, 10);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (isNaN(notificationId)) {
    return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 });
  }

  try {
    // Verify the user owns the notification before deleting
    const notification = await prisma.notification.findFirst({
        where: {
            id: notificationId,
            userId: session.user.id,
        }
    });

    if (!notification) {
        return NextResponse.json({ error: 'Notification not found or access denied' }, { status: 404 });
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete notification ${notificationId}:`, error);
    return NextResponse.json({ error: 'Failed to delete notification.' }, { status: 500 });
  }
}
