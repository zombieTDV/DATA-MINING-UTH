import { View, Text, ScrollView, Pressable, StyleSheet, Switch, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Colors, Spacing, Radius, Typography } from '@/theme';
import { useThemeStore } from '@/store';

const SETTINGS_GROUPS = [
  {
    title: 'Giao diện',
    items: [
      { id: 'theme', label: 'Chế độ tối', type: 'switch', icon: 'moon' },
      { id: 'lang', label: 'Ngôn ngữ', type: 'navigate', value: 'Tiếng Việt', icon: 'language' },
    ],
  },
  {
    title: 'Dữ liệu',
    items: [
      { id: 'sync', label: 'Đồng bộ dữ liệu', type: 'navigate', value: 'Tự động', icon: 'sync' },
      { id: 'cache', label: 'Xóa cache', type: 'action', icon: 'trash-outline' },
      { id: 'storage', label: 'Dung lượng đã dùng', type: 'navigate', value: '234 MB', icon: 'server' },
    ],
  },
  {
    title: 'Thông tin',
    items: [
      { id: 'about', label: 'Giới thiệu', type: 'navigate', icon: 'information-circle' },
      { id: 'version', label: 'Phiên bản', type: 'navigate', value: '1.0.0', icon: 'code-slash' },
      { id: 'docs', label: 'Tài liệu', type: 'navigate', icon: 'book' },
    ],
  },
];

/**
 * Settings / Profile page.
 * Uses the theme store for live theme switching.
 */
export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const { mode, setMode } = useThemeStore();
  const [darkMode, setDarkMode] = useState(mode === 'dark');

  const handleThemeToggle = (value: boolean) => {
    setDarkMode(value);
    setMode(value ? 'dark' : 'light');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.base, paddingBottom: insets.bottom + 80 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>Cài đặt</Text>

      {/* Profile Card */}
      <View
        style={[
          styles.profileCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.accent + '20' }]}>
          <Ionicons name="person" size={32} color={colors.accent} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>UTH Researcher</Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
            researcher@uth.edu.vn
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.accent + '15' }]}>
            <Ionicons name="school" size={12} color={colors.accent} />
            <Text style={[styles.roleText, { color: colors.accent }]}>Sinh viên UTH</Text>
          </View>
        </View>
      </View>

      {/* Settings Groups */}
      {SETTINGS_GROUPS.map((group, gIdx) => (
        <View key={gIdx} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {group.title.toUpperCase()}
          </Text>
          <View
            style={[
              styles.group,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {group.items.map((item, iIdx) => (
              <View
                key={item.id}
                style={[
                  styles.item,
                  iIdx < group.items.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.divider,
                  },
                ]}
              >
                <View style={styles.itemLeft}>
                  <View style={[styles.itemIcon, { backgroundColor: colors.surface }]}>
                    <Ionicons
                      name={item.icon as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color={colors.textSecondary}
                    />
                  </View>
                  <Text style={[styles.itemLabel, { color: colors.text }]}>
                    {item.label}
                  </Text>
                </View>
                {item.type === 'switch' && item.id === 'theme' && (
                  <Switch
                    value={darkMode}
                    onValueChange={handleThemeToggle}
                    trackColor={{ false: colors.border, true: colors.accent }}
                    thumbColor={colors.surface}
                  />
                )}
                {item.type === 'navigate' && (
                  <View style={styles.itemRight}>
                    {item.value && (
                      <Text style={[styles.itemValue, { color: colors.textSecondary }]}>
                        {item.value}
                      </Text>
                    )}
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      ))}

      <Text style={[styles.footer, { color: colors.textMuted }]}>UTH Data Mining v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg },
  title: { ...Typography.h1, marginBottom: Spacing.lg },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1, marginLeft: Spacing.base },
  profileName: { ...Typography.h4 },
  profileEmail: { ...Typography.bodySmall, marginTop: 2 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  roleText: { ...Typography.caption, fontWeight: '600' },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.label, marginBottom: Spacing.sm, letterSpacing: 0.5 },
  group: { borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { ...Typography.body },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  itemValue: { ...Typography.bodySmall },
  footer: { ...Typography.caption, textAlign: 'center', marginTop: Spacing.xl },
});
