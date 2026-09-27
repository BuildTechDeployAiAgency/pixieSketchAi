import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { ImageIcon, Check } from "lucide-react-native";
import { colors, PRESS_OPACITY } from "@/theme";
import { radii } from "@/theme/spacing";
import { shadows } from "@/theme/shadows";
import type { Sketch } from "@/hooks/sketch/useSketchState";

type CharacterPickerProps = {
  completedSketches: Sketch[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export function CharacterPicker({
  completedSketches,
  selectedId,
  onSelect,
}: CharacterPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Pick a character</Text>
      <Text style={styles.subheading}>
        Choose a character to star in your story
      </Text>
      {completedSketches.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <ImageIcon color={colors.primary[300]} size={28} />
          </View>
          <Text style={styles.emptyTitle}>No characters yet</Text>
          <Text style={styles.emptyText}>
            Transform a drawing first to use it as a character
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {completedSketches.map((sketch) => {
            const isSelected = selectedId === sketch.id;
            return (
              <Pressable
                key={sketch.id}
                onPress={() => onSelect(isSelected ? null : sketch.id)}
                style={({ pressed }) => ({
                  opacity: pressed ? PRESS_OPACITY : 1,
                })}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={sketch.name ?? "Character"}
              >
                <View
                  style={[
                    styles.card,
                    isSelected && styles.cardSelected,
                  ]}
                >
                  <Image
                    source={{ uri: sketch.animated_image_url! }}
                    style={styles.image}
                    contentFit="cover"
                  />
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Check color={colors.white} size={11} strokeWidth={3} />
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.cardLabel,
                    isSelected && styles.cardLabelSelected,
                  ]}
                  numberOfLines={1}
                >
                  {sketch.name ?? "Character"}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.gray[900],
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subheading: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.gray[400],
    marginBottom: 14,
  },
  scrollContent: {
    gap: 14,
    paddingRight: 4,
  },

  card: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2.5,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  cardSelected: {
    borderColor: colors.primary.DEFAULT,
    ...shadows.primarySelected,
  },
  image: {
    width: 108,
    height: 108,
    borderRadius: 13,
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
    ...shadows.md,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.gray[400],
    textAlign: "center",
    marginTop: 8,
    maxWidth: 108,
  },
  cardLabelSelected: {
    color: colors.primary.DEFAULT,
    fontWeight: "700",
  },

  emptyCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: "dashed",
    borderRadius: radii.md,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.gray[700],
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.gray[400],
    textAlign: "center",
  },
});
