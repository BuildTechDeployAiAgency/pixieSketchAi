import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Sketch } from "./useSketchState";
import { convertToSketch } from "./useSketchState";

interface UseSketchOperationsProps {
  setSketches: React.Dispatch<React.SetStateAction<Sketch[]>>;
  setNewSketchCount: React.Dispatch<React.SetStateAction<number>>;
}

export const useSketchOperations = ({
  setSketches,
  setNewSketchCount,
}: UseSketchOperationsProps) => {
  const { toast } = useToast();

  const createSketch = async (name: string, originalImageUrl: string) => {
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

      console.log("🎨 Creating new sketch:", { name, originalImageUrl });

      const { data, error } = await supabase
        .from("sketches")
        .insert([
          {
            user_id: user.user.id,
            name,
            original_image_url: originalImageUrl,
            status: "processing",
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
      console.log(`🔄 Retrying sketch processing: ${sketchId}`);

      const { error } = await supabase
        .from("sketches")
        .update({
          status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", sketchId);

      if (error) {
        console.error("❌ Error updating sketch for retry:", error);
        toast({
          title: "Retry Failed",
          description: "Unable to retry sketch processing",
          variant: "destructive",
        });
        return;
      }

      setSketches((prev) =>
        prev.map((sketch) =>
          sketch.id === sketchId
            ? { ...sketch, status: "processing" as const }
            : sketch,
        ),
      );

      toast({
        title: "🔄 Retry Started",
        description: "Your sketch is being processed again",
      });
    } catch (error) {
      console.error("💥 Error retrying sketch:", error);
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

  const deleteSketch = async (id: string) => {
    try {
      const sketchToDelete = setSketches((prev) => {
        const sketch = prev.find((s) => s.id === id);
        return prev;
      });

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

      // Get the sketch that was deleted to clean up files
      let sketchToDelete_actual: Sketch | undefined;
      setSketches((prev) => {
        sketchToDelete_actual = prev.find((s) => s.id === id);
        const filtered = prev.filter((sketch) => sketch.id !== id);
        return filtered;
      });

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
  };
};
