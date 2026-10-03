import { View, Text, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/theme';
import { cn } from '@/utils/cn';
import type { TrendingTopic } from '@/types/entities';
import type { ColorScheme } from '@/theme/colors';
import { Colors } from '@/theme/colors';

interface TrendingTopicCardProps {
  topic: TrendingTopic;
}

/**
 * TrendingTopicCard v2 — Tailwind/NativeWind version.
 */
export function TrendingTopicCard({ topic }: TrendingTopicCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors: ColorScheme = isDark ? Colors.dark : Colors.light;
  const categoryColor = (colors as any)[topic.category] ?? colors.text;

  return (
    <View
      className={cn(
        'flex-row items-center justify-between p-base rounded-lg border mb-md',
        isDark ? 'bg-surface-800 border-surface-700' : 'bg-white border-border',
      )}
    >
      <View className="flex-row items-start gap-md flex-1">
        <View
          className="w-9 h-9 rounded items-center justify-center mt-0.5"
          style={{ backgroundColor: categoryColor + '20' }}
        >
          <Ionicons name="flame" size={18} color={categoryColor} />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-sm mb-1">
            <Text
              className={cn(
                'text-h4 flex-1',
                isDark ? 'text-white' : 'text-text',
              )}
              numberOfLines={1}
            >
              {topic.name}
            </Text>
            <View
              className="px-sm py-0.5 rounded-sm"
              style={{ backgroundColor: categoryColor + '20' }}
            >
              <Text
                className="text-caption font-bold"
                style={{ color: categoryColor }}
              >
                {topic.category}
              </Text>
            </View>
          </View>

          <Text
            className={cn(
              'text-body-sm mb-sm',
              isDark ? 'text-surface-300' : 'text-text-secondary',
            )}
            numberOfLines={2}
          >
            {topic.description}
          </Text>

          <View className="flex-row items-center gap-md">
            <View className="flex-row items-center gap-1">
              <Ionicons
                name="document-text-outline"
                size={12}
                color={isDark ? '#94A3B8' : '#94A3B8'}
              />
              <Text
                className={cn(
                  'text-caption',
                  isDark ? 'text-surface-400' : 'text-text-muted',
                )}
              >
                {topic.paperCount.toLocaleString()} papers
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="flex-row items-center gap-0.5 ml-sm">
        <Ionicons name="trending-up" size={14} color="#10B981" />
        <Text className="text-caption font-bold text-success">
          +{topic.growthPercent.toFixed(1)}%
        </Text>
      </View>
    </View>
  );
}
