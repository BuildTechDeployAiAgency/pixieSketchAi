import { View, Text, StyleSheet, type ViewStyle } from "react-native";
import { colors } from "@/theme/colors";
import { radii } from "@/theme/spacing";
import { typography } from "@/theme/typography";

type BadgeProps = {
  label: string;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
};

/**
 * Small pill badge (e.g. "POPULAR", "VIDEO").
 */
export function Badge({
  label,
  color = colors.white,
  backgroundColor = colors.primary.DEFAULT,
  style,
}: BadgeProps) {
  return (
    <View style={[styles.pill, { backgroundColor }, style]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    ...typography.pillLabel,
  },
});
