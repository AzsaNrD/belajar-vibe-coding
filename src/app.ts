import { Elysia } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";
import { usersRoute } from "./routes/users-route";

export const app = new Elysia()
  .get("/", () => "Hello World from Elysia!")
  .get("/users", async () => {
    try {
      const allUsers = await db.select().from(users);
      return allUsers;
    } catch (error) {
      console.error(error);
      return { error: "Failed to fetch users. Make sure your database is running and credentials in .env are correct." };
    }
  })
  .onError(({ code, error, set }) => {
    if (code === 'VALIDATION') {
      set.status = 400;
      return error;
    }
  })
  .use(usersRoute);
