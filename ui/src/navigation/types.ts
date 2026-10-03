/**
 * Strongly-typed navigation parameters.
 * Import the RootStackParamList type when using useRouter/navigation.
 */
import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabsParamList = {
  index: undefined;
  explore: { category?: string; query?: string } | undefined;
  chat: { sessionId?: string } | undefined;
  analytics: undefined;
  profile: undefined;
};

export type RootStackParamList = {
  '(tabs)': NavigatorScreenParams<TabsParamList>;
  'paper/[id]': { id: string };
  // Future
  // search: { query: string };
  // 'topic/[topicId]': { topicId: string };
  // 'author/[authorId]': { authorId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
