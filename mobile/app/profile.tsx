import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TraitRadarChart } from "../components/TraitRadarChart";
import { careers } from "../lib/fixtures";
import { selectionHaptic, tapHaptic } from "../lib/haptics";
import { getCareerFitFromSignals } from "../lib/traitFit";

const TABS = ["Saved Careers", "Saved Videos"] as const;

type ProfileTab = (typeof TABS)[number];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<ProfileTab>("Saved Careers");

  const { data: fit } = useQuery({
    queryKey: ["careerFit"],
    queryFn: getCareerFitFromSignals,
    staleTime: 15_000,
  });

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
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
          <Pressable hitSlop={12} onPressIn={() => tapHaptic()}>
            <Feather name="settings" size={22} color="#94a3b8" />
          </Pressable>
        </Link>
      </View>

      <View style={styles.fitCard}>
        {fit?.recommendedCareer ? (
          <>
            <Text style={styles.fitRecommendationLead}>You should pursue being a…</Text>
            <Text style={styles.fitCareerTitle}>{fit.recommendedCareer}</Text>
          </>
        ) : (
          <Text style={styles.fitEmpty}>
            Scroll the For You feed to build your trait profile — we compare your engagement
            to each career&apos;s tags.
          </Text>
        )}
      </View>

      {fit ? (
        <TraitRadarChart
          userVector={fit.userVector}
          recommendedCareer={fit.recommendedCareer}
        />
      ) : null}

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t}
            onPressIn={() => selectionHaptic()}
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
              onPressIn={() => tapHaptic()}
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
      </View>
    </ScrollView>
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
  fitCard: {
    marginTop: 22,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 6,
  },
  fitRecommendationLead: {
    marginTop: 0,
    fontSize: 17,
    lineHeight: 24,
    color: "#e2e8f0",
    textAlign: "center",
  },
  fitCareerTitle: {
    marginTop: 8,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  fitEmpty: { fontSize: 13, color: "#94a3b8", lineHeight: 18 },
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
