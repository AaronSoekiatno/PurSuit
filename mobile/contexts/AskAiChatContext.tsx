import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Keyboard } from "react-native";

import type { ChatGrounding, ChatMessage } from "../lib/askAiTypes";
import { feedPostToGroundingPayload } from "../lib/askAiTypes";
import { invokePursuitChat } from "../lib/chatApi";
import type { VisionPayload } from "../lib/visionTypes";
import type { Career, FeedPost } from "../lib/fixtures";
import { getRecentFeedPosts } from "../lib/recentFeedBuffer";
import type { WrappedStats } from "../lib/sessionSignals";

export type AskAiContextValue = {
  visible: boolean;
  grounding: ChatGrounding | null;
  messages: ChatMessage[];
  sending: boolean;
  error: string | null;
  headerSubtitle: string;
  openFromFeed: (post: FeedPost, vision?: VisionPayload | null) => void;
  openFromWrapped: (stats: WrappedStats) => void;
  openFromCareer: (career: Career) => void;
  close: () => void;
  sendMessage: (text: string) => Promise<void>;
  clearError: () => void;
};

const AskAiContext = createContext<AskAiContextValue | null>(null);

export function AskAiChatProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [grounding, setGrounding] = useState<ChatGrounding | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [headerSubtitle, setHeaderSubtitle] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const groundingRef = useRef<ChatGrounding | null>(null);
  /** Latest vision snapshot for feed grounding (re-sent on each message). */
  const feedVisionRef = useRef<VisionPayload | null>(null);

  useEffect(() => {
    groundingRef.current = grounding;
  }, [grounding]);

  const syncRef = useCallback((next: ChatMessage[]) => {
    messagesRef.current = next;
    setMessages(next);
  }, []);

  const openFromFeed = useCallback((post: FeedPost, vision?: VisionPayload | null) => {
    const g: ChatGrounding = {
      kind: "feed",
      activePost: feedPostToGroundingPayload(post),
      recentPosts: getRecentFeedPosts(),
    };
    setGrounding(g);
    feedVisionRef.current = vision ?? null;
    setHeaderSubtitle(post.career_tag);
    setError(null);
    setVisible(true);
  }, []);

  const openFromWrapped = useCallback((stats: WrappedStats) => {
    setGrounding({ kind: "wrapped", stats });
    setHeaderSubtitle("Session Wrapped");
    setError(null);
    setVisible(true);
  }, []);

  const openFromCareer = useCallback((career: Career) => {
    const g: ChatGrounding = {
      kind: "career",
      career: {
        id: career.id,
        title: career.title,
        category: career.category,
        overview: career.overview,
        salary: career.salary,
        skills: career.skills,
        pathways: career.pathways,
        tasks: career.tasks,
      },
    };
    setGrounding(g);
    setHeaderSubtitle(career.title);
    setError(null);
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    Keyboard.dismiss();
    feedVisionRef.current = null;
    setVisible(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      const g = groundingRef.current;
      if (!trimmed || !g || sending) return;

      const prev = [...messagesRef.current];
      const userMsg: ChatMessage = { role: "user", content: trimmed };
      const nextHistory = [...prev, userMsg];
      syncRef(nextHistory);
      setSending(true);
      setError(null);

      try {
        const vision =
          g.kind === "feed" ? feedVisionRef.current ?? undefined : undefined;
        const { reply } = await invokePursuitChat({
          grounding: g,
          messages: nextHistory,
          ...(vision &&
          (vision.imageUrls.length > 0 || vision.imagesBase64.length > 0)
            ? { vision }
            : {}),
        });
        syncRef([...nextHistory, { role: "assistant", content: reply }]);
      } catch (e) {
        syncRef(prev);
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setSending(false);
      }
    },
    [sending, syncRef],
  );

  const value = useMemo<AskAiContextValue>(
    () => ({
      visible,
      grounding,
      messages,
      sending,
      error,
      headerSubtitle,
      openFromFeed,
      openFromWrapped,
      openFromCareer,
      close,
      sendMessage,
      clearError,
    }),
    [
      visible,
      grounding,
      messages,
      sending,
      error,
      headerSubtitle,
      openFromFeed,
      openFromWrapped,
      openFromCareer,
      close,
      sendMessage,
      clearError,
    ],
  );

  return <AskAiContext.Provider value={value}>{children}</AskAiContext.Provider>;
}

export function useAskAi(): AskAiContextValue {
  const ctx = useContext(AskAiContext);
  if (!ctx) {
    throw new Error("useAskAi must be used within AskAiChatProvider");
  }
  return ctx;
}
