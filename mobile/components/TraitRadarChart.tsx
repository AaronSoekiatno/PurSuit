import type { TraitVector } from "../lib/traitFit";
import {
  formatTraitLabel,
  radarPolygonPoints,
  regularPolygonPoints,
  selectRadarAxes,
} from "../lib/traitRadar";
import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, {
  Line,
  Polygon,
  Text as SvgText,
} from "react-native-svg";

const SIZE = 320;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_DATA_R = 108;
const LABEL_R = MAX_DATA_R + 26;

type Props = {
  userVector: TraitVector;
  recommendedCareer: string | null;
};

export function TraitRadarChart({ userVector, recommendedCareer }: Props) {
  const axes = useMemo(() => selectRadarAxes(userVector), [userVector]);
  const [overlayVisible, setOverlayVisible] = useState(false);

  const n = axes.length;
  const normalizedRadii = axes.map((a) => a.normalized);

  const gridFracs = [0.35, 0.65, 1];
  const dataPoints =
    n > 0 ? radarPolygonPoints(CX, CY, normalizedRadii, MAX_DATA_R) : "";

  if (n < 2) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Statistics</Text>

      <View style={styles.chartArea}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Trait radar chart"
          accessibilityHint={
            recommendedCareer
              ? Platform.OS === "web"
                ? "Hover to see recommended career"
                : "Tap to see recommended career"
              : undefined
          }
          style={styles.pressArea}
          onHoverIn={() => {
            if (recommendedCareer) setOverlayVisible(true);
          }}
          onHoverOut={() => setOverlayVisible(false)}
          onPress={() => {
            if (Platform.OS === "web") return;
            if (!recommendedCareer) return;
            setOverlayVisible((v) => !v);
          }}
        >
          <Svg width={SIZE} height={SIZE}>
            {gridFracs.map((frac) => (
              <Polygon
                key={`grid-${frac}`}
                points={regularPolygonPoints(CX, CY, MAX_DATA_R * frac, n)}
                fill="none"
                stroke="rgba(148,163,184,0.35)"
                strokeWidth={1}
              />
            ))}

            {Array.from({ length: n }, (_, i) => {
              const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
              const x2 = CX + MAX_DATA_R * Math.cos(angle);
              const y2 = CY + MAX_DATA_R * Math.sin(angle);
              return (
                <Line
                  key={`axis-${axes[i]!.key}`}
                  x1={CX}
                  y1={CY}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(148,163,184,0.45)"
                  strokeWidth={1}
                />
              );
            })}

            <Polygon
              points={dataPoints}
              fill="rgba(167,139,250,0.28)"
              stroke="#c4b5fd"
              strokeWidth={2}
            />

            {axes.map((axis, i) => {
              const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
              const lx = CX + LABEL_R * Math.cos(angle);
              const ly = CY + LABEL_R * Math.sin(angle);
              const label = formatTraitLabel(axis.key);
              return (
                <SvgText
                  key={axis.key}
                  x={lx}
                  y={ly}
                  fill="#cbd5e1"
                  fontSize={10}
                  fontWeight="600"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {label}
                </SvgText>
              );
            })}
          </Svg>
        </Pressable>

        {overlayVisible && recommendedCareer ? (
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.overlayCard}>
              <Text style={styles.overlayEyebrow}>Recommended career</Text>
              <Text style={styles.overlayCareer}>{recommendedCareer}</Text>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 18,
    marginHorizontal: 22,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginTop: 24
  },
  sectionHint: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 10,
  },
  chartArea: {
    width: SIZE,
    height: SIZE,
    alignSelf: "center",
  },
  pressArea: {
    width: SIZE,
    height: SIZE,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  overlayCard: {
    marginHorizontal: 28,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(15,23,42,0.95)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.45)",
  },
  overlayEyebrow: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  overlayCareer: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
});
