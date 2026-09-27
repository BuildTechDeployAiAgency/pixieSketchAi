import { View, Text, Pressable, StyleSheet } from "react-native";
import { Wand2, Sparkles, Video, Coins, ChevronRight } from "lucide-react-native";
import { colors, PRESS_OPACITY } from "@/theme";
import { radii } from "@/theme/spacing";
import { shadows } from "@/theme/shadows";
import type { PresetOption } from "@/types/presets";
import { PRESET_PROMPTS } from "@/types/presets";

type StyleMeta = {
  label: string;
  description: string;
  icon: typeof Wand2;
  accent: string;
  accentLight: string;
};

const STYLE_META: Record<PresetOption, StyleMeta> = {
  cartoon: {
    label: "Cartoon",
    description: "Bold lines, flat vibrant colors",
    icon: Wand2,
    accent: colors.preset.cartoon,
    accentLight: "#eff6ff",
  },
  pixar: {
    label: "Pixar Character",
    description: "3D rendering, cinematic lighting",
    icon: Sparkles,
    accent: colors.preset.pixar,
    accentLight: "#fff7ed",
  },
  realistic: {
    label: "Bring to Life",
    description: "Realistic storybook illustration",
    icon: Video,
    accent: colors.preset.realistic,
    accentLight: "#f0fdf4",
  },
};

type StylePickerProps = {
  selectedPreset: PresetOption | null;
  onSelect: (preset: PresetOption) => void;
};

export function StylePicker({ selectedPreset, onSelect }: StylePickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Choose a style</Text>
      {(Object.keys(PRESET_PROMPTS) as PresetOption[]).map((preset) => {
        const meta = STYLE_META[preset];
        const config = PRESET_PROMPTS[preset];
        const isSelected = selectedPreset === preset;
        const Icon = meta.icon;

        return (
          <Pressable
            key={preset}
            onPress={() => onSelect(preset)}
            style={({ pressed }) => [
              styles.card,
              isSelected
                ? { backgroundColor: meta.accent, borderColor: meta.accent }
                : { backgroundColor: colors.white, borderColor: colors.gray[200] },
              { opacity: pressed ? PRESS_OPACITY : 1 },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={meta.label}
          >
            {/* Accent bar */}
            {!isSelected && (
              <View
                style={[styles.accentBar, { backgroundColor: meta.accent }]}
              />
            )}

            {/* Icon */}
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: isSelected
                    ? "rgba(255,255,255,0.2)"
                    : meta.accentLight,
                },
              ]}
            >
              <Icon
                color={isSelected ? colors.white : meta.accent}
                size={20}
              />
            </View>

            {/* Text */}
            <View style={styles.textCol}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: isSelected ? colors.white : colors.gray[900] },
                ]}
                numberOfLines={1}
              >
                {meta.label}
              </Text>
              <Text
                style={[
                  styles.cardDesc,
                  {
                    color: isSelected
                      ? "rgba(255,255,255,0.8)"
                      : colors.gray[400],
                  },
                ]}
                numberOfLines={1}
              >
                {meta.description}
              </Text>
            </View>

            {/* Right side: badges */}
            <View style={styles.rightCol}>
              {config.supportsVideo && (
                <View
                  style={[
                    styles.videoBadge,
                    {
                      backgroundColor: isSelected
                        ? "rgba(255,255,255,0.2)"
                        : colors.warningLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.videoBadgeText,
                      {
                        color: isSelected ? colors.white : colors.warningDark,
                      },
                    ]}
                  >
                    VIDEO
                  </Text>
                </View>
              )}
              <View style={styles.creditRow}>
                <Coins
                  color={
                    isSelected ? "rgba(255,255,255,0.7)" : colors.gray[400]
                  }
                  size={12}
                />
                <Text
                  style={[
                    styles.creditText,
                    {
                      color: isSelected
                        ? "rgba(255,255,255,0.7)"
                        : colors.gray[400],
                    },
                  ]}
                >
                  {config.creditCost}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.gray[900],
    marginBottom: 14,
    letterSpacing: -0.3,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.md,
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingLeft: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    overflow: "hidden",
    ...shadows.xs,
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: radii.md,
    borderBottomLeftRadius: radii.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 13,
    fontWeight: "500",
  },

  rightCol: {
    alignItems: "flex-end",
    gap: 6,
  },
  videoBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  videoBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  creditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  creditText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
