import { relations, sql } from "drizzle-orm";
import { index } from "drizzle-orm/pg-core";
import { createTable, customLists, games, reviews, users } from "../schema";

// Activity types
export type ActivityType =
  | "game_added"
  | "status_changed"
  | "review_posted"
  | "user_followed"
  | "list_created"
  | "list_updated";

// User activities table to track all user actions for the activity feed
export const userActivities = createTable(
  "user_activity",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activityType: d.varchar({ length: 50 }).$type<ActivityType>().notNull(),
    // Related entity IDs - only one of these will be populated based on activity type
    gameId: d.integer().references(() => games.id, { onDelete: "cascade" }),
    reviewId: d.integer().references(() => reviews.id, { onDelete: "cascade" }),
    targetUserId: d
      .varchar({ length: 255 })
      .references(() => users.id, { onDelete: "cascade" }),
    listId: d
      .integer()
      .references(() => customLists.id, { onDelete: "cascade" }),
    // Additional data stored as JSON
    metadata: d.json(), // Can store things like previous/new status, rating, etc.
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    isPublic: d.boolean().default(true).notNull(), // Whether this activity should be visible in public feeds
  }),
  (t) => [
    index("user_activity_user_idx").on(t.userId),
    index("user_activity_type_idx").on(t.activityType),
    index("user_activity_game_idx").on(t.gameId),
    index("user_activity_created_at_idx").on(t.createdAt),
  ],
);

// Relations for user activities
export const userActivitiesRelations = relations(userActivities, ({ one }) => ({
  user: one(users, {
    fields: [userActivities.userId],
    references: [users.id],
  }),
  game: one(games, {
    fields: [userActivities.gameId],
    references: [games.id],
  }),
  targetUser: one(users, {
    fields: [userActivities.targetUserId],
    references: [users.id],
    relationName: "activityTargetUser",
  }),
  list: one(customLists, {
    fields: [userActivities.listId],
    references: [customLists.id],
  }),
}));

// Add to user relations
export const extendUserRelationsWithActivities = relations(
  users,
  ({ many }) => ({
    activities: many(userActivities),
    targetedActivities: many(userActivities, {
      relationName: "activityTargetUser",
    }),
  }),
);
