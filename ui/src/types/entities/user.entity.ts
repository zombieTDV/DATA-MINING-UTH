/**
 * Domain entity: User / Profile.
 */

export type UserRole = 'student' | 'researcher' | 'admin';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'vi' | 'en';
  defaultCategory?: string;
  emailNotifications: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  affiliation?: string;
  role: UserRole;
  avatarUrl?: string;
  preferences?: UserPreferences;
  createdAt: string;
}
