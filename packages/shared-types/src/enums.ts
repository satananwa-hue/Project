export const AccountRole = {
  USER: 'USER',
  CREATOR: 'CREATOR',
  ADMINISTRATOR: 'ADMINISTRATOR',
} as const;
export type AccountRole = (typeof AccountRole)[keyof typeof AccountRole];

export const VenueCategory = {
  BAR: 'BAR',
  CLUB: 'CLUB',
  ROOFTOP: 'ROOFTOP',
  LIVE_MUSIC: 'LIVE_MUSIC',
  LOUNGE: 'LOUNGE',
  OTHER: 'OTHER',
} as const;
export type VenueCategory = (typeof VenueCategory)[keyof typeof VenueCategory];

export const PriceRange = {
  BUDGET: 'BUDGET',
  MODERATE: 'MODERATE',
  UPSCALE: 'UPSCALE',
  LUXURY: 'LUXURY',
} as const;
export type PriceRange = (typeof PriceRange)[keyof typeof PriceRange];

export const SharePlatform = {
  INSTAGRAM: 'INSTAGRAM',
  TIKTOK: 'TIKTOK',
  LINK: 'LINK',
  COPY: 'COPY',
} as const;
export type SharePlatform = (typeof SharePlatform)[keyof typeof SharePlatform];

export const PRICE_RANGE_SYMBOLS: Record<string, string> = {
  BUDGET: '$',
  MODERATE: '$$',
  UPSCALE: '$$$',
  LUXURY: '$$$$',
};
