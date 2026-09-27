import { View, StyleSheet, type ViewStyle } from "react-native";
import type { ReactNode } from "react";

type IconCircleProps = {
  size?: number;
  backgroundColor?: string;
  children: ReactNode;
  style?: ViewStyle;
};

/**
 * Circular icon background used throughout the app
 * (style picker, pick cards, segmented control icons, etc.)
 */
export function IconCircle({
  size = 46,
  backgroundColor = "#f3f0ff",
  children,
  style,
}: IconCircleProps) {
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
});
