/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com', // 기존에 있던 설정
        port: '',
        pathname: '/maps/api/place/photo/**',
      },
      { //(리뷰어 프로필 사진용)
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/a/**',
      },
    ],
  },
};

export default nextConfig;