import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { tapHaptic } from "../lib/haptics";
import { APP_TAB_BAR_HEIGHT } from "../lib/layout";

export default function FollowingScreen() {
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
          <Pressable hitSlop={12} onPressIn={() => tapHaptic()}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
        </Link>
        <Text style={styles.title}>Following</Text>
      </View>

      <View style={styles.center}>
        <View style={styles.circle}>
          <Feather name="users" size={32} color="#94a3b8" />
        </View>
        <Text style={styles.headline}>No followed creators yet</Text>
        <Text style={styles.sub}>
          Tap the + on any creator's avatar in your For You feed.
        </Text>
        <Link href="/" asChild>
          <Pressable style={styles.cta} onPressIn={() => tapHaptic()}>
            <Text style={styles.ctaText}>Explore For You</Text>
          </Pressable>
        </Link>
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
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  headline: {
    marginTop: 18,
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  sub: {
    marginTop: 8,
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 18,
  },
  cta: {
    marginTop: 22,
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  ctaText: { fontSize: 13, fontWeight: "700", color: "#000" },
});
