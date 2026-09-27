import { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { CheckCircle } from "lucide-react-native";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import type { RootStackParamList } from "@/types/navigation";
import { colors, PRESS_OPACITY } from "@/theme";
import { radii } from "@/theme/spacing";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type PaymentSuccessRouteProp = RouteProp<RootStackParamList, "PaymentSuccess">;

export function PaymentSuccessScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PaymentSuccessRouteProp>();
  const { refreshProfile } = useUserProfile();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [creditsAdded, setCreditsAdded] = useState<number | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const sessionId = route.params?.session_id;
        if (!sessionId) {
          setIsVerifying(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke(
          "verify-payment",
          { body: { sessionId } },
        );

        if (error) throw error;

        setCreditsAdded(data?.addedCredits ?? null);
        await refreshProfile();
        toast({
          title: "Payment Verified",
          description: `${data?.addedCredits ?? 0} credits added to your account!`,
        });
      } catch (error: any) {
        toast({
          title: "Verification Issue",
          description: "Payment may have succeeded. Credits will be added shortly.",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        {isVerifying ? (
          <>
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
            <Text className="text-gray-500 mt-4">Verifying payment\u2026</Text>
          </>
        ) : (
          <>
            <CheckCircle color={colors.success} size={64} />
            <Text className="text-2xl font-bold text-gray-900 mt-4">
              Payment Successful!
            </Text>
            {creditsAdded && (
              <Text className="text-lg text-purple-600 font-semibold mt-2">
                +{creditsAdded} credits added
              </Text>
            )}
            <Text className="text-gray-500 mt-2 text-center">
              Your credits are ready to use
            </Text>
            <Pressable
              onPress={() => navigation.navigate("MainTabs")}
              style={({ pressed }) => [
                st.btn,
                { opacity: pressed ? PRESS_OPACITY : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Start creating"
            >
              <Text style={st.btnText}>Start Creating</Text>
            </Pressable>
          </>
        )}
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
