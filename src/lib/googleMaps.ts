
import { KakaoPlaceItem, GoogleDetails, GoogleOpeningHours, Review, GoogleParkingOptions } from './types';

// --- NEW API Type Definitions ---

interface NewGooglePhoto {
  name: string; // e.g. "places/ChIJ.../photos/Aap_..."
}

interface NewGoogleReview {
  authorAttribution?: {
    displayName: string;
    photoUri: string;
  };
  rating: number;
  relativePublishTimeDescription: string;
  text?: {
    text: string;
  };
}

interface NewGooglePlace {
  id: string;
  displayName?: {
    text: string;
  };
  internationalPhoneNumber?: string;
  regularOpeningHours?: GoogleOpeningHours;
  rating?: number;
  websiteUri?: string;
  reviews?: NewGoogleReview[];
  photos?: NewGooglePhoto[];
  dineIn?: boolean;
  takeout?: boolean;
  allowsDogs?: boolean;
  parkingOptions?: GoogleParkingOptions;
  userRatingCount?: number;
  adrFormatAddress?: string;
}

// --- Migration of fetchFullGoogleDetails ---

export async function fetchFullGoogleDetails(place: KakaoPlaceItem): Promise<KakaoPlaceItem> {
  console.log('Checking GOOGLE_API_KEY in googleMaps.ts:', process.env.GOOGLE_API_KEY); // 진단용 로그
  try {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    if (!GOOGLE_API_KEY) throw new Error("Google API Key is not configured");

    // Step 1: Find Place ID using Text Search (New)
    const textSearchUrl = 'https://places.googleapis.com/v1/places:searchText';
    const textSearchBody = {
      textQuery: `${place.place_name} ${place.road_address_name}`,
    };
    
    const textSearchResponse = await fetch(textSearchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.id',
      },
      body: JSON.stringify(textSearchBody),
    });

    const textSearchData = await textSearchResponse.json();
    const placeId = textSearchData.places?.[0]?.id;

    if (!placeId) {
      // console.log(`[Google API Info] for ${place.place_name}: Could not find placeId.`);
      return place;
    }

    // Step 2: Get Place Details using Place Details (New)
    const detailsUrl = `https://places.googleapis.com/v1/places/${placeId}?languageCode=ko`;
    const fieldMask = [
      'id', 'displayName', 'rating', 'regularOpeningHours', 'internationalPhoneNumber',
      'websiteUri', 'reviews', 'photos', 'dineIn', 'takeout',
      'allowsDogs', 'parkingOptions', 'userRatingCount', 'adrFormatAddress'
    ].join(',');

    const detailsResponse = await fetch(detailsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': fieldMask,
      },
    });

    const detailsData: NewGooglePlace = await detailsResponse.json();
    console.log(`[Google API Response for ${place.place_name}]:`, JSON.stringify(detailsData, null, 2)); // 진단용 로그

    if (!detailsData) {
      // console.log(`[Google API Info] for ${place.place_name}: Could not find details for placeId ${placeId}.`);
      return place;
    }

    // Map the new response to the existing GoogleDetails structure
    const googleDetails: GoogleDetails = {
      url: detailsData.websiteUri,
      rating: detailsData.rating,
      userRatingCount: detailsData.userRatingCount,
      photos: detailsData.photos?.map(p => 
        `https://places.googleapis.com/v1/${p.name}/media?maxHeightPx=400&key=${GOOGLE_API_KEY}`
      ) || [],
      opening_hours: detailsData.regularOpeningHours,
      phone: detailsData.internationalPhoneNumber,
      reviews: detailsData.reviews?.map(review => ({
        author_name: review.authorAttribution?.displayName || '익명',
        profile_photo_url: review.authorAttribution?.photoUri || '',
        rating: review.rating || 0,
        relative_time_description: review.relativePublishTimeDescription || '',
        text: review.text?.text || '',
      })) || [],
      dine_in: detailsData.dineIn,
      takeout: detailsData.takeout,
      allowsDogs: detailsData.allowsDogs,
      parkingOptions: detailsData.parkingOptions,
    };

    return {
      ...place,
      // Google의 이름과 주소가 더 정확할 수 있으므로 덮어씁니다.
      place_name: detailsData.displayName?.text || place.place_name,
      road_address_name: detailsData.adrFormatAddress || place.road_address_name,
      googleDetails,
    };

  } catch (error) {
    console.error(`[Google API Error] for ${place.place_name}:`, error);
    return place;
  }
}
