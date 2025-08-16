import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Sketch } from "./useSketchState";
import { convertToSketch } from "./useSketchState";
import type { Database } from "@/integrations/supabase/types";

type SketchRow = Database["public"]["Tables"]["sketches"]["Row"];

interface UseSketchSubscriptionProps {
  setSketches: React.Dispatch<React.SetStateAction<Sketch[]>>;
  setNewSketchCount: React.Dispatch<React.SetStateAction<number>>;
  isAuthenticated: boolean;
  currentUserIdRef: React.RefObject<string | null>;
}

export const useSketchSubscription = ({
  setSketches,
  setNewSketchCount,
  isAuthenticated,
  currentUserIdRef,
}: UseSketchSubscriptionProps) => {
  const { toast } = useToast();
  const channelRef = useRef<unknown>(null);
  const isSubscribedRef = useRef(false);
  const hookIdRef = useRef<string>(Math.random().toString(36).substr(2, 9));

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

  const setupRealtimeSubscription = () => {
    cleanupSubscription();

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
        const newRecord = payload.new as SketchRow | null;
        const oldRecord = payload.old as SketchRow | null;

        console.log(
          "📨 Real-time update received:",
          payload.eventType,
          newRecord?.id || oldRecord?.id,
        );

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

  return {
    setupRealtimeSubscription,
    cleanupSubscription,
  };
};
