import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Story } from "@/integrations/supabase/types";

export interface UseStoriesReturn {
  stories: Story[];
  isLoading: boolean;
  error: string | null;
  createStory: (sketchId: string, theme: string) => Promise<{ storyId: string } | null>;
  refreshStories: () => Promise<void>;
}

export const useStories = (): UseStoriesReturn => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const createStory = async (
    sketchId: string,
    theme: string,
  ): Promise<{ storyId: string } | null> => {
    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "generate-story",
        { body: { sketchId, theme } },
      );

      if (invokeError) {
        let errorDetail = invokeError.message;
        const errorResponse = (invokeError as any).context;
        if (errorResponse && typeof errorResponse.json === "function") {
          try {
            const errorBody = await errorResponse.json();
            errorDetail = errorBody?.error ?? errorBody?.details ?? invokeError.message;
          } catch {
            // Response already consumed
          }
        }
        console.error("generate-story error:", errorDetail);
        return null;
      }

      if (data?.storyId) {
        return { storyId: data.storyId };
      }

      console.error("generate-story returned no storyId:", data);
      return null;
    } catch (err: any) {
      console.error("createStory exception:", err);
      return null;
    }
  };

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
              setStories((prev) => [newStory, ...prev]);
            } else if (payload.eventType === "UPDATE") {
              const updatedStory = payload.new as Story;
              setStories((prev) =>
                prev.map((s) => (s.id === updatedStory.id ? updatedStory : s)),
              );
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
  };
};
