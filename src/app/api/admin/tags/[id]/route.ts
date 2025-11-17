
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const tagId = parseInt(params.id, 10);

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (isNaN(tagId)) {
    return NextResponse.json({ error: 'Invalid tag ID' }, { status: 400 });
  }

  try {
    await prisma.tag.delete({
      where: { id: tagId },
    });
    return NextResponse.json({ message: 'Tag deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`[ADMIN_DELETE_TAG_ERROR]`, error);
    // Check for specific Prisma error if a foreign key constraint fails
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2014') { // Relation violation
        return NextResponse.json({ error: 'This tag is in use and cannot be deleted.' }, { status: 409 });
      }
      if (error.code === 'P2025') { // Record to delete not found
        return NextResponse.json({ error: 'Tag not found.' }, { status: 404 });
      }
    }
    return NextResponse.json({ error: 'Failed to delete tag.' }, { status: 500 });
  }
}

// PUT /api/admin/tags/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tagId = parseInt(params.id, 10);
    if (isNaN(tagId)) {
        return NextResponse.json({ error: 'Invalid tag ID' }, { status: 400 });
    }

    try {
        const { name, isPublic } = await request.json();

        if (typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
        }

        const dataToUpdate: { name: string; isPublic?: boolean; needsModeration: boolean } = {
            name: name.trim(),
            needsModeration: false, // Admin is editing
        };

        if (typeof isPublic === 'boolean') {
            dataToUpdate.isPublic = isPublic;
        }

        const updatedTag = await prisma.tag.update({
            where: { id: tagId },
            data: dataToUpdate,
        });

        return NextResponse.json(updatedTag, { status: 200 });
    } catch (error) {
        console.error(`[ADMIN_UPDATE_TAG_ERROR]`, error);
        return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
    }
}
