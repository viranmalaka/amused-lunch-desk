import { preferenceRouter } from "~/server/api/routers/preference";
import { menuRouter } from "~/server/api/routers/menu";
import { orderRouter } from "~/server/api/routers/order";
import { userRouter } from "~/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  preference: preferenceRouter,
  menu: menuRouter,
  order: orderRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
