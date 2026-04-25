import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export const registerUser = async (payload: any) => {
  const { name, email, password } = payload;

  // 1. Check if email already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return { error: "Email sudah terdaftar" };
  }

  // 2. Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // 3. Insert user
  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  });

  return { data: "OK" };
};
