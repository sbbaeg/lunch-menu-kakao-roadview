// src/app/api/notifications/register-fcm-token/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // NextAuth.js 설정 파일
import prisma from '@/lib/prisma'; // Prisma 클라이언트

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  
  try {
    const { token }: { token: string } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ message: 'Invalid FCM token' }, { status: 400 });
    }

    // 이미 존재하는 토큰인지 확인하고 업데이트 또는 생성 (Upsert)
    // 한 사용자가 여러 기기에서 로그인할 수 있으므로, 토큰 자체를 기준으로 upsert 합니다.
    // 만약 한 사용자가 항상 하나의 토큰만 가져야 한다면 로직 수정이 필요합니다.
    await prisma.fcmToken.upsert({
      where: { token: token }, // 토큰이 이미 존재하면
      update: { userId: userId }, // 연결된 사용자 ID만 업데이트 (다른 사용자가 같은 기기를 사용했을 경우를 대비)
      create: {
        userId: userId,
        token: token,
      },
    });

    console.log(`FCM token registered/updated for user ${userId}: ${token}`);
    return NextResponse.json({ message: 'FCM token registered successfully' }, { status: 200 });

  } catch (error: any) {
    // JSON 파싱 오류 등을 처리
    if (error.name === 'SyntaxError') {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }
    console.error('Error registering FCM token:', error);
    return NextResponse.json({ message: 'Failed to register FCM token' }, { status: 500 });
  }
}
