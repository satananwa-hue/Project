export const UserRole = {
  PUBLIC: "PUBLIC",
  REVIEWER: "REVIEWER",
  ADMIN: "ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const RatingDimension = {
  ATMOSPHERE: "ATMOSPHERE",
  MUSIC: "MUSIC",
  DRINKS: "DRINKS",
  VALUE: "VALUE",
  CROWD: "CROWD",
  SERVICE: "SERVICE",
  CLEANLINESS: "CLEANLINESS",
} as const;
export type RatingDimension = (typeof RatingDimension)[keyof typeof RatingDimension];

export const REPUTATION_LEVELS = [
  "Explorer",
  "Regular",
  "Night Owl",
  "VIP Reviewer",
  "Elite Reviewer",
] as const;
export type ReputationLevelName = (typeof REPUTATION_LEVELS)[number];
