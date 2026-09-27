import { Pressable, View, Text, StyleSheet, type ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { colors, PRESS_OPACITY } from "@/theme";
import { radii } from "@/theme/spacing";
import { typography } from "@/theme/typography";
import { shadows } from "@/theme/shadows";
import { IconCircle } from "./IconCircle";

type SelectableRowProps = {
  label: string;
  icon: ReactNode;
  selected: boolean;
  selectedColor: string;
  onPress: () => void;
  /** Defaults to light purple tint */
  iconBgIdle?: string;
  right?: ReactNode;
  style?: ViewStyle;
};

/**
 * A selectable row used for style picker, video prompt options, etc.
 *
 * Handles the NativeWind Pressable bug internally via StyleSheet.
 */
export function SelectableRow({
  label,
  icon,
  selected,
  selectedColor,
  onPress,
  iconBgIdle = colors.primary[50],
  right,
  style,
}: SelectableRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected
          ? { backgroundColor: selectedColor, borderColor: selectedColor }
          : styles.rowInactive,
        { opacity: pressed ? PRESS_OPACITY : 1 },
        style,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <View style={styles.left}>
        <IconCircle
          backgroundColor={selected ? colors.overlay.whiteStrong : iconBgIdle}
        >
          {icon}
        </IconCircle>
        <Text
          style={[styles.label, { color: selected ? colors.white : colors.gray[900] }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: radii.md,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "transparent",
    ...shadows.xs,
  },
  rowInactive: {
    backgroundColor: colors.white,
    borderColor: colors.gray[200],
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  label: {
    marginLeft: 14,
    ...typography.label,
    flexShrink: 1,
  },
});
