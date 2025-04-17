import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { activityRouter } from "./routers/activity"; // Added activity router import
import { customListRouter } from "./routers/customList"; // Added import
import { reviewRouter } from "./routers/review"; // Added review router import
import { igdbRouter } from "./routers/routers/igdb";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  igdb: igdbRouter,
  customList: customListRouter, // Added custom list router
  review: reviewRouter, // Added review router
  activity: activityRouter, // Added activity router
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
