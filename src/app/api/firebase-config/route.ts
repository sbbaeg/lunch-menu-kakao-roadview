// src/app/api/firebase-config/route.ts
import { NextResponse } from 'next/server';

export function GET() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Ensure all required variables are present
  if (Object.values(firebaseConfig).some(value => !value)) {
    console.error('One or more NEXT_PUBLIC_FIREBASE environment variables are missing.');
    return new NextResponse('Firebase configuration is incomplete.', { status: 500 });
  }

  return NextResponse.json(firebaseConfig);
}
