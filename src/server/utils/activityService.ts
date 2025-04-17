import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import type { ActivityType } from "../db/schema/userActivities";
import { userActivities } from "../db/schema/userActivities";

/**
 * Service for creating user activity entries
 * This centralizes activity creation logic to ensure consistency
 */
export const activityService = {
  /**
   * Create a new activity entry
   */
  createActivity: async ({
    userId,
    activityType,
    gameId,
    reviewId,
    targetUserId,
    listId,
    metadata = {},
    isPublic = true,
  }: {
    userId: string;
    activityType: ActivityType;
    gameId?: number;
    reviewId?: number;
    targetUserId?: string;
    listId?: number;
    metadata?: Record<string, unknown>;
    isPublic?: boolean;
  }) => {
    // Get user's privacy settings to determine if this activity should be public
    const userQuery = await db
      .select({ preferences: users.preferences })
      .from(users)
      .where(eq(users.id, userId));

    const userPreferences = userQuery[0]?.preferences;
    const activityVisibility =
      userPreferences?.privacySettings?.activityVisibility ?? "public";

    // Override isPublic based on user's privacy settings
    if (activityVisibility === "private") {
      isPublic = false;
    } else if (activityVisibility === "friends") {
      // For "friends" visibility, we still create the activity
      // The feed query will handle filtering based on relationships
      isPublic = false;
    }

    // Create the activity
    const [activity] = await db
      .insert(userActivities)
      .values({
        userId,
        activityType,
        gameId,
        reviewId,
        targetUserId,
        listId,
        metadata,
        isPublic,
      })
      .returning();

    return activity;
  },

  /**
   * Game added to collection
   */
  gameAdded: async ({
    userId,
    gameId,
    status,
    platform,
  }: {
    userId: string;
    gameId: number;
    status: string;
    platform?: string;
  }) => {
    return activityService.createActivity({
      userId,
      activityType: "game_added",
      gameId,
      metadata: {
        status,
        platform,
      },
    });
  },

  /**
   * Game status changed
   */
  statusChanged: async ({
    userId,
    gameId,
    oldStatus,
    newStatus,
  }: {
    userId: string;
    gameId: number;
    oldStatus: string;
    newStatus: string;
  }) => {
    return activityService.createActivity({
      userId,
      activityType: "status_changed",
      gameId,
      metadata: {
        oldStatus,
        newStatus,
      },
    });
  },

  /**
   * Review posted
   */
  reviewPosted: async ({
    userId,
    gameId,
    reviewId,
    rating,
    hasSpoilers,
  }: {
    userId: string;
    gameId: number;
    reviewId: number;
    rating: number;
    hasSpoilers: boolean;
  }) => {
    return activityService.createActivity({
      userId,
      activityType: "review_posted",
      gameId,
      reviewId,
      metadata: {
        rating,
        hasSpoilers,
      },
    });
  },

  /**
   * User followed
   */
  userFollowed: async ({
    followerId,
    followingId,
  }: {
    followerId: string;
    followingId: string;
  }) => {
    return activityService.createActivity({
      userId: followerId,
      activityType: "user_followed",
      targetUserId: followingId,
    });
  },

  /**
   * List created
   */
  listCreated: async ({
    userId,
    listId,
    listName,
    isPublic,
  }: {
    userId: string;
    listId: number;
    listName: string;
    isPublic: boolean;
  }) => {
    return activityService.createActivity({
      userId,
      activityType: "list_created",
      listId,
      metadata: {
        listName,
      },
      isPublic, // Only create public activity if the list itself is public
    });
  },

  /**
   * List updated (games added/removed)
   */
  listUpdated: async ({
    userId,
    listId,
    listName,
    action,
    gameId,
    isPublic,
  }: {
    userId: string;
    listId: number;
    listName: string;
    action: "added" | "removed";
    gameId: number;
    isPublic: boolean;
  }) => {
    return activityService.createActivity({
      userId,
      activityType: "list_updated",
      listId,
      gameId,
      metadata: {
        listName,
        action,
      },
      isPublic, // Only create public activity if the list itself is public
    });
  },
};
