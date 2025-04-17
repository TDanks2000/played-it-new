import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";

import { RegisterSchema } from "@/models/forms";
import { db } from "@/server/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/server/db/schema";
import { createUser } from "./utils/createUser";
import { comparePassword } from "./utils/password";
import { findUser } from "./utils/user";

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
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    DiscordProvider,
    GoogleProvider,
    Credentials({
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "Email",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Password",
        },
        firstName: {
          label: "First Name",
          type: "text",
          placeholder: "First Name",
        },
        lastName: {
          label: "Last Name",
          type: "text",
          placeholder: "Last Name",
        },
        username: {
          label: "Username",
          type: "text",
          placeholder: "Username",
        },
      },
      authorize: async (credentials) => {
        const parsed = RegisterSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, username, password, firstName, lastName } = parsed.data;

        let user = await findUser({ email, username });

        if (!user) {
          const result = await createUser({
            email,
            password,
            firstName,
            lastName,
            username,
          });
          if (!result.ok || !result.data) return null;
          user = result.data;
        }

        if (!user.passwordHash) return null;

        const isValidPassword = await comparePassword(
          password,
          user.passwordHash,
        );
        if (!isValidPassword) return null;

        return user;
      },
    }),
  ],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
} satisfies NextAuthConfig;
