import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { documentDirectory, downloadAsync } from 'expo-file-system/legacy';
import { supabase } from '@/services/supabase';
import { useTheme } from '@/lib/ThemeContext';
import { GradientButton } from '@/components/ui/GradientButton';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FontSize, Spacing, Shadow, BorderRadius } from '@/constants/theme';
import type { Sketch } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = SCREEN_WIDTH - 32;

export default function SketchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [sketch, setSketch] = useState<Sketch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    fetchSketch();
  }, [id]);

  const fetchSketch = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('sketches')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setSketch(data as Sketch);

      // Mark as viewed
      if ((data as Sketch).is_new) {
        await supabase.from('sketches').update({ is_new: false }).eq('id', id);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not load sketch details.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!sketch?.animated_image_url) return;
    try {
      await Share.share({
        message: `Check out my AI-transformed drawing from PixieSketch AI! ✨`,
        url: sketch.animated_image_url,
      });
    } catch {
      // User cancelled
    }
  };

  const handleSave = async () => {
    if (!sketch?.animated_image_url) return;
    try {
      const fileName = `pixiesketch_${Date.now()}.png`;
      const fileUri = `${documentDirectory}${fileName}`;
      await downloadAsync(sketch.animated_image_url, fileUri);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved!', 'Image saved to your device.');
    } catch {
      Alert.alert('Error', 'Could not save the image.');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Sketch', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!sketch) return;
          await supabase.from('sketches').delete().eq('id', sketch.id);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          router.back();
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!sketch) return null;

  const imageUrl = showOriginal
    ? sketch.original_image_url
    : sketch.animated_image_url || sketch.original_image_url;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Main Image */}
        <Animated.View entering={FadeIn.duration(600)}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.mainImage}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Toggle Original / Transformed */}
        {sketch.status === 'completed' && sketch.animated_image_url && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                !showOriginal && { backgroundColor: colors.primary },
                showOriginal && { backgroundColor: colors.surface },
              ]}
              onPress={() => setShowOriginal(false)}
            >
              <Text style={[styles.toggleText, { color: showOriginal ? colors.text : '#fff' }]}>
                Magic ✨
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                showOriginal && { backgroundColor: colors.primary },
                !showOriginal && { backgroundColor: colors.surface },
              ]}
              onPress={() => setShowOriginal(true)}
            >
              <Text style={[styles.toggleText, { color: !showOriginal ? colors.text : '#fff' }]}>
                Original
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Info */}
        <Animated.View entering={SlideInRight.delay(300).duration(400)}>
          <Card variant="elevated" style={styles.infoCard}>
            <Text style={[styles.sketchName, { color: colors.text }]}>{sketch.name}</Text>
            <View style={styles.metaRow}>
              <Badge
                label={sketch.status === 'completed' ? 'Complete' : sketch.status === 'processing' ? 'Processing' : 'Failed'}
                backgroundColor={
                  sketch.status === 'completed'
                    ? colors.success
                    : sketch.status === 'processing'
                      ? colors.warning
                      : colors.error
                }
                size="sm"
              />
              <Text style={[styles.dateText, { color: colors.textMuted }]}>
                {new Date(sketch.created_at).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Actions */}
        {sketch.status === 'completed' && (
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.actionsRow}>
            <GradientButton
              title="Share"
              onPress={handleShare}
              colors={['#3B82F6', '#8B5CF6']}
              size="md"
              icon={<Text style={{ fontSize: 16 }}>📤</Text>}
              style={{ flex: 1 }}
            />
            <GradientButton
              title="Save"
              onPress={handleSave}
              colors={['#10B981', '#14B8A6']}
              size="md"
              icon={<Text style={{ fontSize: 16 }}>💾</Text>}
              style={{ flex: 1 }}
            />
          </Animated.View>
        )}

        {/* Delete */}
        <TouchableOpacity
          style={[styles.deleteButton, { borderColor: colors.error }]}
          onPress={handleDelete}
        >
          <Text style={[styles.deleteText, { color: colors.error }]}>Delete Sketch</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: BorderRadius['2xl'],
    alignSelf: 'center',
    ...Shadow.lg,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.lg,
  },
  toggleButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  toggleText: { fontSize: FontSize.md, fontWeight: '600' },
  infoCard: { marginBottom: Spacing.lg },
  sketchName: { fontSize: FontSize.xl, fontWeight: '700', marginBottom: Spacing.md },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: { fontSize: FontSize.sm },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  deleteButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  deleteText: { fontSize: FontSize.md, fontWeight: '600' },
});
