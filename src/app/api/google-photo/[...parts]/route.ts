// src/app/api/google-photo/[...parts]/route.ts
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { parts: string[] } }
) {
  try {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    if (!GOOGLE_API_KEY) {
      return new NextResponse('Google API Key is not configured', { status: 500 });
    }

    if (!params.parts || params.parts.length === 0) {
      return new NextResponse('Photo reference is missing', { status: 400 });
    }

    // The photo reference is passed as the URL part(s)
    const photoReference = params.parts.join('/');

    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1024&photoreference=${photoReference}&key=${GOOGLE_API_KEY}`;

    // Fetch the photo from Google. This will likely be a redirect.
    const googleResponse = await fetch(photoUrl, {
      cache: 'force-cache', // Cache the redirect response
    });

    // If the initial request to Google fails, return an error.
    if (!googleResponse.ok) {
        const errorText = await googleResponse.text();
        console.error(`Google Places Photo API error: ${googleResponse.status} ${googleResponse.statusText}`, errorText);
        return new NextResponse(`Failed to fetch photo from Google: ${googleResponse.statusText}`, { status: googleResponse.status });
    }

    // The response from Google should be a redirect to the actual image URL.
    // The browser will handle the redirect automatically if we pass the location header.
    // However, to work with next/image, we need to fetch the image data itself.
    if (googleResponse.redirected) {
      const imageResponse = await fetch(googleResponse.url, { cache: 'force-cache' });
      
      if (!imageResponse.ok) {
        return new NextResponse(`Failed to fetch final image: ${imageResponse.statusText}`, { status: imageResponse.status });
      }

      // Get the image data as a blob
      const imageBlob = await imageResponse.blob();
      
      // Return the image data with the correct content type.
      return new NextResponse(imageBlob, {
        status: 200,
        headers: {
          'Content-Type': imageResponse.headers.get('Content-Type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });

    } else {
       // This case should ideally not happen if the API works as documented (always redirects)
       // But if it does, we stream the response body directly.
       const imageBlob = await googleResponse.blob();
       return new NextResponse(imageBlob, {
        status: 200,
        headers: {
            'Content-Type': googleResponse.headers.get('Content-Type') || 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
       });
    }

  } catch (error) {
    console.error('[Google Photo API Route Error]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
