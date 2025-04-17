"use server";

import type { LoginFormType, RegisterFormType } from "@/models/forms";
import { signIn } from "@/server/auth";
import { createUser } from "@/server/auth/utils/createUser";

export const loginWithCreds = async (values: LoginFormType) =>
  await signIn("credentials", {
    email: values.email,
    password: values.password,
    redirectTo: "/",
  });

export const registerWithCreds = async (values: RegisterFormType) =>
  await createUser(values);
