import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '@/theme';
import type { ChatMessage } from '@/types/entities';

interface ChatBubbleProps {
  message: ChatMessage;
}

/**
 * Chat bubble for displaying a single message in the RAG chat interface.
 */
export function ChatBubble({ message }: ChatBubbleProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const isUser = message.role === 'user';

  return (
    <View
      style={[
        styles.container,
        { justifyContent: isUser ? 'flex-end' : 'flex-start' },
      ]}
    >
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: colors.accent + '20' }]}>
          <Ionicons name="sparkles" size={14} color={colors.accent} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? { backgroundColor: colors.accent, borderTopRightRadius: 4 }
            : { backgroundColor: colors.surface, borderTopLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
        ]}
      >
        <Text
          style={[
            styles.text,
            { color: isUser ? colors.textInverse : colors.text },
          ]}
        >
          {message.content}
        </Text>
        {message.citations && message.citations.length > 0 && (
          <View style={styles.citations}>
            <Text style={[styles.citationLabel, { color: isUser ? colors.textInverse + 'CC' : colors.textMuted }]}>
              Trích dẫn:
            </Text>
            {message.citations.map((cite, idx) => (
              <View
                key={idx}
                style={[
                  styles.citationChip,
                  {
                    backgroundColor: isUser
                      ? 'rgba(255,255,255,0.2)'
                      : colors.accent + '15',
                  },
                ]}
              >
                <Ionicons
                  name="link"
                  size={10}
                  color={isUser ? colors.textInverse : colors.accent}
                />
                <Text
                  style={[
                    styles.citationText,
                    { color: isUser ? colors.textInverse : colors.accent },
                  ]}
                  numberOfLines={1}
                >
                  {cite.paperTitle}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: Spacing.base,
    gap: Spacing.sm,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  text: {
    ...Typography.body,
    lineHeight: 22,
  },
  citations: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  citationLabel: {
    ...Typography.caption,
    fontWeight: '600',
  },
  citationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  citationText: {
    ...Typography.caption,
    fontWeight: '600',
    maxWidth: 200,
  },
});
