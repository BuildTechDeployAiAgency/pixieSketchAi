import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';

interface BadgeProps {
  label: string;
  color?: string;
  backgroundColor?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({
  label,
  color = '#FFFFFF',
  backgroundColor = '#7C3AED',
  size = 'md',
  style,
}: BadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor },
        size === 'sm' ? styles.sm : styles.md,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color },
          { fontSize: size === 'sm' ? FontSize.xs : FontSize.sm },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
