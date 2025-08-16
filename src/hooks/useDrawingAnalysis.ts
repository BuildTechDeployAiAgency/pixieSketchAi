import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResult {
  analysis: string;
}

interface APIError {
  message?: string;
  code?: string;
  error?: string;
  details?: string;
}

export const useDrawingAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const { toast } = useToast();

  const parseErrorMessage = (error: any): string => {
    console.log("Full error object:", error);

    // Check for credit-related errors
    if (
      error?.message?.toLowerCase().includes("credit") ||
      error?.message?.toLowerCase().includes("insufficient") ||
      error?.code === "INSUFFICIENT_CREDITS"
    ) {
      return "You don't have enough credits to analyze this drawing. Please purchase more credits to continue.";
    }

    // Check for OpenAI API errors
    if (
      error?.message?.toLowerCase().includes("openai") ||
      error?.message?.toLowerCase().includes("api key") ||
      error?.message?.toLowerCase().includes("unauthorized")
    ) {
      return "There's an issue with our AI service. Please try again in a moment.";
    }

    // Check for image URL errors
    if (
      error?.message?.toLowerCase().includes("image") &&
      error?.message?.toLowerCase().includes("invalid")
    ) {
      return "There was an issue processing your image. Please try uploading a different image.";
    }

    // Check for rate limiting
    if (
      error?.message?.toLowerCase().includes("rate limit") ||
      error?.code === "RATE_LIMITED"
    ) {
      return "Our AI service is currently busy. Please wait a moment and try again.";
    }

    // Default error messages based on error type
    if (error?.message?.includes("non-2xx status code")) {
      return "Our analysis service is temporarily unavailable. Please try again.";
    }

    return (
      error?.message ||
      error?.error ||
      "An unexpected error occurred while analyzing your drawing."
    );
  };

  const analyzeDrawing = async (imageUrl: string, customPrompt?: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const prompt =
        customPrompt ||
        "Analyze this children's drawing and describe how it could be transformed into a magical drawing. Focus on the characters, colors, and potential magical elements that would bring it to life.";

      console.log("Starting analysis with imageUrl:", imageUrl);
      console.log("Prompt:", prompt);

      const { data, error } = await supabase.functions.invoke(
        "analyze-drawing",
        {
          body: {
            prompt,
            imageUrl,
          },
        },
      );

      console.log("Supabase function response:", { data, error });

      if (error) {
        console.error("Analysis error details:", error);
        const userFriendlyMessage = parseErrorMessage(error);

        toast({
          title: "Analysis Failed",
          description: userFriendlyMessage,
          variant: "destructive",
        });
        return null;
      }

      if (!data?.analysis) {
        console.error("No analysis in response:", data);
        toast({
          title: "Analysis Failed",
          description: "No analysis result received. Please try again.",
          variant: "destructive",
        });
        return null;
      }

      setAnalysisResult(data.analysis);
      toast({
        title: "✨ Analysis Complete!",
        description: "Your drawing has been analyzed with magical AI insights!",
      });

      return data.analysis;
    } catch (error) {
      console.error("Unexpected error during analysis:", error);
      const userFriendlyMessage = parseErrorMessage(error);

      toast({
        title: "Analysis Failed",
        description: userFriendlyMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeDrawing,
    isAnalyzing,
    analysisResult,
    setAnalysisResult,
  };
};
