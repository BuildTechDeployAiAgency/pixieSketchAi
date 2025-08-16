import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileUpload } from "../FileUpload";

// Mock the hooks
vi.mock("@/hooks/useSketches", () => ({
  useSketches: () => ({
    createSketch: vi.fn().mockResolvedValue({ id: "sketch-123" }),
    updateSketchStatus: vi.fn(),
  }),
}));

const mockProps = {
  credits: 5,
  setCredits: vi.fn(),
  isAuthenticated: true,
  onCreditUpdate: vi.fn(),
};

describe("FileUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("file validation", () => {
    it("should accept valid image files", async () => {
      const user = userEvent.setup();
      render(<FileUpload {...mockProps} />);

      const fileInput = screen.getByLabelText(/click to upload/i);
      const validFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      await user.upload(fileInput, validFile);

      expect(screen.getByAltText("Uploaded Drawing")).toBeInTheDocument();
    });

    it("should reject non-image files", async () => {
      const user = userEvent.setup();
      render(<FileUpload {...mockProps} />);

      const fileInput = screen.getByLabelText(/click to upload/i);
      const invalidFile = new File(["test"], "test.txt", {
        type: "text/plain",
      });

      await user.upload(fileInput, invalidFile);

      expect(screen.queryByAltText("Uploaded Drawing")).not.toBeInTheDocument();
    });

    it("should reject files larger than 50MB", async () => {
      const user = userEvent.setup();
      render(<FileUpload {...mockProps} />);

      const fileInput = screen.getByLabelText(/click to upload/i);

      // Create a file larger than 50MB
      const largeFileSize = 51 * 1024 * 1024; // 51MB
      const largeFile = new File(["x".repeat(largeFileSize)], "large.jpg", {
        type: "image/jpeg",
      });

      await user.upload(fileInput, largeFile);

      expect(screen.queryByAltText("Uploaded Drawing")).not.toBeInTheDocument();
    });
  });

  describe("authentication checks", () => {
    it("should show authentication warning when not authenticated", () => {
      render(<FileUpload {...mockProps} isAuthenticated={false} />);

      expect(screen.getByText("Account Required")).toBeInTheDocument();
      expect(
        screen.getByText("You must be logged in to transform your drawings."),
      ).toBeInTheDocument();
    });

    it("should show credit warning when no credits available", () => {
      render(<FileUpload {...mockProps} credits={0} />);

      expect(screen.getByText("No Credits Available")).toBeInTheDocument();
      expect(
        screen.getByText(
          "You need credits to transform drawings. Please purchase credits first.",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("preset selection", () => {
    it("should not allow preset selection without file upload", async () => {
      const user = userEvent.setup();
      render(<FileUpload {...mockProps} />);

      // Try to click a preset button without uploading a file first
      // Since PresetButtonGroup is not rendered without selectedFile, this test verifies the behavior
      expect(screen.queryByText(/cartoon/i)).not.toBeInTheDocument();
    });

    it("should not allow preset selection when not authenticated", async () => {
      const user = userEvent.setup();
      render(<FileUpload {...mockProps} isAuthenticated={false} />);

      const fileInput = screen.getByLabelText(/click to upload/i);
      const validFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      await user.upload(fileInput, validFile);

      // PresetButtonGroup should be disabled when not authenticated
      expect(screen.getByText("Account Required")).toBeInTheDocument();
    });

    it("should not allow preset selection when no credits", async () => {
      const user = userEvent.setup();
      render(<FileUpload {...mockProps} credits={0} />);

      const fileInput = screen.getByLabelText(/click to upload/i);
      const validFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      await user.upload(fileInput, validFile);

      expect(screen.getByText("No Credits Available")).toBeInTheDocument();
    });
  });

  describe("file size validation edge cases", () => {
    it("should accept file exactly at 50MB limit", async () => {
      const user = userEvent.setup();
      render(<FileUpload {...mockProps} />);

      const fileInput = screen.getByLabelText(/click to upload/i);
      const maxSizeFile = new File(["x".repeat(50 * 1024 * 1024)], "max.jpg", {
        type: "image/jpeg",
      });

      await user.upload(fileInput, maxSizeFile);

      expect(screen.getByAltText("Uploaded Drawing")).toBeInTheDocument();
    });

    it("should reject file just over 50MB limit", async () => {
      const user = userEvent.setup();
      render(<FileUpload {...mockProps} />);

      const fileInput = screen.getByLabelText(/click to upload/i);
      const oversizeFile = new File(
        ["x".repeat(50 * 1024 * 1024 + 1)],
        "oversize.jpg",
        { type: "image/jpeg" },
      );

      await user.upload(fileInput, oversizeFile);

      expect(screen.queryByAltText("Uploaded Drawing")).not.toBeInTheDocument();
    });
  });

  describe("error handling", () => {
    it("should handle file reading errors gracefully", async () => {
      const user = userEvent.setup();
      render(<FileUpload {...mockProps} />);

      const fileInput = screen.getByLabelText(/click to upload/i);

      // Mock FileReader to simulate error
      const originalFileReader = global.FileReader;
      global.FileReader = class {
        readAsDataURL = vi.fn();
        onerror = null;
        onload = null;
        result = null;

        constructor() {
          setTimeout(() => {
            if (this.onerror) this.onerror(new Error("File read error"));
          }, 0);
        }
      } as any;

      const validFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      await user.upload(fileInput, validFile);

      // Should not show uploaded image on error
      await waitFor(() => {
        expect(
          screen.queryByAltText("Uploaded Drawing"),
        ).not.toBeInTheDocument();
      });

      global.FileReader = originalFileReader;
    });
  });
});
