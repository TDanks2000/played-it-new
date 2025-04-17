import { db } from "@/server/db";
import { accounts, users } from "@/server/db/schema";
import { eq, or } from "drizzle-orm";

export async function findUser({
  email,
  username,
}: {
  email?: string;
  username?: string;
}) {
  if (!email && !username) {
    throw new Error("Email or username must be provided");
  }

  const user = await db
    .select()
    .from(users)
    .where(
      or(
        email ? eq(users.email, email) : undefined!,
        username ? eq(users.username, username) : undefined!,
      ),
    );

  return user[0] ?? null;
}

export const getUserById = async (id: string) => {
  const user = await db
    .select({
      role: accounts.role,
    })
    .from(accounts)
    .where(eq(accounts.userId, id))
    .limit(1);

  return user[0];
};
