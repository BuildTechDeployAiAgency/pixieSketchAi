import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useSketches } from "@/hooks/useSketches";

type SketchContextValue = ReturnType<typeof useSketches>;

const SketchContext = createContext<SketchContextValue | null>(null);

export function SketchProvider({ children }: { children: ReactNode }) {
  const sketches = useSketches();

  return (
    <SketchContext.Provider value={sketches}>{children}</SketchContext.Provider>
  );
}

export function useSketchContext(): SketchContextValue {
  const ctx = useContext(SketchContext);
  if (!ctx) {
    throw new Error("useSketchContext must be used within a SketchProvider");
  }
  return ctx;
}
