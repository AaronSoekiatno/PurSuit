import { Feather } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAskAi } from "../contexts/AskAiChatContext";
import type { ChatMessage } from "../lib/askAiTypes";

/** Padding under last bubble (composer sits below the ScrollView, not overlaid). */
const LIST_END_PADDING = 16;

const KEYBOARD_BOTTOM_GAP = 6;

const MD_STYLES = StyleSheet.create({
  body: { color: "#e2e8f0", fontSize: 14, lineHeight: 22 },
  paragraph: { marginTop: 0, marginBottom: 10 },
  strong: { fontWeight: "700", color: "#f8fafc" },
  em: { fontStyle: "italic", color: "#e2e8f0" },
  bullet_list: { marginBottom: 8 },
  ordered_list: { marginBottom: 8 },
  list_item: { marginBottom: 4, flexDirection: "row" },
  link: { color: "#c4b5fd", textDecorationLine: "underline" },
  code_inline: {
    backgroundColor: "#334155",
    color: "#f1f5f9",
    borderWidth: 0,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    fontSize: 13,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  code_block: {
    backgroundColor: "#020617",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#334155",
    color: "#e2e8f0",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    fontSize: 12,
    lineHeight: 18,
  },
  fence: {
    backgroundColor: "#020617",
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#334155",
    color: "#e2e8f0",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    fontSize: 12,
    lineHeight: 18,
  },
  heading1: { color: "#f8fafc", fontSize: 18, fontWeight: "700", marginBottom: 8 },
  heading2: { color: "#f8fafc", fontSize: 16, fontWeight: "700", marginBottom: 6 },
  heading3: { color: "#f1f5f9", fontSize: 15, fontWeight: "700", marginBottom: 6 },
  hr: {
    backgroundColor: "#475569",
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: "#7c3aed",
    paddingLeft: 10,
    marginBottom: 10,
    opacity: 0.95,
  },
});

function ChatComposer({
  sending,
  onSend,
}: {
  sending: boolean;
  onSend: (text: string) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const s1 = Keyboard.addListener(showEvt, () => setKeyboardOpen(true));
    const s2 = Keyboard.addListener(hideEvt, () => setKeyboardOpen(false));
    return () => {
      s1.remove();
      s2.remove();
    };
  }, []);

  const padBottom = keyboardOpen ? KEYBOARD_BOTTOM_GAP : Math.max(insets.bottom, 12);

  const submit = useCallback(async () => {
    const t = draft.trim();
    if (!t || sending) return;
    setDraft("");
    await onSend(t);
  }, [draft, sending, onSend]);

  return (
    <View style={[styles.composerStrip, { paddingBottom: padBottom }]}>
      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Message…"
          placeholderTextColor="#64748b"
          style={styles.input}
          multiline
          maxLength={4000}
          editable={!sending}
          blurOnSubmit={false}
          onSubmitEditing={() => void submit()}
        />
        <Pressable
          onPress={() => void submit()}
          style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnOff]}
          disabled={!draft.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Feather name="send" size={18} color="#fff" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

function Bubble({ msg }: { msg: ChatMessage }): ReactElement {
  const isUser = msg.role === "user";
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAsst]}>
        {isUser ? (
          <Text style={[styles.bubbleText, styles.bubbleTextUser]}>{msg.content}</Text>
        ) : (
          <View style={styles.markdownBox}>
            <Markdown style={MD_STYLES}>{msg.content}</Markdown>
          </View>
        )}
      </View>
    </View>
  );
}

/**
 * Plain Modal + RN ScrollView only — no @gorhom/bottom-sheet inside Modal (that combo often breaks
 * iOS scroll/contentSize). Snap-to-expand gestures removed; backdrop tap + X close.
 */
export function AskAiChatSheet() {
  const insets = useSafeAreaInsets();

  const {
    visible,
    close,
    messages,
    sendMessage,
    sending,
    error,
    clearError,
    headerSubtitle,
  } = useAskAi();

  const { width: winW, height: winH } = useWindowDimensions();
  const sheetHeight = Math.min(winH * 0.88, winH - insets.top - 8);

  const listContentStyle = useMemo(
    () => [
      styles.listContent,
      { paddingBottom: LIST_END_PADDING },
      messages.length === 0 && styles.listContentWhenEmpty,
    ],
    [messages.length],
  );

  const sendFromComposer = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || sending) return;
      clearError();
      await sendMessage(t);
    },
    [sending, sendMessage, clearError],
  );

  const stickyHeader = useMemo(
    () => (
      <View style={styles.stickyHeader}>
        <View style={styles.headRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Ask AI</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {headerSubtitle}
            </Text>
          </View>
          <Pressable onPress={close} hitSlop={12} accessibilityLabel="Close Ask AI">
            <Feather name="x" size={22} color="#94a3b8" />
          </Pressable>
        </View>

        <Text style={styles.disclaimer}>
          For exploration only — not professional advice. Answers may be wrong; verify next steps.
        </Text>

        {error ? (
          <View style={styles.errBar}>
            <Text style={styles.errText}>{error}</Text>
            <Pressable onPress={clearError} hitSlop={8}>
              <Text style={styles.errDismiss}>Dismiss</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    ),
    [headerSubtitle, error, close, clearError],
  );

  const listFooter = useMemo(
    () =>
      sending ? (
        <View style={styles.typingRow} accessibilityLiveRegion="polite">
          <ActivityIndicator size="small" color="#a78bfa" />
          <Text style={styles.typingText}>Thinking…</Text>
        </View>
      ) : null,
    [sending],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      {...(Platform.OS === "ios" ? { presentationStyle: "overFullScreen" as const } : {})}
      onRequestClose={close}
    >
      {visible ? (
        <View style={[styles.modalHost, { width: winW, height: winH }]}>
          <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Dismiss" />

          <KeyboardAvoidingView
            style={styles.keyboardAvoid}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
          >
            <View style={[styles.sheet, { height: sheetHeight, width: winW }]}>
              <View style={styles.handleOuter}>
                <View style={styles.handleIndicator} />
              </View>

              {stickyHeader}

              <ScrollView
                style={styles.messageList}
                contentContainerStyle={listContentStyle}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
                contentInsetAdjustmentBehavior={
                  Platform.OS === "ios" ? "never" : undefined
                }
              >
                {messages.length === 0 ? (
                  <Text style={styles.empty}>
                    Ask about this screen, the career on the card, or your session recap. I’ll stay
                    in career-exploration territory.
                  </Text>
                ) : (
                  messages.map((msg, i) => <Bubble key={`m-${i}`} msg={msg} />)
                )}
                {listFooter}
              </ScrollView>

              <ChatComposer sending={sending} onSend={sendFromComposer} />
            </View>
          </KeyboardAvoidingView>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalHost: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.48)",
    zIndex: 0,
  },
  /** Must fill the modal so iOS measures keyboard vs full screen; otherwise the sheet sits too high. */
  keyboardAvoid: {
    flex: 1,
    justifyContent: "flex-end",
    width: "100%",
    zIndex: 1,
  },
  sheet: {
    alignSelf: "center",
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    flexDirection: "column",
  },
  handleOuter: {
    paddingTop: 10,
    paddingBottom: 4,
    alignItems: "center",
  },
  handleIndicator: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#64748b",
  },
  messageList: {
    flex: 1,
    minHeight: 0,
  },
  stickyHeader: {
    flexShrink: 0,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#0f172a",
  },
  headRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#fff" },
  subtitle: { marginTop: 4, fontSize: 13, color: "#a78bfa" },
  disclaimer: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 15,
    color: "#64748b",
  },
  errBar: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(248,113,113,0.12)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errText: { flex: 1, fontSize: 12, color: "#fecaca" },
  errDismiss: { fontSize: 12, fontWeight: "600", color: "#fda4af" },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  /** Avoid `flexGrow: 1` on real chats — common iOS ScrollView wrong content-extent bug. */
  listContentWhenEmpty: {
    flexGrow: 1,
  },
  empty: {
    fontSize: 13,
    lineHeight: 19,
    color: "#64748b",
    paddingHorizontal: 4,
    paddingVertical: 16,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  typingText: {
    fontSize: 13,
    color: "#a78bfa",
    fontWeight: "600",
  },
  bubbleRow: { marginBottom: 10, alignItems: "flex-start" },
  bubbleRowUser: { alignItems: "flex-end" },
  bubble: {
    maxWidth: "88%",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  markdownBox: { alignSelf: "stretch" },
  bubbleUser: { backgroundColor: "#7c3aed" },
  bubbleAsst: { backgroundColor: "#1e293b" },
  bubbleText: { fontSize: 14, lineHeight: 22 },
  bubbleTextUser: { color: "#fff" },
  composerStrip: {
    backgroundColor: "#0f172a",
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingTop: 6,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#334155",
    backgroundColor: "#0f172a",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#020617",
    color: "#f1f5f9",
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnOff: { opacity: 0.45 },
});
