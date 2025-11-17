import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { origin, destination } = await request.json(); // Expecting JSON body for POST

  if (!origin || !destination) {
    return NextResponse.json({ error: 'Origin and destination are required' }, { status: 400 });
  }

  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  if (!GOOGLE_API_KEY) {
    console.error('Google API key is not configured');
    return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
  }

  // Convert "lat,lng" strings to { latitude, longitude } objects
  const [originLat, originLng] = origin.split(',').map(Number);
  const [destinationLat, destinationLng] = destination.split(',').map(Number);

  const requestBody = {
    origin: {
      location: {
        latLng: {
          latitude: originLat,
          longitude: originLng,
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: destinationLat,
          longitude: destinationLng,
        },
      },
    },
    travelMode: 'WALK', // Or 'DRIVE', 'BICYCLE', 'TRANSIT'
    routingPreference: 'TRAFFIC_AWARE_OPTIMAL', // Optional: 'TRAFFIC_AWARE', 'TRAFFIC_UNAWARE'
    polylineEncoding: 'ENCODED_POLYLINE', // Request encoded polyline
    computeAlternativeRoutes: false, // Optional
    languageCode: 'ko',
    units: 'METRIC',
  };

  console.log('[DIAG] Google Routes API Request Body:', JSON.stringify(requestBody, null, 2));

  try {
    const routesResponse = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'routes.polyline.encodedPolyline,routes.duration,routes.distanceMeters',
      },
      body: JSON.stringify(requestBody),
    });

    if (!routesResponse.ok) {
      const errorText = await routesResponse.text();
      console.error(`Google Routes API Error: Status ${routesResponse.status}, Body: ${errorText}`);
      let errorJson: any = {};
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        // Not a JSON response
      }
      return NextResponse.json({ path_encoded: '', error: errorJson.error?.message || 'Failed to get routes' }, { status: routesResponse.status });
    }

    // If we are here, response is OK.
    const data = await routesResponse.json();

    if (data.routes && data.routes.length > 0) {
      const encodedPolyline = data.routes[0].polyline.encodedPolyline;
      const duration = data.routes[0].duration;
      const distanceMeters = data.routes[0].distanceMeters;
      return NextResponse.json({ path_encoded: encodedPolyline, duration, distanceMeters });
    } else {
      console.error('Google Routes API: OK response but no routes found', data);
      return NextResponse.json({ path_encoded: '', error: 'No routes found' }, { status: 404 });
    }

  } catch (error) {
    console.error('Google Routes Request Failed:', error);
    return NextResponse.json({ error: 'Failed to fetch directions' }, { status: 500 });
  }
}