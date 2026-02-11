import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useSketches } from '@/hooks/useSketches';
import { PresetSelector } from '@/components/sketch/PresetSelector';
import { CreditDisplay } from '@/components/sketch/CreditDisplay';
import { GradientButton } from '@/components/ui/GradientButton';
import { Card } from '@/components/ui/Card';
import type { PresetId } from '@/constants/config';
import { FontSize, Spacing, Shadow, BorderRadius } from '@/constants/theme';

export default function CreateScreen() {
  const { isAuthenticated, credits } = useAuth();
  const { colors } = useTheme();
  const { image, pickFromGallery, takePhoto, clearImage } = useImagePicker();
  const { processSketch, isProcessing } = useSketches();
  const [processingPreset, setProcessingPreset] = useState<PresetId | null>(null);

  const handlePresetSelect = async (preset: PresetId) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to transform your drawings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }

    if (credits <= 0) {
      Alert.alert(
        'No Credits',
        'You need credits to transform drawings. Would you like to get more?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Get Credits', onPress: () => router.push('/(tabs)/settings') },
        ]
      );
      return;
    }

    if (!image) {
      Alert.alert('Upload Required', 'Please upload a drawing first.');
      return;
    }

    setProcessingPreset(preset);

    const result = await processSketch(image.base64, preset, image.fileName);

    if (result.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Magic Complete! ✨',
        `Your drawing has been transformed with ${preset} style!`,
        [
          { text: 'Create Another', onPress: clearImage },
          { text: 'View Gallery', onPress: () => router.push('/(tabs)/gallery') },
        ]
      );
      clearImage();
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Transformation Failed', result.error || 'Something went wrong. Please try again.');
    }

    setProcessingPreset(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Create Magic</Text>
          <CreditDisplay onBuyCredits={() => router.push('/(tabs)/settings')} />
        </Animated.View>

        {/* Upload Area */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          {image ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: image.uri }} style={styles.previewImage} resizeMode="cover" />

              {/* Processing Overlay */}
              {isProcessing && (
                <View style={[styles.processingOverlay, { backgroundColor: colors.overlay }]}>
                  <ActivityIndicator color="#fff" size="large" />
                  <Text style={styles.processingText}>Creating magic...</Text>
                  <Text style={styles.processingSubtext}>This takes 10-30 seconds</Text>
                </View>
              )}

              {/* Change Image Button */}
              {!isProcessing && (
                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={clearImage}
                  activeOpacity={0.8}
                >
                  <Text style={styles.changeText}>Change Image</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Card style={styles.uploadCard} variant="outlined">
              <Text style={styles.uploadEmoji}>📸</Text>
              <Text style={[styles.uploadTitle, { color: colors.text }]}>
                Upload Your Drawing
              </Text>
              <Text style={[styles.uploadSubtitle, { color: colors.textSecondary }]}>
                Snap a photo or choose from your gallery
              </Text>

              <View style={styles.uploadButtons}>
                <GradientButton
                  title="Take Photo"
                  onPress={takePhoto}
                  colors={['#3B82F6', '#8B5CF6']}
                  size="lg"
                  icon={<Text style={{ fontSize: 18 }}>📷</Text>}
                  style={{ flex: 1 }}
                />
                <GradientButton
                  title="Gallery"
                  onPress={pickFromGallery}
                  colors={['#7C3AED', '#EC4899']}
                  size="lg"
                  icon={<Text style={{ fontSize: 18 }}>🖼️</Text>}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          )}
        </Animated.View>

        {/* Preset Selector (only when image is selected) */}
        {image && !isProcessing && (
          <Animated.View entering={FadeInUp.delay(300).duration(400)}>
            <PresetSelector
              onSelect={handlePresetSelect}
              isProcessing={isProcessing}
              processingPreset={processingPreset}
              disabled={!isAuthenticated || credits <= 0}
            />
          </Animated.View>
        )}

        {/* Auth Warning */}
        {!isAuthenticated && (
          <Animated.View entering={FadeIn.delay(600).duration(400)}>
            <Card style={styles.warningCard}>
              <LinearGradient
                colors={['#FEF3C7', '#FDE68A']}
                style={styles.warningGradient}
              >
                <Text style={styles.warningEmoji}>🔒</Text>
                <Text style={styles.warningTitle}>Sign In Required</Text>
                <Text style={styles.warningText}>
                  Create a free account to start transforming your drawings.
                </Text>
                <GradientButton
                  title="Sign In"
                  onPress={() => router.push('/(auth)/login')}
                  colors={['#F59E0B', '#D97706']}
                  size="md"
                  style={{ marginTop: Spacing.md }}
                />
              </LinearGradient>
            </Card>
          </Animated.View>
        )}

        {/* Tips */}
        <Animated.View entering={FadeInUp.delay(500).duration(400)} style={styles.tipsSection}>
          <Text style={[styles.tipsTitle, { color: colors.text }]}>Pro Tips</Text>
          {[
            { emoji: '💡', tip: 'Use good lighting when photographing drawings' },
            { emoji: '✏️', tip: 'Bold lines and clear shapes work best' },
            { emoji: '🎨', tip: 'Try different styles for the same drawing!' },
          ].map((item, i) => (
            <View key={i} style={[styles.tipItem, { borderColor: colors.borderLight }]}>
              <Text style={styles.tipEmoji}>{item.emoji}</Text>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>{item.tip}</Text>
            </View>
          ))}
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  title: { fontSize: FontSize['2xl'], fontWeight: '800' },
  previewContainer: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    ...Shadow.lg,
    marginBottom: Spacing.lg,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius['2xl'],
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius['2xl'],
  },
  processingText: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginTop: Spacing.lg,
  },
  processingSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  changeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  changeText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '600' },
  uploadCard: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    marginBottom: Spacing.lg,
    borderStyle: 'dashed',
    borderWidth: 2,
  },
  uploadEmoji: { fontSize: 48, marginBottom: Spacing.lg },
  uploadTitle: { fontSize: FontSize.xl, fontWeight: '700', marginBottom: Spacing.sm },
  uploadSubtitle: { fontSize: FontSize.md, marginBottom: Spacing.xl },
  uploadButtons: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.lg },
  warningCard: { padding: 0, marginBottom: Spacing.lg, overflow: 'hidden' },
  warningGradient: {
    padding: Spacing.xl,
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
  },
  warningEmoji: { fontSize: 32, marginBottom: Spacing.sm },
  warningTitle: { fontSize: FontSize.lg, fontWeight: '700', color: '#92400E' },
  warningText: { fontSize: FontSize.sm, color: '#92400E', textAlign: 'center', marginTop: Spacing.xs },
  tipsSection: { marginTop: Spacing.xl },
  tipsTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.md },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  tipEmoji: { fontSize: 20, marginRight: Spacing.md },
  tipText: { fontSize: FontSize.sm, flex: 1 },
});
