import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '@/theme';
import type { TrendingTopic } from '@/types/entities';

interface TrendingTopicCardProps {
  topic: TrendingTopic;
}

/**
 * Trending topic card with growth indicator.
 */
export function TrendingTopicCard({ topic }: TrendingTopicCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const categoryColor = colors[topic.category as keyof typeof colors] as string;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.left}>
        <View style={[styles.icon, { backgroundColor: categoryColor + '20' }]}>
          <Ionicons name="flame" size={18} color={categoryColor} />
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {topic.name}
            </Text>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '15' }]}>
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {topic.category}
              </Text>
            </View>
          </View>
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
            {topic.description}
          </Text>
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Ionicons name="document-text-outline" size={12} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                {topic.paperCount.toLocaleString()} papers
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.growth}>
        <Ionicons name="trending-up" size={14} color={colors.success} />
        <Text style={[styles.growthText, { color: colors.success }]}>
          +{topic.growthPercent.toFixed(1)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    flex: 1,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  title: {
    ...Typography.h4,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  categoryText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  description: {
    ...Typography.bodySmall,
    marginBottom: Spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...Typography.caption,
  },
  growth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: Spacing.sm,
  },
  growthText: {
    ...Typography.caption,
    fontWeight: '700',
  },
});
