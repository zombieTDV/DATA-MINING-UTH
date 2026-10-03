import { ScrollView, View, Text, StyleSheet, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '@/theme';
import { CategoryStatsCard } from '@/components/charts/CategoryStatsCard';
import { TimelineChart } from '@/components/charts/TimelineChart';
import { TrendingTopicCard } from '@/components/common/TrendingTopicCard';
import {
  useCategoryStats,
  useTimeline,
  useTrendingTopics,
} from '@/hooks';

/**
 * Analytics page - data mining insights and visualizations.
 * Uses hooks to fetch data from analyticsService.
 */
export default function AnalyticsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const { data: categoryStats } = useCategoryStats();
  const { data: timeline } = useTimeline({ range: '30d' });
  const { data: trending } = useTrendingTopics(10);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.base, paddingBottom: insets.bottom + 80 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>Phân tích & Khai phá</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Thống kê, xu hướng và insight từ kho dữ liệu
      </Text>

      {/* Daily Papers Timeline */}
      <View
        style={[
          styles.chartCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="calendar" size={20} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Số bài báo theo ngày (30 ngày)
            </Text>
          </View>
        </View>
        {timeline && <TimelineChart data={timeline} color={colors.accent} />}
      </View>

      {/* Category Distribution */}
      <View
        style={[
          styles.chartCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="pie-chart" size={20} color={colors.success} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Phân bố theo chuyên ngành
            </Text>
          </View>
        </View>
        {categoryStats?.map((stat) => (
          <CategoryStatsCard key={stat.category} stats={stat} />
        ))}
      </View>

      {/* Trending Topics */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          🔥 Chủ đề tăng trưởng mạnh
        </Text>
        {trending?.map((topic) => (
          <TrendingTopicCard key={topic.id} topic={topic} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg },
  title: { ...Typography.h1 },
  subtitle: { ...Typography.bodySmall, marginTop: 2, marginBottom: Spacing.xl },
  chartCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardTitle: { ...Typography.h4 },
  section: { marginTop: Spacing.lg },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.base },
});
