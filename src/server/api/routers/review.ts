import type { ReviewRating } from "@/@types";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { reviews, reviewVotes } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, avg, count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

export const zodRating: z.ZodType<ReviewRating> = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

// Define the review input schema
const reviewInputSchema = z.object({
  gameId: z.number(),
  rating: zodRating,
  content: z.string().optional(),
  hasSpoilers: z.boolean().default(false),
});

// Define the review vote schema
const reviewVoteSchema = z.object({
  reviewId: z.number(),
  voteType: z.enum(["like", "dislike"]),
});

export const reviewRouter = createTRPCRouter({
  // Create or update a review
  upsertReview: protectedProcedure
    .input(reviewInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if the user has already reviewed this game
      const existingReview = await db.query.reviews.findFirst({
        where: and(
          eq(reviews.userId, userId),
          eq(reviews.gameId, input.gameId),
        ),
      });

      if (existingReview) {
        // Update existing review
        return await db
          .update(reviews)
          .set({
            rating: input.rating,
            content: input.content,
            hasSpoilers: input.hasSpoilers,
            updatedAt: new Date(),
          })
          .where(
            and(eq(reviews.userId, userId), eq(reviews.gameId, input.gameId)),
          )
          .returning();
      } else {
        // Create new review
        return await db
          .insert(reviews)
          .values({
            userId,
            gameId: input.gameId,
            rating: input.rating,
            content: input.content,
            hasSpoilers: input.hasSpoilers,
          })
          .returning();
      }
    }),

  // Get reviews for a game
  getGameReviews: publicProcedure
    .input(
      z.object({
        gameId: z.number(),
        limit: z.number().min(1).max(100).default(10),
        cursor: z.number().optional(), // for pagination
        showSpoilers: z.boolean().default(false),
      }),
    )
    .query(async ({ input }) => {
      const { gameId, limit, cursor, showSpoilers } = input;

      // Get reviews with user information
      const reviewsQuery = db.query.reviews.findMany({
        where: eq(reviews.gameId, gameId),
        limit,
        offset: cursor,
        orderBy: [desc(reviews.createdAt)],
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      const reviewsData = await reviewsQuery;

      // If user doesn't want to see spoilers, filter content
      const processedReviews = reviewsData.map((review) => {
        if (!showSpoilers && review.hasSpoilers) {
          return {
            ...review,
            content: "⚠️ This review contains spoilers. Click to reveal.",
            isSpoilerHidden: true,
          };
        }
        return { ...review, isSpoilerHidden: false };
      });

      // Get the next cursor for pagination
      const nextCursor =
        reviewsData.length === limit
          ? cursor
            ? cursor + limit
            : limit
          : undefined;

      return {
        reviews: processedReviews,
        nextCursor,
      };
    }),

  // Get review statistics for a game
  getGameReviewStats: publicProcedure
    .input(z.object({ gameId: z.number() }))
    .query(async ({ input }) => {
      const { gameId } = input;

      // Get average rating
      const ratingStats = await db
        .select({
          averageRating: avg(reviews.rating),
          totalReviews: count(),
          rating1Count: count(sql`CASE WHEN ${reviews.rating} = 1 THEN 1 END`),
          rating2Count: count(sql`CASE WHEN ${reviews.rating} = 2 THEN 1 END`),
          rating3Count: count(sql`CASE WHEN ${reviews.rating} = 3 THEN 1 END`),
          rating4Count: count(sql`CASE WHEN ${reviews.rating} = 4 THEN 1 END`),
          rating5Count: count(sql`CASE WHEN ${reviews.rating} = 5 THEN 1 END`),
        })
        .from(reviews)
        .where(eq(reviews.gameId, gameId));

      // Calculate rating distribution percentages
      const stats = ratingStats[0];
      if (!stats) {
        return {
          averageRating: 0,
          totalReviews: 0,
          distribution: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
          },
        };
      }
      const totalReviews = stats.totalReviews || 0;

      return {
        averageRating: stats.averageRating ?? 0,
        totalReviews,
        distribution: {
          1: totalReviews > 0 ? (stats.rating1Count / totalReviews) * 100 : 0,
          2: totalReviews > 0 ? (stats.rating2Count / totalReviews) * 100 : 0,
          3: totalReviews > 0 ? (stats.rating3Count / totalReviews) * 100 : 0,
          4: totalReviews > 0 ? (stats.rating4Count / totalReviews) * 100 : 0,
          5: totalReviews > 0 ? (stats.rating5Count / totalReviews) * 100 : 0,
        },
      };
    }),

  // Vote on a review (like/dislike)
  voteOnReview: protectedProcedure
    .input(reviewVoteSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { reviewId, voteType } = input;

      // Check if the review exists
      const review = await db.query.reviews.findFirst({
        where: eq(reviews.id, reviewId),
      });

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      // Check if the user has already voted on this review
      const existingVote = await db.query.reviewVotes.findFirst({
        where: and(
          eq(reviewVotes.userId, userId),
          eq(reviewVotes.reviewId, reviewId),
        ),
      });

      if (existingVote) {
        // Update existing vote
        await db
          .update(reviewVotes)
          .set({
            voteType,
          })
          .where(
            and(
              eq(reviewVotes.userId, userId),
              eq(reviewVotes.reviewId, reviewId),
            ),
          );
      } else {
        // Create new vote
        await db.insert(reviewVotes).values({
          userId,
          reviewId,
          voteType,
        });
      }

      // Update the review's like/dislike counts
      const voteCounts = await db
        .select({
          likes: count(
            sql`CASE WHEN ${reviewVotes.voteType} = 'like' THEN 1 END`,
          ),
          dislikes: count(
            sql`CASE WHEN ${reviewVotes.voteType} = 'dislike' THEN 1 END`,
          ),
        })
        .from(reviewVotes)
        .where(eq(reviewVotes.reviewId, reviewId));

      const voteCount = voteCounts[0];
      if (!voteCount) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update review vote counts",
        });
      }

      // Update the review with new counts
      return await db
        .update(reviews)
        .set({
          likes: voteCount.likes || 0,
          dislikes: voteCount.dislikes || 0,
        })
        .where(eq(reviews.id, reviewId))
        .returning();
    }),

  // Get user's review for a specific game
  getUserReviewForGame: protectedProcedure
    .input(z.object({ gameId: z.number() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { gameId } = input;

      return await db.query.reviews.findFirst({
        where: and(eq(reviews.userId, userId), eq(reviews.gameId, gameId)),
      });
    }),

  // Reveal spoiler content for a specific review
  revealSpoiler: protectedProcedure
    .input(z.object({ reviewId: z.number() }))
    .query(async ({ input }) => {
      const { reviewId } = input;

      const review = await db.query.reviews.findFirst({
        where: eq(reviews.id, reviewId),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      return {
        ...review,
        isSpoilerHidden: false,
      };
    }),
});
