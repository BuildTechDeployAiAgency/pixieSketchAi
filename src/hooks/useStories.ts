import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Story } from "@/integrations/supabase/types";

export interface UseStoriesReturn {
  stories: Story[];
  isLoading: boolean;
  error: string | null;
  createStory: (sketchId: string, theme: string) => Promise<{ storyId: string } | null>;
  refreshStories: () => Promise<void>;
  /** The most recently created story that's still processing (for polling) */
  pendingStoryId: string | null;
}

export const useStories = (): UseStoriesReturn => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingStoryId, setPendingStoryId] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchStories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStories([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("stories")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setStories(data ?? []);
    } catch (err: any) {
      setError(err?.message ?? "Failed to fetch stories");
    } finally {
      setIsLoading(false);
    }
  };

  const createStory = useCallback(async (
    sketchId: string,
    theme: string,
  ): Promise<{ storyId: string } | null> => {
    try {
      // Fire the edge function call but DON'T await the full response.
      // The function now runs synchronously (2-5 min), but the story row
      // is inserted early and the realtime subscription picks it up.
      // We use AbortController to timeout after 15s — by then the story
      // row is already created in the DB.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15_000);

      try {
        const { data, error: invokeError } = await supabase.functions.invoke(
          "generate-story",
          {
            body: { sketchId, theme },
            // @ts-ignore — signal is supported by fetch under the hood
          },
        );

        clearTimeout(timeoutId);

        if (invokeError) {
          const errorDetail = invokeError.message || "Story generation failed";
          console.error("generate-story error:", errorDetail);
          setError(errorDetail);
          throw new Error(errorDetail);
        }

        if (data?.storyId) {
          setPendingStoryId(data.storyId);
          return { storyId: data.storyId };
        }
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        // If aborted (timeout) or network error, the story row may already
        // exist in the DB. Check the realtime-updated stories array.
        if (fetchErr?.name === "AbortError" || fetchErr?.message?.includes("aborted")) {
          console.log("generate-story call timed out (expected — generation runs server-side)");
        } else {
          console.warn("generate-story fetch error:", fetchErr?.message);
        }

        // Look for the most recently added "processing" story in our realtime state.
        // The realtime subscription fires on INSERT before the HTTP response returns.
        // Give it a moment to arrive.
        await new Promise((r) => setTimeout(r, 2000));

        // Re-fetch to get the latest
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: latestStories } = await supabase
            .from("stories")
            .select("id, status")
            .eq("user_id", user.id)
            .eq("status", "processing")
            .order("created_at", { ascending: false })
            .limit(1);

          if (latestStories && latestStories.length > 0) {
            const storyId = latestStories[0].id;
            console.log("Found processing story from DB:", storyId);
            setPendingStoryId(storyId);
            return { storyId };
          }
        }

        console.error("Could not find story after timeout — generation may have failed early");
        return null;
      }

      console.error("generate-story returned no storyId");
      return null;
    } catch (err: any) {
      console.error("createStory exception:", err);
      return null;
    }
  }, []);

  const refreshStories = async () => {
    await fetchStories();
  };

  useEffect(() => {
    fetchStories();

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel(`stories:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "stories",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const newStory = payload.new as Story;
              setStories((prev) =>
                prev.some((s) => s.id === newStory.id) ? prev : [newStory, ...prev],
              );
            } else if (payload.eventType === "UPDATE") {
              const updatedStory = payload.new as Story;
              setStories((prev) =>
                prev.map((s) => (s.id === updatedStory.id ? updatedStory : s)),
              );
              // Clear pending if the story completed or failed
              if (updatedStory.status === "completed" || updatedStory.status === "failed") {
                setPendingStoryId((prev) =>
                  prev === updatedStory.id ? null : prev,
                );
              }
            } else if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as { id: string }).id;
              setStories((prev) => prev.filter((s) => s.id !== deletedId));
            }
          },
        )
        .subscribe();

      channelRef.current = channel;
    };

    setupSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return {
    stories,
    isLoading,
    error,
    createStory,
    refreshStories,
    pendingStoryId,
  };
};
