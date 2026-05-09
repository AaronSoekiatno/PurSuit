import { Feather } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { careers, type Career } from "../lib/fixtures";
import { selectionHaptic, tapHaptic } from "../lib/haptics";

const FILTERS = ["All", "Tech", "Design", "Healthcare", "Engineering", "Remote-friendly"];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");

  const results = useMemo(() => {
    return careers.filter((c) => {
      const matchesQ =
        q.trim() === "" || c.title.toLowerCase().includes(q.toLowerCase());
      const matchesF =
        filter === "All" ||
        c.category === filter ||
        (filter === "Remote-friendly" && c.category === "Tech");
      return matchesQ && matchesF;
    });
  }, [q, filter]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topRow}>
        <Link href="/" asChild>
          <Pressable hitSlop={12} onPressIn={() => tapHaptic()}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
        </Link>
        <View style={styles.inputWrap}>
          <Feather name="search" size={18} color="#64748b" style={styles.inputIcon} />
          <TextInput
            placeholder="Search careers, skills…"
            placeholderTextColor="#64748b"
            value={q}
            onChangeText={setQ}
            style={styles.input}
            autoFocus
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPressIn={() => selectionHaptic()}
            onPress={() => setFilter(f)}
            style={[styles.chip, filter === f && styles.chipOn]}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextOn]}>{f}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.sectionLabel}>{q.trim() ? "Results" : "Trending careers"}</Text>

      <FlatList
        data={results}
        numColumns={2}
        keyExtractor={(c) => c.id}
        columnWrapperStyle={styles.column}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        renderItem={({ item }: { item: Career }) => (
          <Pressable
            style={styles.card}
            onPressIn={() => tapHaptic()}
            onPress={() => router.push(`/career/${item.id}`)}
          >
            <Text style={styles.emoji}>{item.emoji}</Text>
            <View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>{item.category}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No careers match “{q}”</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000", paddingHorizontal: 20 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1e293b",
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: "#fff", paddingVertical: 12, fontSize: 14 },
  chipsRow: { marginTop: 16 },
  chip: {
    marginRight: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#0f172a",
  },
  chipOn: {
    borderColor: "transparent",
    backgroundColor: "#fff",
  },
  chipText: { fontSize: 12, fontWeight: "600", color: "#cbd5e1" },
  chipTextOn: { color: "#000" },
  sectionLabel: {
    marginTop: 22,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#64748b",
    textTransform: "uppercase",
  },
  column: { gap: 12 },
  card: {
    flex: 1,
    aspectRatio: 4 / 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
    padding: 12,
    justifyContent: "space-between",
  },
  emoji: { fontSize: 32 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#fff" },
  cardMeta: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  empty: {
    marginTop: 28,
    textAlign: "center",
    fontSize: 14,
    color: "#64748b",
  },
});
