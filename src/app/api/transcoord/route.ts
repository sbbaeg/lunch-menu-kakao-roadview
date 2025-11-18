// src/app/api/transcoord/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { lat, lng } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    const apiKey = process.env.KAKAO_REST_API_KEY;
    if (!apiKey) {
      console.error('KAKAO_REST_API_KEY is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const kakaoApiUrl = `https://dapi.kakao.com/v2/local/geo/transcoord.json?x=${lng}&y=${lat}&input_coord=WGS84&output_coord=KATEC`;

    const response = await fetch(kakaoApiUrl, {
      headers: {
        'Authorization': `KakaoAK ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Kakao API error:', errorBody);
      return NextResponse.json({ error: 'Failed to convert coordinates' }, { status: response.status });
    }

    const data = await response.json();
    
    if (!data.documents || data.documents.length === 0) {
        return NextResponse.json({ error: 'Coordinate conversion returned no results' }, { status: 500 });
    }

    const convertedCoords = data.documents[0];

    return NextResponse.json({ lat: convertedCoords.y, lng: convertedCoords.x });

  } catch (error) {
    console.error('Error in transcoord endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
