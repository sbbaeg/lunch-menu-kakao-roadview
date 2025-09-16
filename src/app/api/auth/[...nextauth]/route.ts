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
    // 이메일이 동일한 다른 소셜 계정을 자동으로 연결해주는 콜백
    async signIn({ user, account }) {
      // --- 감시 카메라: signIn 콜백 시작 지점 ---
      console.log("🕵️ [SignIn Callback] 시작", { user, account });

      // 소셜 로그인(google, kakao 등)이며 이메일이 있는 경우에만 로직 실행
      if (account && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        // --- 감시 카메라: 기존 사용자 검색 결과 ---
        console.log("🕵️ [SignIn Callback] 기존 사용자 검색 결과:", existingUser);

        // 1. DB에 해당 이메일을 가진 사용자가 이미 존재하는 경우
        if (existingUser) {
          const linkedAccount = await prisma.account.findFirst({
            where: {
              provider: account.provider,
              userId: existingUser.id,
            },
          });

          // 2. 그런데 현재 사용하려는 소셜 계정은 아직 연결되지 않은 경우
          if (!linkedAccount) {
            // --- 감시 카메라: 새 계정을 기존 사용자에 연결 ---
            console.log(`🕵️ [SignIn Callback] 새 계정(${account.provider})을 기존 사용자(${existingUser.email})에게 연결합니다.`);
            
            // 3. 새 소셜 계정(account)을 기존 사용자(existingUser)에게 연결
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
                refresh_token_expires_in: account.refresh_token_expires_in as number | undefined,
              },
            });
          }
        }
      }

      // --- 감시 카메라: signIn 콜백 종료 직전 ---
      console.log("🕵️ [SignIn Callback] 로그인 최종 승인 직전");
      return true; // 모든 확인 절차 후, 로그인을 최종 승인
    },
    
    // 세션에 사용자 ID를 포함시키는 콜백
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