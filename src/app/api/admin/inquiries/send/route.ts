
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { NotificationType } from '@prisma/client';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { userId, title, message } = await request.json();

    if (!userId || !title || !message) {
      return NextResponse.json({ error: 'User ID, title, and message are required' }, { status: 400 });
    }

    // Create the inquiry and the notification in a transaction
    const [newInquiry, newNotification] = await prisma.$transaction([
      prisma.inquiry.create({
        data: {
          userId,
          title,
          message,
          isFromAdmin: true,
          isResolved: true, // Admin-initiated messages are considered "resolved" by default
        },
      }),
      prisma.notification.create({
        data: {
          userId,
          type: NotificationType.GENERAL,
          message: `관리자로부터 새 메시지: "${title}"`,
        },
      }),
    ]);

    return NextResponse.json({ inquiry: newInquiry, notification: newNotification }, { status: 201 });

  } catch (error) {
    console.error('Error sending admin message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
