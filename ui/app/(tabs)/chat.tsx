import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '@/theme';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { useRagChat } from '@/hooks';
import { ragService } from '@/services';
import { MOCK_PAPERS } from '@/data/mockData';
import type { ChatSession } from '@/types/entities';

const SUGGESTED_QUESTIONS = [
  'Các kỹ thuật tối ưu FlashAttention gần đây?',
  'DPO vs RLHF: Ưu nhược điểm?',
  'Multimodal model architectures 2024',
  'Citation graph cho paper X',
  'Topic modeling cho arXiv AI papers',
];

/**
 * RAG Chat interface.
 * Uses the useRagChat hook for stateful streaming chat.
 */
export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Load sessions on mount
  useEffect(() => {
    ragService.listSessions().then(setSessions).catch(() => setSessions([]));
  }, []);

  const {
    messages,
    isSending,
    isStreaming,
    error,
    sendMessage,
    setMessages,
  } = useRagChat({ sessionId: activeSessionId ?? undefined });

  // When session changes, hydrate messages
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    ragService.getSession(activeSessionId).then((s) => setMessages(s.messages));
  }, [activeSessionId, setMessages]);

  const handleSend = (text: string) => sendMessage(text);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.base, borderBottomColor: colors.divider },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.aiAvatar, { backgroundColor: colors.accent + '20' }]}>
            <Ionicons name="sparkles" size={20} color={colors.accent} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>UTH RAG Assistant</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Hỏi đáp dựa trên {MOCK_PAPERS.length} bài báo
            </Text>
          </View>
        </View>
        <Pressable
          style={[styles.iconButton, { backgroundColor: colors.surface }]}
          onPress={async () => {
            const s = await ragService.createSession();
            setSessions((prev) => [s, ...prev]);
            setActiveSessionId(s.id);
          }}
        >
          <Ionicons name="add" size={22} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Spacing.base }]}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accent + '15' }]}>
              <Ionicons name="chatbubbles" size={32} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Bắt đầu cuộc trò chuyện
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Hỏi bất kỳ câu hỏi nào về các bài báo AI/DS trong kho dữ liệu
            </Text>

            <View style={styles.suggestions}>
              <Text style={[styles.suggestionLabel, { color: colors.textMuted }]}>
                Gợi ý câu hỏi:
              </Text>
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <Pressable
                  key={idx}
                  style={[
                    styles.suggestionChip,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => handleSend(q)}
                >
                  <Ionicons name="bulb-outline" size={14} color={colors.accent} />
                  <Text style={[styles.suggestionText, { color: colors.text }]}>{q}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)
        )}

        {error && (
          <View style={[styles.errorBox, { backgroundColor: colors.error + '15' }]}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <ChatInput
        onSend={handleSend}
        disabled={isSending}
        placeholder={
          isStreaming ? 'Đang nhận câu trả lời...' : 'Đặt câu hỏi về các bài báo khoa học...'
        }
      />
    </KeyboardAvoidingView>
  );
}

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText('');
  };

  return (
    <View
      style={[
        styles.inputContainer,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
          paddingBottom: insets.bottom + Spacing.sm,
        },
      ]}
    >
      <View
        style={[
          styles.inputBar,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
          editable={!disabled}
        />
        <Pressable
          style={[
            styles.sendButton,
            { backgroundColor: text.trim() && !disabled ? colors.accent : colors.border },
          ]}
          onPress={handleSend}
          disabled={!text.trim() || disabled}
        >
          <Ionicons
            name="arrow-up"
            size={20}
            color={text.trim() && !disabled ? colors.textInverse : colors.textMuted}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...Typography.h4 },
  subtitle: { ...Typography.caption, marginTop: 2 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.base },
  emptyState: { alignItems: 'center', paddingTop: Spacing.xxxl },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  emptyTitle: { ...Typography.h3, marginBottom: Spacing.sm },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  suggestions: { width: '100%', gap: Spacing.sm },
  suggestionLabel: { ...Typography.label, marginBottom: Spacing.xs },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  suggestionText: { ...Typography.bodySmall, flex: 1 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.base,
  },
  errorText: { ...Typography.caption, flex: 1 },
  inputContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    maxHeight: 100,
    paddingVertical: Spacing.xs,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
