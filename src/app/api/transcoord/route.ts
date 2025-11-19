import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { x, y } = await request.json();

    if (!x || !y) {
      return NextResponse.json({ error: 'Missing x or y coordinates' }, { status: 400 });
    }

    const apiKey = process.env.KAKAO_REST_API_KEY;
    if (!apiKey) {
      console.error('KAKAO_REST_API_KEY is not set in environment variables.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const kakaoApiUrl = `https://dapi.kakao.com/v2/local/geo/transcoord.json?x=${x}&y=${y}&input_coord=WGS84&output_coord=KATEC`;

    const response = await fetch(kakaoApiUrl, {
      headers: {
        'Authorization': `KakaoAK ${apiKey}`
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Kakao API error: ${response.status} ${response.statusText}`, errorBody);
      return NextResponse.json({ error: 'Failed to convert coordinates' }, { status: response.status });
    }

    const data = await response.json();

    if (!data.documents || data.documents.length === 0) {
        return NextResponse.json({ error: 'No converted coordinates returned from Kakao API' }, { status: 500 });
    }

    const convertedCoords = data.documents[0];

    return NextResponse.json({ x: convertedCoords.x, y: convertedCoords.y });

  } catch (error) {
    console.error('Error in transcoord API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
