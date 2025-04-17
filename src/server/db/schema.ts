import {
  type CompletionStatus,
  type GameStatus,
  type ReviewRating,
  type UserRole,
} from "@/@types";
import { relations, sql } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

// User preferences type for profile customization
export interface UserPreferences {
  favoriteGenres?: string[];
  favoritePlatforms?: string[];
  privacySettings?: {
    profileVisibility: "public" | "friends" | "private";
    activityVisibility: "public" | "friends" | "private";
    collectionVisibility: "public" | "friends" | "private";
  };
  notificationSettings?: {
    emailNotifications: boolean;
    friendActivity: boolean;
    gameReleases: boolean;
  };
}

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `played-it_${name}`);

export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  username: d.varchar({ length: 255 }).notNull().unique(),
  name: d.varchar({ length: 255 }),
  firstName: d.varchar({ length: 255 }),
  lastName: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  passwordHash: d.varchar({ length: 255 }),
  emailVerified: d
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .default(sql`CURRENT_TIMESTAMP`),
  image: d.varchar({ length: 255 }),
  bio: d.text(),
  preferences: d.json().$type<UserPreferences>(),
  createdAt: d
    .timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  role: d.varchar("role").$type<UserRole>().default("USER").notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const games = createTable(
  "game",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    igdbId: d.integer().notNull(),
    name: d.varchar({ length: 255 }).notNull(),
    coverImage: d.varchar({ length: 255 }),
    releaseDate: d.timestamp({ withTimezone: true }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [
    uniqueIndex("igdb_id_idx").on(t.igdbId),
    index("game_name_idx").on(t.name),
  ],
);

export const userGames = createTable(
  "user_game",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    gameId: d
      .integer()
      .notNull()
      .references(() => games.id),
    status: d.varchar({ length: 20 }).$type<GameStatus>().notNull(),
    completionStatus: d
      .varchar({ length: 20 })
      .$type<CompletionStatus>()
      .notNull()
      .default("not_started"),
    playtime: d.integer(),
    startedAt: d.timestamp({ withTimezone: true }),
    completedAt: d.timestamp({ withTimezone: true }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    uniqueIndex("user_game_unique_idx").on(t.userId, t.gameId),
    index("user_game_user_idx").on(t.userId),
    index("user_game_game_idx").on(t.gameId),
    index("user_game_status_idx").on(t.status),
  ],
);

export const reviews = createTable(
  "review",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    gameId: d
      .integer()
      .notNull()
      .references(() => games.id),
    rating: d.integer().$type<ReviewRating>().notNull(),
    content: d.text(),
    hasSpoilers: d.boolean().default(false).notNull(),
    likes: d.integer().default(0).notNull(),
    dislikes: d.integer().default(0).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    uniqueIndex("user_review_unique_idx").on(t.userId, t.gameId),
    index("review_user_idx").on(t.userId),
    index("review_game_idx").on(t.gameId),
  ],
);

export const reviewVotes = createTable(
  "review_vote",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    reviewId: d
      .integer()
      .notNull()
      .references(() => reviews.id),
    voteType: d.varchar({ length: 10 }).notNull().default("like"), // "like" or "dislike"
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [
    uniqueIndex("user_review_vote_unique_idx").on(t.userId, t.reviewId),
    index("review_vote_user_idx").on(t.userId),
    index("review_vote_review_idx").on(t.reviewId),
  ],
);

export const gameTags = createTable(
  "game_tag",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    gameId: d
      .integer()
      .notNull()
      .references(() => games.id),
    name: d.varchar({ length: 50 }).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [
    index("game_tag_user_idx").on(t.userId),
    index("game_tag_game_idx").on(t.gameId),
    index("game_tag_name_idx").on(t.name),
  ],
);

export const userFollows = createTable(
  "user_follow",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    followerId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    followingId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [
    uniqueIndex("user_follow_unique_idx").on(t.followerId, t.followingId),
    index("user_follow_follower_idx").on(t.followerId),
    index("user_follow_following_idx").on(t.followingId),
  ],
);

export const groups = createTable(
  "group",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 255 }).notNull(),
    description: d.text(),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    uniqueIndex("group_name_idx").on(t.name),
    index("group_created_by_idx").on(t.createdById),
  ],
);

export const groupMembers = createTable(
  "group_member",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    groupId: d
      .integer()
      .notNull()
      .references(() => groups.id),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    isAdmin: d.boolean().default(false).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [
    uniqueIndex("group_member_unique_idx").on(t.groupId, t.userId),
    index("group_member_group_idx").on(t.groupId),
    index("group_member_user_idx").on(t.userId),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  // Replaced by usersRelationsExtended
  accounts: many(accounts),
  userGames: many(userGames),
  reviews: many(reviews),
  reviewVotes: many(reviewVotes),
  gameTags: many(gameTags),
  followers: many(userFollows, { relationName: "followers" }),
  following: many(userFollows, { relationName: "following" }),
  groupsCreated: many(groups, { relationName: "createdGroups" }),
  groupMemberships: many(groupMembers),
}));

// Define the userFollows relations separately to handle the self-referential relationship
export const userFollowsRelations = relations(userFollows, ({ one }) => ({
  follower: one(users, {
    fields: [userFollows.followerId],
    references: [users.id],
  }),
  following: one(users, {
    fields: [userFollows.followingId],
    references: [users.id],
  }),
}));

export const gamesRelations = relations(games, ({ many }) => ({
  // Replaced by gamesRelationsExtended
  userGames: many(userGames),
  reviews: many(reviews),
  gameTags: many(gameTags),
}));

export const userGamesRelations = relations(userGames, ({ one }) => ({
  user: one(users, { fields: [userGames.userId], references: [users.id] }),
  game: one(games, { fields: [userGames.gameId], references: [games.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  game: one(games, { fields: [reviews.gameId], references: [games.id] }),
  votes: many(reviewVotes),
}));

export const reviewVotesRelations = relations(reviewVotes, ({ one }) => ({
  user: one(users, { fields: [reviewVotes.userId], references: [users.id] }),
  review: one(reviews, {
    fields: [reviewVotes.reviewId],
    references: [reviews.id],
  }),
}));

export const gameTagsRelations = relations(gameTags, ({ one }) => ({
  user: one(users, { fields: [gameTags.userId], references: [users.id] }),
  game: one(games, { fields: [gameTags.gameId], references: [games.id] }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [groups.createdById],
    references: [users.id],
  }),
  members: many(groupMembers),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  user: one(users, { fields: [groupMembers.userId], references: [users.id] }),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    role: d.varchar("role").$type<UserRole>().default("USER").notNull(),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

// Custom Lists Feature
export const customLists = createTable(
  "custom_list",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: d.varchar({ length: 255 }).notNull(),
    description: d.text(),
    isPublic: d.boolean().default(false).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("custom_list_user_idx").on(t.userId),
    index("custom_list_name_idx").on(t.name),
  ],
);

export const customListItems = createTable(
  "custom_list_item",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    listId: d
      .integer()
      .notNull()
      .references(() => customLists.id, { onDelete: "cascade" }),
    gameId: d
      .integer()
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    addedAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    notes: d.text(), // Optional notes for the game within this list
  }),
  (t) => [
    uniqueIndex("custom_list_item_unique_idx").on(t.listId, t.gameId),
    index("custom_list_item_list_idx").on(t.listId),
    index("custom_list_item_game_idx").on(t.gameId),
  ],
);

export const customListCollaborators = createTable(
  "custom_list_collaborator",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    listId: d
      .integer()
      .notNull()
      .references(() => customLists.id, { onDelete: "cascade" }),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    canEdit: d.boolean().default(false).notNull(), // Permission level
    addedAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [
    uniqueIndex("custom_list_collaborator_unique_idx").on(t.listId, t.userId),
    index("custom_list_collaborator_list_idx").on(t.listId),
    index("custom_list_collaborator_user_idx").on(t.userId),
  ],
);

// Relations for Custom Lists
export const customListsRelations = relations(customLists, ({ one, many }) => ({
  user: one(users, { fields: [customLists.userId], references: [users.id] }),
  items: many(customListItems),
  collaborators: many(customListCollaborators),
}));

export const customListItemsRelations = relations(
  customListItems,
  ({ one }) => ({
    list: one(customLists, {
      fields: [customListItems.listId],
      references: [customLists.id],
    }),
    game: one(games, {
      fields: [customListItems.gameId],
      references: [games.id],
    }),
  }),
);

export const customListCollaboratorsRelations = relations(
  customListCollaborators,
  ({ one }) => ({
    list: one(customLists, {
      fields: [customListCollaborators.listId],
      references: [customLists.id],
    }),
    user: one(users, {
      fields: [customListCollaborators.userId],
      references: [users.id],
    }),
  }),
);

// Add relations to User
export const usersRelationsExtended = relations(users, ({ many }) => ({
  accounts: many(accounts),
  userGames: many(userGames),
  reviews: many(reviews),
  reviewVotes: many(reviewVotes),
  gameTags: many(gameTags),
  followers: many(userFollows, { relationName: "followers" }),
  following: many(userFollows, { relationName: "following" }),
  groupsCreated: many(groups, { relationName: "createdGroups" }),
  groupMemberships: many(groupMembers),
  customLists: many(customLists), // Added relation
  collaboratingLists: many(customListCollaborators), // Added relation
}));

// Add relation to Game
export const gamesRelationsExtended = relations(games, ({ many }) => ({
  userGames: many(userGames),
  reviews: many(reviews),
  gameTags: many(gameTags),
  customListItems: many(customListItems), // Added relation
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);
