import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { db } from "./db";
import { users } from "./db/schema";
import { usersRoute } from "./routes/users-route";

export const app = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: "User Management API Documentation",
        version: "1.0.0",
        description: "Dokumentasi API terpusat untuk aplikasi Belajar Vibe Coding"
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    }
  }))
  .get("/", () => "Hello World from Elysia!")
  .onError(({ code, error, set }) => {
    if (code === 'VALIDATION') {
      set.status = 400;
      return error;
    }
  })
  .use(usersRoute);
