import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  /**
   * session 객체의 user 타입에 id를 추가합니다.
   */
  interface Session {
    user?: {
      id: string;
    } & DefaultSession["user"];
  }

}