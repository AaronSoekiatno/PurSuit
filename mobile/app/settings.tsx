import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { APP_TAB_BAR_HEIGHT } from "../lib/layout";
import { clearSignals } from "../lib/sessionSignals";

const LANGS = ["English", "Español", "Français"] as const;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [captions, setCaptions] = useState(true);
  const [sessionOnly, setSessionOnly] = useState(false);
  const [langIdx, setLangIdx] = useState(0);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: insets.bottom + APP_TAB_BAR_HEIGHT + 32 }}
    >
      <View style={[styles.head, { paddingTop: insets.top + 8 }]}>
        <Link href="/" asChild>
          <Pressable hitSlop={12}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
        </Link>
        <Text style={styles.title}>Settings</Text>
      </View>

      <Group title="Playback">
        <Row label="Captions" desc="Show captions on videos when available">
          <Switch value={captions} onValueChange={setCaptions} />
        </Row>
      </Group>

      <Group title="Language">
        <Row label="App language" desc="Affects feed and UI">
          <Pressable
            style={styles.langBtn}
            onPress={() =>
              setLangIdx((i) => (i + 1) % LANGS.length)
            }
          >
            <Text style={styles.langText}>{LANGS[langIdx]}</Text>
            <Feather name="chevron-down" size={16} color="#94a3b8" />
          </Pressable>
        </Row>
      </Group>

      <Group title="Privacy">
        <Row label="Session-only mode" desc="Don't persist watch history for this demo build.">
          <Switch value={sessionOnly} onValueChange={setSessionOnly} />
        </Row>
        <Pressable
          style={styles.clearBtn}
          onPress={() => {
            void clearSignals();
          }}
        >
          <Feather name="trash-2" size={16} color="#f87171" />
          <Text style={styles.clearText}>Clear session analytics</Text>
        </Pressable>
      </Group>

      <Group title="About">
        <Row label="Version" desc="PurSuit mobile preview">
          <Text style={styles.beta}>beta</Text>
        </Row>
      </Group>
    </ScrollView>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupBody}>{children}</View>
    </View>
  );
}

function Row({
  label,
  desc,
  children,
}: {
  label: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      {children}
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
  group: { marginTop: 22, paddingHorizontal: 20 },
  groupTitle: {
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#64748b",
    textTransform: "uppercase",
  },
  groupBody: { gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: "600", color: "#fff" },
  rowDesc: {
    marginTop: 4,
    fontSize: 11,
    color: "#94a3b8",
  },
  langBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#020617",
  },
  langText: { fontSize: 13, color: "#fff" },
  clearBtn: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    paddingVertical: 14,
    backgroundColor: "#0f172a",
  },
  clearText: { fontSize: 14, fontWeight: "600", color: "#f87171" },
  beta: { fontSize: 11, color: "#94a3b8" },
});
