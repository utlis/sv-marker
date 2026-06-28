import express from "express";
import cors from "cors";
import * as trpcExpress from "@trpc/server/adapters/express";
import { createContext } from "./trpc.js";
import { appRouter } from "./_app.js";

export type AppRouter = typeof appRouter;

const app = express();

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    middleware: cors({ origin: process.env.WEB_ORIGIN }),
    router: appRouter,
    createContext,
  }),
);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
