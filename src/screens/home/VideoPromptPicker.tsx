import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Zap, MessageSquare } from "lucide-react-native";
import { colors, PRESS_OPACITY } from "@/theme";
import { radii } from "@/theme/spacing";
import { shadows } from "@/theme/shadows";
import type { VideoPromptMode } from "@/types/presets";

type VideoPromptPickerProps = {
  mode: VideoPromptMode | null;
  onSelectMode: (mode: VideoPromptMode) => void;
  customPrompt: string;
  onChangeCustomPrompt: (text: string) => void;
};

export function VideoPromptPicker({
  mode,
  onSelectMode,
  customPrompt,
  onChangeCustomPrompt,
}: VideoPromptPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>How should it move?</Text>

      <View style={styles.optionsRow}>
        <Pressable
          onPress={() => onSelectMode("ai_decide")}
          style={({ pressed }) => [
            styles.optionCard,
            mode === "ai_decide" && styles.optionSelected,
            { opacity: pressed ? PRESS_OPACITY : 1 },
          ]}
          accessibilityRole="radio"
          accessibilityState={{ selected: mode === "ai_decide" }}
          accessibilityLabel="Let AI decide"
        >
          <View
            style={[
              styles.optionIconWrap,
              {
                backgroundColor:
                  mode === "ai_decide"
                    ? "rgba(255,255,255,0.2)"
                    : colors.successLight,
              },
            ]}
          >
            <Zap
              color={mode === "ai_decide" ? colors.white : colors.success}
              size={20}
            />
          </View>
          <Text
            style={[
              styles.optionLabel,
              {
                color:
                  mode === "ai_decide" ? colors.white : colors.gray[900],
              },
            ]}
          >
            AI decides
          </Text>
          <Text
            style={[
              styles.optionHint,
              {
                color:
                  mode === "ai_decide"
                    ? "rgba(255,255,255,0.7)"
                    : colors.gray[400],
              },
            ]}
          >
            Natural motion
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onSelectMode("custom")}
          style={({ pressed }) => [
            styles.optionCard,
            mode === "custom" && styles.optionSelected,
            { opacity: pressed ? PRESS_OPACITY : 1 },
          ]}
          accessibilityRole="radio"
          accessibilityState={{ selected: mode === "custom" }}
          accessibilityLabel="Custom prompt"
        >
          <View
            style={[
              styles.optionIconWrap,
              {
                backgroundColor:
                  mode === "custom"
                    ? "rgba(255,255,255,0.2)"
                    : colors.successLight,
              },
            ]}
          >
            <MessageSquare
              color={mode === "custom" ? colors.white : colors.success}
              size={20}
            />
          </View>
          <Text
            style={[
              styles.optionLabel,
              {
                color:
                  mode === "custom" ? colors.white : colors.gray[900],
              },
            ]}
          >
            Custom
          </Text>
          <Text
            style={[
              styles.optionHint,
              {
                color:
                  mode === "custom"
                    ? "rgba(255,255,255,0.7)"
                    : colors.gray[400],
              },
            ]}
          >
            You describe it
          </Text>
        </Pressable>
      </View>

      {mode === "custom" && (
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder='e.g. "The butterfly flies away gently"'
            placeholderTextColor={colors.gray[400]}
            value={customPrompt}
            onChangeText={onChangeCustomPrompt}
            multiline
            maxLength={200}
            accessibilityLabel="Custom video motion prompt"
          />
        </View>
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
    marginBottom: 14,
    letterSpacing: -0.3,
  },

  optionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  optionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: "center",
    ...shadows.xs,
  },
  optionSelected: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  optionHint: {
    fontSize: 12,
    fontWeight: "500",
  },

  inputWrap: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    marginTop: 12,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "400",
    color: colors.gray[800],
    minHeight: 80,
    textAlignVertical: "top",
  },
});
