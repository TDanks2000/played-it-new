import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import igdb from "@/server/utils/api/igdb";
import { z } from "zod";

export const igdbRouter = createTRPCRouter({
  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().default(20),
        offset: z.number().default(0)
      }),
    )
    .query(async ({ input }) => {
      const { query, limit, offset } = input;
      const res = await igdb.search(query, limit, offset);

      return res;
    }),
  info: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { id } = input;
      const res = await igdb.info(id);

      return res;
    }),
  top_rated: publicProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0)
      })
    )
    .query(async ({ input }) => {
      const { limit, offset } = input;
      const res = await igdb.topRated(limit, offset);

      return res;
    }),
  new_releases: publicProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0)
      })
    )
    .query(async ({ input }) => {
      const { limit, offset } = input;
      const res = await igdb.newReleases(limit, offset);

      return res;
    }),
  most_anticipated: publicProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0)
      })
    )
    .query(async ({ input }) => {
      const { limit, offset } = input;
      const res = await igdb.mostAnticipated(limit, offset);

      return res;
    }),
  by_genre: publicProcedure
    .input(
      z.object({
        genre: z.string(),
        limit: z.number().default(20),
        offset: z.number().default(0)
      })
    )
    .query(async ({ input }) => {
      const { genre, limit, offset } = input;
      const res = await igdb.byGenre(genre, limit, offset);

      return res;
    }),
});
