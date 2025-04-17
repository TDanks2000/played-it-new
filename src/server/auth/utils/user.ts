import { db } from "@/server/db";
import { users } from "@/server/db/schema";
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
