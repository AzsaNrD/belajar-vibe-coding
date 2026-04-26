import { Elysia, t } from "elysia";
import { registerUser, loginUser, getCurrentUser, logoutUser } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .derive(({ headers }) => {
    const auth = headers.authorization;
    return {
      token: auth?.startsWith("Bearer ") ? auth.substring(7) : undefined
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
      name: t.String({ maxLength: 255 }),
      email: t.String({ format: "email" }),
      password: t.String(),
    })
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
      email: t.String({ format: "email" }),
      password: t.String(),
    })
  })
  .get("/current", async ({ token, set }) => {
    const result = await getCurrentUser(token);

    if (result.error) {
      set.status = 401;
      return { error: result.error };
    }

    return result;
  })
  .delete("/logout", async ({ token, set }) => {
    const result = await logoutUser(token);

    if (result.error) {
      set.status = 401;
      return { error: result.error };
    }

    return result;
  });
