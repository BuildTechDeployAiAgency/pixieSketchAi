import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useUserProfile } from "../useUserProfile";
import { supabase } from "@/integrations/supabase/client";

describe("useUserProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchProfile", () => {
    it("should create profile with 10 credits for new user", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const mockNewProfile = {
        id: "user-123",
        email: "test@example.com",
        credits: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
      } as any);

      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: mockNewProfile, error: null }),
      });

      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi
              .fn()
              .mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
            insert: insertMock,
            update: vi.fn().mockReturnThis(),
          }) as any,
      );

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(insertMock).toHaveBeenCalledWith([
        {
          id: "user-123",
          email: "test@example.com",
          credits: 10,
        },
      ]);
      expect(result.current.profile?.credits).toBe(10);
    });

    it("should handle existing profile", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const mockProfile = {
        id: "user-123",
        email: "test@example.com",
        credits: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
      } as any);

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.profile).toEqual(mockProfile);
    });
  });

  describe("updateCredits", () => {
    it("should update credits and local state", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const mockProfile = {
        id: "user-123",
        email: "test@example.com",
        credits: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const updateMock = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        insert: vi.fn().mockReturnThis(),
        update: updateMock,
      } as any);

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.updateCredits(10);

      expect(updateMock).toHaveBeenCalledWith({
        credits: 10,
        updated_at: expect.any(String),
      });
    });

    it("should prevent credits from going negative", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.updateCredits(-5);

      expect(result.current.profile?.credits).not.toBeLessThan(0);
    });
  });
});
