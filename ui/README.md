# UTH Data Mining — UI (Mockup)

- **Motivation/Background**: Mockup UI for the UTH Data Mining RAG System, intended for visual demonstration before backend integration.
- **Purpose**: Showcase the user experience for searching scientific papers, RAG-based Q&A, and analytics dashboards.
- **Overview Pipeline**: Page → Hooks → Services → API → (Future) Backend. All data flows through a strict layered architecture.
- **Detailed Plan**: §1 Tech Stack; §2 Architecture Layers; §3 Setup; §4 Folder Structure; §5 Scripts; §6 Mockup scope; §7 Tailwind.
- **References**: [Expo](https://docs.expo.dev/), [React Native Paper](https://callstack.github.io/react-native-paper/), [Expo Router](https://docs.expo.dev/router/introduction/), [Zustand](https://github.com/pmndrs/zustand), [NativeWind](https://www.nativewind.dev/).
- **Created**: 2026-10-03T14:30:00+07:00
- **Last Updated**: 2026-10-03T14:45:00+07:00

---

## 1. Tech Stack

| Component | Technology | Purpose |
|---|---|---|
| Framework | **React Native Web (Expo SDK 52)** | Cross-platform (iOS, Android, Web) |
| Styling | **NativeWind v4 (Tailwind CSS)** | Utility-first CSS, works on RN + Web |
| Navigation | **Expo Router v4** | File-based routing, typed routes |
| UI Library | **React Native Paper v5** | Material Design 3 components |
| State | **Zustand** | Lightweight store with persistence |
| Icons | **@expo/vector-icons** | Native icon set |
| Language | **TypeScript (strict)** | Type safety |

> 📘 **Tailwind cheatsheet**: see [`docs/TAILWIND_CHEATSHEET.md`](docs/TAILWIND_CHEATSHEET.md) for theme tokens, presets, and patterns.

## 2. Architecture Layers

```text
┌─────────────────────────────────────────────┐
│  app/  —  Pages (Expo Router, screens)     │  ← UI layer
├─────────────────────────────────────────────┤
│  src/components/  —  Reusable UI           │  ← Presentational
├─────────────────────────────────────────────┤
│  src/hooks/  —  Stateful logic (async)      │  ← Business logic
├─────────────────────────────────────────────┤
│  src/services/  —  API clients              │  ← Data access
├─────────────────────────────────────────────┤
│  src/types/  —  Entities & DTOs             │  ← Type contracts
├─────────────────────────────────────────────┤
│  src/store/  —  Global state (Zustand)     │  ← Persistent state
├─────────────────────────────────────────────┤
│  src/theme/  —  Design tokens               │  ← Styling primitives
└─────────────────────────────────────────────┘
```

**Strict flow**: Pages import hooks → hooks import services → services consume types.
**No shortcuts** — components must not call services directly; they go through hooks.

## 3. Setup

```bash
cd ui
npm install
npm run web        # Start web dev server (port 8081)
npm run type-check # Run TypeScript type checking
```

## 4. Folder Structure

```text
ui/
├── app/                                  # Expo Router pages
│   ├── _layout.tsx                       # Root layout (PaperProvider, Stack)
│   ├── (tabs)/
│   │   ├── _layout.tsx                   # Bottom tab navigator
│   │   ├── index.tsx                     # 🏠 Home / Dashboard
│   │   ├── explore.tsx                   # 🔍 Search & filter papers
│   │   ├── chat.tsx                      # 💬 RAG chat interface
│   │   ├── analytics.tsx                 # 📊 Analytics & trends
│   │   └── profile.tsx                   # ⚙️ Settings
│   └── paper/[id].tsx                    # 📄 Paper detail page
│
├── src/
│   ├── components/                       # Reusable UI components
│   │   ├── common/                       # StatCard, TrendingTopicCard
│   │   ├── paper/                        # PaperCard
│   │   ├── chat/                         # ChatBubble
│   │   └── charts/                       # CategoryStatsCard, TimelineChart
│   │
│   ├── navigation/                       # 🆕 Navigation helpers
│   │   ├── routes.ts                     # Route constants & path builders
│   │   ├── linking.ts                    # Deep linking config
│   │   └── types.ts                      # ParamList types
│   │
│   ├── services/                         # 🆕 API service clients
│   │   ├── api/                          # Base HTTP client
│   │   │   ├── client.ts                 # Fetch wrapper, ApiError, retry
│   │   │   ├── config.ts                 # API_CONFIG, ENDPOINTS
│   │   │   └── index.ts
│   │   ├── papers/                       # papersService
│   │   ├── rag/                          # ragService (query, stream, sessions)
│   │   ├── analytics/                    # analyticsService
│   │   ├── mining/                       # miningService (topics, citation graph)
│   │   └── index.ts
│   │
│   ├── hooks/                            # 🆕 Custom React hooks
│   │   ├── useAsync.ts                   # Generic async data hook
│   │   ├── useDebounce.ts
│   │   ├── useCommon.ts                  # usePrevious, useToggle, useLatestRef
│   │   ├── usePapers.ts                  # usePapersList, usePaper
│   │   ├── useRagChat.ts                 # Streaming RAG chat
│   │   ├── useSearch.ts                  # Debounced paper search
│   │   ├── useAnalytics.ts               # Analytics data hooks
│   │   └── index.ts
│   │
│   ├── types/                            # 🆕 Domain types
│   │   ├── entities/                     # Domain entities (Paper, Chat, ...)
│   │   │   ├── paper.entity.ts
│   │   │   ├── section.entity.ts
│   │   │   ├── chat.entity.ts
│   │   │   ├── user.entity.ts
│   │   │   ├── analytics.entity.ts
│   │   │   └── search.entity.ts
│   │   ├── responses/                    # API response DTOs
│   │   │   ├── api-response.ts
│   │   │   ├── paginated.ts
│   │   │   └── rag-response.ts
│   │   └── index.ts
│   │
│   ├── store/                            # 🆕 Zustand stores
│   │   ├── theme.store.ts                # Light/dark/auto with persistence
│   │   ├── auth.store.ts                 # User auth (placeholder)
│   │   └── index.ts
│   │
│   ├── data/                             # Mock data (for dev)
│   ├── theme/                            # Design tokens (colors, typography, spacing)
│   └── utils/
│
├── assets/                               # Images, icons
├── app.json                              # Expo config
├── package.json
├── tsconfig.json                         # Path aliases for @/components, @/services, etc.
├── babel.config.js                       # + nativewind/babel + module-resolver
├── metro.config.js                       # + withNativeWind
├── tailwind.config.js                    # 🆕 Tailwind theme tokens
├── global.css                            # 🆕 @tailwind directives
└── README.md
```

## 5. Path Aliases

| Alias | Resolves to |
|---|---|
| `@/*` | `./src/*` |
| `@/components/*` | `./src/components/*` |
| `@/hooks` / `@/hooks/*` | `./src/hooks` / `./src/hooks/*` |
| `@/services` / `@/services/*` | `./src/services` / `./src/services/*` |
| `@/navigation` / `@/navigation/*` | `./src/navigation` / `./src/navigation/*` |
| `@/types` / `@/types/*` | `./src/types` / `./src/types/*` |
| `@/store` / `@/store/*` | `./src/store` / `./src/store/*` |
| `@/theme/*` | `./src/theme/*` |
| `@/data/*` | `./src/data/*` |

## 6. Scripts

| Script | Description |
|---|---|
| `npm run web` | Start Expo dev server for web |
| `npm run android` | Start Expo dev server for Android |
| `npm run ios` | Start Expo dev server for iOS |
| `npm run build:web` | Build static web bundle |
| `npm run type-check` | Run TypeScript compiler in noEmit mode |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest tests |

## 7. Styling with Tailwind (NativeWind)

The project uses **NativeWind v4** so you can write `className="..."` directly on React Native components. The theme tokens (colors, spacing, font sizes, shadows) are defined in `tailwind.config.js` and exposed as utility classes.

```tsx
import { View, Text } from 'react-native';
import { cn } from '@/utils/cn';

export function Demo() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-surface-900 p-base">
      <Text className="text-h1 text-brand-accent">Hello Tailwind!</Text>
    </View>
  );
}
```

### Highlights

- **Tokens** for `surface-*`, `brand-*`, `cat-*` (categories), spacing (`xxs`-`huge`), typography (`text-display`, `text-h1`...), shadows (`shadow-soft-md`).
- **Dark mode** automatic via `dark:` variant (driven by `useColorScheme`).
- **Conditional classes** with the `cn` helper from `@/utils/cn`.
- **Pre-built compositions** in `@/theme` (`twStyles.card`, `twStyles.primaryBtn`, ...).
- **Both styles supported**: `Component.tsx` (StyleSheet) and `Component.tw.tsx` (Tailwind) live side-by-side.

### Files Added

| File | Purpose |
|---|---|
| `tailwind.config.js` | Theme tokens, content globs, presets |
| `global.css` | `@tailwind base/components/utilities` + custom layers |
| `babel.config.js` | Added `nativewind/babel` plugin (before module-resolver) |
| `metro.config.js` | Wrapped with `withNativeWind(config, { input: './global.css' })` |
| `app/_layout.tsx` | `import '../global.css'` at top |
| `src/theme/tw.ts` | `tw`, `twColors`, `twStyles` exports |
| `src/utils/cn.ts` | `cn()` classname combiner (lightweight clsx) |
| `docs/TAILWIND_CHEATSHEET.md` | Full reference for tokens, patterns, presets |

> 📘 See [`docs/TAILWIND_CHEATSHEET.md`](docs/TAILWIND_CHEATSHEET.md) for the full cheatsheet.

## 8. Mockup Scope

### ✅ Implemented
- Home dashboard with stats, recent papers, trending topics
- Explore page with search bar & category filter (uses `useSearch` hook)
- Paper detail page (uses `usePaper` hook)
- RAG chat interface with streaming (`useRagChat` hook), suggested questions, citations
- Analytics page with timeline & category breakdown (uses `useAnalytics` hooks)
- Settings/Profile page with theme toggle (Zustand `useThemeStore`)
- Light + Dark mode (auto by system, persisted via AsyncStorage)
- Deep linking config (web URL → screen)
- **Tailwind utility classes** integrated via NativeWind v4

### ⏳ Pending from user
- Real backend integration (toggle `USE_MOCK` in each service)
- Real citation graph visualization (D3 / react-native-svg)
- Advanced filters & saved searches
- User authentication

## 9. Backend Integration

Each service has a `USE_MOCK = true` flag at the top. When the backend is ready:

1. Set the API base URL in `src/services/api/config.ts` or via `EXPO_PUBLIC_API_BASE_URL` env var.
2. Flip `USE_MOCK` to `false` in each service.
3. The hooks will automatically start hitting the real API.

```typescript
// src/services/papers/papers.service.ts
const USE_MOCK = true;  // ← change to false
```

## 10. Theming

The UI supports both **light** and **dark** modes via the `useThemeStore` (Zustand). Colors are defined in `src/theme/colors.ts` (StyleSheet path) and `tailwind.config.js` (Tailwind path). Both are kept in sync.

```typescript
import { Colors } from '@/theme';
const isDark = useThemeStore((s) => s.resolvedMode === 'dark');
const colors = isDark ? Colors.dark : Colors.light;
```

For Tailwind: just use `dark:` variants — they auto-switch when the system color scheme changes.

## 11. Adding a New Feature

1. **Define entity** in `src/types/entities/`
2. **Define DTOs** in `src/types/responses/`
3. **Create service** in `src/services/<feature>/`
4. **Create hook** in `src/hooks/use<Feature>.ts`
5. **Export** from `index.ts` barrels
6. **Build page** in `app/<feature>.tsx`
7. **Reuse components** from `src/components/`
8. **Style with Tailwind** using the tokens in `tailwind.config.js` or pre-built `twStyles` presets
