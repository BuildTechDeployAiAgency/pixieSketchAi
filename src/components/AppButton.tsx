import { Pressable, Text, View, ActivityIndicator, StyleSheet, type ViewStyle } from "react-native";
import { colors, PRIMARY, PRESS_OPACITY, DISABLED_OPACITY } from "@/theme";
import { typography } from "@/theme/typography";
import { radii, sizing } from "@/theme/spacing";
import { shadows } from "@/theme/shadows";

type AppButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  icon?: React.ReactNode;
  loadingIcon?: React.ReactNode;
  color?: string;
  disabledColor?: string;
  style?: ViewStyle;
};

/**
 * Primary action button.
 *
 * Uses StyleSheet internally (not NativeWind className on Pressable)
 * to avoid the CssInterop + React Navigation context crash.
 * See: https://github.com/nativewind/nativewind/issues/1466
 */
export function AppButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  loadingLabel,
  icon,
  loadingIcon,
  color = PRIMARY,
  disabledColor,
  style,
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  const bg = isDisabled && disabledColor ? disabledColor : color;

  return (
    <View style={[styles.outer, { backgroundColor: bg }, shadows.primaryLg, style]}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.pressable,
          { opacity: isDisabled ? DISABLED_OPACITY : pressed ? PRESS_OPACITY : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isDisabled }}
      >
        <View style={styles.row}>
          {loading ? (
            <>
              {loadingIcon ?? <ActivityIndicator color={colors.white} size="small" />}
              <Text style={styles.label}>{loadingLabel ?? label}</Text>
            </>
          ) : (
            <>
              {icon}
              <Text style={styles.label}>{label}</Text>
            </>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: radii.xxl,
    overflow: "hidden",
    marginTop: 8,
  },
  pressable: {
    width: "100%",
    minHeight: sizing.buttonLg,
    justifyContent: "center",
    paddingVertical: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: sizing.buttonLg,
    paddingHorizontal: 24,
    gap: 12,
  },
  label: {
    ...typography.cta,
  },
});
