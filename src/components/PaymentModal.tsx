import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { X, Coins, Star, Zap } from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { colors, PRESS_OPACITY } from "@/theme";
import { radii } from "@/theme/spacing";
import { shadows } from "@/theme/shadows";
import { typography } from "@/theme/typography";

type PricingTier = {
  credits: number;
  price: string;
  amount: number;
  icon: typeof Coins;
  color: string;
  popular?: boolean;
};

const PRICING_TIERS: PricingTier[] = [
  { credits: 1, price: "$1.00", amount: 100, icon: Coins, color: colors.tier.starter },
  { credits: 10, price: "$4.99", amount: 499, icon: Star, color: colors.tier.popular, popular: true },
  { credits: 25, price: "$9.99", amount: 999, icon: Zap, color: colors.tier.pro },
];

type PaymentModalProps = {
  visible: boolean;
  onClose: () => void;
};

/* Pressable uses style (not className) to avoid CssInterop crash */
export function PaymentModal({ visible, onClose }: PaymentModalProps) {
  const [loadingTier, setLoadingTier] = useState<number | null>(null);
  const { toast } = useToast();

  const handlePurchase = async (tier: PricingTier) => {
    setLoadingTier(tier.credits);
    try {
      const successUrl = Linking.createURL("payment-success", {
        queryParams: {
          credits: tier.credits.toString(),
          session_id: "{CHECKOUT_SESSION_ID}",
        },
      });
      const cancelUrl = Linking.createURL("payment-canceled");

      const { data, error } = await supabase.functions.invoke(
        "create-payment",
        {
          body: {
            amount: tier.amount,
            credits: tier.credits,
            success_url: successUrl,
            cancel_url: cancelUrl,
          },
        },
      );

      if (error) throw error;
      if (data?.url) {
        onClose();
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          successUrl,
        );
        if (result.type === "success" && result.url) {
          await Linking.openURL(result.url);
        }
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message ?? "Unable to start payment",
        variant: "destructive",
      });
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={st.backdrop}>
        <View style={st.sheet}>
          <View style={st.headerRow}>
            <Text style={st.headerTitle}>Buy Credits</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                st.closeButton,
                { opacity: pressed ? PRESS_OPACITY : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close payment modal"
            >
              <X color={colors.gray[500]} size={24} />
            </Pressable>
          </View>

          <Text style={st.headerSubtitle}>
            Top up your credits to unlock more transforms, videos, and stories.
          </Text>

          {PRICING_TIERS.map((tier) => {
            const Icon = tier.icon;
            return (
              <Pressable
                key={tier.credits}
                onPress={() => handlePurchase(tier)}
                disabled={loadingTier !== null}
                style={({ pressed }) => [
                  st.tierBtn,
                  tier.popular ? st.tierPopular : st.tierDefault,
                  { opacity: pressed ? PRESS_OPACITY : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Buy ${tier.credits} credits for ${tier.price}`}
              >
                <View
                  style={[
                    st.tierIconWrap,
                    { backgroundColor: tier.color + "20" },
                  ]}
                >
                  <Icon color={tier.color} size={24} />
                </View>
                <View style={st.tierTextWrap}>
                  <View style={st.tierTitleRow}>
                    <Text style={st.tierTitle}>
                      {tier.credits} Credit{tier.credits > 1 ? "s" : ""}
                    </Text>
                    {tier.popular && (
                      <View style={st.popularPill}>
                        <Text style={st.popularPillText}>POPULAR</Text>
                      </View>
                    )}
                  </View>
                  <Text style={st.tierDescription}>
                    {tier.credits > 1
                      ? `$${(tier.amount / tier.credits / 100).toFixed(2)}/credit`
                      : "Single transformation"}
                  </Text>
                </View>
                {loadingTier === tier.credits ? (
                  <ActivityIndicator color={tier.color} />
                ) : (
                  <Text style={[st.priceText, { color: tier.color }]}>{tier.price}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlay.backdrop,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerTitle: { ...typography.h2 },
  headerSubtitle: {
    ...typography.subtitle,
    lineHeight: 20,
    marginBottom: 20,
    paddingRight: 24,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[50],
    alignItems: "center",
    justifyContent: "center",
  },
  tierBtn: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 84,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: radii.lg,
    marginBottom: 12,
    borderWidth: 1,
  },
  tierIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  tierTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  tierTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  tierTitle: { ...typography.label },
  tierDescription: { ...typography.caption },
  popularPill: {
    marginLeft: 8,
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  popularPillText: {
    color: colors.white,
    ...typography.pillLabel,
    letterSpacing: 0.4,
  },
  priceText: { ...typography.price, marginLeft: 12 },
  tierPopular: {
    borderColor: colors.primary[300],
    backgroundColor: colors.primary[50],
    ...shadows.primarySm,
  },
  tierDefault: {
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
});
