import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Sketch } from "./useSketchState";

interface UseSketchTimeoutProps {
  setSketches: React.Dispatch<React.SetStateAction<Sketch[]>>;
}

export const useSketchTimeout = ({ setSketches }: UseSketchTimeoutProps) => {
  const { toast } = useToast();
  const timeoutCheckRef = useRef<NodeJS.Timeout | null>(null);

  const checkForStuckSketches = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

      // Only image jobs — video generation polls fal.ai asynchronously and can
      // legitimately run longer than the 10-minute image timeout.
      const { data: stuckSketches, error } = await supabase
        .from("sketches")
        .select("*")
        .eq("status", "processing")
        .eq("user_id", session.user.id)
        .lt("updated_at", tenMinutesAgo)
        .is("fal_request_id", null)
        .or("content_type.is.null,content_type.eq.image");

      if (error) {
        console.error("Error checking for stuck sketches:", error);
        return;
      }

      if (stuckSketches && stuckSketches.length > 0) {
        console.log(
          `⚠️ Found ${stuckSketches.length} sketches stuck in processing for >10 minutes`,
        );

        setSketches((prev) =>
          prev.map((sketch) => {
            if (stuckSketches.some((stuck) => stuck.id === sketch.id)) {
              return { ...sketch, status: "failed" as const };
            }
            return sketch;
          }),
        );

        const stuckIds = stuckSketches.map((s) => s.id);
        await supabase
          .from("sketches")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .in("id", stuckIds);

        toast({
          title: "Processing Timeout",
          description: `${stuckSketches.length} sketch(es) took too long to process. You can retry them from the gallery.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in timeout checker:", error);
    }
  };

  const startTimeoutChecker = () => {
    if (timeoutCheckRef.current) {
      clearInterval(timeoutCheckRef.current);
    }

    timeoutCheckRef.current = setInterval(checkForStuckSketches, 60000); // Check every minute
  };

  const stopTimeoutChecker = () => {
    if (timeoutCheckRef.current) {
      clearInterval(timeoutCheckRef.current);
      timeoutCheckRef.current = null;
    }
  };

  return {
    checkForStuckSketches,
    startTimeoutChecker,
    stopTimeoutChecker,
  };
};
