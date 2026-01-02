
import { GooglePlaceItem, GoogleDetails, GoogleOpeningHours, Review, GoogleParkingOptions } from './types';

export async function fetchFullGoogleDetails(place: GooglePlaceItem): Promise<GooglePlaceItem & { types?: any }> {
  try {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    if (!GOOGLE_API_KEY) throw new Error("Google API Key is not configured");

    const placeId = place.id; 

    if (!placeId) {
      return place;
    }

    const fields = [
      'place_id', 'name', 'url', 'rating', 'user_ratings_total', 
      'photos', 'opening_hours', 'international_phone_number', 
      'reviews', 'type', 'formatted_address'
    ].join(',');

    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&key=${GOOGLE_API_KEY}&language=ko&fields=${fields}`;

    const detailsResponse = await fetch(detailsUrl);
    const responseData = await detailsResponse.json();

    if (responseData.status !== 'OK' || !responseData.result) {
      // console.log(`[Google API Info] for ${place.place_name}: Could not find details for placeId ${placeId}. Status: ${responseData.status}`);
      return place;
    }

    const detailsData = responseData.result;

    const googleDetails: GoogleDetails = {
      placeId: detailsData.place_id,
      url: detailsData.url,
      rating: detailsData.rating,
      userRatingCount: detailsData.user_ratings_total,
      photos: detailsData.photos?.map((p: { photo_reference: string }) => p.photo_reference) || [],
      opening_hours: detailsData.opening_hours,
      phone: detailsData.international_phone_number,
      reviews: detailsData.reviews,
    };

    return {
      ...place,
      place_name: detailsData.name || place.place_name,
      road_address_name: detailsData.formatted_address || place.road_address_name,
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
