import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PRESET_PROMPTS } from "@/types/presets";
import type { PresetOption } from "@/types/presets";
import type { Sketch } from "./useSketchState";
import { convertToSketch } from "./useSketchState";

const LABEL_TO_PRESET: Record<string, PresetOption> = Object.fromEntries(
  (Object.entries(PRESET_PROMPTS) as [PresetOption, { label: string }][]).map(
    ([key, val]) => [val.label, key],
  ),
) as Record<string, PresetOption>;

interface UseSketchOperationsProps {
  sketches: Sketch[];
  setSketches: React.Dispatch<React.SetStateAction<Sketch[]>>;
  setNewSketchCount: React.Dispatch<React.SetStateAction<number>>;
}

export const useSketchOperations = ({
  sketches,
  setSketches,
  setNewSketchCount,
}: UseSketchOperationsProps) => {
  const { toast } = useToast();

  const createSketch = async (
    name: string,
    originalImageUrl: string,
    contentType: "image" | "video" = "image",
    videoPrompt: string | null = null,
    preset: PresetOption | null = null,
  ) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to save sketches",
          variant: "destructive",
        });
        return null;
      }

      console.log("🎨 Creating new sketch:", { name, originalImageUrl, contentType });

      const { data, error } = await supabase
        .from("sketches")
        .insert([
          {
            user_id: user.user.id,
            name,
            original_image_url: originalImageUrl,
            status: "processing",
            content_type: contentType,
            ...(preset && { preset }),
            ...(videoPrompt && { video_prompt: videoPrompt }),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("❌ Error creating sketch:", error);
        toast({
          title: "Error",
          description: "Failed to save sketch",
          variant: "destructive",
        });
        return null;
      }

      console.log("✅ Sketch created successfully:", data.id);
      toast({
        title: "✨ Sketch Saved!",
        description: "Your sketch is being processed",
      });

      return convertToSketch(data);
    } catch (error) {
      console.error("💥 Error creating sketch:", error);
      return null;
    }
  };

  const retrySketch = async (sketchId: string) => {
    try {
      const sketch = sketches.find((s) => s.id === sketchId);
      if (!sketch?.original_image_url) {
        toast({
          title: "Retry Failed",
          description: "Original image not found",
          variant: "destructive",
        });
        return;
      }

      const preset =
        (sketch.preset as PresetOption | null) ?? LABEL_TO_PRESET[sketch.name];
      if (!preset) {
        toast({
          title: "Retry Failed",
          description: "Could not determine transformation style",
          variant: "destructive",
        });
        return;
      }

      console.log(`Retrying sketch ${sketchId} with preset: ${preset}`);

      // Update status to processing
      await supabase
        .from("sketches")
        .update({ status: "processing", updated_at: new Date().toISOString() })
        .eq("id", sketchId);

      setSketches((prev) =>
        prev.map((s) =>
          s.id === sketchId ? { ...s, status: "processing" as const } : s,
        ),
      );

      toast({
        title: "Retry Started",
        description: "Your sketch is being processed again",
      });

      // Download original image and convert to base64
      const response = await fetch(sketch.original_image_url);
      if (!response.ok) {
        throw new Error("Failed to download original image");
      }
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl.slice(dataUrl.indexOf(",") + 1));
        };
        reader.onerror = () => reject(new Error("Failed to read image data"));
        reader.readAsDataURL(blob);
      });

      // Re-invoke the Edge Function
      const isVideo = sketch.content_type === "video";
      const { data, error: fnError } = await supabase.functions.invoke(
        "process-sketch",
        {
          body: {
            imageData: base64,
            preset,
            sketchId,
            ...(isVideo && {
              isVideo: true,
              videoPromptMode: sketch.video_prompt ? "custom" : "ai_decide",
              customVideoPrompt: sketch.video_prompt ?? undefined,
            }),
          },
        },
      );

      if (fnError) {
        let errorDetail = fnError.message;
        const errorResponse = (fnError as any).context;
        if (errorResponse && typeof errorResponse.json === "function") {
          try {
            const errorBody = await errorResponse.json();
            errorDetail =
              errorBody?.error ?? errorBody?.details ?? fnError.message;
          } catch {
            // Response not parseable
          }
        }
        throw new Error(errorDetail);
      }

      if (data?.animatedImageUrl) {
        setSketches((prev) =>
          prev.map((s) =>
            s.id === sketchId
              ? {
                  ...s,
                  status: "completed" as const,
                  animated_image_url: data.animatedImageUrl,
                }
              : s,
          ),
        );
      }

      toast({
        title: "Transformation Complete!",
        description: "Check the Gallery to see your result!",
      });
    } catch (error: any) {
      console.error("Retry failed:", error);

      await supabase
        .from("sketches")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", sketchId);

      setSketches((prev) =>
        prev.map((s) =>
          s.id === sketchId ? { ...s, status: "failed" as const } : s,
        ),
      );

      toast({
        title: "Retry Failed",
        description: error.message ?? "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const updateSketchStatus = async (
    id: string,
    status: "processing" | "completed" | "failed",
    animatedImageUrl?: string,
  ) => {
    try {
      const updateData: {
        status: string;
        updated_at: string;
        animated_image_url?: string;
      } = { status, updated_at: new Date().toISOString() };
      if (animatedImageUrl) {
        updateData.animated_image_url = animatedImageUrl;
      }

      const { error } = await supabase
        .from("sketches")
        .update(updateData)
        .eq("id", id);

      if (error) {
        console.error("Error updating sketch:", error);
        return;
      }

      if (status === "completed") {
        toast({
          title: "🎉 Animation Complete!",
          description:
            "Your sketch has been transformed into a magical animation!",
        });
      }
    } catch (error) {
      console.error("Error updating sketch:", error);
    }
  };

  const markSketchAsViewed = async (id: string) => {
    try {
      const { error } = await supabase
        .from("sketches")
        .update({ is_new: false })
        .eq("id", id);

      if (!error) {
        setSketches((prev) =>
          prev.map((sketch) =>
            sketch.id === id ? { ...sketch, is_new: false } : sketch,
          ),
        );
        setNewSketchCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking sketch as viewed:", error);
    }
  };

  const deleteSketches = async (ids: string[]) => {
    if (ids.length === 0) return;

    try {
      const { error } = await supabase
        .from("sketches")
        .delete()
        .in("id", ids);

      if (error) {
        console.error("Error bulk-deleting sketches:", error);
        toast({
          title: "Error",
          description: "Failed to delete sketches",
          variant: "destructive",
        });
        return;
      }

      const idSet = new Set(ids);
      let deletedSketches: Sketch[] = [];
      setSketches((prev) => {
        deletedSketches = prev.filter((s) => idSet.has(s.id));
        return prev.filter((s) => !idSet.has(s.id));
      });

      const filesToDelete: string[] = [];
      for (const sketch of deletedSketches) {
        if (sketch.original_image_url) {
          const p = sketch.original_image_url.split("/").pop();
          if (p) filesToDelete.push(p);
        }
        if (sketch.animated_image_url) {
          const p = sketch.animated_image_url.split("/").pop();
          if (p) filesToDelete.push(p);
        }
      }

      if (filesToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("sketches")
          .remove(filesToDelete);
        if (storageError) {
          console.error("Error deleting storage files:", storageError);
        }
      }

      const newCount = deletedSketches.filter((s) => s.is_new).length;
      if (newCount > 0) {
        setNewSketchCount((prev) => Math.max(0, prev - newCount));
      }

      toast({
        title: "Sketches Deleted",
        description: `Removed ${ids.length} sketch${ids.length === 1 ? "" : "es"}`,
      });
    } catch (error) {
      console.error("Error bulk-deleting sketches:", error);
    }
  };

  const deleteSketch = async (id: string) => {
    try {
      // Capture the sketch BEFORE removing it from state
      const sketchToDelete_actual = sketches.find((s) => s.id === id);

      const { error } = await supabase.from("sketches").delete().eq("id", id);

      if (error) {
        console.error("Error deleting sketch:", error);
        toast({
          title: "Error",
          description: "Failed to delete sketch",
          variant: "destructive",
        });
        return;
      }

      // Remove from local state
      setSketches((prev) => prev.filter((sketch) => sketch.id !== id));

      if (sketchToDelete_actual) {
        const filesToDelete = [];

        if (sketchToDelete_actual.original_image_url) {
          const originalPath = sketchToDelete_actual.original_image_url
            .split("/")
            .pop();
          if (originalPath) filesToDelete.push(originalPath);
        }

        if (sketchToDelete_actual.animated_image_url) {
          const animatedPath = sketchToDelete_actual.animated_image_url
            .split("/")
            .pop();
          if (animatedPath) filesToDelete.push(animatedPath);
        }

        if (filesToDelete.length > 0) {
          const { error: storageError } = await supabase.storage
            .from("sketches")
            .remove(filesToDelete);

          if (storageError) {
            console.error("Error deleting storage files:", storageError);
          }
        }

        if (sketchToDelete_actual.is_new) {
          setNewSketchCount((prev) => Math.max(0, prev - 1));
        }
      }

      toast({
        title: "Sketch Deleted",
        description: "Your sketch has been removed",
      });
    } catch (error) {
      console.error("Error deleting sketch:", error);
    }
  };

  return {
    createSketch,
    retrySketch,
    updateSketchStatus,
    markSketchAsViewed,
    deleteSketch,
    deleteSketches,
  };
};
