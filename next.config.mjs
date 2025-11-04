// next.config.mjs

// import withPWA from 'next-pwa'; // PWA 비활성화
// import runtimeCaching from "next-pwa/cache.js"; // PWA 비활성화

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
    ],
  },
};

// PWA is disabled for now to allow build to complete on low-resource server
// const pwaConfig = {
//   dest: 'public',
//   register: true,
//   skipWaiting: true,
//   disable: process.env.NODE_ENV === 'development',
//   runtimeCaching,
// };

// export default withPWA(pwaConfig)(nextConfig); // PWA 비활성화
export default nextConfig;