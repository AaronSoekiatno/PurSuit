import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { careers } from "../lib/fixtures";
import { APP_TAB_BAR_HEIGHT } from "../lib/layout";

const TABS = ["Saved Careers", "Saved Videos", "Recaps"] as const;

type ProfileTab = (typeof TABS)[number];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<ProfileTab>("Saved Careers");

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: insets.bottom + APP_TAB_BAR_HEIGHT + 32 }}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.row}>
          <LinearGradient colors={["#e879f9", "#38bdf8"]} style={styles.avatar}>
            <Text style={styles.avatarLetter}>U</Text>
          </LinearGradient>
          <View>
            <Text style={styles.name}>Your name</Text>
            <Text style={styles.handle}>@you</Text>
          </View>
        </View>
        <Link href="/settings" asChild>
          <Pressable hitSlop={12}>
            <Feather name="settings" size={22} color="#94a3b8" />
          </Pressable>
        </Link>
      </View>

      <View style={styles.stats}>
        <Stat label="Watched" value="48" />
        <Stat label="Saved" value="12" />
        <Stat label="Recaps" value="3" />
      </View>

      <Pressable style={styles.wrappedBanner} onPress={() => router.push("/wrapped")}>
        <View>
          <Text style={styles.bannerTitle}>Your Session Wrapped</Text>
          <Text style={styles.bannerSub}>See what you've been exploring</Text>
        </View>
        <LinearGradient colors={["#9333ea", "#4f46e5"]} style={styles.bannerCta}>
          <Text style={styles.bannerCtaText}>View</Text>
        </LinearGradient>
      </Pressable>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabOn]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextOn]} numberOfLines={1}>
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.grid}>
        {tab === "Saved Careers" &&
          careers.slice(0, 4).map((c) => (
            <Pressable
              key={c.id}
              style={styles.card}
              onPress={() => router.push(`/career/${c.id}`)}
            >
              <Text style={styles.emoji}>{c.emoji}</Text>
              <View>
                <Text style={styles.cardTitle}>{c.title}</Text>
                <Text style={styles.cardMeta}>{c.category}</Text>
              </View>
            </Pressable>
          ))}
        {tab === "Saved Videos" && (
          <Empty msg="No saved videos yet. Tap the bookmark on any video." />
        )}
        {tab === "Recaps" && (
          <Empty msg="Open Wrapped to generate your first recap." />
        )}
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Empty({ msg }: { msg: string }) {
  return <Text style={styles.empty}>{msg}</Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontSize: 22, fontWeight: "700", color: "#fff" },
  name: { fontSize: 16, fontWeight: "700", color: "#fff" },
  handle: { marginTop: 2, fontSize: 12, color: "#94a3b8" },
  stats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  stat: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
    alignItems: "center",
    paddingVertical: 12,
  },
  statVal: { fontSize: 16, fontWeight: "700", color: "#fff" },
  statLabel: { marginTop: 4, fontSize: 11, color: "#94a3b8" },
  wrappedBanner: {
    marginTop: 18,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bannerTitle: { fontSize: 14, fontWeight: "700", color: "#fff" },
  bannerSub: { marginTop: 4, fontSize: 11, color: "#94a3b8" },
  bannerCta: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  bannerCtaText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 22,
    backgroundColor: "#1e293b",
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 999 },
  tabOn: { backgroundColor: "#fff" },
  tabText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
    paddingHorizontal: 4,
    textAlign: "center",
  },
  tabTextOn: { color: "#000" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 20,
  },
  card: {
    width: "47%",
    aspectRatio: 4 / 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
    padding: 12,
    justifyContent: "space-between",
  },
  emoji: { fontSize: 32 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#fff" },
  cardMeta: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  empty: {
    flexBasis: "100%",
    marginTop: 12,
    textAlign: "center",
    fontSize: 13,
    color: "#64748b",
    paddingHorizontal: 8,
  },
});
