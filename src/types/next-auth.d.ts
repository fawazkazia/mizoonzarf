import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    /** Set when the account's password was reset after this token was issued — session() then drops session.user so the request is treated as unauthenticated. */
    invalidated?: boolean;
  }
}
