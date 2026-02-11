import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';

interface CreditDisplayProps {
  onBuyCredits?: () => void;
}

export function CreditDisplay({ onBuyCredits }: CreditDisplayProps) {
  const { credits, isAuthenticated } = useAuth();
  const { colors } = useTheme();

  if (!isAuthenticated) return null;

  const isLow = credits <= 2;

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      <TouchableOpacity onPress={onBuyCredits} activeOpacity={0.8}>
        <LinearGradient
          colors={
            isLow
              ? (['#EF4444', '#F97316'] as [string, string])
              : (['#7C3AED', '#EC4899'] as [string, string])
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.container}
        >
          <Text style={styles.emoji}>
            {isLow ? '⚡' : '✨'}
          </Text>
          <Text style={styles.credits}>{credits}</Text>
          <Text style={styles.label}>credits</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  emoji: {
    fontSize: 14,
  },
  credits: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  label: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
