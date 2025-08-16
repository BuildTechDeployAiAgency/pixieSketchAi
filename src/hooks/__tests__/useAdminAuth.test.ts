import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAdminAuth } from "../useAdminAuth";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_EMAIL = "diogo@diogoppedro.com";

describe("useAdminAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should grant admin access for correct email", async () => {
    const mockAdminUser = { id: "admin-123", email: ADMIN_EMAIL };

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockAdminUser },
      error: null,
    });

    const { result } = renderHook(() => useAdminAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.user).toEqual(mockAdminUser);
  });

  it("should deny admin access for non-admin email", async () => {
    const mockUser = { id: "user-123", email: "regular@user.com" };

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useAdminAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.user).toEqual(mockUser);
  });

  it("should deny admin access when no user", async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useAdminAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.user).toBe(null);
  });

  it("should handle auth errors gracefully", async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: new Error("Auth error"),
    });

    const { result } = renderHook(() => useAdminAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.user).toBe(null);
  });
});
