import { auth } from "@/server/auth";

export const getCurrentUser = async () => {
  const session = await auth();
  console.log({ session });

  if (session?.user.id) return session.user;

  return null;
};

export const getCurrentRole = async () => {
  const session = await auth();
  console.log({ session });

  if (session?.user.role) return session.user.role;

  return null;
};
