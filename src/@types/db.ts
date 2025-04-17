export type GameStatus = "completed" | "playing" | "want_to_play" | "abandoned";
export type CompletionStatus =
  | "standard"
  | "100_percent"
  | "abandoned"
  | "not_started";

export type ReviewRating = 1 | 2 | 3 | 4 | 5;

// User profile visibility and notification preferences
export type VisibilityType = "public" | "friends" | "private";

export interface UserPreferences {
  favoriteGenres?: string[];
  favoritePlatforms?: string[];
  privacySettings?: {
    profileVisibility: VisibilityType;
    activityVisibility: VisibilityType;
    collectionVisibility: VisibilityType;
  };
  notificationSettings?: {
    emailNotifications: boolean;
    friendActivity: boolean;
    gameReleases: boolean;
  };
}
