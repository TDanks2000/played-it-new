import type { UserPreferences } from "@/@types/db";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { userFollows, users } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, ne } from "drizzle-orm";
import { z } from "zod";

// Define the privacy settings schema
const privacySettingsSchema = z.object({
  profileVisibility: z.enum(["public", "friends", "private"]).default("public"),
  activityVisibility: z
    .enum(["public", "friends", "private"])
    .default("public"),
  collectionVisibility: z
    .enum(["public", "friends", "private"])
    .default("public"),
});

// Define the notification settings schema
const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  friendActivity: z.boolean().default(true),
  gameReleases: z.boolean().default(true),
});

// Define the user preferences schema
const userPreferencesSchema = z.object({
  favoriteGenres: z.array(z.string()).optional(),
  favoritePlatforms: z.array(z.string()).optional(),
  privacySettings: privacySettingsSchema.optional(),
  notificationSettings: notificationSettingsSchema.optional(),
});

// Define the profile update schema
const profileUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  bio: z.string().optional(),
  preferences: userPreferencesSchema.optional(),
});

export const userRouter = createTRPCRouter({
  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  }),

  // Get user profile by ID (respecting privacy settings)
  getProfileById: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, input.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Check privacy settings
      const privacySettings = user.preferences?.privacySettings;
      const profileVisibility = privacySettings?.profileVisibility ?? "public";

      // If profile is private, only return basic info
      if (
        profileVisibility === "private" &&
        ctx.session?.user?.id !== user.id
      ) {
        return {
          id: user.id,
          name: user.name,
          image: user.image,
          isPrivate: true,
        };
      }

      // If profile is friends-only, check if the current user is following
      if (
        profileVisibility === "friends" &&
        ctx.session?.user?.id !== user.id
      ) {
        const isFollowing = await db.query.userFollows.findFirst({
          where: and(
            eq(userFollows.followerId, ctx.session?.user?.id ?? ""),
            eq(userFollows.followingId, user.id),
          ),
        });

        if (!isFollowing) {
          return {
            id: user.id,
            name: user.name,
            image: user.image,
            isFriendsOnly: true,
          };
        }
      }

      // Return full profile for public profiles or the user themselves
      return user;
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(profileUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get current user data to merge with updates
      const currentUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!currentUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Merge existing preferences with updates
      const updatedPreferences: UserPreferences = {
        ...currentUser.preferences,
        ...input.preferences,
        // Merge nested objects if they exist
        privacySettings:
          input.preferences?.privacySettings ||
          currentUser.preferences?.privacySettings
            ? {
                profileVisibility:
                  input.preferences?.privacySettings?.profileVisibility ??
                  currentUser.preferences?.privacySettings?.profileVisibility ??
                  "public",
                activityVisibility:
                  input.preferences?.privacySettings?.activityVisibility ??
                  currentUser.preferences?.privacySettings
                    ?.activityVisibility ??
                  "public",
                collectionVisibility:
                  input.preferences?.privacySettings?.collectionVisibility ??
                  currentUser.preferences?.privacySettings
                    ?.collectionVisibility ??
                  "public",
              }
            : undefined,
        notificationSettings:
          input.preferences?.notificationSettings ||
          currentUser.preferences?.notificationSettings
            ? {
                emailNotifications:
                  input.preferences?.notificationSettings?.emailNotifications ??
                  currentUser.preferences?.notificationSettings
                    ?.emailNotifications ??
                  true,
                friendActivity:
                  input.preferences?.notificationSettings?.friendActivity ??
                  currentUser.preferences?.notificationSettings
                    ?.friendActivity ??
                  true,
                gameReleases:
                  input.preferences?.notificationSettings?.gameReleases ??
                  currentUser.preferences?.notificationSettings?.gameReleases ??
                  true,
              }
            : undefined,
      };

      // Update the user profile
      const updatedUser = await db
        .update(users)
        .set({
          name: input.name ?? currentUser.name,
          bio: input.bio ?? currentUser.bio,
          preferences: updatedPreferences,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      return updatedUser[0];
    }),

  // Follow a user
  followUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const followerId = ctx.session.user.id;
      const followingId = input.userId;

      // Check if users exist
      const followingUser = await db.query.users.findFirst({
        where: eq(users.id, followingId),
      });

      if (!followingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User to follow not found",
        });
      }

      // Check if already following
      const existingFollow = await db.query.userFollows.findFirst({
        where: and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.followingId, followingId),
        ),
      });

      if (existingFollow) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Already following this user",
        });
      }

      // Create follow relationship
      const follow = await db
        .insert(userFollows)
        .values({
          followerId,
          followingId,
        })
        .returning();

      return follow[0];
    }),

  // Unfollow a user
  unfollowUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const followerId = ctx.session.user.id;
      const followingId = input.userId;

      // Delete the follow relationship
      const result = await db
        .delete(userFollows)
        .where(
          and(
            eq(userFollows.followerId, followerId),
            eq(userFollows.followingId, followingId),
          ),
        )
        .returning();

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Follow relationship not found",
        });
      }

      return result[0];
    }),

  // Get followers of a user
  getFollowers: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, input.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Check privacy settings if not the user themselves
      if (ctx.session?.user?.id !== user.id) {
        const privacySettings = user.preferences?.privacySettings;
        const profileVisibility =
          privacySettings?.profileVisibility ?? "public";

        if (profileVisibility === "private") {
          return [];
        }

        if (profileVisibility === "friends") {
          const isFollowing = await db.query.userFollows.findFirst({
            where: and(
              eq(userFollows.followerId, ctx.session?.user?.id ?? ""),
              eq(userFollows.followingId, user.id),
            ),
          });

          if (!isFollowing) {
            return [];
          }
        }
      }

      // Get followers with user details
      const followers = await db.query.userFollows.findMany({
        where: eq(userFollows.followingId, input.userId),
        with: {
          follower: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: [desc(userFollows.createdAt)],
      });

      return followers.map((follow) => follow.follower);
    }),

  // Get users that a user is following
  getFollowing: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, input.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Check privacy settings if not the user themselves
      if (ctx.session?.user?.id !== user.id) {
        const privacySettings = user.preferences?.privacySettings;
        const profileVisibility =
          privacySettings?.profileVisibility ?? "public";

        if (profileVisibility === "private") {
          return [];
        }

        if (profileVisibility === "friends") {
          const isFollowing = await db.query.userFollows.findFirst({
            where: and(
              eq(userFollows.followerId, ctx.session?.user?.id ?? ""),
              eq(userFollows.followingId, user.id),
            ),
          });

          if (!isFollowing) {
            return [];
          }
        }
      }

      // Get following with user details
      const following = await db.query.userFollows.findMany({
        where: eq(userFollows.followerId, input.userId),
        with: {
          following: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: [desc(userFollows.createdAt)],
      });

      return following.map((follow) => follow.following);
    }),

  // Check if current user is following another user
  isFollowing: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const followerId = ctx.session.user.id;
      const followingId = input.userId;

      const follow = await db.query.userFollows.findFirst({
        where: and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.followingId, followingId),
        ),
      });

      return !!follow;
    }),

  // Get user suggestions (users not currently followed)
  getUserSuggestions: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get IDs of users already following
    const following = await db.query.userFollows.findMany({
      where: eq(userFollows.followerId, userId),
      columns: {
        followingId: true,
      },
    });

    const followingIds = following.map((f) => f.followingId);
    // Add current user ID to exclude from suggestions
    followingIds.push(userId);

    // Get users not currently followed
    const suggestions = await db.query.users.findMany({
      where: ne(users.id, userId),
      columns: {
        id: true,
        name: true,
        image: true,
        bio: true,
      },
      limit: 10,
    });

    return suggestions.filter((user) => !followingIds.includes(user.id));
  }),
});
