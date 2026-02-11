import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { Card } from '@/components/ui/Card';
import { GradientButton } from '@/components/ui/GradientButton';
import { CREDIT_PACKAGES } from '@/constants/config';
import { FontSize, Spacing, Shadow, BorderRadius } from '@/constants/theme';
import { supabase } from '@/services/supabase';

export default function SettingsScreen() {
  const { isAuthenticated, user, credits, signOut, refreshProfile } = useAuth();
  const { colors, isDark, toggleTheme, theme, setTheme } = useTheme();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await signOut();
        },
      },
    ]);
  };

  const handlePurchase = async (packageId: string, packageCredits: number) => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to purchase credits.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }

    setIsPurchasing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          credits: packageCredits,
          amount: CREDIT_PACKAGES.find((p) => p.id === packageId)?.priceNum,
        },
      });

      if (error) throw error;

      if (data?.url) {
        await Linking.openURL(data.url);
      }
    } catch (error) {
      Alert.alert('Purchase Error', 'Unable to start purchase. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        </Animated.View>

        {/* Profile Section */}
        {isAuthenticated ? (
          <Animated.View entering={FadeInUp.delay(200).duration(400)}>
            <Card variant="elevated" style={styles.profileCard}>
              <LinearGradient
                colors={['#7C3AED', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.profileGradient}
              >
                <View style={styles.profileAvatar}>
                  <Text style={styles.avatarText}>
                    {user?.email?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileEmail}>{user?.email}</Text>
                  <Text style={styles.profileCredits}>{credits} credits remaining</Text>
                </View>
              </LinearGradient>
            </Card>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.delay(200).duration(400)}>
            <Card variant="elevated" style={styles.signInCard}>
              <Text style={styles.signInEmoji}>👋</Text>
              <Text style={[styles.signInTitle, { color: colors.text }]}>
                Welcome to PixieSketch
              </Text>
              <Text style={[styles.signInSubtitle, { color: colors.textSecondary }]}>
                Sign in to access all features
              </Text>
              <GradientButton
                title="Sign In"
                onPress={() => router.push('/(auth)/login')}
                size="lg"
                style={{ marginTop: Spacing.lg, width: '100%' }}
              />
            </Card>
          </Animated.View>
        )}

        {/* Credits / Purchase */}
        {isAuthenticated && (
          <Animated.View entering={FadeInUp.delay(400).duration(400)}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Get More Credits
            </Text>
            <View style={styles.packagesRow}>
              {CREDIT_PACKAGES.map((pkg) => (
                <TouchableOpacity
                  key={pkg.id}
                  onPress={() => handlePurchase(pkg.id, pkg.credits)}
                  activeOpacity={0.8}
                  style={[styles.packageCard, { borderColor: pkg.popular ? colors.primary : colors.border }]}
                  disabled={isPurchasing}
                >
                  {pkg.popular && (
                    <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.popularText}>BEST VALUE</Text>
                    </View>
                  )}
                  <Text style={styles.packageEmoji}>
                    {pkg.credits === 1 ? '⚡' : pkg.credits === 10 ? '🔥' : '💎'}
                  </Text>
                  <Text style={[styles.packageCredits, { color: colors.text }]}>
                    {pkg.credits}
                  </Text>
                  <Text style={[styles.packageLabel, { color: colors.textSecondary }]}>
                    credits
                  </Text>
                  <Text style={[styles.packagePrice, { color: colors.primary }]}>
                    {pkg.price}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Appearance */}
        <Animated.View entering={FadeInUp.delay(600).duration(400)}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          <Card variant="outlined">
            <TouchableOpacity
              style={styles.settingRow}
              onPress={toggleTheme}
              activeOpacity={0.7}
            >
              <Text style={styles.settingEmoji}>{isDark ? '🌙' : '☀️'}</Text>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  {isDark ? 'Dark theme active' : 'Light theme active'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </TouchableOpacity>
          </Card>
        </Animated.View>

        {/* About */}
        <Animated.View entering={FadeInUp.delay(800).duration(400)}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          <Card variant="outlined">
            {[
              { emoji: '📱', label: 'Version', value: '1.0.0' },
              { emoji: '🛡️', label: 'Privacy', value: 'COPPA Compliant' },
              { emoji: '💜', label: 'Made with', value: 'AI + Love' },
            ].map((item, i) => (
              <View
                key={i}
                style={[
                  styles.aboutRow,
                  i < 2 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
                ]}
              >
                <Text style={styles.aboutEmoji}>{item.emoji}</Text>
                <Text style={[styles.aboutLabel, { color: colors.text }]}>{item.label}</Text>
                <Text style={[styles.aboutValue, { color: colors.textSecondary }]}>
                  {item.value}
                </Text>
              </View>
            ))}
          </Card>
        </Animated.View>

        {/* Sign Out */}
        {isAuthenticated && (
          <Animated.View entering={FadeInUp.delay(1000).duration(400)}>
            <TouchableOpacity
              style={[styles.signOutButton, { borderColor: colors.error }]}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: '800',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  profileCard: { padding: 0, overflow: 'hidden', marginBottom: Spacing.xl },
  profileGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  avatarText: { color: '#fff', fontSize: FontSize['2xl'], fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileEmail: { color: '#fff', fontSize: FontSize.md, fontWeight: '600' },
  profileCredits: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm, marginTop: Spacing.xs },
  signInCard: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    marginBottom: Spacing.xl,
  },
  signInEmoji: { fontSize: 48, marginBottom: Spacing.md },
  signInTitle: { fontSize: FontSize.xl, fontWeight: '700' },
  signInSubtitle: { fontSize: FontSize.md, marginTop: Spacing.xs },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  packagesRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  packageCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    alignItems: 'center',
  },
  popularText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  packageEmoji: { fontSize: 28, marginBottom: Spacing.sm },
  packageCredits: { fontSize: FontSize['2xl'], fontWeight: '800' },
  packageLabel: { fontSize: FontSize.xs, fontWeight: '500' },
  packagePrice: { fontSize: FontSize.lg, fontWeight: '800', marginTop: Spacing.sm },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  settingEmoji: { fontSize: 24, marginRight: Spacing.lg },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: FontSize.md, fontWeight: '600' },
  settingDesc: { fontSize: FontSize.sm, marginTop: 2 },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  aboutEmoji: { fontSize: 20, marginRight: Spacing.lg },
  aboutLabel: { fontSize: FontSize.md, fontWeight: '500', flex: 1 },
  aboutValue: { fontSize: FontSize.sm },
  signOutButton: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  signOutText: { fontSize: FontSize.md, fontWeight: '600' },
});
