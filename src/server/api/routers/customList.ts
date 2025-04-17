import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";
import {
  customListCollaborators,
  customListItems,
  customLists,
  games,
  users,
} from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

export const customListRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        isPublic: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const newList = await db
        .insert(customLists)
        .values({
          userId,
          name: input.name,
          description: input.description,
          isPublic: input.isPublic,
        })
        .returning();
      return newList[0];
    }),

  getMyLists: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return db.query.customLists.findMany({
      where: eq(customLists.userId, userId),
      orderBy: [desc(customLists.createdAt)],
      with: {
        user: { columns: { name: true, image: true } },
        items: { columns: { id: true } },
        collaborators: { columns: { userId: true } },
      },
    });
  }),

  getCollaboratingLists: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return db.query.customListCollaborators
      .findMany({
        where: eq(customListCollaborators.userId, userId),
        with: {
          list: {
            with: {
              user: { columns: { name: true, image: true } },
              items: { columns: { id: true } },
              collaborators: { columns: { userId: true } },
            },
          },
        },
      })
      .then((collabs) => {
        return collabs
          .map((c) => c.list)
          .filter((list) => list !== null && list !== undefined);
      });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const list = await db.query.customLists.findFirst({
        where: eq(customLists.id, input.id),
        with: {
          user: { columns: { id: true, name: true, image: true } },
          items: {
            with: {
              game: {
                columns: {
                  id: true,
                  name: true,
                  coverImage: true,
                  igdbId: true,
                },
              },
            },
            orderBy: [desc(customListItems.addedAt)],
          },
          collaborators: {
            with: {
              user: { columns: { id: true, name: true, image: true } },
            },
          },
        },
      });

      if (!list) {
        throw new TRPCError({ code: "NOT_FOUND", message: "List not found." });
      }

      if (!list.isPublic) {
        const userId = ctx.session?.user?.id;
        if (!userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to view this list.",
          });
        }

        const isOwner = list.userId === userId;
        const isCollaborator = list.collaborators.some(
          (c) => c.userId === userId,
        );

        if (!isOwner && !isCollaborator) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to view this list.",
          });
        }
      }

      return list;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional().nullable(),
        isPublic: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const list = await db.query.customLists.findFirst({
        where: eq(customLists.id, input.id),
        columns: { userId: true },
        with: { collaborators: { columns: { userId: true, canEdit: true } } },
      });

      if (!list) {
        throw new TRPCError({ code: "NOT_FOUND", message: "List not found." });
      }

      const isOwner = list.userId === userId;
      const canEdit = list.collaborators.some(
        (c) => c.userId === userId && c.canEdit,
      );

      if (!isOwner && !canEdit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to edit this list.",
        });
      }

      const { id, ...updateData } = input;
      if (Object.keys(updateData).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No update data provided.",
        });
      }

      const updatedList = await db
        .update(customLists)
        .set(updateData)
        .where(eq(customLists.id, id))
        .returning();

      return updatedList[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const list = await db.query.customLists.findFirst({
        where: and(
          eq(customLists.id, input.id),
          eq(customLists.userId, userId),
        ),
        columns: { id: true },
      });

      if (!list) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "List not found or you do not have permission to delete it.",
        });
      }

      await db.delete(customLists).where(eq(customLists.id, input.id));
      return { success: true };
    }),

  addItem: protectedProcedure
    .input(
      z.object({
        listId: z.number(),
        gameId: z.number(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const list = await db.query.customLists.findFirst({
        where: eq(customLists.id, input.listId),
        columns: { userId: true },
        with: { collaborators: { columns: { userId: true, canEdit: true } } },
      });

      if (!list) {
        throw new TRPCError({ code: "NOT_FOUND", message: "List not found." });
      }

      const isOwner = list.userId === userId;
      const canEdit = list.collaborators.some(
        (c) => c.userId === userId && c.canEdit,
      );

      if (!isOwner && !canEdit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to add items to this list.",
        });
      }

      const gameExists = await db.query.games.findFirst({
        where: eq(games.id, input.gameId),
        columns: { id: true },
      });
      if (!gameExists) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Game not found." });
      }

      const existingItem = await db.query.customListItems.findFirst({
        where: and(
          eq(customListItems.listId, input.listId),
          eq(customListItems.gameId, input.gameId),
        ),
        columns: { id: true },
      });
      if (existingItem) {
        return existingItem;
      }

      const newItem = await db
        .insert(customListItems)
        .values({
          listId: input.listId,
          gameId: input.gameId,
          notes: input.notes,
        })
        .returning();

      return newItem[0];
    }),

  removeItem: protectedProcedure
    .input(
      z.object({
        listId: z.number(),
        gameId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const list = await db.query.customLists.findFirst({
        where: eq(customLists.id, input.listId),
        columns: { userId: true },
        with: { collaborators: { columns: { userId: true, canEdit: true } } },
      });

      if (!list) {
        throw new TRPCError({ code: "NOT_FOUND", message: "List not found." });
      }

      const isOwner = list.userId === userId;
      const canEdit = list.collaborators.some(
        (c) => c.userId === userId && c.canEdit,
      );

      if (!isOwner && !canEdit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to remove items from this list.",
        });
      }

      const deletedItem = await db
        .delete(customListItems)
        .where(
          and(
            eq(customListItems.listId, input.listId),
            eq(customListItems.gameId, input.gameId),
          ),
        )
        .returning({ id: customListItems.id });

      if (deletedItem.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item not found in this list.",
        });
      }

      return { success: true };
    }),

  addCollaborator: protectedProcedure
    .input(
      z.object({
        listId: z.number(),
        collaboratorUserId: z.string(),
        canEdit: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ownerUserId = ctx.session.user.id;

      const list = await db.query.customLists.findFirst({
        where: and(
          eq(customLists.id, input.listId),
          eq(customLists.userId, ownerUserId),
        ),
        columns: { id: true },
      });
      if (!list) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "List not found or you do not own this list.",
        });
      }

      const collaboratorUser = await db.query.users.findFirst({
        where: eq(users.id, input.collaboratorUserId),
        columns: { id: true },
      });
      if (!collaboratorUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collaborator user not found.",
        });
      }

      if (ownerUserId === input.collaboratorUserId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot add yourself as a collaborator.",
        });
      }

      const existingCollaborator =
        await db.query.customListCollaborators.findFirst({
          where: and(
            eq(customListCollaborators.listId, input.listId),
            eq(customListCollaborators.userId, input.collaboratorUserId),
          ),
          columns: { id: true },
        });
      if (existingCollaborator) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User is already a collaborator on this list.",
        });
      }

      const newCollaborator = await db
        .insert(customListCollaborators)
        .values({
          listId: input.listId,
          userId: input.collaboratorUserId,
          canEdit: input.canEdit,
        })
        .returning();

      return newCollaborator[0];
    }),

  removeCollaborator: protectedProcedure
    .input(
      z.object({
        listId: z.number(),
        collaboratorUserId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ownerUserId = ctx.session.user.id;

      const list = await db.query.customLists.findFirst({
        where: and(
          eq(customLists.id, input.listId),
          eq(customLists.userId, ownerUserId),
        ),
        columns: { id: true },
      });
      if (!list) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "List not found or you do not own this list.",
        });
      }

      const deletedCollaborator = await db
        .delete(customListCollaborators)
        .where(
          and(
            eq(customListCollaborators.listId, input.listId),
            eq(customListCollaborators.userId, input.collaboratorUserId),
          ),
        )
        .returning({ id: customListCollaborators.id });

      if (deletedCollaborator.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collaborator not found on this list.",
        });
      }

      return { success: true };
    }),

  updateCollaborator: protectedProcedure
    .input(
      z.object({
        listId: z.number(),
        collaboratorUserId: z.string(),
        canEdit: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ownerUserId = ctx.session.user.id;

      const list = await db.query.customLists.findFirst({
        where: and(
          eq(customLists.id, input.listId),
          eq(customLists.userId, ownerUserId),
        ),
        columns: { id: true },
      });
      if (!list) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "List not found or you do not own this list.",
        });
      }

      const updatedCollaborator = await db
        .update(customListCollaborators)
        .set({ canEdit: input.canEdit })
        .where(
          and(
            eq(customListCollaborators.listId, input.listId),
            eq(customListCollaborators.userId, input.collaboratorUserId),
          ),
        )
        .returning();

      if (updatedCollaborator.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collaborator not found on this list.",
        });
      }

      return updatedCollaborator[0];
    }),
});
