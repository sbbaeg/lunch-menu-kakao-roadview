// src/app/api/badges/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const badges = await prisma.badge.findMany({
      orderBy: {
        category: 'asc', // 카테고리별 정렬
        tier: 'asc',     // 티어별 정렬
        name: 'asc',     // 이름별 정렬
      },
    });
    return NextResponse.json(badges);
  } catch (error) {
    console.error("Failed to fetch all badges:", error);
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
  }
}
