import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '@/theme';
import type { CategoryStats } from '@/types/entities';

interface CategoryStatsCardProps {
  stats: CategoryStats;
  maxCount?: number;
}

/**
 * Category statistics row with horizontal bar chart.
 */
export function CategoryStatsCard({ stats, maxCount }: CategoryStatsCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const categoryColor = colors[stats.category as keyof typeof colors] as string;

  const max = maxCount || Math.max(...stats.topAuthors.map((a) => a.count));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.dot, { backgroundColor: categoryColor }]} />
          <Text style={[styles.category, { color: colors.text }]}>
            {stats.category}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.count, { color: colors.text }]}>
            {stats.paperCount.toLocaleString()}
          </Text>
          <Text style={[styles.countLabel, { color: colors.textMuted }]}>
            papers
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {stats.totalCitations.toLocaleString()} citations
        </Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          avg {stats.avgCitationsPerPaper.toFixed(1)}/paper
        </Text>
      </View>

      <View style={styles.topAuthors}>
        {stats.topAuthors.slice(0, 3).map((author) => {
          const widthPercent = (author.count / max) * 100;
          return (
            <View key={author.name} style={styles.authorRow}>
              <Text style={[styles.authorName, { color: colors.textSecondary }]} numberOfLines={1}>
                {author.name}
              </Text>
              <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${widthPercent}%`, backgroundColor: categoryColor },
                  ]}
                />
              </View>
              <Text style={[styles.authorCount, { color: colors.textMuted }]}>
                {author.count}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  category: {
    ...Typography.h4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  count: {
    ...Typography.h4,
  },
  countLabel: {
    ...Typography.caption,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginBottom: Spacing.md,
  },
  meta: {
    ...Typography.caption,
  },
  topAuthors: {
    gap: Spacing.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  authorName: {
    ...Typography.caption,
    width: 100,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  authorCount: {
    ...Typography.caption,
    fontWeight: '700',
    width: 24,
    textAlign: 'right',
  },
});
