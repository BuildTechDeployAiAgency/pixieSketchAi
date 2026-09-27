import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { XCircle } from "lucide-react-native";
import type { RootStackParamList } from "@/types/navigation";
import { colors, PRESS_OPACITY } from "@/theme";
import { radii } from "@/theme/spacing";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function PaymentCanceledScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <XCircle color={colors.gray[500]} size={64} />
        <Text className="text-2xl font-bold text-gray-900 mt-4">
          Payment Canceled
        </Text>
        <Text className="text-gray-500 mt-2 text-center">
          No charges were made. You can try again anytime.
        </Text>
        <Pressable
          onPress={() => navigation.navigate("MainTabs")}
          style={({ pressed }) => [
            st.btn,
            { opacity: pressed ? PRESS_OPACITY : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back to app"
        >
          <Text style={st.btnText}>Go Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  btn: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: radii.sm,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 32,
  },
  btnText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 16,
  },
});
