import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Prisma.TagGetPayload를 사용하여 쿼리 결과에 대한 정확한 타입을 생성합니다.
type TagWithCountsAndUser = Prisma.TagGetPayload<{
    include: {
        user: {
            select: {
                name: true;
            };
        };
        _count: {
            select: {
                restaurants: true;
                subscribers: true;
            };
        };
    };
}>;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const sort = searchParams.get('sort'); // 'popular' 또는 'subscribers'

    try {
        let tags: TagWithCountsAndUser[]; // 정확한 타입을 변수에 적용합니다.

        if (sort) {
            // 정렬 기능: 인기순 또는 구독자순으로 전체 공개 태그를 정렬
            const orderBy: Prisma.TagOrderByWithRelationInput = sort === 'popular' 
                ? { restaurants: { _count: 'desc' } } 
                : { subscribers: { _count: 'desc' } };

            tags = await prisma.tag.findMany({
                where: {
                    isPublic: true,
                },
                include: {
                    user: { select: { name: true } },
                    _count: { select: { restaurants: true, subscribers: true } },
                },
                orderBy: orderBy,
                take: 20, // 상위 20개 결과
            });

        } else if (query && query.trim() !== '') {
            // 기존의 검색 기능
            tags = await prisma.tag.findMany({
                where: {
                    isPublic: true,
                    name: {
                        contains: query,
                        mode: 'insensitive',
                    },
                },
                include: {
                    user: { select: { name: true } },
                    _count: { select: { restaurants: true, subscribers: true } },
                },
                take: 10, 
            });
        } else {
            // 정렬이나 검색어 없이 요청된 경우
            return NextResponse.json([]);
        }
        
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