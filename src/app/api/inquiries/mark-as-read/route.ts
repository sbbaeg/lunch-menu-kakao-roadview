
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Mark all resolved inquiries for the user as read
    await prisma.inquiry.updateMany({
      where: {
        userId: session.user.id,
        isResolved: true, // Only mark as read if admin has replied
        isReadByUser: false, // Only update if not already read
      },
      data: {
        isReadByUser: true,
      },
    });

    return NextResponse.json({ message: 'Inquiries marked as read.' });
  } catch (error) {
    console.error('Failed to mark inquiries as read:', error);
    return NextResponse.json({ error: 'Failed to mark inquiries as read.' }, { status: 500 });
  }
}
