import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { useSketches } from '@/hooks/useSketches';
import { SketchCard } from '@/components/sketch/SketchCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Badge } from '@/components/ui/Badge';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';
import type { Sketch } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GalleryScreen() {
  const { isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const { sketches, isLoading, newSketchCount, fetchSketches, deleteSketch, markAsViewed, retrySketch } = useSketches();
  const [refreshing, setRefreshing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');

  const filteredSketches = sketches.filter((s) => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSketches();
    setRefreshing(false);
  };

  const handleSketchPress = (sketch: Sketch) => {
    if (sketch.is_new) {
      markAsViewed(sketch.id);
    }
    if (sketch.status === 'completed' && sketch.animated_image_url) {
      setPreviewImage(sketch.animated_image_url);
    }
  };

  const filters = [
    { key: 'all', label: 'All', count: sketches.length },
    { key: 'completed', label: 'Done', count: sketches.filter((s) => s.status === 'completed').length },
    { key: 'processing', label: 'Active', count: sketches.filter((s) => s.status === 'processing').length },
    { key: 'failed', label: 'Failed', count: sketches.filter((s) => s.status === 'failed').length },
  ] as const;

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🖼️</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Your Gallery</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Sign in to see your transformed sketches
          </Text>
          <GradientButton
            title="Sign In"
            onPress={() => router.push('/(auth)/login')}
            size="lg"
            style={{ marginTop: Spacing.xl }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Gallery</Text>
          {newSketchCount > 0 && (
            <Badge
              label={`${newSketchCount} new`}
              backgroundColor={colors.primary}
              size="sm"
              style={{ marginTop: Spacing.xs }}
            />
          )}
        </View>
        <Text style={[styles.count, { color: colors.textSecondary }]}>
          {sketches.length} sketch{sketches.length !== 1 ? 'es' : ''}
        </Text>
      </Animated.View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === f.key ? colors.primary : colors.surface,
                borderColor: filter === f.key ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f.key ? '#fff' : colors.textSecondary },
              ]}
            >
              {f.label} ({f.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sketch List */}
      <FlatList
        data={filteredSketches}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <SketchCard
            sketch={item}
            index={index}
            onPress={() => handleSketchPress(item)}
            onDelete={() => deleteSketch(item.id)}
            onRetry={() => retrySketch(item.id, 'cartoon')}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>
              {filter === 'all' ? '🎨' : filter === 'failed' ? '😊' : '⏳'}
            </Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {filter === 'all' ? 'No Sketches Yet' : `No ${filter} sketches`}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {filter === 'all'
                ? 'Create your first transformation!'
                : 'Try a different filter'}
            </Text>
            {filter === 'all' && (
              <GradientButton
                title="Create First Sketch"
                onPress={() => router.push('/(tabs)/create')}
                size="lg"
                style={{ marginTop: Spacing.xl }}
              />
            )}
          </Animated.View>
        }
      />

      {/* Image Preview Modal */}
      <Modal
        visible={!!previewImage}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <TouchableOpacity
          style={styles.previewOverlay}
          activeOpacity={1}
          onPress={() => setPreviewImage(null)}
        >
          <Animated.View entering={ZoomIn.duration(300)}>
            <Image
              source={{ uri: previewImage || '' }}
              style={styles.previewFullImage}
              resizeMode="contain"
            />
          </Animated.View>
          <Text style={styles.previewDismiss}>Tap anywhere to close</Text>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  title: { fontSize: FontSize['2xl'], fontWeight: '800' },
  count: { fontSize: FontSize.sm, fontWeight: '500', marginTop: Spacing.sm },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterText: { fontSize: FontSize.xs, fontWeight: '600' },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['5xl'],
  },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', marginBottom: Spacing.sm },
  emptySubtitle: { fontSize: FontSize.md, textAlign: 'center' },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewFullImage: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_WIDTH - 32,
    borderRadius: BorderRadius.xl,
  },
  previewDismiss: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.sm,
    marginTop: Spacing.xl,
  },
});
