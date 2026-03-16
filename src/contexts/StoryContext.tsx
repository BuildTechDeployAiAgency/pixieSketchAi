import React, { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useStories, type UseStoriesReturn } from "@/hooks/useStories";

const StoryContext = createContext<UseStoriesReturn | null>(null);

export const StoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const storyData = useStories();
  return <StoryContext.Provider value={storyData}>{children}</StoryContext.Provider>;
};

export const useStoryContext = (): UseStoriesReturn => {
  const context = useContext(StoryContext);
  if (!context) {
    throw new Error("useStoryContext must be used within StoryProvider");
  }
  return context;
};
