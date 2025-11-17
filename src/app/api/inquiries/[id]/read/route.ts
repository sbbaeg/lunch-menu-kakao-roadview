
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const inquiryId = parseInt(params.id, 10);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (isNaN(inquiryId)) {
    return NextResponse.json({ error: 'Invalid inquiry ID' }, { status: 400 });
  }

  try {
    // First, verify the user owns the inquiry before updating
    const inquiry = await prisma.inquiry.findFirst({
      where: {
        id: inquiryId,
        userId: session.user.id,
      },
    });

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found or access denied' }, { status: 404 });
    }

    // Now, update it
    await prisma.inquiry.update({
      where: { id: inquiryId },
      data: { isReadByUser: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Failed to mark inquiry ${inquiryId} as read:`, error);
    return NextResponse.json({ error: 'Failed to update inquiry.' }, { status: 500 });
  }
}
