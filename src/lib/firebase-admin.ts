import * as admin from 'firebase-admin';

// 환경 변수에서 서비스 계정 키(Base64 인코딩된 JSON)를 가져옵니다.
// Vercel 환경에서는 환경 변수를 직접 사용할 수 있습니다.
// 로컬 개발 시에는 .env.local 파일에 이 변수를 설정해야 합니다.
const serviceAccountKeyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;

let initialized = false;

// 이미 초기화되었는지 확인하여 중복 초기화를 방지합니다.
if (admin.apps.length > 0) {
    initialized = true;
}

if (!initialized && serviceAccountKeyBase64) {
  try {
    // Base64 디코딩
    const serviceAccountKeyJson = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountKeyJson);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
    // 초기화 실패 시 빈 객체를 내보내거나 에러를 던질 수 있습니다.
    // 여기서는 에러를 로깅하고, 아래에서 messaging() 호출 시 에러가 발생하도록 둡니다.
  }
} else if (!initialized) {
    console.warn("Firebase Admin SDK not initialized. `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64` env var is missing or SDK is already initialized.");
}


// 초기화된 앱이 있을 경우에만 messaging과 auth를 내보냅니다.
// 초기화되지 않았다면, 이를 사용하는 코드에서 에러가 발생하여 문제를 인지할 수 있도록 합니다.
export const adminMessaging = admin.apps.length > 0 ? admin.messaging() : undefined;
export const adminAuth = admin.apps.length > 0 ? admin.auth() : undefined;
