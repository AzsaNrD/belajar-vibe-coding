import { Elysia, t } from "elysia";
import { registerUser, loginUser, getCurrentUser, logoutUser } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .post("/", async ({ body, set }) => {
    const result = await registerUser(body);

    if (result.error) {
      set.status = 400;
      return { error: result.error };
    }

    return result;
  }, {
    body: t.Object({
      name: t.String(),
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
  .get("/current", async ({ headers, set }) => {
    const token = headers.authorization?.split(" ")[1];
    const result = await getCurrentUser(token);

    if (result.error) {
      set.status = 401;
      return { error: result.error };
    }

    return result;
  })
  .get("/logout", async ({ headers, set }) => {
    const token = headers.authorization?.split(" ")[1];
    const result = await logoutUser(token);

    if (result.error) {
      set.status = 401;
      return { error: result.error };
    }

    return result;
  });
