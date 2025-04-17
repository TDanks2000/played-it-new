import { and, desc, eq, inArray, lt, or } from "drizzle-orm";
import { z } from "zod";
import { userFollows, users } from "../../db/schema";
import { userActivities } from "../../db/schema/userActivities";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const activityRouter = createTRPCRouter({
  // Get activity feed for the current user (their own activities + people they follow)
  getFeed: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.number().optional(), // For pagination
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;
      const userId = ctx.session.user.id;

      // Get IDs of users the current user follows
      const followingQuery = await ctx.db
        .select({ followingId: userFollows.followingId })
        .from(userFollows)
        .where(eq(userFollows.followerId, userId));

      const followingIds = followingQuery.map((row) => row.followingId);

      // Build query for activities
      const query = ctx.db
        .select({
          id: userActivities.id,
          userId: userActivities.userId,
          activityType: userActivities.activityType,
          gameId: userActivities.gameId,
          reviewId: userActivities.reviewId,
          targetUserId: userActivities.targetUserId,
          listId: userActivities.listId,
          metadata: userActivities.metadata,
          createdAt: userActivities.createdAt,
          isPublic: userActivities.isPublic,
        })
        .from(userActivities)
        .where(
          and(
            // Activities from the user or people they follow
            or(
              eq(userActivities.userId, userId),
              inArray(userActivities.userId, followingIds),
            ),
            // Apply cursor for pagination if provided
            cursor ? lt(userActivities.id, cursor) : undefined,
          ),
        )
        .orderBy(desc(userActivities.createdAt))
        .limit(limit + 1); // Get one extra to determine if there are more results

      const activities = await query;

      // Check if there are more results
      const hasMore = activities.length > limit;

      const nextCursor = hasMore ? activities?.[limit - 1]?.id : undefined;

      // Remove the extra activity if there are more results
      const result = hasMore ? activities.slice(0, limit) : activities;

      // Fetch related user data for each activity
      const userIds = [...new Set(result.map((activity) => activity.userId))];
      const usersData = await ctx.db
        .select({
          id: users.id,
          username: users.username,
          image: users.image,
        })
        .from(users)
        .where(inArray(users.id, userIds));

      const usersMap = new Map(usersData.map((user) => [user.id, user]));

      // Enrich activities with user data
      const enrichedActivities = result.map((activity) => ({
        ...activity,
        user: usersMap.get(activity.userId),
      }));

      return {
        activities: enrichedActivities,
        nextCursor,
      };
    }),

  // Get global activity feed (public activities from all users)
  getGlobalFeed: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.number().optional(), // For pagination
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      // Build query for public activities
      const query = ctx.db
        .select({
          id: userActivities.id,
          userId: userActivities.userId,
          activityType: userActivities.activityType,
          gameId: userActivities.gameId,
          reviewId: userActivities.reviewId,
          targetUserId: userActivities.targetUserId,
          listId: userActivities.listId,
          metadata: userActivities.metadata,
          createdAt: userActivities.createdAt,
        })
        .from(userActivities)
        .where(
          and(
            // Only public activities
            eq(userActivities.isPublic, true),
            // Apply cursor for pagination if provided
            cursor ? lt(userActivities.id, cursor) : undefined,
          ),
        )
        .orderBy(desc(userActivities.createdAt))
        .limit(limit + 1); // Get one extra to determine if there are more results

      const activities = await query;

      // Check if there are more results
      const hasMore = activities.length > limit;
      const nextCursor = hasMore ? activities?.[limit - 1]?.id : undefined;

      // Remove the extra activity if there are more results
      const result = hasMore ? activities.slice(0, limit) : activities;

      // Fetch related user data for each activity
      const userIds = [...new Set(result.map((activity) => activity.userId))];
      const usersData = await ctx.db
        .select({
          id: users.id,
          image: users.image,
          username: users.username,
        })
        .from(users)
        .where(inArray(users.id, userIds));

      const usersMap = new Map(usersData.map((user) => [user.id, user]));

      // Enrich activities with user data
      const enrichedActivities = result.map((activity) => ({
        ...activity,
        user: usersMap.get(activity.userId),
      }));

      return {
        activities: enrichedActivities,
        nextCursor,
      };
    }),

  // Get user profile activity feed (public activities from a specific user)
  getUserFeed: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.number().optional(), // For pagination
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userId, limit, cursor } = input;
      const currentUserId = ctx.session?.user?.id;

      // Get user's privacy settings
      const userQuery = await ctx.db
        .select({ preferences: users.preferences })
        .from(users)
        .where(eq(users.id, userId));

      const userPreferences = userQuery[0]?.preferences ?? undefined;
      const activityVisibility =
        userPreferences?.privacySettings?.activityVisibility ?? "public";

      // Check if current user is allowed to see this user's activities
      let canViewActivities = activityVisibility === "public";

      if (activityVisibility === "friends" && currentUserId) {
        // Check if current user follows this user
        const followCheck = await ctx.db
          .select({ id: userFollows.id })
          .from(userFollows)
          .where(
            and(
              eq(userFollows.followerId, currentUserId),
              eq(userFollows.followingId, userId),
            ),
          )
          .limit(1);

        canViewActivities = followCheck.length > 0;
      } else if (activityVisibility === "private") {
        // Only the user themselves can see their activities
        canViewActivities = currentUserId === userId;
      }

      if (!canViewActivities) {
        return {
          activities: [],
          nextCursor: undefined,
        };
      }

      // Build query for user's activities
      const query = ctx.db
        .select({
          id: userActivities.id,
          userId: userActivities.userId,
          activityType: userActivities.activityType,
          gameId: userActivities.gameId,
          reviewId: userActivities.reviewId,
          targetUserId: userActivities.targetUserId,
          listId: userActivities.listId,
          metadata: userActivities.metadata,
          createdAt: userActivities.createdAt,
        })
        .from(userActivities)
        .where(
          and(
            // Only activities from this user
            eq(userActivities.userId, userId),
            // Apply cursor for pagination if provided
            cursor ? lt(userActivities.id, cursor) : undefined,
          ),
        )
        .orderBy(desc(userActivities.createdAt))
        .limit(limit + 1); // Get one extra to determine if there are more results

      const activities = await query;

      // Check if there are more results
      const hasMore = activities.length > limit;
      const nextCursor = hasMore ? activities?.[limit - 1]?.id : undefined;

      // Remove the extra activity if there are more results
      const result = hasMore ? activities.slice(0, limit) : activities;

      // Fetch user data
      const userData = await ctx.db
        .select({
          id: users.id,
          username: users.username,
          image: users.image,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      // Enrich activities with user data
      const enrichedActivities = result.map((activity) => ({
        ...activity,
        user: userData[0],
      }));

      return {
        activities: enrichedActivities,
        nextCursor,
      };
    }),
});
