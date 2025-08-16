import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDrawingAnalysis } from "../useDrawingAnalysis";
import { supabase } from "@/integrations/supabase/client";

describe("useDrawingAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("parseErrorMessage", () => {
    it("should handle credit-related errors", () => {
      const hook = renderHook(() => useDrawingAnalysis());
      const parseErrorMessage = (hook.result.current as any).parseErrorMessage;

      const creditError = { message: "Insufficient credits available" };
      const result = parseErrorMessage(creditError);

      expect(result).toContain("don't have enough credits");
    });

    it("should handle OpenAI API errors", () => {
      const hook = renderHook(() => useDrawingAnalysis());
      const parseErrorMessage = (hook.result.current as any).parseErrorMessage;

      const apiError = { message: "OpenAI API key invalid" };
      const result = parseErrorMessage(apiError);

      expect(result).toContain("issue with our AI service");
    });

    it("should handle rate limiting errors", () => {
      const hook = renderHook(() => useDrawingAnalysis());
      const parseErrorMessage = (hook.result.current as any).parseErrorMessage;

      const rateLimitError = { code: "RATE_LIMITED" };
      const result = parseErrorMessage(rateLimitError);

      expect(result).toContain("AI service is currently busy");
    });

    it("should provide default error message for unknown errors", () => {
      const hook = renderHook(() => useDrawingAnalysis());
      const parseErrorMessage = (hook.result.current as any).parseErrorMessage;

      const unknownError = { message: "Some random error" };
      const result = parseErrorMessage(unknownError);

      expect(result).toBe("Some random error");
    });
  });

  describe("analyzeDrawing", () => {
    it("should successfully analyze drawing", async () => {
      const mockAnalysisResult = {
        analysis: "This is a beautiful drawing of a cat.",
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockAnalysisResult,
        error: null,
      });

      const { result } = renderHook(() => useDrawingAnalysis());

      const imageUrl = "data:image/png;base64,test-image-data";
      const analysisPromise = result.current.analyzeDrawing(imageUrl);

      expect(result.current.isAnalyzing).toBe(true);

      const analysis = await analysisPromise;

      await waitFor(() => {
        expect(result.current.isAnalyzing).toBe(false);
      });

      expect(analysis).toBe(mockAnalysisResult.analysis);
      expect(result.current.analysisResult).toBe(mockAnalysisResult.analysis);
    });

    it("should handle analysis errors", async () => {
      const mockError = { message: "Analysis failed" };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHook(() => useDrawingAnalysis());

      const imageUrl = "data:image/png;base64,test-image-data";
      const analysis = await result.current.analyzeDrawing(imageUrl);

      await waitFor(() => {
        expect(result.current.isAnalyzing).toBe(false);
      });

      expect(analysis).toBe(null);
    });

    it("should handle missing analysis result", async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {},
        error: null,
      });

      const { result } = renderHook(() => useDrawingAnalysis());

      const imageUrl = "data:image/png;base64,test-image-data";
      const analysis = await result.current.analyzeDrawing(imageUrl);

      await waitFor(() => {
        expect(result.current.isAnalyzing).toBe(false);
      });

      expect(analysis).toBe(null);
    });

    it("should use custom prompt when provided", async () => {
      const mockAnalysisResult = { analysis: "Custom analysis result." };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockAnalysisResult,
        error: null,
      });

      const { result } = renderHook(() => useDrawingAnalysis());

      const imageUrl = "data:image/png;base64,test-image-data";
      const customPrompt =
        "Analyze this drawing with special attention to colors.";

      await result.current.analyzeDrawing(imageUrl, customPrompt);

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        "analyze-drawing",
        {
          body: {
            prompt: customPrompt,
            imageUrl,
          },
        },
      );
    });
  });
});
