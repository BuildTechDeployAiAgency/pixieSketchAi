import { View, StyleSheet, type ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { colors } from "@/theme/colors";
import { radii } from "@/theme/spacing";
import { shadows } from "@/theme/shadows";

type CardProps = {
  children: ReactNode;
  shadow?: keyof typeof shadows;
  style?: ViewStyle;
};

/**
 * Consistent card wrapper with border, radius, and shadow.
 */
export function Card({ children, shadow = "sm", style }: CardProps) {
  return (
    <View style={[styles.card, shadows[shadow], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
});
