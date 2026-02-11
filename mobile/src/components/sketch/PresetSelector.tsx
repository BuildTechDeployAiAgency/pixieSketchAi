import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PRESETS, type PresetId } from '@/constants/config';
import { useTheme } from '@/lib/ThemeContext';
import { BorderRadius, FontSize, Shadow, Spacing } from '@/constants/theme';

interface PresetSelectorProps {
  onSelect: (preset: PresetId) => void;
  isProcessing: boolean;
  processingPreset: PresetId | null;
  disabled?: boolean;
}

export function PresetSelector({
  onSelect,
  isProcessing,
  processingPreset,
  disabled = false,
}: PresetSelectorProps) {
  const { colors } = useTheme();

  const handleSelect = async (preset: PresetId) => {
    if (disabled || isProcessing) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(preset);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        Choose Your Magic Style
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Pick a transformation style for your drawing
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {PRESETS.map((preset, index) => {
          const isActive = processingPreset === preset.id;
          return (
            <Animated.View
              key={preset.id}
              entering={FadeInDown.delay(index * 100).duration(400)}
            >
              <TouchableOpacity
                onPress={() => handleSelect(preset.id)}
                disabled={disabled || isProcessing}
                activeOpacity={0.7}
                style={[styles.presetButton, disabled && styles.disabled]}
              >
                <LinearGradient
                  colors={preset.colors as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.gradient, isActive && styles.activeGradient]}
                >
                  {isActive ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.emoji}>{preset.emoji}</Text>
                  )}
                  <Text style={styles.presetLabel}>{preset.label}</Text>
                  <Text style={styles.presetDesc}>{preset.description}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.lg,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
  subtitle: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  presetButton: {
    borderRadius: BorderRadius.xl,
    ...Shadow.md,
  },
  disabled: {
    opacity: 0.5,
  },
  gradient: {
    width: 130,
    height: 150,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeGradient: {
    opacity: 0.8,
  },
  emoji: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  presetLabel: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  presetDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 14,
  },
});
