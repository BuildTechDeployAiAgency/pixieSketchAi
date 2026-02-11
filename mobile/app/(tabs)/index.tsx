import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { useSketches } from '@/hooks/useSketches';
import { CreditDisplay } from '@/components/sketch/CreditDisplay';
import { GradientButton } from '@/components/ui/GradientButton';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PRESETS } from '@/constants/config';
import { FontSize, Spacing, Shadow, BorderRadius } from '@/constants/theme';

export default function HomeScreen() {
  const { isAuthenticated, user, credits } = useAuth();
  const { colors } = useTheme();
  const { sketches, newSketchCount, fetchSketches } = useSketches();
  const [refreshing, setRefreshing] = React.useState(false);

  const recentSketches = sketches.filter((s) => s.status === 'completed').slice(0, 3);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSketches();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                {getGreeting()}{isAuthenticated ? ',' : ''}
              </Text>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {isAuthenticated ? user?.email?.split('@')[0] : 'Welcome'}
              </Text>
            </View>
            <CreditDisplay onBuyCredits={() => router.push('/(tabs)/settings')} />
          </View>
        </Animated.View>

        {/* Hero Card */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <LinearGradient
            colors={['#7C3AED', '#EC4899', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <Text style={styles.heroEmoji}>✨</Text>
            <Text style={styles.heroTitle}>Bring Your Drawings{'\n'}to Life!</Text>
            <Text style={styles.heroSubtitle}>
              Transform any sketch into stunning AI artwork in seconds
            </Text>
            <GradientButton
              title="Create Magic"
              onPress={() => router.push('/(tabs)/create')}
              colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
              size="lg"
              style={{ marginTop: Spacing.lg, alignSelf: 'center' }}
            />
          </LinearGradient>
        </Animated.View>

        {/* Quick Stats */}
        {isAuthenticated && (
          <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.statsRow}>
            <Card style={styles.statCard} variant="elevated">
              <Text style={styles.statEmoji}>🎨</Text>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {sketches.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Sketches
              </Text>
            </Card>
            <Card style={styles.statCard} variant="elevated">
              <Text style={styles.statEmoji}>✅</Text>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {sketches.filter((s) => s.status === 'completed').length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Completed
              </Text>
            </Card>
            <Card style={styles.statCard} variant="elevated">
              <Text style={styles.statEmoji}>⚡</Text>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {credits}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Credits
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* How It Works */}
        <Animated.View entering={FadeInUp.delay(600).duration(600)}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>How It Works</Text>
          <View style={styles.stepsContainer}>
            {[
              { emoji: '📸', title: 'Capture', desc: 'Snap a photo or upload a drawing' },
              { emoji: '🎨', title: 'Choose Style', desc: 'Pick from 6 AI transformation styles' },
              { emoji: '🪄', title: 'Transform', desc: 'Watch AI magic bring it to life' },
              { emoji: '💾', title: 'Save & Share', desc: 'Download or share your creation' },
            ].map((step, i) => (
              <View key={i} style={[styles.stepItem, { borderColor: colors.borderLight }]}>
                <View style={[styles.stepNumber, { backgroundColor: `${colors.primary}15` }]}>
                  <Text style={styles.stepEmoji}>{step.emoji}</Text>
                </View>
                <View style={styles.stepText}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
                  <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Available Styles Preview */}
        <Animated.View entering={FadeInUp.delay(800).duration(600)}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            AI Styles
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stylesScroll}>
            {PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                onPress={() => router.push('/(tabs)/create')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={preset.colors as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.styleCard}
                >
                  <Text style={styles.styleEmoji}>{preset.emoji}</Text>
                  <Text style={styles.styleName}>{preset.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Recent Creations */}
        {recentSketches.length > 0 && (
          <Animated.View entering={FadeInUp.delay(1000).duration(600)}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                Recent Creations
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/gallery')}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentScroll}
            >
              {recentSketches.map((sketch) => (
                <TouchableOpacity
                  key={sketch.id}
                  onPress={() => router.push(`/sketch/${sketch.id}`)}
                  activeOpacity={0.9}
                >
                  <Card style={styles.recentCard} variant="elevated">
                    <Image
                      source={{ uri: sketch.animated_image_url || sketch.original_image_url }}
                      style={styles.recentImage}
                      resizeMode="cover"
                    />
                    <Text
                      style={[styles.recentName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {sketch.name}
                    </Text>
                  </Card>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Auth CTA */}
        {!isAuthenticated && (
          <Animated.View entering={FadeInUp.delay(800).duration(600)}>
            <Card style={styles.authCta} variant="elevated">
              <Text style={[styles.ctaTitle, { color: colors.text }]}>
                Ready to Create?
              </Text>
              <Text style={[styles.ctaDesc, { color: colors.textSecondary }]}>
                Sign up for free and get 10 credits to start transforming your drawings!
              </Text>
              <GradientButton
                title="Get Started Free"
                onPress={() => router.push('/(auth)/login')}
                size="lg"
                style={{ marginTop: Spacing.lg }}
              />
            </Card>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg },
  header: { marginBottom: Spacing.xl },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  greeting: { fontSize: FontSize.sm, fontWeight: '500' },
  headerTitle: { fontSize: FontSize['2xl'], fontWeight: '800' },
  heroCard: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing['3xl'],
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadow.xl,
  },
  heroEmoji: { fontSize: 48, marginBottom: Spacing.md },
  heroTitle: {
    fontSize: FontSize['3xl'],
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 38,
  },
  heroSubtitle: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  statEmoji: { fontSize: 24, marginBottom: Spacing.sm },
  statNumber: { fontSize: FontSize['2xl'], fontWeight: '800' },
  statLabel: { fontSize: FontSize.xs, fontWeight: '500', marginTop: Spacing.xs },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  seeAll: { fontSize: FontSize.sm, fontWeight: '600' },
  stepsContainer: { marginBottom: Spacing.xl },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  stepEmoji: { fontSize: 22 },
  stepText: { flex: 1 },
  stepTitle: { fontSize: FontSize.md, fontWeight: '600', marginBottom: 2 },
  stepDesc: { fontSize: FontSize.sm },
  stylesScroll: { gap: Spacing.md, paddingBottom: Spacing.xl },
  styleCard: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  styleEmoji: { fontSize: 28, marginBottom: Spacing.xs },
  styleName: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  recentScroll: { gap: Spacing.md, paddingBottom: Spacing.lg },
  recentCard: { width: 160, padding: 0, overflow: 'hidden' },
  recentImage: { width: 160, height: 160, borderRadius: BorderRadius.xl },
  recentName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  authCta: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    marginTop: Spacing.lg,
  },
  ctaTitle: { fontSize: FontSize.xl, fontWeight: '700', marginBottom: Spacing.sm },
  ctaDesc: { fontSize: FontSize.md, textAlign: 'center', lineHeight: 22 },
});
