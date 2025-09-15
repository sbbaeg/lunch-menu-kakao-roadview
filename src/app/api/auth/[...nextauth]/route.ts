import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import KakaoProvider from "next-auth/providers/kakao"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

console.log("✅ [Auth] route.ts 파일이 로드되었습니다.");

const prisma = new PrismaClient()

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      profile(profile) {
        // --- 감시 카메라 1: 카카오에서 어떤 정보를 주는지 확인 ---
        console.log("👀 [Auth] 카카오 프로필 정보:", profile);
        
        const userProfile = {
          id: profile.id.toString(),
          name: profile.kakao_account?.profile?.nickname,
          email: profile.kakao_account?.email ?? `${profile.id}@kakao.local`,
          image: profile.kakao_account?.profile?.profile_image_url,
        }

        // --- 감시 카메라 2: DB에 저장할 최종 정보 확인 ---
        console.log("📦 [Auth] DB에 저장될 최종 사용자 정보:", userProfile);
        
        return userProfile;
      },
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async session({ session, user }) {
      console.log("🔑 [Auth] 세션이 생성되었습니다. User ID:", user.id);
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
})

export { handler as GET, handler as POST }