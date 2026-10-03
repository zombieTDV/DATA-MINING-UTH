/**
 * Centralized route constants & path builders.
 * Use these constants instead of hardcoded route strings.
 */

export const ROUTES = {
  // Tabs
  HOME: '/',
  EXPLORE: '/explore',
  CHAT: '/chat',
  ANALYTICS: '/analytics',
  PROFILE: '/profile',

  // Stack screens
  PAPER_DETAIL: (id: string) => `/paper/${id}` as const,

  // Future routes
  SEARCH_RESULTS: '/search',
  TOPIC_DETAIL: (topicId: string) => `/topic/${topicId}` as const,
  AUTHOR_PROFILE: (authorId: string) => `/author/${authorId}` as const,
} as const;

/**
 * Tab identifiers (used for tab state).
 */
export const TAB_KEYS = {
  HOME: 'index',
  EXPLORE: 'explore',
  CHAT: 'chat',
  ANALYTICS: 'analytics',
  PROFILE: 'profile',
} as const;

export type TabKey = (typeof TAB_KEYS)[keyof typeof TAB_KEYS];

/**
 * External deep link schemes.
 */
export const LINKING_SCHEMES = {
  APP: 'uthdatamining://',
  WEB: 'https://datamining.uth.edu.vn',
} as const;
