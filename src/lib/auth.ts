// src/lib/auth.ts (새 파일)

import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// NextAuth 설정 객체를 별도 파일로 분리하여 export 합니다.
export const authOptions: NextAuthOptions = {
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
        return {
          id: profile.id.toString(),
          name: profile.kakao_account?.profile?.nickname,
          email: profile.kakao_account?.email ?? `${profile.id}@kakao.local`,
          image: profile.kakao_account?.profile?.profile_image_url,
        };
      },
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    // 여기에 signIn, session 콜백을 그대로 둡니다.
    async signIn({ user, account }) {
      // ... signIn 콜백 로직 ...
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};