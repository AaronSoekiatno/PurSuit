import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAskAi } from "../contexts/AskAiChatContext";
import { APP_TAB_BAR_HEIGHT } from "../lib/layout";
import {
  computeWrapped,
  type WrappedStats,
} from "../lib/sessionSignals";

export default function WrappedScreen() {
  const insets = useSafeAreaInsets();
  const { visible: askVisible, openFromWrapped } = useAskAi();
  const [stats, setStats] = useState<WrappedStats | null>(null);

  useEffect(() => {
    void computeWrapped().then(setStats);
  }, []);

  const top = stats?.topCareers[0]?.career ?? "Data Analyst";

  return (
    <ScrollView
      style={styles.root}
      scrollEnabled={!askVisible}
      contentContainerStyle={{ paddingBottom: insets.bottom + APP_TAB_BAR_HEIGHT + 32 }}
    >
      <View style={[styles.head, { paddingTop: insets.top + 8 }]}>
        <Link href="/profile" asChild>
          <Pressable hitSlop={12}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
        </Link>
        <Text style={styles.title}>Session Wrapped</Text>
      </View>

      <LinearGradient colors={["#6d28d9", "#2563eb"]} style={styles.hero}>
        <Feather name="zap" size={24} color="#fff" />
        <Text style={styles.heroEyebrow}>Your top career this session</Text>
        <Text style={styles.heroBig}>{top}</Text>
        <Text style={styles.heroSub}>
          Based on what you watched, liked and saved
        </Text>
      </LinearGradient>

      <View style={styles.rowCards}>
        <Card
          title="Depth preference"
          big={(stats?.depth ?? "balanced").toUpperCase()}
          sub="how deep you watch"
        />
        <Card title="Most replayed" big={stats?.mostReplayed ?? "—"} sub="post id" />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Top careers explored</Text>
        <View style={{ marginTop: 12, gap: 10 }}>
          {(stats?.topCareers ?? []).slice(0, 5).map((c, i) => (
            <View key={c.career} style={styles.line}>
              <Text style={styles.lineLeft}>
                <Text style={styles.muted}>{i + 1}. </Text>
                {c.career}
              </Text>
              <Text style={styles.lineRight}>{c.score.toFixed(1)} pts</Text>
            </View>
          ))}
          {!stats?.topCareers.length && (
            <Text style={styles.muted}>Watch a few videos to populate this.</Text>
          )}
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Recurring themes</Text>
        <View style={styles.tags}>
          {(stats?.themes ?? []).map((t) => (
            <View key={t.name} style={styles.tag}>
              <Text style={styles.tagText}>{t.name}</Text>
            </View>
          ))}
          {!stats?.themes.length && (
            <Text style={styles.muted}>No themes yet.</Text>
          )}
        </View>
      </View>

      <Pressable
        style={styles.aiBtn}
        onPress={() => stats && openFromWrapped(stats)}
      >
        <Feather name="message-circle" size={18} color="#fff" />
        <Text style={styles.aiBtnText}>Ask AI to explain this</Text>
      </Pressable>

      <View style={styles.actions}>
        <Pressable style={styles.outlineBtn}>
          <Feather name="share-2" size={16} color="#fff" />
          <Text style={styles.outlineText}>Share recap</Text>
        </Pressable>
        <Pressable style={styles.outlineBtn}>
          <Feather name="bookmark" size={16} color="#fff" />
          <Text style={styles.outlineText}>Save recap</Text>
        </Pressable>
      </View>

    </ScrollView>
  );
}

function Card({
  title,
  big,
  sub,
}: {
  title: string;
  big: string;
  sub: string;
}) {
  return (
    <View style={styles.smallCard}>
      <Text style={styles.smallEyebrow}>{title}</Text>
      <Text style={styles.smallBig} numberOfLines={1}>
        {big}
      </Text>
      <Text style={styles.muted}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
  },
  title: { fontSize: 16, fontWeight: "700", color: "#fff" },
  hero: {
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 24,
    padding: 22,
    overflow: "hidden",
    gap: 6,
  },
  heroEyebrow: {
    marginTop: 14,
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
  },
  heroBig: { fontSize: 28, fontWeight: "800", color: "#fff" },
  heroSub: { fontSize: 11, color: "rgba(255,255,255,0.8)" },
  rowCards: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 14,
  },
  smallCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
    padding: 14,
  },
  smallEyebrow: {
    fontSize: 10,
    letterSpacing: 0.8,
    color: "#94a3b8",
    textTransform: "uppercase",
    fontWeight: "700",
  },
  smallBig: { marginTop: 8, fontSize: 14, fontWeight: "700", color: "#fff" },
  panel: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
    padding: 16,
  },
  panelTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  line: { flexDirection: "row", justifyContent: "space-between" },
  lineLeft: { fontSize: 13, color: "#fff", flex: 1, paddingRight: 8 },
  lineRight: { fontSize: 11, color: "#94a3b8" },
  muted: { fontSize: 13, color: "#94a3b8" },
  tags: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#020617",
  },
  tagText: { fontSize: 11, color: "#e2e8f0" },
  aiBtn: {
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: "#7c3aed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  aiBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 12,
  },
  outlineBtn: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  outlineText: { fontSize: 13, fontWeight: "600", color: "#fff" },
});
