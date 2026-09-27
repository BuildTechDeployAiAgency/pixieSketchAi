import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDrawingAnalysis } from "../useDrawingAnalysis";
import { supabase } from "@/integrations/supabase/client";

const { toastSpy } = vi.hoisted(() => ({ toastSpy: vi.fn() }));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
}));

const IMAGE_URL = "data:image/png;base64,test-image-data";

describe("useDrawingAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("analyzeDrawing error messages", () => {
    it.each([
      [
        "credit-related errors",
        { message: "Insufficient credits available" },
        /don't have enough credits/,
      ],
      [
        "OpenAI API errors",
        { message: "OpenAI API key invalid" },
        /issue with our AI service/,
      ],
      [
        "rate limiting errors",
        { code: "RATE_LIMITED" },
        /AI service is currently busy/,
      ],
      [
        "unknown errors (falls back to raw message)",
        { message: "Some random error" },
        /^Some random error$/,
      ],
    ])(
      "shows a destructive toast with a user-friendly message for %s",
      async (_label, invokeError, expectedDescription) => {
        vi.mocked(supabase.functions.invoke).mockResolvedValue({
          data: null,
          error: invokeError,
        } as never);

        const { result } = renderHook(() => useDrawingAnalysis());

        let analysis: string | null = "unset" as string | null;
        await act(async () => {
          analysis = await result.current.analyzeDrawing(IMAGE_URL);
        });

        expect(analysis).toBe(null);
        expect(toastSpy).toHaveBeenCalledWith({
          title: "Analysis Failed",
          description: expect.stringMatching(expectedDescription),
          variant: "destructive",
        });
      },
    );
  });

  describe("analyzeDrawing", () => {
    it("should successfully analyze drawing", async () => {
      const mockAnalysisResult = {
        analysis: "This is a beautiful drawing of a cat.",
      };

      let resolveInvoke!: (value: {
        data: typeof mockAnalysisResult;
        error: null;
      }) => void;
      vi.mocked(supabase.functions.invoke).mockReturnValue(
        new Promise((resolve) => {
          resolveInvoke = resolve;
        }) as never,
      );

      const { result } = renderHook(() => useDrawingAnalysis());

      let analysisPromise!: Promise<string | null>;
      act(() => {
        analysisPromise = result.current.analyzeDrawing(IMAGE_URL);
      });

      expect(result.current.isAnalyzing).toBe(true);

      let analysis: string | null = null;
      await act(async () => {
        resolveInvoke({ data: mockAnalysisResult, error: null });
        analysis = await analysisPromise;
      });

      expect(result.current.isAnalyzing).toBe(false);
      expect(analysis).toBe(mockAnalysisResult.analysis);
      expect(result.current.analysisResult).toBe(mockAnalysisResult.analysis);
    });

    it("should handle analysis errors", async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: "Analysis failed" },
      } as never);

      const { result } = renderHook(() => useDrawingAnalysis());

      let analysis: string | null = "unset" as string | null;
      await act(async () => {
        analysis = await result.current.analyzeDrawing(IMAGE_URL);
      });

      expect(analysis).toBe(null);
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.analysisResult).toBe(null);
    });

    it("should handle missing analysis result", async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {},
        error: null,
      } as never);

      const { result } = renderHook(() => useDrawingAnalysis());

      let analysis: string | null = "unset" as string | null;
      await act(async () => {
        analysis = await result.current.analyzeDrawing(IMAGE_URL);
      });

      expect(analysis).toBe(null);
      expect(result.current.isAnalyzing).toBe(false);
      expect(toastSpy).toHaveBeenCalledWith({
        title: "Analysis Failed",
        description: "No analysis result received. Please try again.",
        variant: "destructive",
      });
    });

    it("should use custom prompt when provided", async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { analysis: "Custom analysis result." },
        error: null,
      } as never);

      const { result } = renderHook(() => useDrawingAnalysis());

      const customPrompt =
        "Analyze this drawing with special attention to colors.";

      await act(async () => {
        await result.current.analyzeDrawing(IMAGE_URL, customPrompt);
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        "analyze-drawing",
        {
          body: {
            prompt: customPrompt,
            imageUrl: IMAGE_URL,
          },
        },
      );
    });
  });
});
