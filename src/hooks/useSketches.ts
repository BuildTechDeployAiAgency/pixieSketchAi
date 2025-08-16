import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSketchState } from "./sketch/useSketchState";
import { useSketchOperations } from "./sketch/useSketchOperations";
import { useSketchSubscription } from "./sketch/useSketchSubscription";
import { useSketchTimeout } from "./sketch/useSketchTimeout";
import { useSketchFetcher } from "./sketch/useSketchFetcher";

export const useSketches = () => {
  const currentUserIdRef = useRef<string | null>(null);

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

  const operations = useSketchOperations({ setSketches, setNewSketchCount });

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

  useEffect(() => {
    let unsub: (() => void) | undefined;

    supabase.auth.getSession().then(({ data: { session } }) => {
      const authenticated = !!session;
      setIsAuthenticated(authenticated);

      if (authenticated) {
        fetchSketches().then(() => {
          currentUserIdRef.current = session?.user?.id || null;
          startTimeoutChecker();
          setTimeout(() => {
            setupRealtimeSubscription();
          }, 100);
        });
      } else {
        setIsLoading(false);
        cleanupSubscription();
        stopTimeoutChecker();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔐 Auth state changed in useSketches:", event, !!session);

      const nowAuthenticated = !!session;
      setIsAuthenticated(nowAuthenticated);

      if (session) {
        currentUserIdRef.current = session.user.id;
        fetchSketches().then(() => {
          startTimeoutChecker();
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
        stopTimeoutChecker();
      }
    });

    return () => {
      stopTimeoutChecker();
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
    ...operations,
    refreshSketches: fetchSketches,
    retryFetchSketches,
  };
};
