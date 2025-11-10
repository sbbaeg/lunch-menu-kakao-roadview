
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const inquiryId = parseInt(params.id, 10);
    const { isResolved } = await request.json();

    if (typeof isResolved !== 'boolean') {
      return NextResponse.json({ error: 'Invalid value for isResolved.' }, { status: 400 });
    }

    const updatedInquiry = await prisma.inquiry.update({
      where: { id: inquiryId },
      data: { isResolved },
    });

    return NextResponse.json(updatedInquiry);
  } catch (error) {
    console.error(`Failed to update inquiry ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update inquiry.' }, { status: 500 });
  }
}
