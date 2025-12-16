
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const inquiryIds = body?.inquiryIds;

    const whereClause: any = {
      userId: session.user.id,
      isReadByUser: false,
    };

    if (Array.isArray(inquiryIds) && inquiryIds.length > 0) {
      // If specific IDs are provided, target them
      whereClause.id = {
        in: inquiryIds,
      };
    } else {
      // Original behavior: mark all resolved inquiries as read
      whereClause.isResolved = true;
    }

    await prisma.inquiry.updateMany({
      where: whereClause,
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
