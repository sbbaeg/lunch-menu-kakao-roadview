// src/app/api/debug/set-admin/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  // 최소한의 보안: 아무나 관리자로 설정할 수 없도록 로그인된 사용자만 접근 허용
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required to set admin' }, { status: 401 });
  }

  // 관리자로 설정할 특정 이메일 주소
  const adminEmail = 'sbbaeg6@gmila.om'; 

  try {
    const updatedUser = await prisma.user.update({
      where: { email: adminEmail },
      data: { isAdmin: true },
      select: { id: true, email: true, isAdmin: true }, // 업데이트된 정보 반환
    });

    console.log(`[Debug] User ${updatedUser.email} (ID: ${updatedUser.id}) set as admin: ${updatedUser.isAdmin}`);

    return NextResponse.json({ 
      message: `User ${adminEmail} has been set as admin.`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
      }
    });
  } catch (error) {
    console.error(`[Debug] Error setting ${adminEmail} as admin:`, error);
    if (error instanceof Error && error.message.includes('Record not found')) {
        return NextResponse.json({ error: `User with email ${adminEmail} not found.` }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to set user as admin' }, { status: 500 });
  }
}
