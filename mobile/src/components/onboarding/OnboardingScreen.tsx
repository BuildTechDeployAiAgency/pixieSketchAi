import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ViewToken,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { GradientButton } from '@/components/ui/GradientButton';
import { FontSize, Spacing } from '@/constants/theme';
import type { OnboardingSlide } from '@/types';

const { width, height } = Dimensions.get('window');

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Welcome to\nPixieSketch AI',
    description:
      'Transform your drawings into stunning AI-powered artwork with just a tap',
    emoji: '✨',
    gradient: ['#7C3AED', '#EC4899'],
  },
  {
    id: '2',
    title: 'Snap or Upload\nYour Drawing',
    description:
      'Take a photo of any sketch or upload from your gallery - pencil drawings, crayon art, anything!',
    emoji: '📸',
    gradient: ['#3B82F6', '#8B5CF6'],
  },
  {
    id: '3',
    title: 'Choose Your\nMagic Style',
    description:
      '6 unique AI styles: Cartoon, Pixar 3D, Realistic, Anime, Watercolor, and Fantasy',
    emoji: '🎨',
    gradient: ['#F97316', '#EAB308'],
  },
  {
    id: '4',
    title: 'Watch the\nMagic Happen',
    description:
      'Our AI transforms your artwork in seconds. Save, share, and create amazing art!',
    emoji: '🪄',
    gradient: ['#10B981', '#14B8A6'],
  },
];

export function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const activeIndex = useSharedValue(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
        activeIndex.value = viewableItems[0].index;
      }
    }
  ).current;

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      await handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/(tabs)');
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/(tabs)');
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => (
    <LinearGradient
      colors={item.gradient as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.slide}
    >
      <View style={styles.slideContent}>
        <Animated.Text
          entering={FadeInDown.delay(200).duration(600)}
          style={styles.emoji}
        >
          {item.emoji}
        </Animated.Text>
        <Animated.Text
          entering={FadeInUp.delay(400).duration(600)}
          style={styles.slideTitle}
        >
          {item.title}
        </Animated.Text>
        <Animated.Text
          entering={FadeInUp.delay(600).duration(600)}
          style={styles.slideDescription}
        >
          {item.description}
        </Animated.Text>
      </View>
    </LinearGradient>
  );

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
      />

      {/* Bottom Controls */}
      <View style={styles.bottomContainer}>
        {/* Dot Indicators */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, i) => (
            <Dot key={i} active={i === currentIndex} />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttonsRow}>
          {!isLast && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          <GradientButton
            title={isLast ? "Let's Go!" : 'Next'}
            onPress={handleNext}
            colors={SLIDES[currentIndex].gradient}
            size="lg"
            style={{ minWidth: 140 }}
          />
        </View>
      </View>
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  const animStyle = useAnimatedStyle(() => ({
    width: withSpring(active ? 28 : 8),
    opacity: withSpring(active ? 1 : 0.4),
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        animStyle,
        { backgroundColor: active ? '#fff' : 'rgba(255,255,255,0.5)' },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  slide: {
    width,
    height,
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
    paddingBottom: 200,
  },
  emoji: {
    fontSize: 80,
    marginBottom: Spacing['3xl'],
  },
  slideTitle: {
    fontSize: FontSize['4xl'],
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 44,
  },
  slideDescription: {
    fontSize: FontSize.lg,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 320,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['5xl'],
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing['2xl'],
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  skipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
