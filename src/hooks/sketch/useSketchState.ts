import { useState } from "react";
import type { Database } from "@/integrations/supabase/types";

type SketchRow = Database["public"]["Tables"]["sketches"]["Row"];

export interface Sketch {
  id: string;
  user_id: string;
  name: string;
  original_image_url: string | null;
  animated_image_url: string | null;
  content_type: "image" | "video";
  video_prompt: string | null;
  fal_request_id: string | null;
  status: "processing" | "completed" | "failed";
  is_new: boolean;
  created_at: string;
  updated_at: string;
}

const isValidStatus = (
  status: string,
): status is "processing" | "completed" | "failed" => {
  return ["processing", "completed", "failed"].includes(status);
};

export const convertToSketch = (row: SketchRow): Sketch => ({
  ...row,
  status: isValidStatus(row.status) ? row.status : "processing",
  content_type: row.content_type === "video" ? "video" : "image",
  video_prompt: row.video_prompt ?? null,
});

export const useSketchState = () => {
  const [sketches, setSketches] = useState<Sketch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSketchCount, setNewSketchCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return {
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
  };
};
