import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { signInSchema } from "@/lib/validations/auth";
import { encryptToken } from "@/lib/crypto";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...authConfig.providers,
    Credentials({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = signInSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
          },
        });

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  events: {
    /**
     * Google hands back tokens on the account object. Mirror them onto the
     * User row (encrypted) so the Calendar layer has a single place to read
     * from regardless of which provider produced them.
     */
    async linkAccount({ user, account }) {
      if (user.id) await persistGoogleTokens(user.id, account);
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.id) {
        await persistGoogleTokens(user.id, account);
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.userId = user.id;
      }

      if (trigger === "update" && session && typeof session === "object") {
        const patch = session as { name?: string; image?: string };
        if (patch.name) token.name = patch.name;
        if (patch.image) token.picture = patch.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (token.userId && session.user) {
        session.user.id = token.userId;
      }
      return session;
    },
  },
});

type AccountLike = {
  provider?: string;
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: number | null;
} | null;

async function persistGoogleTokens(userId: string, account: AccountLike) {
  if (!account || account.provider !== "google" || !account.access_token) {
    return;
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: encryptToken(account.access_token),
        // Google only returns a refresh_token on first consent; never overwrite
        // a stored one with null on subsequent sign-ins.
        ...(account.refresh_token
          ? { googleRefreshToken: encryptToken(account.refresh_token) }
          : {}),
        googleTokenExpiry: account.expires_at
          ? new Date(account.expires_at * 1000)
          : null,
        // A fresh consent clears any previous invalid_grant state.
        googleTokenInvalidAt: null,
      },
    });
  } catch {
    // Sign-in must succeed even if the calendar tokens cannot be stored; the
    // settings page will show the connection as missing and offer a reconnect.
  }
}
