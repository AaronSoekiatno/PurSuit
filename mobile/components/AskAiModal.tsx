import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { tapHaptic } from "../lib/haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
  career: string;
};

/** Bottom sheet–style placeholder matching web `AskAiSheet` intent. */
export function AskAiModal({ visible, onClose, career }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        onPressIn={() => tapHaptic()}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 20) + 12,
              maxHeight: height * 0.45,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>Ask AI</Text>
          <Text style={styles.career}>{career}</Text>
          <Text style={styles.body}>
            Wire your model or edge function here. This build only shows the UX shell from the web app.
          </Text>
          <Pressable
            onPressIn={() => tapHaptic()}
            onPress={onClose}
            style={styles.closeBtn}
          >
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#334155",
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#fff" },
  career: { fontSize: 14, color: "#a78bfa", marginTop: 6 },
  body: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 20,
    color: "#94a3b8",
  },
  closeBtn: {
    marginTop: 22,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  closeText: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
});
