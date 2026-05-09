import { Feather } from "@expo/vector-icons";
import { Link, useLocalSearchParams, router } from "expo-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AskAiModal } from "../../components/AskAiModal";
import { careers } from "../../lib/fixtures";
import { slugify } from "../../lib/slug";

export default function CareerDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState(false);
  const [askOpen, setAskOpen] = useState(false);

  const career = useMemo(() => {
    const raw = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";
    if (!raw) return undefined;
    return careers.find((c) => c.id === raw || slugify(c.title) === raw);
  }, [id]);

  if (!career) {
    return (
      <View
        style={[
          styles.missRoot,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Text style={styles.miss}>Career not found.</Text>
        <Pressable style={styles.cta} onPress={() => router.push("/search")}>
          <Text style={styles.ctaText}>Browse careers</Text>
        </Pressable>
        <Link href="/" asChild>
          <Pressable style={styles.link}>
            <Text style={styles.linkText}>Back home</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  const c = career;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
    >
      <View style={[styles.toolbar, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={14} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </Pressable>
        <Pressable
          hitSlop={14}
          onPress={() => setSaved((v) => !v)}
          accessibilityLabel="Bookmark"
          style={styles.bookmarkBtn}
        >
          <Feather
            name="bookmark"
            size={18}
            color={saved ? "#fff" : "#cbd5e1"}
          />
        </Pressable>
      </View>

      <View style={styles.heroRow}>
        <Text style={styles.emoji}>{c.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.category}>{c.category}</Text>
          <Text style={styles.title}>{c.title}</Text>
        </View>
      </View>

      <Text style={styles.overview}>{c.overview}</Text>

      <Pressable style={styles.aiBtn} onPress={() => setAskOpen(true)}>
        <Feather name="zap" size={16} color="#fff" />
        <Text style={styles.aiText}>Ask AI about this</Text>
      </Pressable>

      <Section title="Salary">
        <Text style={styles.p}>{c.salary}</Text>
        <Text style={styles.note}>
          Salary varies widely by location, employer, and experience.
        </Text>
      </Section>

      <Section title="Skills">
        <View style={styles.chips}>
          {c.skills.map((s) => (
            <View key={s} style={styles.chip}>
              <Text style={styles.chipText}>{s}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Pathways in">
        {c.pathways.map((p) => (
          <View key={p} style={styles.box}>
            <Text style={styles.p}>{p}</Text>
          </View>
        ))}
      </Section>

      <Section title="Day-to-day tasks">
        {c.tasks.map((t) => (
          <View key={t} style={styles.box}>
            <Text style={styles.bulletMuted}>›</Text>
            <Text style={[styles.p, { flex: 1 }]}>{t}</Text>
          </View>
        ))}
      </Section>

      <Section title="Resources">
        {["O*NET profile", "Subreddit", "BLS outlook"].map((r) => (
          <View key={r} style={styles.resRow}>
            <Feather name="external-link" size={13} color="#94a3b8" />
            <Text style={styles.resText}>{r}</Text>
          </View>
        ))}
      </Section>

      <AskAiModal visible={askOpen} onClose={() => setAskOpen(false)} career={c.title} />
    </ScrollView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ gap: 8 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000", paddingHorizontal: 20 },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  bookmarkBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 10,
    backgroundColor: "#0f172a",
  },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  emoji: { fontSize: 48 },
  category: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  title: { marginTop: 4, fontSize: 26, fontWeight: "800", color: "#fff" },
  overview: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 22,
    color: "#e2e8f0",
  },
  aiBtn: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#7c3aed",
  },
  aiText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  section: { marginTop: 22 },
  sectionTitle: {
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#64748b",
    textTransform: "uppercase",
  },
  p: { fontSize: 14, color: "#e2e8f0" },
  note: { marginTop: 6, fontSize: 11, color: "#94a3b8", lineHeight: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#0f172a",
  },
  chipText: { fontSize: 11, color: "#e2e8f0" },
  box: {
    flexDirection: "row",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
    padding: 12,
  },
  bulletMuted: { color: "#64748b", marginTop: 1 },
  resRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  resText: { fontSize: 13, color: "#94a3b8" },
  missRoot: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  miss: { fontSize: 14, color: "#94a3b8", textAlign: "center" },
  cta: {
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  ctaText: { fontSize: 13, fontWeight: "700", color: "#000" },
  link: { padding: 8 },
  linkText: { fontSize: 13, color: "#a78bfa" },
});
