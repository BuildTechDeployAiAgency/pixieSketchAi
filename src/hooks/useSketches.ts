import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSketchState } from "./sketch/useSketchState";
import { useSketchOperations } from "./sketch/useSketchOperations";
import { useSketchSubscription } from "./sketch/useSketchSubscription";
import { useSketchTimeout } from "./sketch/useSketchTimeout";
import { useSketchFetcher } from "./sketch/useSketchFetcher";

export const useSketches = () => {
  const currentUserIdRef = useRef<string | null>(null);
  const initialFetchDoneRef = useRef(false);

  const {
    sketches,
    setSketches,
    isLoading,
    setIsLoading,
    error,
    setError,
    newSketchCount,
    setNewSketchCount,
    isAuthenticated,
    setIsAuthenticated,
  } = useSketchState();

  const operations = useSketchOperations({ sketches, setSketches, setNewSketchCount });

  const { checkForStuckSketches, startTimeoutChecker, stopTimeoutChecker } =
    useSketchTimeout({ setSketches });

  const { fetchSketches, retryFetchSketches } = useSketchFetcher({
    setSketches,
    setNewSketchCount,
    setIsLoading,
    setError,
    currentUserIdRef,
    checkForStuckSketches,
  });

  const { setupRealtimeSubscription, cleanupSubscription } =
    useSketchSubscription({
      setSketches,
      setNewSketchCount,
      isAuthenticated,
      currentUserIdRef,
    });

  const initForSession = (userId: string) => {
    currentUserIdRef.current = userId;
    fetchSketches().then(() => {
      startTimeoutChecker();
      setTimeout(() => {
        setupRealtimeSubscription();
      }, 100);
    });
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔐 Auth state changed in useSketches:", event, !!session);

      const nowAuthenticated = !!session;
      setIsAuthenticated(nowAuthenticated);

      if (session) {
        // Skip if this is the initial session and we haven't changed users
        if (
          event === "INITIAL_SESSION" &&
          initialFetchDoneRef.current &&
          currentUserIdRef.current === session.user.id
        ) {
          return;
        }

        initialFetchDoneRef.current = true;
        initForSession(session.user.id);
      } else {
        initialFetchDoneRef.current = false;
        setSketches([]);
        setNewSketchCount(0);
        setError(null);
        currentUserIdRef.current = null;
        setIsLoading(false);
        cleanupSubscription();
        stopTimeoutChecker();
      }
    });

    return () => {
      stopTimeoutChecker();
      cleanupSubscription();
      subscription.unsubscribe();
    };
  }, []);

  return {
    sketches,
    isLoading,
    error,
    newSketchCount,
    ...operations,
    refreshSketches: fetchSketches,
    retryFetchSketches,
  };
};
