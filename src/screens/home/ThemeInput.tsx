import { View, Text, TextInput, StyleSheet } from "react-native";
import { colors } from "@/theme/colors";
import { radii } from "@/theme/spacing";

type ThemeInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  disabled?: boolean;
  maxLength?: number;
  placeholder?: string;
  label?: string;
};

export function ThemeInput({
  value,
  onChangeText,
  disabled = false,
  maxLength = 200,
  placeholder = "Describe your story theme\u2026\ne.g. A magical forest adventure",
  label = "Story theme",
}: ThemeInputProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>{label}</Text>
        <Text style={styles.counter}>
          {value.length}/{maxLength}
        </Text>
      </View>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          value={value}
          onChangeText={onChangeText}
          multiline
          numberOfLines={3}
          maxLength={maxLength}
          editable={!disabled}
          accessibilityLabel={label}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.gray[900],
    letterSpacing: -0.3,
  },
  counter: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.gray[400],
  },
  inputWrap: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "400",
    color: colors.gray[800],
    minHeight: 88,
    textAlignVertical: "top",
  },
});
