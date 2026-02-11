import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { documentDirectory, downloadAsync } from 'expo-file-system/legacy';
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';
import { useTheme } from '@/lib/ThemeContext';
import { Badge } from '@/components/ui/Badge';
import { BorderRadius, FontSize, Shadow, Spacing } from '@/constants/theme';
import type { Sketch } from '@/types';

interface SketchCardProps {
  sketch: Sketch;
  onPress: () => void;
  onDelete: () => void;
  onRetry: () => void;
  index: number;
}

export function SketchCard({ sketch, onPress, onDelete, onRetry, index }: SketchCardProps) {
  const { colors } = useTheme();

  const handleLongPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert('Sketch Options', `"${sketch.name}"`, [
      { text: 'Cancel', style: 'cancel' },
      ...(sketch.status === 'failed'
        ? [{ text: 'Retry', onPress: onRetry }]
        : []),
      ...(sketch.status === 'completed'
        ? [
            {
              text: 'Save to Photos',
              onPress: async () => {
                if (sketch.animated_image_url) {
                  try {
                    const fileName = `pixiesketch_${Date.now()}.png`;
                    const fileUri = `${documentDirectory}${fileName}`;
                    await downloadAsync(
                      sketch.animated_image_url,
                      fileUri
                    );
                    Alert.alert('Saved!', 'Image saved to your device.');
                  } catch {
                    Alert.alert('Error', 'Could not save the image.');
                  }
                }
              },
            },
          ]
        : []),
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Delete Sketch',
            'Are you sure you want to delete this sketch?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: onDelete },
            ]
          );
        },
      },
    ]);
  };

  const statusConfig = {
    processing: { label: 'Processing...', color: colors.warning, bg: `${colors.warning}20` },
    completed: { label: 'Complete', color: colors.success, bg: `${colors.success}20` },
    failed: { label: 'Failed', color: colors.error, bg: `${colors.error}20` },
  };

  const status = statusConfig[sketch.status];

  return (
    <Animated.View entering={FadeInUp.delay(index * 80).duration(400)} exiting={FadeOut}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={handleLongPress}
        activeOpacity={0.9}
        style={[styles.card, { backgroundColor: colors.cardBg }, Shadow.md]}
      >
        {/* Image Section */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: sketch.original_image_url }}
            style={styles.originalImage}
            resizeMode="cover"
          />
          {sketch.status === 'completed' && sketch.animated_image_url && (
            <Image
              source={{ uri: sketch.animated_image_url }}
              style={styles.transformedImage}
              resizeMode="cover"
            />
          )}
          {sketch.status === 'processing' && (
            <View style={[styles.processingOverlay, { backgroundColor: colors.overlay }]}>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={styles.processingText}>Creating magic...</Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.info}>
          <View style={styles.infoHeader}>
            <Text
              style={[styles.name, { color: colors.text }]}
              numberOfLines={1}
            >
              {sketch.name}
            </Text>
            {sketch.is_new && sketch.status === 'completed' && (
              <Badge label="NEW" backgroundColor={colors.primary} size="sm" />
            )}
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
            <Text style={[styles.dateText, { color: colors.textMuted }]}>
              {new Date(sketch.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  imageContainer: {
    flexDirection: 'row',
    height: 180,
  },
  originalImage: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  transformedImage: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderLeftWidth: 2,
    borderLeftColor: '#fff',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    left: '50%' as unknown as number,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  info: {
    padding: Spacing.md,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    flex: 1,
  },
  dateText: {
    fontSize: FontSize.xs,
  },
});
