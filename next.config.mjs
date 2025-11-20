// next.config.mjs

import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        port: '',
        pathname: '/maps/api/place/photo/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'places.googleapis.com',
        port: '',
        pathname: '/v1/**',
      },
    ],
  },
};

const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  swSrc: 'src/sw.ts', // 커스텀 서비스 워커 파일 지정
  workboxOptions: {
    // runtimeCaching: [], // 필요한 경우 런타임 캐싱 전략 정의
    // 푸시 알림을 위한 추가 설정은 sw.ts 파일 내에서 직접 처리
  },
};

export default withPWA(pwaConfig)(nextConfig); // PWA 활성화
