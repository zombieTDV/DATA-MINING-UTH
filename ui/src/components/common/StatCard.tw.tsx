import { View, Text, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/theme';
import { cn } from '@/utils/cn';

interface StatCardProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  trend?: string;
}

/**
 * StatCard v2 — Tailwind/NativeWind version.
 * Demonstrates the new className-based styling approach.
 *
 *   ✅ className="..." utility classes work directly
 *   ✅ Use cn() to conditionally combine classes
 *   ✅ Dynamic colors passed via style prop (since they're runtime values)
 *   ✅ Dark mode automatic via Tailwind `dark:` variant
 */
export function StatCard({ label, value, icon, color, trend }: StatCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const isPositive = trend?.startsWith('+');

  return (
    <View
      className={cn(
        'w-[48%] p-base rounded-lg border mb-md',
        isDark ? 'bg-surface-800 border-surface-700' : 'bg-white border-border',
      )}
    >
      <View className="flex-row justify-between items-center mb-md">
        <View
          className="w-8 h-8 rounded items-center justify-center"
          style={{ backgroundColor: color + '20' }}
        >
          <Ionicons name={icon} size={18} color={color} />
        </View>
        {trend && (
          <Text
            className={cn(
              'text-caption font-bold',
              isPositive ? 'text-success' : 'text-error',
            )}
          >
            {trend}
          </Text>
        )}
      </View>
      <Text
        className={cn(
          'text-h2 mb-0.5',
          isDark ? 'text-white' : 'text-text',
        )}
      >
        {value}
      </Text>
      <Text
        className={cn(
          'text-caption',
          isDark ? 'text-surface-400' : 'text-text-secondary',
        )}
      >
        {label}
      </Text>
    </View>
  );
}
