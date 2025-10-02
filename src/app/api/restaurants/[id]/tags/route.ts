import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    // 모든 내부 로직을 삭제하고, 받은 id만 바로 반환하는 테스트 코드
    const { id } = params;
    
    // DB 연결, 세션 확인 등 모든 로직을 주석 처리하거나 삭제합니다.
    // 오직 타입 시그니처가 통과되는지만 확인합니다.
    return NextResponse.json({ receivedId: id });
}