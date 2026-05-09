import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { Link, usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { homeFeedListRef } from "../lib/homeFeedListRef";
import { tapHaptic } from "../lib/haptics";
import { APP_TAB_BAR_HEIGHT } from "../lib/layout";

export function AppBottomBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const padBottom = Math.max(insets.bottom, 12);

  const isHome = pathname === "/" || pathname === "/index";
  const isProfile = pathname === "/profile";

  return (
    <View style={[styles.bar, { paddingBottom: padBottom }]}>
      <Pressable
        style={styles.item}
        onPressIn={() => tapHaptic()}
        onPress={() => {
          if (isHome) {
            homeFeedListRef.current?.scrollToOffset({ offset: 0, animated: true });
            void queryClient.invalidateQueries({ queryKey: ["feed"] });
          } else {
            router.push("/");
          }
        }}
      >
        <Feather name="home" size={24} color={isHome ? "#fff" : "rgba(255,255,255,0.6)"} />
        <Text style={isHome ? styles.labelOn : styles.label}>Home</Text>
      </Pressable>
      <Link href="/create" asChild>
        <Pressable style={styles.createBtn}>
          <Feather name="plus" size={22} color="#000" />
        </Pressable>
      </Link>
      <Link href="/profile" asChild>
        <Pressable style={styles.item}>
          <Feather
            name="user"
            size={24}
            color={isProfile ? "#fff" : "rgba(255,255,255,0.6)"}
          />
          <Text style={isProfile ? styles.labelOn : styles.label}>Profile</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: APP_TAB_BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-around",
    paddingHorizontal: 24,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.95)",
    zIndex: 40,
    elevation: 24,
  },
  item: { flex: 1, alignItems: "center", gap: 4 },
  label: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.6)" },
  labelOn: { fontSize: 11, fontWeight: "700", color: "#fff" },
  createBtn: {
    width: 56,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
