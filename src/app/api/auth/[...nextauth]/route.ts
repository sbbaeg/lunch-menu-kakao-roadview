// src/app/api/auth/[...nextauth]/route.ts (수정)

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // ✅ 경로 수정: @/lib/auth 에서 가져옵니다.

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };