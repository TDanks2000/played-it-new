import { type RegisterSchema } from "@/models/forms";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import type { z } from "zod";
import { hashPassword } from "./password";

export const createUser = async (
  credentials: z.infer<typeof RegisterSchema>,
) => {
  try {
    const { email, password, ...rest } = credentials;

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Insert the new user into the database and return the inserted user
    const insertedUsers = await db
      .insert(users)
      .values({
        email: email,
        passwordHash: hashedPassword,
        ...rest,
      })
      .returning();

    const newUser = insertedUsers[0];
    if (!newUser) {
      throw new Error("Failed to create user");
    }

    return {
      error: null,
      ok: true,
      data: newUser, // Return the inserted user object
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
      ok: false,
    };
  }
};
