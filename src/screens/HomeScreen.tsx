import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import {
  Camera,
  ImageIcon,
  Sparkles,
  Wand2,
  Coins,
  X,
  Video,
  MessageSquare,
  Zap,
  BookOpen,
} from "lucide-react-native";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSketchContext } from "@/contexts/SketchContext";
import { useStoryContext } from "@/contexts/StoryContext";
import { useToast } from "@/hooks/use-toast";
import type { PresetOption, VideoPromptMode } from "@/types/presets";
import { PRESET_PROMPTS } from "@/types/presets";
import type { MainTabParamList } from "@/types/navigation";
import { decode } from "base64-arraybuffer";

const PRESET_COLORS: Record<PresetOption, { bg: string; text: string }> = {
  cartoon: { bg: "bg-blue-500", text: "text-white" },
  pixar: { bg: "bg-orange-500", text: "text-white" },
  realistic: { bg: "bg-green-600", text: "text-white" },
};

export function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<PresetOption | null>(
    null,
  );
  const [videoPromptMode, setVideoPromptMode] = useState<VideoPromptMode | null>(null);
  const [customVideoPrompt, setCustomVideoPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Story mode state
  const [isStoryMode, setIsStoryMode] = useState(false);
  const [storyTheme, setStoryTheme] = useState("");
  const [selectedSketchForStory, setSelectedSketchForStory] = useState<string | null>(null);

  const { profile } = useUserProfile();
  const { sketches, createSketch, updateSketchStatus, refreshSketches } = useSketchContext();
  const { createStory } = useStoryContext();
  const { toast } = useToast();
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const storyPollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (storyPollIntervalRef.current) {
        clearInterval(storyPollIntervalRef.current);
        storyPollIntervalRef.current = null;
      }
    };
  }, []);

  const isVideoPreset = selectedPreset ? PRESET_PROMPTS[selectedPreset].supportsVideo : false;
  const creditCost = selectedPreset ? PRESET_PROMPTS[selectedPreset].creditCost : 1;

  // Completed sketches available for story character selection
  const completedSketches = sketches.filter(
    (s) => s.status === "completed" && s.animated_image_url !== null,
  );

  const showProcessingAlert = () => {
    Alert.alert(
      "Transformation in Progress",
      "We're bringing your drawing to life. Head to the Gallery to track progress—we'll let you know when it's ready!",
      [
        { text: "Stay Here", style: "cancel" },
        {
          text: "Go to Gallery",
          onPress: () => navigation.navigate("Gallery"),
        },
      ],
    );
  };

  const pickImage = async (source: "camera" | "gallery") => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    };

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const pollVideoStatus = (sketchId: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    let attempts = 0;
    let consecutiveErrors = 0;
    const maxAttempts = 60; // 10s interval * 60 = 10 minutes max
    console.log(`Starting video poll for sketch ${sketchId}`);

    const stopPolling = () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };

    pollIntervalRef.current = setInterval(async () => {
      attempts++;
      console.log(`Poll attempt ${attempts}/${maxAttempts} for sketch ${sketchId}`);
      try {
        // Verify we still have a valid session before invoking
        let { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // Attempt token refresh before giving up
          const { data: refreshData } = await supabase.auth.refreshSession();
          session = refreshData.session;
        }
        if (!session) {
          console.warn("No active session after refresh, skipping poll");
          consecutiveErrors++;
          if (consecutiveErrors >= 5) {
            stopPolling();
            toast({ title: "Session Expired", description: "Please sign in again to continue.", variant: "destructive" });
          }
          return;
        }

        const { data, error } = await supabase.functions.invoke("poll-video", {
          body: { sketchId },
        });

        if (error) {
          consecutiveErrors++;
          let errorDetail = error.message;
          const errorResponse = (error as any).context;
          if (errorResponse && typeof errorResponse.json === "function") {
            try {
              const errorBody = await errorResponse.json();
              errorDetail = errorBody?.error ?? errorBody?.errorDetail ?? error.message;
            } catch {
              // Response already consumed
            }
          }
          console.warn(`Poll error (${consecutiveErrors}):`, errorDetail);
          if (attempts >= maxAttempts) {
            stopPolling();
            await updateSketchStatus(sketchId, "failed");
            toast({ title: "Video Timed Out", description: "Video generation took too long.", variant: "destructive" });
          }
          return;
        }

        consecutiveErrors = 0;

        if (data?.status === "completed") {
          stopPolling();
          await refreshSketches();
          toast({ title: "Video Ready!", description: "Your video has been created!" });
        } else if (data?.status === "failed") {
          stopPolling();
          await refreshSketches();
          toast({ title: "Video Failed", description: data.error ?? "Video generation failed.", variant: "destructive" });
        }
      } catch (err) {
        consecutiveErrors++;
        console.warn(`Poll exception (${consecutiveErrors}):`, err);
        if (attempts >= maxAttempts) {
          stopPolling();
        }
      }
    }, 10_000);
  };

  const pollStoryStatus = (storyId: string) => {
    if (storyPollIntervalRef.current) {
      clearInterval(storyPollIntervalRef.current);
    }

    let attempts = 0;
    const maxAttempts = 72; // 10s interval * 72 = 12 minutes max
    console.log(`Starting story poll for story ${storyId}`);

    const stopPolling = () => {
      if (storyPollIntervalRef.current) {
        clearInterval(storyPollIntervalRef.current);
        storyPollIntervalRef.current = null;
      }
    };

    storyPollIntervalRef.current = setInterval(async () => {
      attempts++;
      console.log(`Story poll attempt ${attempts}/${maxAttempts} for story ${storyId}`);
      try {
        const { data, error } = await supabase.functions.invoke("poll-story", {
          body: { storyId },
        });

        if (error) {
          console.warn("Story poll error:", error.message);
          if (attempts >= maxAttempts) {
            stopPolling();
            setIsProcessing(false);
            toast({
              title: "Generation Timeout",
              description: "Generation is taking longer than expected. Check Gallery soon.",
              variant: "destructive",
            });
          }
          return;
        }

        if (data?.status === "completed") {
          stopPolling();
          setIsProcessing(false);
          toast({ title: "Story Ready!", description: "Your story is ready!" });
          navigation.navigate("Gallery");
        } else if (data?.status === "failed") {
          stopPolling();
          setIsProcessing(false);
          toast({
            title: "Story Generation Failed",
            description: "Story generation failed. No credits were charged.",
            variant: "destructive",
          });
        } else if (attempts >= maxAttempts) {
          stopPolling();
          setIsProcessing(false);
          toast({
            title: "Still Generating",
            description: "Generation is taking longer than expected. Check Gallery soon.",
          });
        }
      } catch (err) {
        console.warn("Story poll exception:", err);
        if (attempts >= maxAttempts) {
          stopPolling();
          setIsProcessing(false);
        }
      }
    }, 10_000);
  };

  const handleGenerateStory = async () => {
    if (!selectedSketchForStory || !storyTheme.trim()) {
      toast({
        title: "Missing Details",
        description: "Please select a character and enter a story theme",
        variant: "destructive",
      });
      return;
    }

    if (!profile || profile.credits < 5) {
      Alert.alert(
        "Insufficient Credits",
        "You need at least 5 credits to generate a story. Purchase more credits from the Account tab.",
        [{ text: "OK" }],
      );
      return;
    }

    setIsProcessing(true);
    try {
      const result = await createStory(selectedSketchForStory, storyTheme.trim());
      if (!result) {
        toast({
          title: "Story Creation Failed",
          description: "Could not start story generation. Please try again.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Start polling for completion
      pollStoryStatus(result.storyId);
    } catch (err: any) {
      console.error("handleGenerateStory error:", err);
      toast({
        title: "Story Creation Failed",
        description: err?.message ?? "Something went wrong",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleTransform = async () => {
    if (!selectedImage || !selectedPreset) {
      toast({
        title: "Missing Selection",
        description: "Please select an image and a style",
        variant: "destructive",
      });
      return;
    }

    if (!profile || profile.credits < creditCost) {
      toast({
        title: "Insufficient Credits",
        description: `You need at least ${creditCost} credit(s) to ${isVideoPreset ? "create a video" : "transform a drawing"}`,
        variant: "destructive",
      });
      return;
    }

    if (isVideoPreset && !videoPromptMode) {
      toast({
        title: "Choose a Video Option",
        description: "Select how you want the motion to be generated",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const resized = await manipulateAsync(
        selectedImage,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: SaveFormat.JPEG },
      );

      const base64 = await FileSystem.readAsStringAsync(resized.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log(`Image resized: ${(base64.length / 1024).toFixed(0)}KB base64`);

      const fileName = `sketch_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("sketches")
        .upload(fileName, decode(base64), {
          contentType: "image/jpeg",
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("sketches").getPublicUrl(uploadData.path);

      const sketch = await createSketch(
        `${PRESET_PROMPTS[selectedPreset].label}`,
        publicUrl,
        isVideoPreset ? "video" : "image",
        isVideoPreset && videoPromptMode === "custom" ? customVideoPrompt : null,
      );

      if (!sketch) {
        throw new Error("Failed to create sketch record");
      }

      showProcessingAlert();

      const { data, error } = await supabase.functions.invoke(
        "process-sketch",
        {
          body: {
            imageData: base64,
            preset: selectedPreset,
            sketchId: sketch.id,
            ...(isVideoPreset && {
              isVideo: true,
              videoPromptMode,
              customVideoPrompt: videoPromptMode === "custom" ? customVideoPrompt : undefined,
            }),
          },
        },
      );

      if (error) {
        let errorDetail = error.message;
        let isContentPolicyViolation = false;
        const errorResponse = (error as any).context;
        if (errorResponse && typeof errorResponse.json === "function") {
          try {
            const errorBody = await errorResponse.json();
            if (errorBody?.error === "CONTENT_POLICY_VIOLATION") {
              isContentPolicyViolation = true;
              errorDetail = errorBody.message;
            } else {
              errorDetail = errorBody?.error ?? errorBody?.details ?? error.message;
            }
            console.error("Edge Function error body:", JSON.stringify(errorBody));
          } catch {
            try {
              const errorText = await (errorResponse as any).text();
              console.error("Edge Function error text:", errorText);
              errorDetail = errorText || error.message;
            } catch {
              // Response already consumed or not available
            }
          }
        }
        console.error("Edge Function error:", errorDetail);
        if (isContentPolicyViolation) {
          toast({
            title: "Content Not Allowed",
            description: errorDetail,
            variant: "destructive",
          });
          return;
        }
        await updateSketchStatus(sketch.id, "failed");
        throw new Error(errorDetail);
      }

      if (data?.videoSubmitted) {
        pollVideoStatus(sketch.id);
        setSelectedImage(null);
        setSelectedPreset(null);
        setVideoPromptMode(null);
        setCustomVideoPrompt("");
        toast({
          title: "Video Generating!",
          description: "Your video is being created. Check Gallery in a few minutes!",
        });
        navigation.navigate("Gallery");
      } else if (data?.animatedImageUrl) {
        await updateSketchStatus(
          sketch.id,
          "completed",
          data.animatedImageUrl,
        );
        setSelectedImage(null);
        setSelectedPreset(null);
        setVideoPromptMode(null);
        setCustomVideoPrompt("");
        toast({
          title: "Transformation Complete!",
          description: "Opening Gallery to show your result!",
        });
        navigation.navigate("Gallery");
      }
    } catch (error: any) {
      console.error("Transform error:", error);
      toast({
        title: "Transformation Failed",
        description: error.message ?? "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Create</Text>
            <Text className="text-sm text-gray-500">
              {isStoryMode ? "Generate a story" : "Transform your drawing"}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center bg-purple-100 rounded-full px-3 py-1.5">
              <Coins color="#7c3aed" size={16} />
              <Text className="text-purple-600 font-semibold ml-1">
                {profile?.credits ?? 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Mode toggle */}
        <View className="flex-row mb-6 bg-gray-200 rounded-xl p-1">
          <TouchableOpacity
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg ${!isStoryMode ? "bg-white shadow-sm" : ""}`}
            onPress={() => setIsStoryMode(false)}
            activeOpacity={0.7}
          >
            <Sparkles color={!isStoryMode ? "#7c3aed" : "#6b7280"} size={16} />
            <Text className={`ml-2 font-semibold text-sm ${!isStoryMode ? "text-purple-600" : "text-gray-500"}`}>
              Transform
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg ${isStoryMode ? "bg-white shadow-sm" : ""}`}
            onPress={() => setIsStoryMode(true)}
            activeOpacity={0.7}
          >
            <BookOpen color={isStoryMode ? "#7c3aed" : "#6b7280"} size={16} />
            <Text className={`ml-2 font-semibold text-sm ${isStoryMode ? "text-purple-600" : "text-gray-500"}`}>
              Create Story
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── STORY MODE ─── */}
        {isStoryMode ? (
          <>
            {/* Character picker */}
            <View className="mb-6">
              <Text className="text-base font-semibold text-gray-800 mb-3">
                Pick a character
              </Text>
              {completedSketches.length === 0 ? (
                <View className="bg-white border border-gray-200 rounded-2xl p-6 items-center">
                  <ImageIcon color="#9ca3af" size={32} />
                  <Text className="text-gray-500 text-sm mt-2 text-center">
                    No transformed characters yet.{"\n"}Transform a drawing first!
                  </Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-3">
                    {completedSketches.map((sketch) => (
                      <TouchableOpacity
                        key={sketch.id}
                        onPress={() => setSelectedSketchForStory(
                          selectedSketchForStory === sketch.id ? null : sketch.id,
                        )}
                        activeOpacity={0.7}
                      >
                        <View
                          className={`rounded-xl overflow-hidden border-2 ${
                            selectedSketchForStory === sketch.id
                              ? "border-purple-500"
                              : "border-transparent"
                          }`}
                        >
                          <Image
                            source={{ uri: sketch.animated_image_url! }}
                            style={{ width: 88, height: 88 }}
                            contentFit="cover"
                          />
                        </View>
                        {selectedSketchForStory === sketch.id && (
                          <View className="absolute top-1 right-1 bg-purple-500 rounded-full w-5 h-5 items-center justify-center">
                            <Text className="text-white text-xs font-bold">✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>

            {/* Theme input */}
            <View className="mb-6">
              <Text className="text-base font-semibold text-gray-800 mb-3">
                Story theme
              </Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-base"
                placeholder="e.g. goes on a space adventure"
                placeholderTextColor="#9ca3af"
                value={storyTheme}
                onChangeText={setStoryTheme}
                multiline={false}
                maxLength={200}
                editable={!isProcessing}
              />
              <Text className="text-xs text-gray-400 mt-1 text-right">
                {storyTheme.length}/200
              </Text>
            </View>

            {/* Generate button */}
            <TouchableOpacity
              className={`rounded-xl py-4 items-center flex-row justify-center ${
                isProcessing || !selectedSketchForStory || !storyTheme.trim()
                  ? "bg-purple-400"
                  : "bg-purple-600"
              }`}
              onPress={handleGenerateStory}
              disabled={isProcessing || !selectedSketchForStory || !storyTheme.trim()}
              activeOpacity={0.8}
            >
              {isProcessing ? (
                <>
                  <ActivityIndicator color="#fff" />
                  <Text className="text-white font-semibold text-base ml-2">
                    Generating your story...
                  </Text>
                </>
              ) : (
                <>
                  <BookOpen color="#fff" size={20} />
                  <Text className="text-white font-semibold text-base ml-2">
                    Generate Story (5 Credits)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          /* ─── TRANSFORM MODE ─── */
          <>
            {selectedImage ? (
              <View className="mb-6">
                <View className="relative rounded-2xl overflow-hidden bg-white border border-gray-200">
                  <Image
                    source={{ uri: selectedImage }}
                    style={{ width: "100%", height: 300 }}
                    contentFit="contain"
                  />
                  <TouchableOpacity
                    className="absolute top-3 right-3 bg-black/50 rounded-full p-2"
                    onPress={() => {
                      setSelectedImage(null);
                      setSelectedPreset(null);
                      setVideoPromptMode(null);
                      setCustomVideoPrompt("");
                    }}
                  >
                    <X color="#fff" size={18} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="mb-6">
                <Text className="text-base font-semibold text-gray-800 mb-3">
                  Choose your drawing
                </Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 bg-white border border-gray-200 rounded-2xl py-8 items-center"
                    onPress={() => pickImage("gallery")}
                    activeOpacity={0.7}
                  >
                    <ImageIcon color="#7c3aed" size={32} />
                    <Text className="text-gray-700 font-medium mt-2">Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-white border border-gray-200 rounded-2xl py-8 items-center"
                    onPress={() => pickImage("camera")}
                    activeOpacity={0.7}
                  >
                    <Camera color="#7c3aed" size={32} />
                    <Text className="text-gray-700 font-medium mt-2">Camera</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {selectedImage && (
              <View className="mb-6">
                <Text className="text-base font-semibold text-gray-800 mb-3">
                  Choose a style
                </Text>
                {(Object.keys(PRESET_PROMPTS) as PresetOption[]).map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    className={`rounded-xl py-4 px-5 mb-3 flex-row items-center ${
                      selectedPreset === preset
                        ? PRESET_COLORS[preset].bg
                        : "bg-white border border-gray-200"
                    }`}
                    onPress={() => {
                      setSelectedPreset(preset);
                      setVideoPromptMode(null);
                      setCustomVideoPrompt("");
                    }}
                    activeOpacity={0.7}
                  >
                    <Wand2
                      color={selectedPreset === preset ? "#fff" : "#6b7280"}
                      size={20}
                    />
                    <Text
                      className={`ml-3 font-semibold text-base flex-1 ${
                        selectedPreset === preset
                          ? PRESET_COLORS[preset].text
                          : "text-gray-700"
                      }`}
                    >
                      {PRESET_PROMPTS[preset].label}
                    </Text>
                    {PRESET_PROMPTS[preset].supportsVideo && (
                      <View className="bg-yellow-400 rounded-full px-2 py-0.5">
                        <Text className="text-xs font-bold text-yellow-900">VIDEO</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {selectedImage && selectedPreset && isVideoPreset && (
              <View className="mb-6">
                <Text className="text-base font-semibold text-gray-800 mb-3">
                  How should it move?
                </Text>
                <TouchableOpacity
                  className={`rounded-xl py-3.5 px-5 mb-3 flex-row items-center ${
                    videoPromptMode === "ai_decide"
                      ? "bg-green-600"
                      : "bg-white border border-gray-200"
                  }`}
                  onPress={() => setVideoPromptMode("ai_decide")}
                  activeOpacity={0.7}
                >
                  <Zap
                    color={videoPromptMode === "ai_decide" ? "#fff" : "#6b7280"}
                    size={20}
                  />
                  <Text
                    className={`ml-3 font-semibold text-base ${
                      videoPromptMode === "ai_decide" ? "text-white" : "text-gray-700"
                    }`}
                  >
                    Let AI decide
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`rounded-xl py-3.5 px-5 mb-3 flex-row items-center ${
                    videoPromptMode === "custom"
                      ? "bg-green-600"
                      : "bg-white border border-gray-200"
                  }`}
                  onPress={() => setVideoPromptMode("custom")}
                  activeOpacity={0.7}
                >
                  <MessageSquare
                    color={videoPromptMode === "custom" ? "#fff" : "#6b7280"}
                    size={20}
                  />
                  <Text
                    className={`ml-3 font-semibold text-base ${
                      videoPromptMode === "custom" ? "text-white" : "text-gray-700"
                    }`}
                  >
                    Custom prompt
                  </Text>
                </TouchableOpacity>
                {videoPromptMode === "custom" && (
                  <TextInput
                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-base"
                    placeholder='e.g. "The butterfly flies away gently"'
                    placeholderTextColor="#9ca3af"
                    value={customVideoPrompt}
                    onChangeText={setCustomVideoPrompt}
                    multiline
                    maxLength={200}
                  />
                )}
              </View>
            )}

            {selectedImage && selectedPreset && (
              <TouchableOpacity
                className={`rounded-xl py-4 items-center flex-row justify-center ${
                  isProcessing || (isVideoPreset && !videoPromptMode) ? "bg-purple-400" : "bg-purple-600"
                }`}
                onPress={handleTransform}
                disabled={isProcessing || (isVideoPreset && !videoPromptMode)}
                activeOpacity={0.8}
              >
                {isProcessing ? (
                  <>
                    <ActivityIndicator color="#fff" />
                    <Text className="text-white font-semibold text-base ml-2">
                      {isVideoPreset ? "Creating Video..." : "Transforming..."}
                    </Text>
                  </>
                ) : (
                  <>
                    {isVideoPreset ? (
                      <Video color="#fff" size={20} />
                    ) : (
                      <Sparkles color="#fff" size={20} />
                    )}
                    <Text className="text-white font-semibold text-base ml-2">
                      {isVideoPreset ? `Create Video (${creditCost} Credits)` : `Transform (${creditCost} Credit)`}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {!selectedImage && (
              <View className="bg-white rounded-2xl p-6 border border-gray-100 mt-2">
                <Text className="text-lg font-semibold text-gray-800 mb-4">
                  How it works
                </Text>
                {[
                  { step: "1", text: "Take a photo or pick a drawing" },
                  {
                    step: "2",
                    text: "Choose a transformation style",
                  },
                  {
                    step: "3",
                    text: "AI transforms it into magical art!",
                  },
                ].map((item) => (
                  <View
                    key={item.step}
                    className="flex-row items-center mb-3 last:mb-0"
                  >
                    <View className="w-8 h-8 rounded-full bg-purple-100 items-center justify-center mr-3">
                      <Text className="text-purple-600 font-bold text-sm">
                        {item.step}
                      </Text>
                    </View>
                    <Text className="text-gray-600 text-sm flex-1">
                      {item.text}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
