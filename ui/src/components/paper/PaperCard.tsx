import { View, Text, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '@/theme';
import type { Paper } from '@/types/entities';

interface PaperCardProps {
  paper: Paper;
  onPress?: () => void;
}

/**
 * Paper card showing essential paper info in list views.
 */
export function PaperCard({ paper, onPress }: PaperCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const categoryColor = colors[paper.primaryCategory as keyof typeof colors] as string;

  const publishedDate = new Date(paper.publishedDate).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
          <Text style={[styles.categoryText, { color: categoryColor }]}>
            {paper.primaryCategory}
          </Text>
        </View>
        <Text style={[styles.date, { color: colors.textMuted }]}>{publishedDate}</Text>
      </View>

      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {paper.title}
      </Text>

      <Text style={[styles.abstract, { color: colors.textSecondary }]} numberOfLines={3}>
        {paper.abstract}
      </Text>

      <View style={styles.footer}>
        <View style={styles.authors}>
          <Ionicons name="people-outline" size={12} color={colors.textMuted} />
          <Text style={[styles.authorText, { color: colors.textMuted }]} numberOfLines={1}>
            {paper.authors.slice(0, 2).map((a) => a.name).join(', ')}
            {paper.authors.length > 2 ? ` +${paper.authors.length - 2}` : ''}
          </Text>
        </View>
        <View style={styles.citations}>
          <Ionicons name="link" size={12} color={colors.accent} />
          <Text style={[styles.citationText, { color: colors.accent }]}>
            {paper.citations}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  categoryText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  date: {
    ...Typography.caption,
  },
  title: {
    ...Typography.h4,
    marginBottom: Spacing.sm,
  },
  abstract: {
    ...Typography.bodySmall,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authors: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  authorText: {
    ...Typography.caption,
    flex: 1,
  },
  citations: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  citationText: {
    ...Typography.caption,
    fontWeight: '700',
  },
});
