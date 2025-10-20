import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  /**
   * `session.user` 객체에 `id` 프로퍼티를 추가합니다.
   */
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  /**
   * `user` 객체 (예: `session` 콜백의 `user` 파라미터)에 `id` 프로퍼티를 추가합니다.
   */
  interface User extends DefaultUser {
    id: string;
  }
}
