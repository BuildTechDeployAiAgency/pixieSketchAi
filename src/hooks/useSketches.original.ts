import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type SketchRow = Database["public"]["Tables"]["sketches"]["Row"];

interface Sketch {
  id: string;
  user_id: string;
  name: string;
  original_image_url: string | null;
  animated_image_url: string | null;
  status: "processing" | "completed" | "failed";
  is_new: boolean;
  created_at: string;
  updated_at: string;
}

// Type guard to ensure status is valid
const isValidStatus = (
  status: string,
): status is "processing" | "completed" | "failed" => {
  return ["processing", "completed", "failed"].includes(status);
};

// Convert database row to our Sketch type
const convertToSketch = (row: SketchRow): Sketch => ({
  ...row,
  status: isValidStatus(row.status) ? row.status : "processing",
});

export const useSketches = () => {
  const [sketches, setSketches] = useState<Sketch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSketchCount, setNewSketchCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Refs to track subscription state and prevent multiple subscriptions
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);
  const hookIdRef = useRef<string>(Math.random().toString(36).substr(2, 9));
  const timeoutCheckRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const currentUserIdRef = useRef<string | null>(null);

  // Refs to track subscription state and prevent multiple subscriptions

  // Enhanced timeout checker for stuck processing sketches
  const checkForStuckSketches = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Extended timeout to 10 minutes for more complex sketches
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

      const { data: stuckSketches, error } = await supabase
        .from("sketches")
        .select("*")
        .eq("status", "processing")
        .eq("user_id", user.user.id)
        .lt("created_at", tenMinutesAgo);

      if (error) {
        console.error("Error checking for stuck sketches:", error);
        return;
      }

      if (stuckSketches && stuckSketches.length > 0) {
        console.log(
          `⚠️ Found ${stuckSketches.length} sketches stuck in processing for >10 minutes`,
        );

        // Update local state to show these as failed
        setSketches((prev) =>
          prev.map((sketch) => {
            if (stuckSketches.some((stuck) => stuck.id === sketch.id)) {
              return { ...sketch, status: "failed" as const };
            }
            return sketch;
          }),
        );

        // Update database status with retry flag
        for (const stuckSketch of stuckSketches) {
          await supabase
            .from("sketches")
            .update({
              status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", stuckSketch.id);
        }

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

  const fetchSketches = async (retryCount = 0) => {
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

      // Use a more efficient query with limits and ordering
      const { data, error } = await supabase
        .from("sketches")
        .select(
          "id, user_id, name, original_image_url, animated_image_url, status, is_new, created_at, updated_at",
        )
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false })
        .limit(50); // Limit to 50 most recent sketches

      if (error) {
        console.error("❌ Database error fetching sketches:", error);

        // Handle specific timeout errors
        if (error.code === "57014" && retryCount < maxRetries) {
          console.log(
            `⏰ Query timeout, retrying in ${(retryCount + 1) * 2} seconds...`,
          );
          setTimeout(
            () => {
              fetchSketches(retryCount + 1);
            },
            (retryCount + 1) * 2000,
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
      retryCountRef.current = 0; // Reset retry count on success

      // Check for stuck sketches on successful load
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
      setIsLoading(false);
    }
  };

  // Clean up existing subscription
  const cleanupSubscription = () => {
    if (channelRef.current && isSubscribedRef.current) {
      console.log("🧹 Cleaning up existing subscription");
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.error("Error removing channel:", error);
      }
      channelRef.current = null;
      isSubscribedRef.current = false;
    }
  };

  // Enhanced real-time subscription with better error handling and user filtering
  const setupRealtimeSubscription = () => {
    // Fix: Always rebuild subscription when sketches change for authenticated user
    cleanupSubscription(); // Remove any previous

    if (!isAuthenticated || !currentUserIdRef.current) return;

    const channelName = `sketches-changes-${hookIdRef.current}`;
    console.log(
      `📡 Setting up real-time subscription: ${channelName} for user: ${currentUserIdRef.current}`,
    );

    const channel = supabase.channel(channelName).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "sketches",
        filter: `user_id=eq.${currentUserIdRef.current}`,
      },
      (payload) => {
        // Type guard to ensure payload has the expected structure
        const newRecord = payload.new as SketchRow | null;
        const oldRecord = payload.old as SketchRow | null;

        console.log(
          "📨 Real-time update received:",
          payload.eventType,
          newRecord?.id || oldRecord?.id,
        );

        // Only process updates for the current user
        const userId = newRecord?.user_id || oldRecord?.user_id;
        if (userId !== currentUserIdRef.current) {
          console.log("🚫 Ignoring update for different user:", userId);
          return;
        }

        if (payload.eventType === "INSERT" && newRecord) {
          const newSketch = convertToSketch(newRecord);
          console.log("➕ Adding new sketch:", newSketch.id);
          setSketches((prev) => {
            if (prev.some((s) => s.id === newSketch.id)) return prev;
            return [newSketch, ...prev];
          });
          setNewSketchCount((prev) => prev + 1);
        } else if (payload.eventType === "UPDATE" && newRecord && oldRecord) {
          const updatedSketch = convertToSketch(newRecord);

          console.log(
            "🔄 Updating sketch:",
            updatedSketch.id,
            `${oldRecord.status} -> ${updatedSketch.status}`,
          );

          setSketches((prev) =>
            prev.map((sketch) =>
              sketch.id === updatedSketch.id ? updatedSketch : sketch,
            ),
          );

          // Enhanced status update notifications with better UX
          if (
            updatedSketch.status === "completed" &&
            oldRecord.status === "processing"
          ) {
            console.log("🎉 Sketch completed, showing success toast");
            toast({
              title: "🎉 Magic Complete!",
              description: `Your drawing "${updatedSketch.name}" has been transformed!`,
              duration: 6000,
            });
          } else if (
            updatedSketch.status === "failed" &&
            oldRecord.status === "processing"
          ) {
            console.log("❌ Sketch failed, showing error toast");
            toast({
              title: "❌ Processing Failed",
              description: `Unable to transform "${updatedSketch.name}". Click retry to try again.`,
              variant: "destructive",
              duration: 8000,
            });
          }

          // Handle new sketch count updates
          if (oldRecord.is_new && !updatedSketch.is_new) {
            setNewSketchCount((prev) => Math.max(0, prev - 1));
          } else if (!oldRecord.is_new && updatedSketch.is_new) {
            setNewSketchCount((prev) => prev + 1);
          }
        } else if (payload.eventType === "DELETE" && oldRecord) {
          const deletedId = oldRecord.id;
          console.log("🗑️ Removing deleted sketch:", deletedId);
          setSketches((prev) =>
            prev.filter((sketch) => sketch.id !== deletedId),
          );
          if (oldRecord.is_new) {
            setNewSketchCount((prev) => Math.max(0, prev - 1));
          }
        }
      },
    );

    channel.subscribe((status) => {
      console.log(
        `📡 Subscription status: ${status} for channel: ${channelName}`,
      );
      if (status === "SUBSCRIBED") {
        isSubscribedRef.current = true;
        channelRef.current = channel;
        console.log("✅ Successfully subscribed to real-time updates");
      } else if (status === "CHANNEL_ERROR") {
        console.error(
          "❌ Real-time subscription error, attempting to reconnect...",
        );
        isSubscribedRef.current = false;
        setTimeout(() => {
          if (!isSubscribedRef.current && isAuthenticated) {
            console.log("🔄 Retrying real-time subscription setup...");
            setupRealtimeSubscription();
          }
        }, 5000);
      } else if (status === "CLOSED") {
        console.log("🔒 Real-time subscription closed");
        isSubscribedRef.current = false;
      }
    });
  };

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

      // Update status back to processing
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

      // Update local state
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
      const updateData: any = { status, updated_at: new Date().toISOString() };
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
      const sketchToDelete = sketches.find((s) => s.id === id);

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

      if (sketchToDelete) {
        const filesToDelete = [];

        if (sketchToDelete.original_image_url) {
          const originalPath = sketchToDelete.original_image_url
            .split("/")
            .pop();
          if (originalPath) filesToDelete.push(originalPath);
        }

        if (sketchToDelete.animated_image_url) {
          const animatedPath = sketchToDelete.animated_image_url
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
      }

      setSketches((prev) => prev.filter((sketch) => sketch.id !== id));
      if (sketchToDelete?.is_new) {
        setNewSketchCount((prev) => Math.max(0, prev - 1));
      }

      toast({
        title: "Sketch Deleted",
        description: "Your sketch has been removed",
      });
    } catch (error) {
      console.error("Error deleting sketch:", error);
    }
  };

  // Retry function for failed loads
  const retryFetchSketches = () => {
    setError(null);
    retryCountRef.current = 0;
    fetchSketches();
  };

  useEffect(() => {
    let unsub: (() => void) | undefined;

    // Always fetch and subscribe for already authenticated users
    supabase.auth.getSession().then(({ data: { session } }) => {
      const authenticated = !!session;
      setIsAuthenticated(authenticated);

      if (authenticated) {
        fetchSketches().then(() => {
          currentUserIdRef.current = session?.user?.id || null;
          setTimeout(() => {
            setupRealtimeSubscription();
          }, 100);
        });
      } else {
        setIsLoading(false);
        cleanupSubscription();
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔐 Auth state changed in useSketches:", event, !!session);

      const wasAuthenticated = isAuthenticated;
      const nowAuthenticated = !!session;

      setIsAuthenticated(nowAuthenticated);

      if (!!session) {
        currentUserIdRef.current = session.user.id;
        fetchSketches().then(() => {
          setTimeout(() => {
            setupRealtimeSubscription();
          }, 150);
        });
      } else {
        setSketches([]);
        setNewSketchCount(0);
        setError(null);
        currentUserIdRef.current = null;
        cleanupSubscription();
      }
    });

    // Cleanup timer and sub
    return () => {
      if (timeoutCheckRef.current) clearInterval(timeoutCheckRef.current);
      cleanupSubscription();
      subscription.unsubscribe();
      if (typeof unsub === "function") unsub();
    };
  }, []);

  return {
    sketches,
    isLoading,
    error,
    newSketchCount,
    createSketch,
    updateSketchStatus,
    markSketchAsViewed,
    deleteSketch,
    retrySketch,
    refreshSketches: fetchSketches,
    retryFetchSketches,
  };
};
