import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Receipt } from "lucide-react-native";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/components/utils";
import { colors, PRESS_OPACITY } from "@/theme";
import { shadows } from "@/theme/shadows";
import { typography } from "@/theme/typography";

type PaymentRecord = {
  id: string;
  amount: number;
  credits: number;
  status: string;
  package_name: string | null;
  stripe_session_id: string | null;
  created_at: string;
};

export function PaymentHistoryScreen() {
  const navigation = useNavigation();
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const { data, error } = await supabase
          .from("payment_history")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setPayments(data ?? []);
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to load payment history",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const totalSpent = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalCredits = payments.reduce((sum, p) => sum + (p.credits || 0), 0);

  const renderPayment = ({ item }: { item: PaymentRecord }) => (
    <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-base font-semibold text-gray-900">
          {item.package_name || `${item.credits} Credits`}
        </Text>
        <Text className="text-base font-bold text-purple-600">
          ${((item.amount || 0) / 100).toFixed(2)}
        </Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-gray-400">
          {formatDate(item.created_at)}
        </Text>
        <View
          className={`rounded-full px-2 py-0.5 ${
            item.status === "succeeded" ? "bg-green-50" : "bg-gray-100"
          }`}
        >
          <Text
            className={`text-xs font-medium ${
              item.status === "succeeded" ? "text-green-600" : "text-gray-500"
            }`}
          >
            {item.status}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={st.screen}>
      <View style={st.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            st.backBtn,
            { opacity: pressed ? PRESS_OPACITY : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft color={colors.gray[900]} size={24} />
        </Pressable>
        <Text style={st.headerTitle}>Payment History</Text>
      </View>

      {payments.length > 0 && (
        <View className="flex-row px-6 mt-2 mb-4 gap-3">
          <View className="flex-1 bg-white rounded-xl p-3 border border-gray-100">
            <Text className="text-xs text-gray-500">Total Spent</Text>
            <Text className="text-lg font-bold text-gray-900">
              ${(totalSpent / 100).toFixed(2)}
            </Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-3 border border-gray-100">
            <Text className="text-xs text-gray-500">Credits Purchased</Text>
            <Text className="text-lg font-bold text-purple-600">
              {totalCredits}
            </Text>
          </View>
        </View>
      )}

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      ) : payments.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Receipt color={colors.gray[300]} size={48} />
          <Text className="text-gray-400 text-lg mt-4 font-medium">
            No payments yet
          </Text>
          <Text className="text-gray-400 text-sm mt-1 text-center">
            Your purchase history will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          renderItem={renderPayment}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    marginRight: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.gray[900],
    letterSpacing: -0.4,
  },
});
