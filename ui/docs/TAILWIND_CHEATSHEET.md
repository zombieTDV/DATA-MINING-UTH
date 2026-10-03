# Tailwind (NativeWind) Cheatsheet

This project uses **NativeWind v4** to bring Tailwind CSS utility classes to React Native (and React Native Web).

## Quick Start

```tsx
import { View, Text } from 'react-native';

export function Example() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-base">
      <Text className="text-h1 text-brand-accent">Hello Tailwind!</Text>
    </View>
  );
}
```

## Theme Tokens (defined in `tailwind.config.js`)

### Colors

| Class | Hex | Usage |
|---|---|---|
| `bg-surface` / `bg-white` | `#FFFFFF` | Page background (light) |
| `bg-surface-dark` / `bg-surface-900` | `#0F172A` | Page background (dark) |
| `bg-surface-800` | `#1E293B` | Cards (dark mode) |
| `bg-surface-700` | `#334155` | Elevated cards (dark) |
| `text-text` | `#0F172A` | Primary text |
| `text-text-secondary` | `#475569` | Secondary text |
| `text-text-muted` | `#94A3B8` | Muted/disabled text |
| `text-brand-accent` | `#3B82F6` | Accent / links |
| `bg-success` | `#10B981` | Success state |
| `bg-warning` | `#F59E0B` | Warning state |
| `bg-error` | `#EF4444` | Error state |
| `bg-cat-ai` | `#8B5CF6` | cs.AI category |
| `bg-cat-lg` | `#3B82F6` | cs.LG category |
| `bg-cat-cv` | `#F59E0B` | cs.CV category |
| `bg-cat-cl` | `#10B981` | cs.CL category |
| `bg-cat-ml` | `#EC4899` | stat.ML category |

### Spacing (4px base)

| Class | Value | Tailwind equivalent |
|---|---|---|
| `xxs` | 2px | `0.5` |
| `xs` | 4px | `1` |
| `sm` | 8px | `2` |
| `md` | 12px | `3` |
| `base` | 16px | `4` |
| `lg` | 20px | `5` |
| `xl` | 24px | `6` |
| `xxl` | 32px | `8` |
| `xxxl` | 40px | `10` |
| `huge` | 64px | `16` |

```tsx
<View className="p-base m-md gap-sm">   {/* padding 16, margin 12, gap 8 */}
```

### Border Radius

| Class | Value |
|---|---|
| `rounded-xs` | 4px |
| `rounded` / `rounded-md` | 8px |
| `rounded-lg` | 12px |
| `rounded-xl` | 16px |
| `rounded-2xl` | 20px |
| `rounded-full` | 9999px |

### Typography

```tsx
<Text className="text-display">32px / 700</Text>
<Text className="text-h1">28px / 700</Text>
<Text className="text-h2">24px / 600</Text>
<Text className="text-h3">20px / 600</Text>
<Text className="text-h4">18px / 600</Text>
<Text className="text-body">16px / 400</Text>
<Text className="text-body-sm">14px / 400</Text>
<Text className="text-caption">12px / 500</Text>
<Text className="text-label">13px / 600</Text>
<Text className="text-mono">14px Courier</Text>
```

### Shadows

```tsx
<View className="shadow-soft-sm">  // 0 1px 2px 0 rgba(0,0,0,0.05)
<View className="shadow-soft-md">  // 0 2px 4px 0 rgba(0,0,0,0.08)
<View className="shadow-soft-lg">  // 0 4px 8px 0 rgba(0,0,0,0.12)
<View className="shadow-soft-xl">  // 0 8px 16px 0 rgba(0,0,0,0.15)
<View className="shadow-glow">      // accent ring
```

## Dark Mode

Use the `dark:` variant. NativeWind applies dark mode based on system color scheme by default.

```tsx
<View className="bg-white dark:bg-surface-900">
  <Text className="text-text dark:text-white">Hello</Text>
</View>
```

For manual control, the `useThemeStore` (Zustand) is available. The `dark` CSS class is automatically toggled on the `<html>` element by `useColorScheme`.

## Conditional Classes (cn helper)

Use the `cn` utility from `@/utils/cn` to combine classes conditionally:

```tsx
import { cn } from '@/utils/cn';

<View
  className={cn(
    'p-base rounded-lg',
    isDark ? 'bg-surface-800 text-white' : 'bg-white text-text',
    isActive && 'border-brand-accent',
  )}
/>
```

## Dynamic Colors (Runtime Values)

Tailwind classes are static (JIT-compiled), so dynamic colors must go through `style`:

```tsx
// ❌ Won't work — class names are JIT-compiled
<View className={`bg-[${dynamicColor}]`} />

// ✅ Works — runtime style values
<View
  className="p-base rounded-lg"
  style={{ backgroundColor: dynamicColor + '20' }}  // 20 = 12% alpha hex
>
```

## Pre-built Compositions (`@/theme`)

For ultra-fast prototyping, use the `twStyles` presets:

```tsx
import { twStyles, cn } from '@/theme';

<View className={twStyles.card}>
  <Text className="text-h4">Pre-styled card</Text>
</View>
```

## Available Presets (`twStyles`)

| Preset | Classes |
|---|---|
| `card` | `bg-white dark:bg-surface-800 border border-border dark:border-surface-700 rounded-lg p-base` |
| `cardElevated` | `card + shadow-soft-md` |
| `input` | `bg-surface-50 dark:bg-surface-800 border ... rounded-lg px-base py-md ...` |
| `chip` | `px-base py-sm rounded-full text-caption font-semibold` |
| `primaryBtn` | `bg-brand-accent px-lg py-md rounded-lg font-semibold` |
| `secondaryBtn` | `bg-surface-50 ... border ... px-lg py-md rounded-lg` |
| `row` | `flex-row items-center` |
| `rowGap` | `flex-row items-center gap-md` |
| `col` | `flex-col` |
| `colGap` | `flex-col gap-md` |
| `center` | `items-center justify-center` |
| `flex1` | `flex-1` |

## Common Patterns

### Card
```tsx
<View className="bg-white dark:bg-surface-800 border border-border dark:border-surface-700 rounded-lg p-base">
  ...
</View>
```

### Button (primary)
```tsx
<Pressable className="bg-brand-accent px-lg py-md rounded-lg active:opacity-80">
  <Text className="text-white font-semibold text-center">Submit</Text>
</Pressable>
```

### List Item
```tsx
<View className="flex-row items-center justify-between p-base border-b border-border">
  <Text className="text-body">Title</Text>
  <Ionicons name="chevron-forward" size={18} />
</View>
```

### Avatar + Title
```tsx
<View className="flex-row items-center gap-md">
  <View className="w-10 h-10 rounded-full bg-brand-accent/20 items-center justify-center">
    <Ionicons name="person" size={20} color="#3B82F6" />
  </View>
  <View>
    <Text className="text-h4">Title</Text>
    <Text className="text-caption text-text-muted">Subtitle</Text>
  </View>
</View>
```

## File Naming Convention

- **StyleSheet version**: `Component.tsx` (original)
- **Tailwind version**: `Component.tw.tsx` (alternative)
- **Index re-exports**: Both versions are available

```tsx
// Both work
import { StatCard } from '@/components/common';          // StyleSheet
import { StatCardTw } from '@/components/common';        // Tailwind
```

## Tips

1. **Use the `dark:` variant** instead of writing `isDark` conditionals when possible
2. **Prefer className over StyleSheet** for static styles (better tree-shaking, easier theming)
3. **Use `cn()` for conditionals** rather than template literals
4. **Dynamic colors → `style` prop** (Tailwind can't JIT runtime values)
5. **Reference `tailwind.config.js`** for the full theme map
