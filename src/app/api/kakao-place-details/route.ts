import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { placeName, x, y } = await request.json();

    if (!placeName || !x || !y) {
      return NextResponse.json({ error: 'Missing placeName, x, or y coordinates' }, { status: 400 });
    }

    const apiKey = process.env.KAKAO_REST_API_KEY;
    if (!apiKey) {
      console.error('KAKAO_REST_API_KEY is not set in environment variables.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Kakao Local Search API endpoint
    const kakaoApiUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(placeName)}&x=${x}&y=${y}&radius=1000`; // Search within 1km radius

    const response = await fetch(kakaoApiUrl, {
      headers: {
        'Authorization': `KakaoAK ${apiKey}`
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Kakao Local Search API error: ${response.status} ${response.statusText}`, errorBody);
      return NextResponse.json({ error: 'Failed to search place details from Kakao API' }, { status: response.status });
    }

    const data = await response.json();

    if (!data.documents || data.documents.length === 0) {
        return NextResponse.json({ error: 'No place found for the given name and coordinates' }, { status: 404 });
    }

    // Find the most relevant place_url (e.g., the first one, or refine if needed)
    const placeUrl = data.documents[0].place_url;

    if (!placeUrl) {
        return NextResponse.json({ error: 'Place URL not found in Kakao API response' }, { status: 500 });
    }

    return NextResponse.json({ placeUrl });

  } catch (error) {
    console.error('Error in kakao-place-details API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
