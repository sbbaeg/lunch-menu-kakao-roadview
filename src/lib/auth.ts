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
          isAdmin: false, // isAdmin 기본값 추가
          isBanned: false, // isBanned 기본값 추가
        };
      },
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async session({ session, user }) {
      console.log("SESSION CALLBACK USER:", user);
      if (session.user) {
        session.user.id = user.id;
        session.user.isAdmin = (user as any).isAdmin; // Add isAdmin flag
        session.user.isBanned = (user as any).isBanned; // Add isBanned flag
      }
      return session;
    },
  },
};