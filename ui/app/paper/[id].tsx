import { View, Text, ScrollView, StyleSheet, useColorScheme, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '@/theme';
import { usePaper } from '@/hooks';
import { ROUTES } from '@/navigation';

const MOCK_SECTIONS = [
  { title: 'Abstract', type: 'abstract', content: 'This paper presents a novel approach to the problem. We achieve state-of-the-art results on multiple benchmarks.' },
  { title: '1. Introduction', type: 'introduction', content: 'Recent advances in machine learning have enabled significant progress in this area. However, several challenges remain unresolved.' },
  { title: '2. Methodology', type: 'methodology', content: 'We propose a three-stage approach: (1) preprocessing, (2) core algorithm, and (3) post-processing. Each stage is designed to address specific challenges identified in the literature.' },
  { title: '3. Experiments', type: 'experiments', content: 'We evaluate our approach on five standard benchmarks: ImageNet, CIFAR-10, CIFAR-100, GLUE, and SuperGLUE. Results show a 12.4% average improvement over baselines.' },
  { title: '4. Conclusion', type: 'conclusion', content: 'We have presented a new method that achieves state-of-the-art results across multiple benchmarks. Future work will explore applications to multimodal learning.' },
];

/**
 * Paper detail page - full paper view with sections, citations, and related papers.
 * Uses the usePaper hook to fetch data from the papers service.
 */
export default function PaperDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: paper, loading, error } = usePaper(id ?? null);

  if (loading || !paper) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textMuted }}>{error ? `Error: ${error.message}` : 'Đang tải...'}</Text>
      </View>
    );
  }

  const categoryColor = colors[paper.primaryCategory as keyof typeof colors] as string;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.divider }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.topBarRight}>
          <Pressable style={[styles.iconButton, { backgroundColor: colors.surface }]}>
            <Ionicons name="bookmark-outline" size={20} color={colors.text} />
          </Pressable>
          <Pressable style={[styles.iconButton, { backgroundColor: colors.surface }]}>
            <Ionicons name="share-outline" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
            <Text style={[styles.categoryText, { color: categoryColor }]}>
              {paper.primaryCategory}
            </Text>
          </View>
          <Text style={[styles.arxivId, { color: colors.textMuted }]}>
            arXiv:{paper.arxivId}
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{paper.title}</Text>

        {/* Authors */}
        <View style={styles.authors}>
          {paper.authors.map((author, idx) => (
            <Text key={idx} style={[styles.author, { color: colors.textSecondary }]}>
              {author.name}
              {idx < paper.authors.length - 1 ? ', ' : ''}
            </Text>
          ))}
        </View>

        {/* Meta info */}
        <View
          style={[
            styles.metaCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <MetaItem
            icon="calendar-outline"
            label="Ngày đăng"
            value={new Date(paper.publishedDate).toLocaleDateString('vi-VN')}
            color={colors.text}
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <MetaItem
            icon="link"
            label="Trích dẫn"
            value={paper.citations.toString()}
            color={colors.accent}
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <MetaItem
            icon="document-text"
            label="Trang"
            value={paper.comments?.split(' ')[0] || '~10'}
            color={colors.text}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionPrimary, { backgroundColor: colors.accent }]}
          >
            <Ionicons name="download" size={18} color={colors.textInverse} />
            <Text style={[styles.actionPrimaryText, { color: colors.textInverse }]}>
              Tải PDF
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.actionSecondary,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <Ionicons name="globe-outline" size={18} color={colors.text} />
            <Text style={[styles.actionSecondaryText, { color: colors.text }]}>HTML</Text>
          </Pressable>
        </View>

        {/* Sections */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Nội dung</Text>
        {MOCK_SECTIONS.map((section, idx) => (
          <View
            key={idx}
            style={[
              styles.sectionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
              {section.content}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function MetaItem({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.metaValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  topBarRight: { flexDirection: 'row', gap: Spacing.sm },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: Spacing.lg, paddingBottom: 80 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  categoryBadge: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.sm },
  categoryText: { ...Typography.caption, fontWeight: '700' },
  arxivId: { ...Typography.caption, fontWeight: '600' },
  title: { ...Typography.h2, marginBottom: Spacing.base },
  authors: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.lg },
  author: { ...Typography.bodySmall },
  metaCard: {
    flexDirection: 'row',
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  metaItem: { flex: 1, alignItems: 'center', gap: 4 },
  metaLabel: { ...Typography.caption },
  metaValue: { ...Typography.label },
  divider: { width: 1, marginHorizontal: Spacing.md },
  actions: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  actionPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  actionPrimaryText: { ...Typography.label },
  actionSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  actionSecondaryText: { ...Typography.label },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.base },
  sectionCard: {
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  sectionHeading: { ...Typography.h4, marginBottom: Spacing.sm },
  sectionContent: { ...Typography.body, lineHeight: 22 },
});
