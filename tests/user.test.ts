import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/app";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";
import { eq } from "drizzle-orm";

describe("User API", () => {
  beforeEach(async () => {
    // Clear data before each test for consistency
    await db.delete(sessions);
    await db.delete(users);
  });

  describe("POST /api/users/ (Register)", () => {
    it("should register a new user successfully", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User",
            email: "test@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data).toEqual({ data: "OK" });

      const [user] = await db.select().from(users).where(eq(users.email, "test@example.com"));
      expect(user).toBeDefined();
      expect(user!.name).toBe("Test User");
    });

    it("should fail if email is already registered", async () => {
      // Pre-register user
      await app.handle(
        new Request("http://localhost/api/users/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Existing User",
            email: "test@example.com",
            password: "password123",
          }),
        })
      );

      const response = await app.handle(
        new Request("http://localhost/api/users/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User",
            email: "test@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json() as any;
      expect(data.error).toBe("Email sudah terdaftar");
    });

    it("should fail on validation error (invalid email format)", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User",
            email: "invalid-email",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(400);
    });

    it("should fail on validation error (name too long)", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "a".repeat(256),
            email: "test@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/users/login", () => {
    beforeEach(async () => {
      // Register a user for login tests
      await app.handle(
        new Request("http://localhost/api/users/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Login User",
            email: "login@example.com",
            password: "password123",
          }),
        })
      );
    });

    it("should login successfully with correct credentials", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "login@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.data).toBeDefined(); // Token

      const [session] = await db.select().from(sessions).where(eq(sessions.token, data.data));
      expect(session).toBeDefined();
    });

    it("should fail with incorrect password", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "login@example.com",
            password: "wrongpassword",
          }),
        })
      );

      expect(response.status).toBe(401);
      const data = await response.json() as any;
      expect(data.error).toBe("Email atau password salah");
    });
  });

  describe("GET /api/users/current", () => {
    let token: string;

    beforeEach(async () => {
      await app.handle(
        new Request("http://localhost/api/users/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Current User",
            email: "current@example.com",
            password: "password123",
          }),
        })
      );

      const loginResponse = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "current@example.com",
            password: "password123",
          }),
        })
      );
      const loginData = await loginResponse.json() as any;
      token = loginData.data;
    });

    it("should get current user with valid token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const result = await response.json() as any;
      expect(result.data.email).toBe("current@example.com");
      expect(result.data.name).toBe("Current User");
    });

    it("should fail without token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
        })
      );

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /api/users/logout", () => {
    let token: string;

    beforeEach(async () => {
      await app.handle(
        new Request("http://localhost/api/users/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Logout User",
            email: "logout@example.com",
            password: "password123",
          }),
        })
      );

      const loginResponse = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "logout@example.com",
            password: "password123",
          }),
        })
      );
      const loginData = await loginResponse.json() as any;
      token = loginData.data;
    });

    it("should logout successfully", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const result = await response.json() as any;
      expect(result.data).toBe("OK");

      const [session] = await db.select().from(sessions).where(eq(sessions.token, token));
      expect(session).toBeUndefined();
    });

    it("should fail with invalid token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer invalid-token`,
          },
        })
      );

      expect(response.status).toBe(401);
    });
  });
});
