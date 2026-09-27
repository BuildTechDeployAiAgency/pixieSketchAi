import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { X, RefreshCw } from "lucide-react-native";
import { colors, PRESS_OPACITY } from "@/theme";
import { radii } from "@/theme/spacing";
import { shadows } from "@/theme/shadows";

type ImagePreviewProps = {
  uri: string;
  onClose: () => void;
};

export function ImagePreview({ uri, onClose }: ImagePreviewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image
          source={{ uri }}
          style={styles.image}
          contentFit="contain"
          accessibilityLabel="Selected drawing preview"
        />
        {/* Top gradient overlay for close button visibility */}
        <View style={styles.topOverlay} />
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Remove selected image"
        >
          <X color={colors.white} size={16} strokeWidth={2.5} />
        </Pressable>
      </View>
      <Pressable
        onPress={onClose}
        style={({ pressed }) => [
          styles.changeRow,
          { opacity: pressed ? PRESS_OPACITY : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Change selected image"
      >
        <RefreshCw color={colors.primary.DEFAULT} size={14} />
        <Text style={styles.changeText}>Change image</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  card: {
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.gray[100],
    ...shadows.sm,
  },
  image: {
    width: "100%",
    height: 280,
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "transparent",
    // Using border trick for a subtle gradient feel
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 20,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  changeText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary.DEFAULT,
    letterSpacing: -0.2,
  },
});
