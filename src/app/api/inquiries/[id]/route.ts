import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
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
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: {
        user: {
          select: {
            name: true,
          }
        }
      }
    });

    if (!inquiry || inquiry.userId !== session.user.id) {
      return NextResponse.json({ error: 'Inquiry not found or access denied' }, { status: 404 });
    }

    return NextResponse.json(inquiry);
  } catch (error) {
    console.error(`Failed to fetch inquiry ${inquiryId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch inquiry.' }, { status: 500 });
  }
}