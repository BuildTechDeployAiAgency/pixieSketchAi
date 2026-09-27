import { View, Text, Pressable, StyleSheet } from "react-native";
import { Sparkles, BookOpen } from "lucide-react-native";
import { colors, PRESS_OPACITY } from "@/theme";
import { shadows } from "@/theme/shadows";

type SegmentedControlProps = {
  isStoryMode: boolean;
  onChangeMode: (storyMode: boolean) => void;
  isCompact: boolean;
};

export function SegmentedControl({
  isStoryMode,
  onChangeMode,
}: SegmentedControlProps) {
  return (
    <View style={styles.track}>
      <Pressable
        onPress={() => onChangeMode(false)}
        style={({ pressed }) => [
          styles.tab,
          !isStoryMode && styles.tabActive,
          { opacity: pressed ? PRESS_OPACITY : 1 },
        ]}
        accessibilityRole="tab"
        accessibilityState={{ selected: !isStoryMode }}
        accessibilityLabel="Transform"
      >
        <Sparkles
          color={!isStoryMode ? colors.primary.DEFAULT : colors.gray[400]}
          size={20}
        />
        <Text
          style={[
            styles.label,
            !isStoryMode ? styles.labelActive : styles.labelInactive,
          ]}
        >
          Transform
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onChangeMode(true)}
        style={({ pressed }) => [
          styles.tab,
          isStoryMode && styles.tabActive,
          { opacity: pressed ? PRESS_OPACITY : 1 },
        ]}
        accessibilityRole="tab"
        accessibilityState={{ selected: isStoryMode }}
        accessibilityLabel="Create Story"
      >
        <BookOpen
          color={isStoryMode ? colors.primary.DEFAULT : colors.gray[400]}
          size={20}
        />
        <Text
          style={[
            styles.label,
            isStoryMode ? styles.labelActive : styles.labelInactive,
          ]}
        >
          Story
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.gray[100],
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 9,
  },
  tabActive: {
    backgroundColor: colors.white,
    ...shadows.md,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  labelActive: {
    color: colors.gray[900],
  },
  labelInactive: {
    color: colors.gray[400],
  },
});
