// api/recommend/route.ts (수정)

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { fetchFullGoogleDetails } from '@/lib/googleMaps';
import { GooglePlaceItem, RestaurantWithTags } from '@/lib/types';
import { getExpandedCategoryTypes, getDisplayCategoryLabel } from '@/lib/categories';

export const dynamic = 'force-dynamic';

// 두 지점 간의 거리를 미터(m) 단위로 계산하는 함수
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const query = searchParams.get('query') || '음식점';
    const radius = searchParams.get('radius') || '800';
    const sort = searchParams.get('sort') || 'accuracy';
    const size = Number(searchParams.get('size') || '5');
    const minRating = Number(searchParams.get('minRating') || '0');
    const openNow = searchParams.get('openNow') === 'true';
    const includeUnknown = searchParams.get('includeUnknown') === 'true';
    const fromFavorites = searchParams.get('fromFavorites') === 'true';
    const allowsDogsOnly = searchParams.get('allowsDogsOnly') === 'true';
    const hasParkingOnly = searchParams.get('hasParkingOnly') === 'true';
    const wheelchairAccessibleEntrance = searchParams.get('wheelchairAccessibleEntrance') === 'true';
    const wheelchairAccessibleRestroom = searchParams.get('wheelchairAccessibleRestroom') === 'true';
    const wheelchairAccessibleSeating = searchParams.get('wheelchairAccessibleSeating') === 'true';
    const wheelchairAccessibleParking = searchParams.get('wheelchairAccessibleParking') === 'true';
    const tagsParam = searchParams.get('tags');
    const tagIds = tagsParam ? tagsParam.split(',').map(Number).filter(id => !isNaN(id)) : [];

    if (!lat || !lng) {
        return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    // Helper function for Text Search
    async function performTextSearch(term: string, sort: string, lat: string, lng: string, radius: string, apiKey: string) {
        const searchUrl = 'https://places.googleapis.com/v1/places:searchText';
        const requestBody: any = {
            textQuery: term,
            locationRestriction: {
                circle: { center: { latitude: Number(lat), longitude: Number(lng) }, radius: Number(radius) },
            },
            languageCode: "ko",
            maxResultCount: 20,
        };
        if (sort === 'distance') {
            requestBody.rankPreference = 'DISTANCE';
            delete requestBody.locationRestriction.circle.radius;
        }
        const searchResponse = await fetch(searchUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.types,places.primaryTypeDisplayName,places.location' },
            body: JSON.stringify(requestBody),
        });
        return searchResponse.json();
    }

    // Helper function for Category Search
    async function performCategorySearch(type: string, sort: string, lat: string, lng: string, radius: string, apiKey: string) {
        const searchUrl = 'https://places.googleapis.com/v1/places:searchNearby';
        const requestBody: any = {
            includedTypes: [type],
            locationRestriction: {
                circle: { center: { latitude: Number(lat), longitude: Number(lng) }, radius: Number(radius) },
            },
            languageCode: "ko",
            maxResultCount: 20,
        };
        if (sort === 'distance') {
            requestBody.rankPreference = 'DISTANCE';
            delete requestBody.locationRestriction.circle.radius;
        } else {
            requestBody.rankPreference = 'POPULARITY';
        }
        const searchResponse = await fetch(searchUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.types,places.primaryTypeDisplayName,places.location' },
            body: JSON.stringify(requestBody),
        });
        return searchResponse.json();
    }

    // Common mapping function
    function mapGoogleToAppPlace(places: any[]): GooglePlaceItem[] {
        return places.map((place: any) => ({
            id: place.id,
            place_name: place.displayName?.text || '',
            category_name: getDisplayCategoryLabel(place.types),
            road_address_name: place.formattedAddress || '',
            address_name: place.formattedAddress || '',
            x: String(place.location?.longitude || 0),
            y: String(place.location?.latitude || 0),
            place_url: `https://www.google.com/maps/place/?q=place_id:${place.id}`,
            distance: '', // This will be calculated later
            googleTypes: place.types || [],
        }));
    }

    try {
        const session = await getServerSession(authOptions);
        let blacklistIds: string[] = [];
        if (session?.user?.id) {
            const blacklistEntries = await prisma.blacklist.findMany({
                where: { userId: session.user.id },
                select: { restaurant: { select: { googlePlaceId: true } } },
            });
            blacklistIds = blacklistEntries.map(entry => entry.restaurant.googlePlaceId);
        }

        let candidates: GooglePlaceItem[] = [];

        if (fromFavorites && session?.user?.id) {
            const favoriteRestaurants = await prisma.favorite.findMany({
                where: { userId: session.user.id },
                include: { restaurant: true },
            });
            candidates = favoriteRestaurants
                .map(({ restaurant }) => ({
                    ...restaurant,
                    calculatedDistance: calculateDistance(Number(lat), Number(lng), restaurant.latitude!, restaurant.longitude!),
                }))
                .filter(restaurant => restaurant.calculatedDistance <= Number(radius))
                .map(restaurant => ({
                    id: restaurant.googlePlaceId,
                    place_name: restaurant.placeName,
                    category_name: restaurant.categoryName || '',
                    road_address_name: restaurant.address || '',
                    address_name: restaurant.address || '',
                    x: String(restaurant.longitude),
                    y: String(restaurant.latitude),
                    place_url: `https://www.google.com/maps/place/?q=place_id:${restaurant.googlePlaceId}`,
                    distance: String(Math.round(restaurant.calculatedDistance)),
                }));
        } else {
            const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
            if (!GOOGLE_API_KEY) {
                throw new Error("Google API Key is not configured");
            }
            const source = searchParams.get('source');
            const allPlaces: any[] = [];

            if (source === 'search_bar') {
                const searchTerm = (query.split(',')[0].trim()) || '음식점';
                if (searchTerm) {
                    const searchData = await performTextSearch(searchTerm, sort, lat, lng, radius, GOOGLE_API_KEY);
                    if (searchData.places) {
                        allPlaces.push(...searchData.places);
                    }
                }
            } else {
                // Category Search Logic (from filter)
                let searchTerms = (query || 'restaurant').split(',').map(term => term.trim()).filter(term => term);

                // If "음식점" is present and it's the only term, expand it to meal-focused categories
                if (searchTerms.length === 1 && searchTerms[0] === '음식점') {
                    searchTerms = [
                        'korean_restaurant', 'korean_bbq_restaurant', 'korean_noodles_restaurant', 'korean_soup_restaurant',
                        'japanese_restaurant', 'sushi_restaurant', 'ramen_restaurant', 'japanese_curry_restaurant', 'tonkatsu_restaurant', 'udon_and_soba_restaurant',
                        'chinese_restaurant', 'dim_sum_restaurant', 'sichuan_restaurant',
                        'western_restaurant', 'italian_restaurant', 'french_restaurant', 'spanish_restaurant', 'steak_house', 'pizza_restaurant',
                        'asian_restaurant', 'thai_restaurant', 'vietnamese_restaurant', 'indian_restaurant',
                        'fast_food_restaurant', 'hamburger_restaurant', 'chicken_restaurant', 'korean_street_food_restaurant',
                        'vegetarian_restaurant', 'buffet', 'restaurant'
                    ];
                } else {
                    // Otherwise, translate "음식점" if it's part of a list, or just use the term
                    searchTerms = searchTerms.map(term => (term === '음식점' ? 'restaurant' : term));
                }

                // Execute all category searches in parallel
                const searchPromises = searchTerms.map(term => performCategorySearch(term, sort, lat, lng, radius, GOOGLE_API_KEY));
                const results = await Promise.all(searchPromises);

                results.forEach(searchData => {
                    if (searchData.places) {
                        allPlaces.push(...searchData.places);
                    }
                });
            }
            const uniquePlaces = allPlaces.filter((place, index, self) => index === self.findIndex(p => p.id === place.id));
            candidates = mapGoogleToAppPlace(uniquePlaces);
        }

        let tagExcludedCount = 0;
        let taggedRestaurantIds: Set<string> | null = null;
        if (tagIds.length > 0) {
            const taggedRestaurants = await prisma.restaurant.findMany({
                where: {
                    taggedBy: { some: { tagId: { in: tagIds } } },
                    ...(fromFavorites ? { googlePlaceId: { in: candidates.map(c => c.id) } } : {})
                },
                select: { googlePlaceId: true }
            });
            taggedRestaurantIds = new Set(taggedRestaurants.map(r => r.googlePlaceId));
        }

        const countBeforeBlacklist = candidates.length;
        let filteredCandidates = candidates.filter(place => !blacklistIds.includes(place.id));
        const blacklistExcludedCount = countBeforeBlacklist - filteredCandidates.length;

        if (taggedRestaurantIds) {
            const countBeforeTagFilter = filteredCandidates.length;
            filteredCandidates = filteredCandidates.filter(place => taggedRestaurantIds!.has(place.id));
            tagExcludedCount = countBeforeTagFilter - filteredCandidates.length;
        }

        if (sort === 'accuracy') {
            for (let i = filteredCandidates.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [filteredCandidates[i], filteredCandidates[j]] = [filteredCandidates[j], filteredCandidates[i]];
            }
        }

        const finalResults: GooglePlaceItem[] = [];
        for (const candidate of filteredCandidates) {
            if (finalResults.length >= size) break;
            const enriched = await fetchFullGoogleDetails(candidate);
            if ((enriched.googleDetails?.rating || 0) < minRating) continue;
            if (openNow) {
                const hours = enriched.googleDetails?.opening_hours;
                if (!(hours?.openNow === true || (includeUnknown && hours === undefined))) continue;
            }
            if (allowsDogsOnly && !enriched.googleDetails?.allowsDogs) continue;
            if (hasParkingOnly) {
                const parking = enriched.googleDetails?.parkingOptions;
                if (!parking || !Object.values(parking).some(val => val === true)) continue;
            }
            if (wheelchairAccessibleEntrance && !enriched.googleDetails?.wheelchairAccessibleEntrance) continue;
            if (wheelchairAccessibleRestroom && !enriched.googleDetails?.wheelchairAccessibleRestroom) continue;
            if (wheelchairAccessibleSeating && !enriched.googleDetails?.wheelchairAccessibleSeating) continue;
            if (wheelchairAccessibleParking && !enriched.googleDetails?.wheelchairAccessibleParking) continue;
            finalResults.push(enriched);
        }

        let sortedResults: GooglePlaceItem[] = [];
        if (sort === 'rating') {
            sortedResults = finalResults.sort((a, b) => (b.googleDetails?.rating || 0) - (a.googleDetails?.rating || 0));
        } else if (sort === 'distance' && fromFavorites) {
            sortedResults = finalResults.sort((a, b) => Number(a.distance) - Number(b.distance));
        } else {
            sortedResults = finalResults;
        }

        const resultIds = sortedResults.map(r => r.id);
        const dbRestaurants = await prisma.restaurant.findMany({
            where: { googlePlaceId: { in: resultIds } },
            select: {
              id: true,
              googlePlaceId: true,
              likeCount: true,
              dislikeCount: true,
              taggedBy: { select: { tag: { select: { id: true, name: true, isPublic: true, userId: true, user: { select: { id: true, name: true } }, _count: { select: { restaurants: true, subscribers: true } } } } } }
            }
        });
        const dbRestaurantMap = new Map(dbRestaurants.map(r => [r.googlePlaceId, r]));

        const reviewAggregations = await prisma.review.groupBy({
            by: ['restaurantId'],
            where: { restaurantId: { in: dbRestaurants.map(r => r.id) } },
            _avg: { rating: true },
            _count: { id: true },
        });
        const reviewAggsMap = new Map(reviewAggregations.map(agg => [agg.restaurantId, agg]));

        const finalDocuments: (RestaurantWithTags & { likeCount: number, dislikeCount: number })[] = sortedResults.map(result => {
            const dbRestaurant = dbRestaurantMap.get(result.id);
            const reviewAggs = dbRestaurant ? reviewAggsMap.get(dbRestaurant.id) : null;
            return {
                ...result,
                tags: dbRestaurant ? dbRestaurant.taggedBy.map(t => ({ id: t.tag.id, name: t.tag.name, isPublic: t.tag.isPublic, creatorId: t.tag.user.id, creatorName: t.tag.user.name, restaurantCount: t.tag._count.restaurants, subscriberCount: t.tag._count.subscribers })) : [],
                appReview: reviewAggs ? { averageRating: reviewAggs._avg.rating || 0, reviewCount: reviewAggs._count.id } : undefined,
                likeCount: dbRestaurant?.likeCount ?? 0,
                dislikeCount: dbRestaurant?.dislikeCount ?? 0,
            };
        });

        return NextResponse.json({ documents: finalDocuments, blacklistExcludedCount, tagExcludedCount });

    } catch (error) {
        console.error('[API Route Error]:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}