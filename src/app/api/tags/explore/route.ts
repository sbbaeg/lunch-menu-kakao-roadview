// app/api/tags/explore/route.ts (새 파일)

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query || query.trim() === '') {
        return NextResponse.json([]); // 검색어가 없으면 빈 배열 반환
    }

    try {
        const tags = await prisma.tag.findMany({
            where: {
                isPublic: true,       // 1. 공개된 태그만 검색
                name: {
                    contains: query,  // 2. 검색어가 이름에 포함된 태그
                    mode: 'insensitive', // 3. 대소문자 구분 없이 검색
                },
            },
            include: {
                user: { // 생성자 정보 포함
                    select: {
                        name: true,
                    },
                },
                _count: { // 관계된 모델의 개수 카운트
                    select: {
                        restaurants: true, // 이 태그에 연결된 맛집 수
                        subscribers: true, // 이 태그를 구독하는 사람 수
                    },
                },
            },
            take: 10, // 검색 결과는 최대 10개로 제한
        });
        
        // 프론트엔드가 사용하기 편한 형태로 데이터 가공
        const formattedTags = tags.map(tag => ({
            id: tag.id,
            name: tag.name,
            creatorName: tag.user.name,
            restaurantCount: tag._count.restaurants,
            subscriberCount: tag._count.subscribers,
        }));

        return NextResponse.json(formattedTags);

    } catch (error) {
        console.error('태그 탐색 오류:', error);
        return NextResponse.json({ error: '데이터를 조회하는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}