import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Coins, Sparkles, Video } from "lucide-react-native";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSketchContext } from "@/contexts/SketchContext";
import { useStoryContext } from "@/contexts/StoryContext";
import { useToast } from "@/hooks/use-toast";
import type { PresetOption, VideoPromptMode } from "@/types/presets";
import { PRESET_PROMPTS } from "@/types/presets";
import type { MainTabParamList } from "@/types/navigation";
import { decode } from "base64-arraybuffer";

import { colors } from "@/theme/colors";
import { shadows } from "@/theme/shadows";
import { spacing } from "@/theme/spacing";
import { PRESS_OPACITY } from "@/theme";
import { AppButton } from "@/components/AppButton";

import { SegmentedControl } from "./home/SegmentedControl";
import { CharacterPicker } from "./home/CharacterPicker";
import { ThemeInput } from "./home/ThemeInput";
import { StylePicker } from "./home/StylePicker";
import { VideoPromptPicker } from "./home/VideoPromptPicker";
import { ImagePreview } from "./home/ImagePreview";
import { ImagePickerCards } from "./home/ImagePickerCards";
import { HowItWorks } from "./home/HowItWorks";

export function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { width } = useWindowDimensions();

  /* ── Transform mode state ── */
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<PresetOption | null>(null);
  const [videoPromptMode, setVideoPromptMode] = useState<VideoPromptMode | null>(null);
  const [customVideoPrompt, setCustomVideoPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  /* ── Story mode state ── */
  const [isStoryMode, setIsStoryMode] = useState(false);
  const [storyTheme, setStoryTheme] = useState("");
  const [selectedSketchForStory, setSelectedSketchForStory] = useState<string | null>(null);

  /* ── Hooks ── */
  const { profile } = useUserProfile();
  const { sketches, createSketch, updateSketchStatus, refreshSketches } = useSketchContext();
  const { createStory } = useStoryContext();
  const { toast } = useToast();
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const storyPollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (storyPollIntervalRef.current) clearInterval(storyPollIntervalRef.current);
    };
  }, []);

  /* ── Derived ── */
  const isVideoPreset = selectedPreset ? PRESET_PROMPTS[selectedPreset].supportsVideo : false;
  const creditCost = selectedPreset ? PRESET_PROMPTS[selectedPreset].creditCost : 1;
  const isCompact = width < 380;
  const completedSketches = sketches.filter(
    (s) => s.status === "completed" && s.animated_image_url !== null,
  );

  /* ── Helpers ── */

  const resetTransformState = () => {
    setSelectedImage(null);
    setSelectedPreset(null);
    setVideoPromptMode(null);
    setCustomVideoPrompt("");
  };

  const showProcessingAlert = () => {
    Alert.alert(
      "Transformation in Progress",
      "We're bringing your drawing to life. Head to the Gallery to track progress — we'll let you know when it's ready!",
      [
        { text: "Stay Here", style: "cancel" },
        { text: "Go to Gallery", onPress: () => navigation.navigate("Gallery") },
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

  /* ── Polling: Video ── */

  const pollVideoStatus = (sketchId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    let attempts = 0;
    let consecutiveErrors = 0;
    const maxAttempts = 60;

    const stopPolling = () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };

    pollIntervalRef.current = setInterval(async () => {
      attempts++;
      try {
        let { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const { data: refreshData } = await supabase.auth.refreshSession();
          session = refreshData.session;
        }
        if (!session) {
          consecutiveErrors++;
          if (consecutiveErrors >= 5) {
            stopPolling();
            toast({ title: "Session Expired", description: "Please sign in again to continue.", variant: "destructive" });
          }
          return;
        }

        const { data, error } = await supabase.functions.invoke("poll-video", { body: { sketchId } });

        if (error) {
          consecutiveErrors++;
          let errorDetail = error.message;
          const errorResponse = (error as any).context;
          if (errorResponse && typeof errorResponse.json === "function") {
            try {
              const errorBody = await errorResponse.json();
              errorDetail = errorBody?.error ?? errorBody?.errorDetail ?? error.message;
            } catch { /* consumed */ }
          }
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
        if (attempts >= maxAttempts) {
          stopPolling();
          setIsProcessing(false);
          await updateSketchStatus(sketchId, "failed");
          toast({ title: "Video Timed Out", description: "Video generation took too long. Please try again.", variant: "destructive" });
        }
      }
    }, 10_000);
  };

  /* ── Polling: Story ── */

  const pollStoryStatus = (storyId: string) => {
    if (storyPollIntervalRef.current) clearInterval(storyPollIntervalRef.current);

    let attempts = 0;
    const maxAttempts = 72;

    const stopPolling = () => {
      if (storyPollIntervalRef.current) {
        clearInterval(storyPollIntervalRef.current);
        storyPollIntervalRef.current = null;
      }
    };

    let consecutiveErrors = 0;

    storyPollIntervalRef.current = setInterval(async () => {
      attempts++;
      try {
        let { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const { data: refreshData } = await supabase.auth.refreshSession();
          session = refreshData.session;
        }
        if (!session) {
          consecutiveErrors++;
          if (consecutiveErrors >= 5) {
            stopPolling();
            setIsProcessing(false);
            toast({ title: "Session Expired", description: "Please sign in again to continue.", variant: "destructive" });
          }
          return;
        }

        const { data, error } = await supabase.functions.invoke("poll-story", { body: { storyId } });

        if (error) {
          if (attempts >= maxAttempts) {
            stopPolling();
            setIsProcessing(false);
            toast({ title: "Generation Timeout", description: "Generation is taking longer than expected. Check Gallery soon.", variant: "destructive" });
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
          toast({ title: "Story Generation Failed", description: "Story generation failed. No credits were charged.", variant: "destructive" });
        } else if (attempts >= maxAttempts) {
          stopPolling();
          setIsProcessing(false);
          toast({ title: "Still Generating", description: "Generation is taking longer than expected. Check Gallery soon." });
        }
      } catch (err) {
        consecutiveErrors++;
        if (attempts >= maxAttempts) {
          stopPolling();
          setIsProcessing(false);
          toast({ title: "Story Timed Out", description: "Story generation took too long. Check Gallery soon.", variant: "destructive" });
        }
      }
    }, 10_000);
  };

  /* ── Actions ── */

  const handleGenerateStory = async () => {
    if (!selectedSketchForStory || !storyTheme.trim()) {
      toast({ title: "Missing Details", description: "Please select a character and enter a story theme", variant: "destructive" });
      return;
    }
    if (!profile || profile.credits < 5) {
      Alert.alert("Insufficient Credits", "You need at least 5 credits to generate a story. Purchase more credits from the Account tab.", [{ text: "OK" }]);
      return;
    }

    setIsProcessing(true);
    try {
      const result = await createStory(selectedSketchForStory, storyTheme.trim());
      if (!result) {
        toast({ title: "Story Creation Failed", description: "Could not start story generation. Please try again.", variant: "destructive" });
        setIsProcessing(false);
        return;
      }
      pollStoryStatus(result.storyId);
    } catch (err: any) {
      toast({ title: "Story Creation Failed", description: err?.message ?? "Something went wrong", variant: "destructive" });
      setIsProcessing(false);
    }
  };

  const handleTransform = async () => {
    if (!selectedImage || !selectedPreset) {
      toast({ title: "Missing Selection", description: "Please select an image and a style", variant: "destructive" });
      return;
    }
    if (!profile || profile.credits < creditCost) {
      toast({ title: "Insufficient Credits", description: `You need at least ${creditCost} credit(s) to ${isVideoPreset ? "create a video" : "transform a drawing"}`, variant: "destructive" });
      return;
    }
    if (isVideoPreset && !videoPromptMode) {
      toast({ title: "Choose a Video Option", description: "Select how you want the motion to be generated", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const resized = await manipulateAsync(selectedImage, [{ resize: { width: 1024 } }], { compress: 0.7, format: SaveFormat.JPEG });
      const base64 = await FileSystem.readAsStringAsync(resized.uri, { encoding: FileSystem.EncodingType.Base64 });
      const fileName = `sketch_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("sketches")
        .upload(fileName, decode(base64), { contentType: "image/jpeg" });
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage.from("sketches").getPublicUrl(uploadData.path);

      const sketch = await createSketch(
        `${PRESET_PROMPTS[selectedPreset].label}`,
        publicUrl,
        isVideoPreset ? "video" : "image",
        isVideoPreset && videoPromptMode === "custom" ? customVideoPrompt : null,
      );
      if (!sketch) throw new Error("Failed to create sketch record");

      showProcessingAlert();

      const { data, error } = await supabase.functions.invoke("process-sketch", {
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
      });

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
          } catch {
            try {
              const errorText = await (errorResponse as any).text();
              errorDetail = errorText || error.message;
            } catch { /* consumed */ }
          }
        }
        if (isContentPolicyViolation) {
          await updateSketchStatus(sketch.id, "failed");
          toast({ title: "Content Not Allowed", description: errorDetail, variant: "destructive" });
          return;
        }
        await updateSketchStatus(sketch.id, "failed");
        throw new Error(errorDetail);
      }

      if (data?.videoSubmitted) {
        pollVideoStatus(sketch.id);
        resetTransformState();
        toast({ title: "Video Generating!", description: "Your video is being created. Check Gallery in a few minutes!" });
        navigation.navigate("Gallery");
      } else if (data?.animatedImageUrl) {
        await updateSketchStatus(sketch.id, "completed", data.animatedImageUrl);
        resetTransformState();
        toast({ title: "Transformation Complete!", description: "Opening Gallery to show your result!" });
        navigation.navigate("Gallery");
      }
    } catch (error: any) {
      toast({ title: "Transformation Failed", description: error.message ?? "Something went wrong", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  /* ─────────────────────────  JSX  ───────────────────────── */

  const storyReady = !!selectedSketchForStory && !!storyTheme.trim();
  const transformReady = !!selectedPreset && (!isVideoPreset || !!videoPromptMode);

  return (
    <SafeAreaView style={st.screen}>
      <KeyboardAvoidingView
        style={st.flex1}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* ── Top bar: mode toggle + credits ── */}
        <View style={st.topBar}>
          <SegmentedControl
            isStoryMode={isStoryMode}
            onChangeMode={setIsStoryMode}
            isCompact={isCompact}
          />
          <View style={st.creditBadge}>
            <Coins color={colors.primary[400]} size={15} />
            <Text style={st.creditText}>{profile?.credits ?? 0}</Text>
          </View>
        </View>

        <ScrollView
          style={st.flex1}
          contentContainerStyle={[st.scrollContent, { paddingBottom: Platform.OS === "ios" ? 120 : 100 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ═══════════════  STORY MODE  ═══════════════ */}
          {isStoryMode ? (
            <>
              <CharacterPicker
                completedSketches={completedSketches}
                selectedId={selectedSketchForStory}
                onSelect={setSelectedSketchForStory}
              />
              <ThemeInput
                value={storyTheme}
                onChangeText={setStoryTheme}
                disabled={isProcessing}
              />
              <AppButton
                label="Generate Story"
                onPress={handleGenerateStory}
                disabled={!storyReady}
                loading={isProcessing}
                loadingLabel="Generating your story…"
                icon={<Sparkles color={colors.white} size={20} />}
              />
            </>
          ) : (
            /* ═══════════════  TRANSFORM MODE  ═══════════════ */
            <>
              {selectedImage ? (
                <>
                  <ImagePreview uri={selectedImage} onClose={resetTransformState} />
                  <StylePicker
                    selectedPreset={selectedPreset}
                    onSelect={(p) => {
                      setSelectedPreset(p);
                      setVideoPromptMode(null);
                      setCustomVideoPrompt("");
                    }}
                  />
                  {selectedPreset && isVideoPreset && (
                    <VideoPromptPicker
                      mode={videoPromptMode}
                      onSelectMode={setVideoPromptMode}
                      customPrompt={customVideoPrompt}
                      onChangeCustomPrompt={setCustomVideoPrompt}
                    />
                  )}
                  {selectedPreset && (
                    <AppButton
                      label={
                        isVideoPreset
                          ? `Create Video (${creditCost} Credits)`
                          : `Transform (${creditCost} Credit)`
                      }
                      onPress={handleTransform}
                      disabled={!transformReady}
                      loading={isProcessing}
                      loadingLabel={isVideoPreset ? "Creating Video…" : "Transforming…"}
                      icon={
                        isVideoPreset
                          ? <Video color={colors.white} size={20} />
                          : <Sparkles color={colors.white} size={20} />
                      }
                      disabledColor={colors.primary[400]}
                    />
                  )}
                </>
              ) : (
                <>
                  <ImagePickerCards
                    onPickGallery={() => pickImage("gallery")}
                    onPickCamera={() => pickImage("camera")}
                    isCompact={isCompact}
                  />
                  <HowItWorks />
                </>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ─────────────────────────  STYLES  ───────────────────────── */

const st = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex1: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 12,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 4,
  },

  /* Credit badge */
  creditBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: 6,
    ...shadows.xs,
  },
  creditText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.gray[700],
  },
});
