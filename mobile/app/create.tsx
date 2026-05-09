import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { APP_TAB_BAR_HEIGHT } from "../lib/layout";

export default function CreateScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + APP_TAB_BAR_HEIGHT + 24 },
      ]}
    >
      <View style={styles.top}>
        <Link href="/" asChild>
          <Pressable hitSlop={12}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
        </Link>
        <Text style={styles.title}>Create</Text>
      </View>

      <View style={styles.center}>
        <LinearGradient colors={["#9333ea", "#4f46e5"]} style={styles.heroIcon}>
          <Feather name="tool" size={28} color="#fff" />
        </LinearGradient>
        <Text style={styles.headline}>Creator tools — coming soon</Text>
        <Text style={styles.sub}>
          Soon you'll be able to film a day-in-the-life and tag a career.
        </Text>
        <View style={styles.note}>
          <Feather name="zap" size={14} color="#94a3b8" />
          <Text style={styles.noteText}>Want early access? Sign in coming soon.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000", paddingHorizontal: 20 },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: { fontSize: 16, fontWeight: "700", color: "#fff" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 10,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  headline: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  sub: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
  },
  note: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 999,
    backgroundColor: "#0f172a",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  noteText: { fontSize: 11, color: "#94a3b8", flexShrink: 1 },
});
