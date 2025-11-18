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
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Inquiry IDs are required.' }, { status: 400 });
    }

    const numericIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

    if (numericIds.length !== ids.length) {
        return NextResponse.json({ error: 'All IDs must be valid numbers.' }, { status: 400 });
    }

    const deleteResult = await prisma.inquiry.deleteMany({
      where: {
        id: {
          in: numericIds,
        },
        userId: session.user.id, // IMPORTANT: Ensure users can only delete their own inquiries
      },
    });

    if (deleteResult.count === 0) {
        // This could mean the inquiries were already deleted or belong to another user.
        // For security, we don't reveal which case it is.
        return NextResponse.json({ error: 'No matching inquiries found to delete.' }, { status: 404 });
    }


    return NextResponse.json({ message: `${deleteResult.count} inquiries deleted successfully.` }, { status: 200 });
  } catch (error) {
    console.error('Failed to bulk delete inquiries:', error);
    return NextResponse.json({ error: 'Failed to delete inquiries.' }, { status: 500 });
  }
}
