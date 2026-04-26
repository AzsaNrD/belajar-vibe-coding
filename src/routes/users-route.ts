import { Elysia, t } from "elysia";
import { registerUser, loginUser, getCurrentUser, logoutUser } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .derive(({ headers: { authorization } }) => {
    return {
      token: authorization?.startsWith("Bearer ") ? authorization.substring(7) : undefined
    };
  })
  .post("/", async ({ body, set }) => {
    const result = await registerUser(body);

    if (result.error) {
      set.status = 400;
      return { error: result.error };
    }

    return result;
  }, {
    body: t.Object({
      name: t.String({ minLength: 1, maxLength: 255, default: "John Doe" }),
      email: t.String({ format: "email", minLength: 1, maxLength: 255, default: "john@example.com" }),
      password: t.String({ minLength: 8, maxLength: 255, default: "password123" }),
    }),
    response: {
      200: t.Object({ 
        data: t.String({ default: "OK" }) 
      }),
      400: t.Object({ 
        error: t.String({ default: "Email sudah terdaftar" }) 
      })
    },
    detail: {
      tags: ['Users'],
      summary: 'Registrasi User Baru'
    }
  })
  .post("/login", async ({ body, set }) => {
    const result = await loginUser(body);

    if (result.error) {
      set.status = 401;
      return { error: result.error };
    }

    return result;
  }, {
    body: t.Object({
      email: t.String({ format: "email", minLength: 1, maxLength: 255, default: "john@example.com" }),
      password: t.String({ minLength: 1, maxLength: 255, default: "password123" }),
    }),
    response: {
      200: t.Object({ 
        data: t.String({ default: "random-session-token-string" }) 
      }),
      401: t.Object({ 
        error: t.String({ default: "Email atau password salah" }) 
      })
    },
    detail: {
      tags: ['Users'],
      summary: 'Login User'
    }
  })
  .get("/current", async ({ token, set }) => {
    const result = await getCurrentUser(token);

    if (result.error) {
      set.status = 401;
      return { error: result.error };
    }

    return {
      data: {
        ...result.data!,
        createdAt: result.data!.createdAt?.toISOString() ?? null
      }
    };
  }, {
    response: {
      200: t.Object({
        data: t.Object({
          id: t.Number({ default: 1 }),
          name: t.String({ default: "John Doe" }),
          email: t.String({ default: "john@example.com" }),
          createdAt: t.Nullable(t.String({ default: "2024-04-26T12:00:00.000Z" }))
        })
      }),
      401: t.Object({ 
        error: t.String({ default: "Unauthorized" }) 
      })
    },
    detail: {
      tags: ['Users'],
      summary: 'Ambil Data User Saat Ini',
      security: [{ bearerAuth: [] }]
    }
  })
  .delete("/logout", async ({ token, set }) => {
    const result = await logoutUser(token);

    if (result.error) {
      set.status = 401;
      return { error: result.error };
    }

    return result;
  }, {
    response: {
      200: t.Object({ 
        data: t.String({ default: "OK" }) 
      }),
      401: t.Object({ 
        error: t.String({ default: "Unauthorized" }) 
      })
    },
    detail: {
      tags: ['Users'],
      summary: 'Logout User',
      security: [{ bearerAuth: [] }]
    }
  });
