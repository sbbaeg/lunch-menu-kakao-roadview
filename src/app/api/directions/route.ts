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
    travelMode: 'DRIVE', // Or 'WALK', 'BICYCLE', 'TRANSIT'
    routingPreference: 'TRAFFIC_AWARE_OPTIMAL', // Optional: 'TRAFFIC_AWARE', 'TRAFFIC_UNAWARE'
    polylineEncoding: 'ENCODED_POLYLINE', // Request encoded polyline
    computeAlternativeRoutes: false, // Optional
    languageCode: 'ko',
    units: 'METRIC',
  };

  try {
    const routesResponse = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        // Specify which fields to return to optimize cost
        'X-Goog-FieldMask': 'routes.polyline.encodedPolyline,routes.duration,routes.distanceMeters',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await routesResponse.json();

    if (routesResponse.ok && data.routes && data.routes.length > 0) {
      const encodedPolyline = data.routes[0].polyline.encodedPolyline;
      const duration = data.routes[0].duration; // e.g., "1234s"
      const distanceMeters = data.routes[0].distanceMeters; // e.g., 1234
      return NextResponse.json({ path_encoded: encodedPolyline, duration, distanceMeters });
    } else {
      console.error('Google Routes API Error:', data);
      return NextResponse.json({ path_encoded: '', error: data.error?.message || 'No routes found' }, { status: routesResponse.status });
    }

  } catch (error) {
    console.error('Google Routes Request Failed:', error);
    return NextResponse.json({ error: 'Failed to fetch directions' }, { status: 500 });
  }
}