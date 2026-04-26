import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

/**
 * Mendaftarkan pengguna baru ke dalam sistem.
 * Fungsi ini akan mengecek apakah email sudah terdaftar,
 * melakukan hashing pada password, dan menyimpan data user ke database.
 * 
 * @param payload - Objek yang berisi name, email, dan password dari user
 * @returns Objek { data: "OK" } jika sukses, atau objek { error: string } jika gagal
 */
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

/**
 * Memverifikasi kredensial pengguna untuk proses login.
 * Fungsi ini mencari user berdasarkan email, memverifikasi kecocokan password,
 * dan men-generate token sesi jika kredensial valid.
 * 
 * @param payload - Objek yang berisi email dan password login
 * @returns Objek { data: token } jika login sukses, atau { error: string } jika gagal
 */
export const loginUser = async (payload: any) => {
  const { email, password } = payload;

  // 1. Find user by email
  const [foundUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!foundUser) {
    return { error: "Email atau password salah" };
  }

  // 2. Verify password
  const isPasswordValid = await bcrypt.compare(password, foundUser.password);

  if (!isPasswordValid) {
    return { error: "Email atau password salah" };
  }

  // 3. Generate token
  const token = crypto.randomUUID();

  // 4. Save session
  await db.insert(sessions).values({
    token,
    userId: foundUser.id,
  });

  return { data: token };
};

/**
 * Mengambil informasi detail profil user yang sedang login saat ini.
 * Fungsi ini memvalidasi token sesi yang diberikan dan mengembalikan data
 * user yang berelasi dengan sesi tersebut.
 * 
 * @param token - String token autentikasi (Bearer token)
 * @returns Objek data profil user jika token valid, atau { error: "Unauthorized" } jika tidak valid
 */
export const getCurrentUser = async (token: string | undefined) => {
  if (!token) {
    return { error: "Unauthorized" };
  }

  // 1. Find session and join with user
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);

  if (result.length === 0) {
    return { error: "Unauthorized" };
  }

  return { data: result[0] };
};

/**
 * Melakukan proses logout pengguna dengan cara menghapus token sesi.
 * Fungsi ini akan mencari sesi berdasarkan token dan menghapusnya dari database
 * sehingga token tersebut tidak dapat digunakan lagi.
 * 
 * @param token - String token autentikasi yang ingin dihapus
 * @returns Objek { data: "OK" } jika berhasil logout, atau { error: "Unauthorized" } jika gagal
 */
export const logoutUser = async (token: string | undefined) => {
  if (!token) {
    return { error: "Unauthorized" };
  }

  // 1. Find session
  const [foundSession] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (!foundSession) {
    return { error: "Unauthorized" };
  }

  // 2. Delete session
  await db.delete(sessions).where(eq(sessions.token, token));

  return { data: "OK" };
};
