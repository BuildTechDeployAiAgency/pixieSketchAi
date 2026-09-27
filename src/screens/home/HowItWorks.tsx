import { View, Text, StyleSheet } from "react-native";
import { Upload, Palette, Download } from "lucide-react-native";
import { colors } from "@/theme/colors";

const STEPS = [
  { icon: Upload, label: "Upload", detail: "your drawing" },
  { icon: Palette, label: "Pick", detail: "an AI style" },
  { icon: Download, label: "Create", detail: "your art" },
];

export function HowItWorks() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>How it works</Text>
      <View style={styles.stepsRow}>
        {STEPS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <View key={item.label} style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{idx + 1}</Text>
              </View>
              <View style={styles.stepIconWrap}>
                <Icon color={colors.primary[400]} size={22} />
              </View>
              <Text style={styles.stepLabel}>{item.label}</Text>
              <Text style={styles.stepDetail}>{item.detail}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    paddingBottom: 8,
  },
  heading: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.gray[400],
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 16,
    textAlign: "center",
  },
  stepsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stepItem: {
    alignItems: "center",
    flex: 1,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary.DEFAULT,
  },
  stepIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.gray[800],
    marginBottom: 2,
  },
  stepDetail: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.gray[400],
  },
});
