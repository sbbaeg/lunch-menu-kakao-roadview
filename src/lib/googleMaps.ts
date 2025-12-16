
import { GooglePlaceItem, GoogleDetails, GoogleOpeningHours, Review, GoogleParkingOptions } from './types';

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
  geometry?: {
    location: {
      latitude: number;
      longitude: number;
    }
  };
  types?: string[];
  accessibilityOptions?: {
    wheelchairAccessibleParking?: boolean;
    wheelchairAccessibleEntrance?: boolean;
    wheelchairAccessibleRestroom?: boolean;
    wheelchairAccessibleSeating?: boolean;
  }
}

// --- Migration of fetchFullGoogleDetails ---

export async function fetchFullGoogleDetails(place: GooglePlaceItem): Promise<GooglePlaceItem & { types?: any }> {
  try {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    if (!GOOGLE_API_KEY) throw new Error("Google API Key is not configured");

    const placeId = place.id; // The ID from the candidate is now the Google Place ID.

    if (!placeId) {
      // console.log(`[Google API Info] for ${place.place_name}: No placeId provided.`);
      return place;
    }

    // Step 2: Get Place Details using Place Details (New)
    const detailsUrl = `https://places.googleapis.com/v1/places/${placeId}?languageCode=ko`;
    const fieldMask = [
      'id', 'displayName', 'rating', 'regularOpeningHours', 'internationalPhoneNumber',
      'websiteUri', 'reviews', 'photos', 'dineIn', 'takeout',
      'allowsDogs', 'parkingOptions', 'userRatingCount', 'adrFormatAddress', 'types',
      'accessibilityOptions.wheelchairAccessibleParking', 
      'accessibilityOptions.wheelchairAccessibleEntrance', 
      'accessibilityOptions.wheelchairAccessibleRestroom', 
      'accessibilityOptions.wheelchairAccessibleSeating'
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

    if (!detailsData) {
      // console.log(`[Google API Info] for ${place.place_name}: Could not find details for placeId ${placeId}.`);
      return place;
    }

    // Map the new response to the existing GoogleDetails structure
    const googleDetails: GoogleDetails = {
      placeId: detailsData.id,
      url: detailsData.websiteUri,
      rating: detailsData.rating,
      userRatingCount: detailsData.userRatingCount,
      photos: detailsData.photos?.map(p => p.name) || [],
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
      wheelchairAccessibleParking: detailsData.accessibilityOptions?.wheelchairAccessibleParking,
      wheelchairAccessibleEntrance: detailsData.accessibilityOptions?.wheelchairAccessibleEntrance,
      wheelchairAccessibleRestroom: detailsData.accessibilityOptions?.wheelchairAccessibleRestroom,
      wheelchairAccessibleSeating: detailsData.accessibilityOptions?.wheelchairAccessibleSeating,
    };

    return {
      ...place,
      // Google의 이름과 주소가 더 정확할 수 있으므로 덮어씁니다.
      place_name: detailsData.displayName?.text || place.place_name,
      road_address_name: detailsData.adrFormatAddress ? detailsData.adrFormatAddress.replace(/<[^>]*>?/gm, '') : place.road_address_name,
      googleDetails,
      types: detailsData.types,
    };

  } catch (error) {
    console.error(`[Google API Error] for ${place.place_name}:`, error);
    return place;
  }
}

export async function fetchDirections(origin: { lat: number, lng: number }, destination: { lat: number, lng: number }): Promise<string | null> {
  try {
    const response = await fetch(`/api/directions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
      }),
    });

    const data = await response.json();

    if (response.ok && data.path_encoded) {
      return data.path_encoded;
    } else {
      console.error("Directions API error:", data.error || "Unknown error");
      return null;
    }
  } catch (error) {
    console.error("Directions fetch failed:", error);
    return null;
  }
}
