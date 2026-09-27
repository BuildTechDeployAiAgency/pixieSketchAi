import { View, Text, Pressable, StyleSheet } from "react-native";
import { Camera, ImageIcon } from "lucide-react-native";
import { colors, PRESS_OPACITY } from "@/theme";
import { radii } from "@/theme/spacing";
import { shadows } from "@/theme/shadows";

type ImagePickerCardsProps = {
  onPickGallery: () => void;
  onPickCamera: () => void;
  isCompact: boolean;
};

export function ImagePickerCards({
  onPickGallery,
  onPickCamera,
}: ImagePickerCardsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Choose your drawing</Text>

      <View style={styles.row}>
        {/* Camera card */}
        <Pressable
          onPress={onPickCamera}
          style={({ pressed }) => [
            styles.card,
            { opacity: pressed ? PRESS_OPACITY : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Take a photo with camera"
        >
          <View style={styles.iconWrap}>
            <Camera color={colors.primary.DEFAULT} size={26} />
          </View>
          <Text style={styles.cardTitle}>Take Photo</Text>
          <Text style={styles.cardSubtitle}>Use your camera</Text>
        </Pressable>

        {/* Gallery card */}
        <Pressable
          onPress={onPickGallery}
          style={({ pressed }) => [
            styles.card,
            { opacity: pressed ? PRESS_OPACITY : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Upload from photo gallery"
        >
          <View style={styles.iconWrap}>
            <ImageIcon color={colors.primary.DEFAULT} size={26} />
          </View>
          <Text style={styles.cardTitle}>Upload</Text>
          <Text style={styles.cardSubtitle}>From your library</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },

  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.gray[700],
    marginBottom: 12,
    letterSpacing: -0.3,
  },

  row: {
    flexDirection: "row",
    gap: 12,
  },

  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.xs,
  },

  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.gray[900],
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.gray[400],
    textAlign: "center",
  },
});
