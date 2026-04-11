import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Sketch } from "./useSketchState";
import { convertToSketch } from "./useSketchState";

interface UseSketchFetcherProps {
  setSketches: React.Dispatch<React.SetStateAction<Sketch[]>>;
  setNewSketchCount: React.Dispatch<React.SetStateAction<number>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  currentUserIdRef: React.RefObject<string | null>;
  checkForStuckSketches: () => Promise<void>;
}

export const useSketchFetcher = ({
  setSketches,
  setNewSketchCount,
  setIsLoading,
  setError,
  currentUserIdRef,
  checkForStuckSketches,
}: UseSketchFetcherProps) => {
  const { toast } = useToast();
  const retryCountRef = useRef(0);
  const fetchInProgressRef = useRef(false);
  const retryPendingRef = useRef(false);
  const maxRetries = 3;

  const fetchSketches = async (retryCount = 0) => {
    if (fetchInProgressRef.current && retryCount === 0) {
      console.log("⏳ Fetch already in progress, skipping duplicate call");
      return;
    }

    fetchInProgressRef.current = true;

    try {
      console.log(
        `🔄 Fetching sketches (attempt ${retryCount + 1}/${maxRetries + 1})`,
      );
      setIsLoading(true);
      setError(null);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        console.log("❌ No authenticated user found");
        setSketches([]);
        setNewSketchCount(0);
        setIsLoading(false);
        return;
      }

      console.log("✅ Authenticated user found:", user.user.id);
      currentUserIdRef.current = user.user.id;

      const { data, error } = await supabase
        .from("sketches")
        .select(
          "id, user_id, name, original_image_url, animated_image_url, content_type, video_prompt, fal_request_id, status, is_new, created_at, updated_at",
        )
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("❌ Database error fetching sketches:", error);

        if (error.code === "57014" && retryCount < maxRetries) {
          const delaySec = (retryCount + 1) * 2;
          console.log(
            `⏰ Query timeout, retrying in ${delaySec} seconds...`,
          );
          retryPendingRef.current = true;
          setTimeout(
            () => {
              retryPendingRef.current = false;
              fetchSketches(retryCount + 1);
            },
            delaySec * 1000,
          );
          return;
        }

        setError(`Failed to load sketches: ${error.message}`);
        toast({
          title: "Error Loading Sketches",
          description:
            error.code === "57014"
              ? "Database query timed out. Please try refreshing the page."
              : "Failed to load your sketches. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      console.log(`✅ Successfully fetched ${data?.length || 0} sketches`);
      const convertedSketches = (data || []).map(convertToSketch);
      setSketches(convertedSketches);
      setNewSketchCount(
        convertedSketches.filter((sketch) => sketch.is_new).length,
      );
      retryCountRef.current = 0;

      await checkForStuckSketches();
    } catch (error) {
      console.error("💥 Unexpected error fetching sketches:", error);
      setError("An unexpected error occurred while loading sketches");
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      fetchInProgressRef.current = false;
      if (!retryPendingRef.current) {
        setIsLoading(false);
      }
    }
  };

  const retryFetchSketches = () => {
    setError(null);
    retryCountRef.current = 0;
    fetchSketches();
  };

  return {
    fetchSketches,
    retryFetchSketches,
  };
};
