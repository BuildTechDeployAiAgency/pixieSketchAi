import { useState, useCallback, memo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useFocusEffect } from "@react-navigation/native";
import {
  Download,
  Trash2,
  RefreshCw,
  X,
  AlertCircle,
  Loader2,
  CheckCircle,
  Eye,
  Play,
  CheckSquare,
  Square,
} from "lucide-react-native";
import { useSketchContext } from "@/contexts/SketchContext";
import { useToast } from "@/hooks/use-toast";
import type { Sketch } from "@/hooks/sketch/useSketchState";
import { formatDate } from "@/components/utils";
import { colors, PRESS_OPACITY } from "@/theme";

type SketchCardProps = {
  item: Sketch;
  isSelecting: boolean;
  isSelected: boolean;
  onPreview: (sketch: Sketch) => void;
  onToggleSelect: (id: string) => void;
  onShare: (mediaUrl: string, name: string, contentType: "image" | "video") => void;
  onDelete: (id: string) => void;
  onRetry: (id: string) => void;
};

/** Pressable uses `style` prop to avoid NativeWind CssInterop + React Navigation context crash. */
const SketchCard = memo(function SketchCard({
  item,
  isSelecting,
  isSelected,
  onPreview,
  onToggleSelect,
  onShare,
  onDelete,
  onRetry,
}: SketchCardProps) {
  return (
    <View className="flex-1 m-1.5 bg-white rounded-xl border border-gray-100 overflow-hidden">
      {isSelecting && (
        <Pressable
          style={gs.selectCheckbox}
          onPress={() => onToggleSelect(item.id)}
        >
          {isSelected ? (
            <CheckSquare color={colors.primary.DEFAULT} size={22} fill={colors.primary.DEFAULT} />
          ) : (
            <Square color={colors.gray[400]} size={22} />
          )}
        </Pressable>
      )}
      {!isSelecting && item.is_new && (
        <View className="absolute top-2 left-2 z-10 bg-purple-600 rounded-full px-2 py-0.5">
          <Text className="text-white text-xs font-bold">NEW</Text>
        </View>
      )}
      {item.content_type === "video" && (
        <View className="absolute top-2 right-2 z-10 bg-yellow-400 rounded-full px-2 py-0.5">
          <Text className="text-yellow-900 text-xs font-bold">VIDEO</Text>
        </View>
      )}

      <Pressable
        onPress={() => isSelecting ? onToggleSelect(item.id) : onPreview(item)}
        style={({ pressed }) => ({ opacity: pressed ? PRESS_OPACITY : 1 })}
      >
        <Image
          source={{
            uri: item.content_type === "video"
              ? (item.original_image_url ?? undefined)
              : (item.animated_image_url ?? item.original_image_url ?? undefined),
          }}
          style={{ width: "100%", height: 160 }}
          contentFit="cover"
        />
        {item.content_type === "video" && item.status === "completed" && (
          <View className="absolute inset-0 items-center justify-center">
            <View className="bg-black/40 rounded-full p-3">
              <Play color={colors.white} size={24} fill={colors.white} />
            </View>
          </View>
        )}
      </Pressable>

      <View className="p-3">
        <Text className="text-sm font-medium text-gray-800 mb-1" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-xs text-gray-400 mb-2">
          {formatDate(item.created_at)}
        </Text>

        <View className="flex-row items-center mb-2">
          {item.status === "completed" && (
            <View className="flex-row items-center bg-green-50 rounded-full px-2 py-0.5">
              <CheckCircle color={colors.success} size={12} />
              <Text className="text-green-600 text-xs ml-1">Complete</Text>
            </View>
          )}
          {item.status === "processing" && (
            <View className="flex-row items-center bg-yellow-50 rounded-full px-2 py-0.5">
              <ActivityIndicator size="small" color={colors.warningDark} />
              <Text className="text-yellow-600 text-xs ml-1">Processing</Text>
            </View>
          )}
          {item.status === "failed" && (
            <View className="flex-row items-center bg-red-50 rounded-full px-2 py-0.5">
              <AlertCircle color={colors.error} size={12} />
              <Text className="text-red-600 text-xs ml-1">Failed</Text>
            </View>
          )}
        </View>

        <View className="flex-row gap-2">
          {item.status === "completed" && item.animated_image_url && (
            <Pressable
              onPress={() => onShare(item.animated_image_url!, item.name, item.content_type)}
              style={({ pressed }) => [
                gs.shareBtn,
                { opacity: pressed ? PRESS_OPACITY : 1 },
              ]}
            >
              <Download color={colors.primary.DEFAULT} size={14} />
              <Text className="text-purple-600 text-xs font-medium ml-1">
                Share
              </Text>
            </Pressable>
          )}
          {item.status === "failed" && (
            <Pressable
              onPress={() => onRetry(item.id)}
              style={({ pressed }) => [
                gs.retryBtn,
                { opacity: pressed ? PRESS_OPACITY : 1 },
              ]}
            >
              <RefreshCw color={colors.warningDark} size={14} />
              <Text className="text-yellow-600 text-xs font-medium ml-1">
                Retry
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => onDelete(item.id)}
            style={({ pressed }) => [
              gs.deleteBtn,
              { opacity: pressed ? PRESS_OPACITY : 1 },
            ]}
          >
            <Trash2 color={colors.error} size={14} />
          </Pressable>
        </View>
      </View>
    </View>
  );
});

export function GalleryScreen() {
  const {
    sketches,
    isLoading,
    error,
    newSketchCount,
    deleteSketch,
    deleteSketches,
    retrySketch,
    markSketchAsViewed,
    refreshSketches,
  } = useSketchContext();
  const { toast } = useToast();
  const [previewMedia, setPreviewMedia] = useState<{
    url: string;
    type: "image" | "video";
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false);

  const videoUrl = previewMedia?.type === "video" ? previewMedia.url : "";
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    if (videoUrl) p.play();
  });

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshSketches();
    setIsRefreshing(false);
  }, [refreshSketches]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(sketches.map((s) => s.id)));
  }, [sketches]);

  const selectFailed = useCallback(() => {
    setSelectedIds(
      new Set(sketches.filter((s) => s.status === "failed").map((s) => s.id)),
    );
  }, [sketches]);

  const selectNone = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const exitSelecting = useCallback(() => {
    setIsSelecting(false);
    setSelectedIds(new Set());
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      "Delete Sketches",
      `Are you sure you want to delete ${selectedIds.size} sketch${selectedIds.size === 1 ? "" : "es"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteSketches(Array.from(selectedIds));
            exitSelecting();
          },
        },
      ],
    );
  }, [selectedIds, deleteSketches, exitSelecting]);

  useFocusEffect(
    useCallback(() => {
      refreshSketches();
    }, [refreshSketches]),
  );

  const handleShare = useCallback(
    async (mediaUrl: string, name: string, contentType: "image" | "video") => {
      try {
        const ext = contentType === "video" ? "mp4" : "jpg";
        const fileName = `pixiesketch_${Date.now()}.${ext}`;
        const fileUri = FileSystem.documentDirectory + fileName;
        const downloadResult = await FileSystem.downloadAsync(mediaUrl, fileUri);

        if (downloadResult.status === 200) {
          await Sharing.shareAsync(downloadResult.uri);
        }
      } catch (err) {
        toast({
          title: "Share Failed",
          description: `Unable to share this ${contentType}`,
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert(
        "Delete Sketch",
        "Are you sure you want to delete this sketch?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => deleteSketch(id),
          },
        ],
      );
    },
    [deleteSketch],
  );

  const handlePreview = useCallback(
    async (sketch: Sketch) => {
      const mediaUrl = sketch.animated_image_url ?? sketch.original_image_url;
      if (!mediaUrl) return;

      if (sketch.is_new) {
        markSketchAsViewed(sketch.id);
      }

      if (sketch.content_type === "video") {
        const localPath = FileSystem.documentDirectory + `preview_${sketch.id}.mp4`;
        const info = await FileSystem.getInfoAsync(localPath);
        if (info.exists) {
          setPreviewMedia({ url: localPath, type: "video" });
          return;
        }

        setIsDownloadingVideo(true);
        try {
          const dl = await FileSystem.downloadAsync(mediaUrl, localPath);
          if (dl.status === 200) {
            setPreviewMedia({ url: localPath, type: "video" });
          } else {
            toast({ title: "Download Failed", description: "Could not load the video", variant: "destructive" });
          }
        } catch {
          toast({ title: "Download Failed", description: "Could not load the video", variant: "destructive" });
        } finally {
          setIsDownloadingVideo(false);
        }
        return;
      }

      setPreviewMedia({ url: mediaUrl, type: sketch.content_type });
    },
    [markSketchAsViewed, toast],
  );

  const renderSketchCard = useCallback(
    ({ item }: { item: Sketch }) => (
      <SketchCard
        item={item}
        isSelecting={isSelecting}
        isSelected={selectedIds.has(item.id)}
        onPreview={handlePreview}
        onToggleSelect={toggleSelect}
        onShare={handleShare}
        onDelete={handleDelete}
        onRetry={retrySketch}
      />
    ),
    [handlePreview, handleShare, handleDelete, retrySketch, isSelecting, selectedIds, toggleSelect],
  );

  if (isLoading && sketches.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text className="text-gray-500 mt-3">Loading gallery...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-900">Gallery</Text>
        <View className="flex-row items-center gap-3">
          {!isSelecting && newSketchCount > 0 && (
            <View className="bg-purple-600 rounded-full px-2.5 py-0.5">
              <Text className="text-white text-xs font-bold">
                {newSketchCount} new
              </Text>
            </View>
          )}
          {sketches.length > 0 && (
            <Pressable
              onPress={isSelecting ? exitSelecting : () => setIsSelecting(true)}
              style={({ pressed }) => ({ opacity: pressed ? PRESS_OPACITY : 1 })}
            >
              <Text className="text-purple-600 font-semibold text-base">
                {isSelecting ? "Done" : "Edit"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {isSelecting && (
        <View className="px-6 pb-2 flex-row gap-2">
          <Pressable
            onPress={selectAll}
            style={({ pressed }) => [
              gs.chipPurple,
              { opacity: pressed ? PRESS_OPACITY : 1 },
            ]}
          >
            <Text className="text-purple-700 text-sm font-medium">All</Text>
          </Pressable>
          <Pressable
            onPress={selectFailed}
            style={({ pressed }) => [
              gs.chipRed,
              { opacity: pressed ? PRESS_OPACITY : 1 },
            ]}
          >
            <Text className="text-red-700 text-sm font-medium">Failed</Text>
          </Pressable>
          <Pressable
            onPress={selectNone}
            style={({ pressed }) => [
              gs.chipGray,
              { opacity: pressed ? PRESS_OPACITY : 1 },
            ]}
          >
            <Text className="text-gray-600 text-sm font-medium">None</Text>
          </Pressable>
        </View>
      )}

      {sketches.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Eye color={colors.gray[300]} size={48} />
          <Text className="text-gray-400 text-lg mt-4 font-medium">
            No sketches yet
          </Text>
          <Text className="text-gray-400 text-sm mt-1 text-center">
            Go to the Create tab to transform your first drawing!
          </Text>
        </View>
      ) : (
        <FlatList
          data={sketches}
          renderItem={renderSketchCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          extraData={selectedIds}
          contentContainerStyle={{ padding: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary.DEFAULT}
            />
          }
        />
      )}

      {isSelecting && selectedIds.size > 0 && (
        <View className="px-6 py-3 bg-white border-t border-gray-200 flex-row items-center justify-between">
          <Text className="text-gray-700 font-medium">
            {selectedIds.size} selected
          </Text>
          <Pressable
            onPress={handleBulkDelete}
            style={({ pressed }) => [
              gs.bulkDeleteBtn,
              { opacity: pressed ? PRESS_OPACITY : 1 },
            ]}
          >
            <Text style={gs.bulkDeleteText}>Delete</Text>
          </Pressable>
        </View>
      )}

      <Modal
        visible={isDownloadingVideo}
        transparent
        animationType="fade"
      >
        <View className="flex-1 bg-black/70 items-center justify-center">
          <ActivityIndicator size="large" color={colors.white} />
          <Text className="text-white mt-3 font-medium">Loading video...</Text>
        </View>
      </Modal>

      <Modal
        visible={!!previewMedia}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewMedia(null)}
      >
        <View className="flex-1 bg-black/90 items-center justify-center">
          <Pressable
            onPress={() => setPreviewMedia(null)}
            style={({ pressed }) => [
              gs.closePreviewBtn,
              { opacity: pressed ? PRESS_OPACITY : 1 },
            ]}
          >
            <X color={colors.white} size={24} />
          </Pressable>
          {previewMedia?.type === "video" ? (
            <VideoView
              player={player}
              style={{ width: "90%", height: "70%" }}
              contentFit="contain"
              nativeControls
            />
          ) : previewMedia ? (
            <Image
              source={{ uri: previewMedia.url }}
              style={{ width: "90%", height: "70%" }}
              contentFit="contain"
            />
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const gs = StyleSheet.create({
  selectCheckbox: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 20,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  retryBtn: {
    flex: 1,
    backgroundColor: "#fefce8",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  deleteBtn: {
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  chipPurple: {
    backgroundColor: colors.primary[100],
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chipRed: {
    backgroundColor: "#fee2e2",
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chipGray: {
    backgroundColor: colors.gray[100],
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  bulkDeleteBtn: {
    backgroundColor: colors.error,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bulkDeleteText: {
    color: colors.white,
    fontWeight: "600",
  },
  closePreviewBtn: {
    position: "absolute",
    top: 64,
    right: 24,
    zIndex: 10,
    backgroundColor: colors.overlay.whiteSubtle,
    borderRadius: 9999,
    padding: 8,
  },
});
