// utils/password.ts

import bcrypt from "bcryptjs";

/**
 * Hashes a password using bcryptjs.
 * @param password - The plain text password to hash.
 * @param saltRounds - The number of salt rounds to use (default is 10).
 * @returns A promise that resolves to the hashed password.
 */
export const hashPassword = async (
  password: string,
  saltRounds = 10,
): Promise<string> => {
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compares a plain text password with a hashed password.
 * @param password - The plain text password to compare.
 * @param hashedPassword - The hashed password to compare against.
 * @returns A promise that resolves to true if the passwords match, false otherwise.
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};
