import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  /**
   * `session.user` 객체에 `id`와 `isAdmin` 프로퍼티를 추가합니다.
   */
  interface Session extends DefaultSession {
    user: {
      id: string;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }

  /**
   * `user` 객체에 `isAdmin` 프로퍼티를 추가합니다.
   */
  interface User extends DefaultUser {
    id: string;
    isAdmin: boolean;
  }
}
