import { ScrollView, View, Text, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PaperCard } from '@/components/paper/PaperCard';
import { StatCardTw, TrendingTopicCardTw } from '@/components/common';
import { useAnalyticsSummary, useTrendingTopics } from '@/hooks';
import { MOCK_PAPERS } from '@/data/mockData';
import { ROUTES } from '@/navigation';
import { cn } from '@/utils/cn';
import { Colors } from '@/theme/colors';

/**
 * Home Dashboard — Tailwind/NativeWind demo.
 * Uses className instead of StyleSheet for all styling.
 */
export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const { data: summary } = useAnalyticsSummary();
  const { data: trending } = useTrendingTopics(3);
  const recentPapers = MOCK_PAPERS.slice(0, 3);

  return (
    <ScrollView
      className={cn('flex-1', isDark ? 'bg-surface-dark' : 'bg-surface')}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 80,
        paddingHorizontal: 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-xl">
        <View>
          <Text className={cn('text-caption', isDark ? 'text-surface-400' : 'text-text-muted')}>
            Chào mừng đến với
          </Text>
          <Text className={cn('text-h1', isDark ? 'text-white' : 'text-text')}>
            UTH Data Mining
          </Text>
          <Text className={cn('text-body-sm mt-0.5', isDark ? 'text-surface-300' : 'text-text-secondary')}>
            Kho khai thác dữ liệu khoa học AI/DS
          </Text>
        </View>
        <View
          className="w-14 h-14 rounded-lg items-center justify-center"
          style={{ backgroundColor: colors.accent + '20' }}
        >
          <Ionicons name="school" size={28} color={colors.accent} />
        </View>
      </View>

      {/* Stats Grid */}
      <View className="flex-row flex-wrap justify-between mb-xl">
        <StatCardTw
          label="Tổng bài báo"
          value={summary ? summary.totalPapers.toLocaleString() : '—'}
          icon="document-text"
          color={colors.accent}
          trend="+12.4%"
        />
        <StatCardTw
          label="Trích dẫn"
          value={summary ? `${(summary.totalCitations / 1_000_000).toFixed(1)}M` : '—'}
          icon="link"
          color={colors.success}
          trend="+8.2%"
        />
        <StatCardTw
          label="Chuyên ngành"
          value={summary ? summary.totalCategories.toString() : '—'}
          icon="grid"
          color={colors.warning}
        />
        <StatCardTw
          label="Tác giả"
          value={summary ? `${(summary.totalAuthors / 1000).toFixed(0)}K` : '—'}
          icon="people"
          color={colors.csAI}
          trend="+15.7%"
        />
      </View>

      {/* Quick Actions */}
      <View className="mb-xl">
        <Text className={cn('text-h3 mb-base', isDark ? 'text-white' : 'text-text')}>
          Truy cập nhanh
        </Text>
        <View className="flex-row justify-between">
          <QuickAction
            icon="chatbubbles"
            label="Hỏi đáp RAG"
            color={colors.accent}
            backgroundColor={colors.accent + '15'}
          />
          <QuickAction
            icon="search"
            label="Tìm bài báo"
            color={colors.success}
            backgroundColor={colors.success + '15'}
          />
          <QuickAction
            icon="bar-chart"
            label="Phân tích"
            color={colors.warning}
            backgroundColor={colors.warning + '15'}
          />
          <QuickAction
            icon="git-network"
            label="Citation Graph"
            color={colors.csAI}
            backgroundColor={colors.csAI + '15'}
          />
        </View>
      </View>

      {/* Recent Papers */}
      <View className="mb-xl">
        <View className="flex-row justify-between items-center mb-base">
          <Text className={cn('text-h3', isDark ? 'text-white' : 'text-text')}>
            Bài báo mới nhất
          </Text>
          <Text className="text-label text-brand-accent">Xem tất cả</Text>
        </View>
        {recentPapers.map((paper) => (
          <PaperCard key={paper.id} paper={paper} />
        ))}
      </View>

      {/* Trending Topics */}
      <View className="mb-xl">
        <View className="flex-row justify-between items-center mb-base">
          <Text className={cn('text-h3', isDark ? 'text-white' : 'text-text')}>
            🔥 Chủ đề nổi bật
          </Text>
          <Text className="text-label text-brand-accent">Xem tất cả</Text>
        </View>
        {trending?.map((topic) => (
          <TrendingTopicCardTw key={topic.id} topic={topic} />
        ))}
      </View>
    </ScrollView>
  );
}

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  backgroundColor: string;
}

function QuickAction({ icon, label, color, backgroundColor }: QuickActionProps) {
  const isDark = useColorScheme() === 'dark';
  return (
    <View className="items-center flex-1">
      <View
        className="w-[52px] h-[52px] rounded-lg items-center justify-center mb-sm"
        style={{ backgroundColor }}
      >
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text
        className={cn('text-caption text-center', isDark ? 'text-white' : 'text-text')}
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  );
}
