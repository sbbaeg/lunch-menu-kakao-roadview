import { NextResponse } from 'next/server';
import { Client, DirectionsRequest, TravelMode } from "@googlemaps/google-maps-services-js";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('origin'); // "lat,lng"
  const destination = searchParams.get('destination'); // "lat,lng"

  if (!origin || !destination) {
    return NextResponse.json({ error: 'Origin and destination are required' }, { status: 400 });
  }

  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  if (!GOOGLE_API_KEY) {
    console.error('Google API key is not configured');
    return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
  }

  const client = new Client({});

  const params: DirectionsRequest['params'] = {
    origin: origin,
    destination: destination,
    mode: TravelMode.driving,
    key: GOOGLE_API_KEY,
  };

  try {
    const response = await client.directions({ params });
    const data = response.data;

    if (data.status === 'OK' && data.routes.length > 0) {
      // Return the encoded polyline string
      const encodedPolyline = data.routes[0].overview_polyline.points;
      return NextResponse.json({ path_encoded: encodedPolyline });
    } else {
      console.error('Google Directions API Error:', data.status, data.error_message);
      return NextResponse.json({ path: [], error: data.error_message || 'No routes found' }, { status: 404 });
    }

  } catch (error) {
    console.error('Google Directions Request Failed:', error);
    return NextResponse.json({ error: 'Failed to fetch directions' }, { status: 500 });
  }
}