import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

function skip(): boolean {
  return Platform.OS === "web";
}

/** Standard tap / button feedback */
export function tapHaptic(): void {
  if (skip()) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Tabs, toggles, segmented controls */
export function selectionHaptic(): void {
  if (skip()) return;
  void Haptics.selectionAsync();
}

/** Stronger confirmation (e.g. like, success path) */
export function successHaptic(): void {
  if (skip()) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
