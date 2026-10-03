/**
 * Deep linking configuration for Expo Router.
 * Maps web URLs and custom schemes to in-app screens.
 */
import { LinkingOptions } from '@react-navigation/native';
import { LINKING_SCHEMES } from './routes';

export const linkingConfig: LinkingOptions<any> = {
  prefixes: [LINKING_SCHEMES.APP, LINKING_SCHEMES.WEB],
  config: {
    screens: {
      '(tabs)': {
        screens: {
          index: '',
          explore: 'explore',
          chat: 'chat',
          analytics: 'analytics',
          profile: 'profile',
        },
      },
      paper: {
        path: 'paper/:id',
        parse: { id: (id: string) => id },
      },
      // Future
      // search: 'search',
      // topic: 'topic/:topicId',
      // author: 'author/:authorId',
    },
  },
};
