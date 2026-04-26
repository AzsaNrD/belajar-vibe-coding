import { Elysia, t } from "elysia";
import { registerUser, loginUser } from "../services/users-service";

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
  });
