import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LogOut, CreditCard, Clock, Coins, ChevronRight } from "lucide-react-native";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PaymentModal } from "@/components/PaymentModal";
import type { RootStackParamList } from "@/types/navigation";
import { colors, PRESS_OPACITY } from "@/theme";
import { shadows } from "@/theme/shadows";
import { typography } from "@/theme/typography";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function AccountScreen() {
  const { session } = useAuth();
  const { profile, isLoading } = useUserProfile();
  const { toast } = useToast();
  const navigation = useNavigation<NavigationProp>();
  const [showPayment, setShowPayment] = useState(false);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={acctStyles.screen}>
      <View style={acctStyles.header}>
        <Text style={acctStyles.headerTitle}>Account</Text>
      </View>

      <View style={acctStyles.section}>
        <View style={acctStyles.summaryCard}>
          <View style={acctStyles.summaryContent}>
            <View style={acctStyles.summaryIcon}>
              <Coins color={colors.primary.DEFAULT} size={28} />
            </View>
            <Text style={acctStyles.summaryLabel}>Credits Available</Text>
            <Text style={acctStyles.summaryValue}>
              {profile?.credits ?? 0}
            </Text>
          </View>
          <Text style={acctStyles.summaryEmail}>
            {session?.user?.email}
          </Text>
        </View>
      </View>

      {/* Pressable uses style (not className) to avoid NativeWind CssInterop crash */}
      <View style={acctStyles.section}>
        <Pressable
          onPress={() => setShowPayment(true)}
          style={({ pressed }) => [
            acctStyles.buyCreditsBtn,
            { opacity: pressed ? PRESS_OPACITY : 1 },
          ]}
        >
          <View style={acctStyles.actionContent}>
            <View style={acctStyles.actionIconWrap}>
              <CreditCard color={colors.white} size={18} />
            </View>
            <Text style={acctStyles.buyCreditsText}>Buy Credits</Text>
          </View>
          <ChevronRight color={colors.white} size={18} />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("PaymentHistory")}
          style={({ pressed }) => [
            acctStyles.historyBtn,
            { opacity: pressed ? PRESS_OPACITY : 1 },
          ]}
        >
          <View style={acctStyles.actionContent}>
            <View style={acctStyles.historyIconWrap}>
              <Clock color="#475569" size={18} />
            </View>
            <Text style={acctStyles.historyBtnText}>Payment History</Text>
          </View>
          <ChevronRight color={colors.gray[400]} size={18} />
        </Pressable>
      </View>

      <View style={acctStyles.signOutSection}>
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [
            acctStyles.signOutBtn,
            { opacity: pressed ? PRESS_OPACITY : 1 },
          ]}
        >
          <View style={acctStyles.actionContent}>
            <View style={acctStyles.signOutIconWrap}>
              <LogOut color={colors.error} size={18} />
            </View>
            <Text style={acctStyles.signOutText}>Sign Out</Text>
          </View>
        </Pressable>
      </View>

      <PaymentModal
        visible={showPayment}
        onClose={() => setShowPayment(false)}
      />
    </SafeAreaView>
  );
}

const acctStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.gray[900],
    letterSpacing: -0.4,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 18,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryContent: {
    alignItems: "center",
    marginBottom: 14,
  },
  summaryIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 4,
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 38,
    fontWeight: "800",
    color: colors.primary.DEFAULT,
    letterSpacing: -0.6,
  },
  summaryEmail: {
    textAlign: "center",
    fontSize: 12,
    color: colors.gray[400],
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.overlay.whiteSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  historyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  signOutIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  buyCreditsBtn: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 18,
    minHeight: 64,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },
  buyCreditsText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
  historyBtn: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 18,
    minHeight: 64,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  historyBtnText: {
    color: colors.gray[800],
    fontWeight: "700",
    fontSize: 16,
  },
  signOutSection: {
    paddingHorizontal: 24,
    marginTop: "auto",
    marginBottom: 28,
  },
  signOutBtn: {
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    borderRadius: 18,
    minHeight: 64,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  signOutText: {
    color: colors.error,
    fontWeight: "700",
    fontSize: 16,
  },
});
