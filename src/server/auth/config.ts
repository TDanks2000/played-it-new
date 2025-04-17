import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import { type DefaultJWT } from "next-auth/jwt";
import { type Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";

import type { UserRole } from "@/@types";
import { LoginSchema } from "@/models/forms";
import { db } from "@/server/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/server/db/schema";
import { ZodError } from "zod";
import { comparePassword } from "./utils/password";
import { findUser, getUserById } from "./utils/user";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: UserRole;
  }
}

const providers: Provider[] = [
  DiscordProvider,
  GoogleProvider,
  Credentials({
    credentials: {
      email: {},
      password: {},
      firstName: {},
      lastName: {},
      username: {},
    },
    authorize: async (credentials) => {
      try {
        const parsed = await LoginSchema.parseAsync(credentials);
        const { email, password } = parsed;

        const user = await findUser({ email });
        console.log({ user });

        if (!user) {
          throw new Error("Invalid credentials.");
        }

        if (!user.passwordHash) {
          throw new Error("User does not have a password");
        }

        const isValidPassword = await comparePassword(
          password,
          user.passwordHash,
        );

        if (!isValidPassword) {
          throw new Error("Invalid credentials.");
        }

        return user;
      } catch (error) {
        if (error instanceof ZodError) return null;
        console.log("Error in authorize callback:", error);
        console.error(error);
        return null;
      }
    },
  }),
];

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token }) {
      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);
      if (!existingUser) return token;

      token.role = existingUser.role;

      return token;
    },
    session: ({ session, token }) => {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
