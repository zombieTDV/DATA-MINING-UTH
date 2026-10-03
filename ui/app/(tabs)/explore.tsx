import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, Typography } from '@/theme';
import { PaperCard } from '@/components/paper/PaperCard';
import { MOCK_PAPERS } from '@/data/mockData';
import { useSearch } from '@/hooks';
import { ROUTES } from '@/navigation';
import type { ArxivCategory } from '@/types/entities';

const CATEGORIES: { value: ArxivCategory; label: string; color: string }[] = [
  { value: 'cs.AI', label: 'cs.AI', color: 'csAI' },
  { value: 'cs.LG', label: 'cs.LG', color: 'csLG' },
  { value: 'cs.CV', label: 'cs.CV', color: 'csCV' },
  { value: 'cs.CL', label: 'cs.CL', color: 'csCL' },
  { value: 'stat.ML', label: 'stat.ML', color: 'statML' },
];

/**
 * Explore page - search and filter papers.
 * Uses the useSearch hook for debounced search.
 */
export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [selectedCategory, setSelectedCategory] = useState<ArxivCategory | null>(null);
  const { query, setQuery, results, loading, hasQuery } = useSearch({
    categories: selectedCategory ? [selectedCategory] : [],
  });

  // When no query, show full mock list (filtered by category)
  const displayPapers = hasQuery
    ? results.map((r) => r.paper)
    : selectedCategory
      ? MOCK_PAPERS.filter((p) => p.primaryCategory === selectedCategory)
      : MOCK_PAPERS;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.base }]}>
        <Text style={[styles.title, { color: colors.text }]}>Khám phá</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Tìm kiếm và lọc bài báo khoa học
        </Text>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Tìm kiếm bài báo, tác giả, từ khóa..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.textMuted}
              onPress={() => setQuery('')}
            />
          )}
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          <CategoryChip
            label="Tất cả"
            backgroundColor={selectedCategory === null ? colors.accent : colors.surface}
            textColor={selectedCategory === null ? colors.textInverse : colors.text}
            onPress={() => setSelectedCategory(null)}
            isActive={selectedCategory === null}
          />
          {CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.value}
              label={cat.label}
              backgroundColor={
                selectedCategory === cat.value
                  ? (colors[cat.color as keyof typeof colors] as string)
                  : colors.surface
              }
              textColor={
                selectedCategory === cat.value ? colors.textInverse : colors.text
              }
              onPress={() =>
                setSelectedCategory(
                  selectedCategory === cat.value ? null : cat.value,
                )
              }
              isActive={selectedCategory === cat.value}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
          {loading ? 'Đang tìm kiếm...' : `${displayPapers.length} kết quả`}
        </Text>
        {displayPapers.map((paper) => (
          <PaperCard
            key={paper.id}
            paper={paper}
            onPress={() => router.push(ROUTES.PAPER_DETAIL(paper.id))}
          />
        ))}
        {displayPapers.length === 0 && !loading && (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Không tìm thấy bài báo phù hợp
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

interface CategoryChipProps {
  label: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
  onPress: () => void;
}

function CategoryChip({ label, backgroundColor, textColor, onPress, isActive }: CategoryChipProps) {
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor },
        isActive && { borderWidth: 1, borderColor: 'transparent' },
      ]}
      onTouchEnd={onPress}
    >
      <Text style={[styles.chipText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.base },
  title: { ...Typography.h1 },
  subtitle: { ...Typography.bodySmall, marginTop: 2, marginBottom: Spacing.lg },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  searchInput: { flex: 1, ...Typography.body },
  categoryRow: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  chip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    marginRight: Spacing.sm,
  },
  chipText: { ...Typography.label },
  content: { paddingHorizontal: Spacing.lg },
  resultCount: { ...Typography.caption, marginBottom: Spacing.base },
  empty: { alignItems: 'center', paddingTop: Spacing.xxxl * 2 },
  emptyText: { ...Typography.body, marginTop: Spacing.base },
});
