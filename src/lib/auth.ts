// src/lib/auth.ts (새 파일)

import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";

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
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as any).isAdmin;
        token.isBanned = (user as any).isBanned;

        // --- Early Bird Badge Logic ---
        // TODO: 실제 서비스 런칭 날짜로 변경해주세요.
        const LAUNCH_DATE = new Date('2023-10-01');
        const ONE_MONTH_IN_MS = 30 * 24 * 60 * 60 * 1000;
        const userCreatedAt = (user as any).createdAt ? new Date((user as any).createdAt) : new Date();

        if (userCreatedAt < new Date(LAUNCH_DATE.getTime() + ONE_MONTH_IN_MS)) {
          const earlyBirdBadge = await prisma.badge.findUnique({ where: { name: '얼리버드' } });
          if (earlyBirdBadge) {
            await prisma.userBadge.upsert({
              where: { userId_badgeId: { userId: user.id, badgeId: earlyBirdBadge.id } },
              update: {},
              create: { userId: user.id, badgeId: earlyBirdBadge.id },
            });
          }
        }
        // --- End of Early Bird Badge Logic ---
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.isAdmin = token.isAdmin;
        session.user.isBanned = token.isBanned;
      }
      return session;
    },
  },
};