import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
  }
}

/** next-auth re-exports these types from @auth/core, so augment there too. */
declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string;
  }
}

export {};
