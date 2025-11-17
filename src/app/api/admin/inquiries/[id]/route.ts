import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NotificationType } from '@prisma/client';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const inquiryId = parseInt(params.id, 10);

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (isNaN(inquiryId)) {
    return NextResponse.json({ error: 'Invalid inquiry ID' }, { status: 400 });
  }

  try {
    const { adminReply } = await request.json();

    if (!adminReply || typeof adminReply !== 'string' || adminReply.trim().length === 0) {
      return NextResponse.json({ error: 'Admin reply text is required.' }, { status: 400 });
    }

    const updatedInquiry = await prisma.inquiry.update({
      where: { id: inquiryId },
      data: {
        adminReply: adminReply,
        isResolved: true,
        isReadByUser: false, // This can still be useful for the inquiry list UI
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create a notification for the user
    await prisma.notification.create({
      data: {
        userId: updatedInquiry.userId,
        type: NotificationType.GENERAL,
        message: `문의하신 "${updatedInquiry.title}"에 답변이 등록되었습니다.`,
        inquiry: {
          connect: { id: updatedInquiry.id }
        }
      }
    });

    return NextResponse.json(updatedInquiry);
  } catch (error) {
    console.error(`Failed to update inquiry ${inquiryId}:`, error);
    return NextResponse.json({ error: 'Failed to update inquiry.' }, { status: 500 });
  }
}