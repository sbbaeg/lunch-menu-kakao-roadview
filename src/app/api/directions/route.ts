import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { origin, destination, travelMode = 'WALK' } = await request.json();

  if (!origin || !destination) {
    return NextResponse.json({ error: 'Origin and destination are required' }, { status: 400 });
  }

  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  if (!GOOGLE_API_KEY) {
    console.error('Google API key is not configured');
    return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
  }

  const [originLat, originLng] = origin.split(',').map(Number);
  const [destinationLat, destinationLng] = destination.split(',').map(Number);

  const requestBody: any = {
    origin: { location: { latLng: { latitude: originLat, longitude: originLng } } },
    destination: { location: { latLng: { latitude: destinationLat, longitude: destinationLng } } },
    travelMode: travelMode,
    polylineEncoding: 'ENCODED_POLYLINE',
    computeAlternativeRoutes: false,
    languageCode: 'ko',
    units: 'METRIC',
  };

  if (travelMode === 'TRANSIT') {
    requestBody.computeAlternativeRoutes = true;
    requestBody.transitPreferences = {
      allowedTravelModes: ["BUS", "RAIL", "SUBWAY", "TRAIN", "TRAM", "LIGHT_RAIL"],
      routingPreference: "LESS_WALKING"
    };
  }

  const fieldMask = travelMode === 'TRANSIT'
    ? 'routes.legs,routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
    : 'routes.polyline.encodedPolyline,routes.duration,routes.distanceMeters';

  try {
    const routesResponse = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': fieldMask,
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
      return NextResponse.json({ error: errorJson.error?.message || 'Failed to get routes' }, { status: routesResponse.status });
    }

    const data = await routesResponse.json();

    if (data.routes && data.routes.length > 0) {
      if (travelMode === 'TRANSIT') {
        // For transit, return the full route object which includes legs and steps
        return NextResponse.json({ route: data.routes[0] });
      } else {
        // For other modes, return the simplified object
        const encodedPolyline = data.routes[0].polyline.encodedPolyline;
        const duration = data.routes[0].duration;
        const distanceMeters = data.routes[0].distanceMeters;
        return NextResponse.json({ path_encoded: encodedPolyline, duration, distanceMeters });
      }
    } else {
      console.error('Google Routes API: OK response but no routes found', data);
      return NextResponse.json({ error: 'No routes found' }, { status: 404 });
    }

  } catch (error) {
    console.error('Google Routes Request Failed:', error);
    return NextResponse.json({ error: 'Failed to fetch directions' }, { status: 500 });
  }
}