import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { sendPushNotification } from '@/lib/sendPushNotification';

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
    console.log(`[INQUIRY_REPLY] Inquiry ID: ${inquiryId}, Received adminReply:`, adminReply);


    if (!adminReply || typeof adminReply !== 'string' || adminReply.trim().length === 0) {
      return NextResponse.json({ error: 'Admin reply text is required.' }, { status: 400 });
    }

    const updatedInquiry = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      console.log(`[INQUIRY_REPLY] Starting transaction for inquiry ${inquiryId}`);
      const inquiry = await tx.inquiry.update({
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
            },
          },
        },
      });
      console.log(`[INQUIRY_REPLY] Successfully updated inquiry ${inquiryId}`);


      await tx.notification.create({
        data: {
          userId: inquiry.userId,
          type: 'INQUIRY_REPLY',
          message: adminReply,
          inquiryId: inquiry.id,
        }
      });
      console.log(`[INQUIRY_REPLY] Successfully created notification for user ${inquiry.userId}`);


      return inquiry;
    });

    console.log(`[INQUIRY_REPLY] Transaction completed for inquiry ${inquiryId}. Preparing to send push notification.`);
    // Send push notification immediately after successful transaction
    await sendPushNotification(
      updatedInquiry.userId,
      `Re: ${updatedInquiry.title}`, // Push notification title
      adminReply                      // Push notification body
    );
    console.log(`[INQUIRY_REPLY] Successfully sent push notification for inquiry ${inquiryId}`);


    return NextResponse.json(updatedInquiry);
  } catch (error) {
    console.error(`Failed to update inquiry ${inquiryId}:`, error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to update inquiry: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update inquiry. An unknown error occurred.' },
      { status: 500 }
    );
  }
}