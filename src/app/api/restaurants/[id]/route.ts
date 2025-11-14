// src/app/api/restaurants/[id]/route.ts
import { NextResponse } from 'next/server';
import { VoteType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { fetchFullGoogleDetails } from '@/lib/googleMaps';
import { GooglePlaceItem, AppRestaurant } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const googlePlaceId = params.id;

  if (!googlePlaceId) {
    return NextResponse.json({ error: 'Invalid restaurant ID' }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  try {
    const restaurantFromDb = await prisma.restaurant.findUnique({
      where: { googlePlaceId },
      select: {
        id: true,
        googlePlaceId: true,
        placeName: true,
        address: true,
        latitude: true,
        longitude: true,
        categoryName: true,
        likeCount: true,
        dislikeCount: true,
        taggedBy: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                isPublic: true,
                userId: true
              }
            }
          }
        }
      }
    });

    if (!restaurantFromDb) {
      return NextResponse.json({ error: 'Restaurant not found in our DB. It should be created first.' }, { status: 404 });
    }

    const reviewAggregations = await prisma.review.aggregate({
      where: {
        restaurantId: restaurantFromDb.id,
        user: {
          isBanned: false,
        }
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    const appReview = {
      averageRating: reviewAggregations._avg.rating || 0,
      reviewCount: reviewAggregations._count.id,
    };

    let currentUserVote: VoteType | null = null;
    if (userId && restaurantFromDb) {
      const vote = await prisma.restaurantVote.findUnique({
        where: { userId_restaurantId: { userId: userId, restaurantId: restaurantFromDb.id } },
        select: { type: true }
      });
      currentUserVote = vote?.type || null;
    }

    const googlePlaceItem: GooglePlaceItem = {
        id: restaurantFromDb.googlePlaceId,
        place_name: restaurantFromDb.placeName,
        y: String(restaurantFromDb.latitude),
        x: String(restaurantFromDb.longitude),
        place_url: `https://www.google.com/maps/place/?q=place_id:${restaurantFromDb.googlePlaceId}`,
        category_name: restaurantFromDb.categoryName || '',
        road_address_name: restaurantFromDb.address || '',
        address_name: restaurantFromDb.address || '',
        distance: '',
    };

    const restaurantWithGoogleDetails = await fetchFullGoogleDetails(googlePlaceItem);

    const finalRestaurantData: AppRestaurant = {
      id: restaurantFromDb.googlePlaceId,
      dbId: restaurantFromDb.id,
      googlePlaceId: restaurantFromDb.googlePlaceId,
      placeName: restaurantFromDb.placeName,
      categoryName: restaurantFromDb.categoryName || '',
      address: restaurantFromDb.address || '',
      x: String(restaurantFromDb.longitude),
      y: String(restaurantFromDb.latitude),
      placeUrl: `https://www.google.com/maps/place/?q=place_id:${restaurantFromDb.googlePlaceId}`,
      distance: '',
      tags: restaurantFromDb.taggedBy.map(t => ({
        id: t.tag.id,
        name: t.tag.name,
        isPublic: t.tag.isPublic,
        creatorId: t.tag.userId,
        creatorName: null
      })),
      googleDetails: restaurantWithGoogleDetails.googleDetails,
      appReview: appReview,
      likeCount: restaurantFromDb.likeCount,
      dislikeCount: restaurantFromDb.dislikeCount,
      currentUserVote: currentUserVote,
    };

    return NextResponse.json(finalRestaurantData);
  } catch (error) {
    console.error('Failed to fetch restaurant details:', error);
    return NextResponse.json({ error: 'Failed to fetch restaurant details' }, { status: 500 });
  }
}