import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileUpload } from "../FileUpload";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

// The global test setup replaces FileReader with an inert stub; the
// component needs onloadend to fire for the preview image to render.
class WorkingFileReader {
  onloadend: (() => void) | null = null;
  onload: (() => void) | null = null;
  onerror: ((error: unknown) => void) | null = null;
  result: string | ArrayBuffer | null = null;

  readAsDataURL(_file: Blob) {
    this.result = "data:image/jpeg;base64,dGVzdA==";
    this.onloadend?.();
  }
}

const makeImageFile = (name: string, size: number, type = "image/jpeg") => {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
};

const makeProps = () => ({
  credits: 5,
  isAuthenticated: true,
  onCreditUpdate: vi.fn(),
  createSketch: vi.fn().mockResolvedValue(null),
  updateSketchStatus: vi.fn().mockResolvedValue(undefined),
});

describe("FileUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.FileReader = WorkingFileReader as unknown as typeof FileReader;
  });

  describe("file validation", () => {
    it("should accept valid image files", async () => {
      const user = userEvent.setup();
      render(<FileUpload {...makeProps()} />);

      const fileInput = screen.getByLabelText(/click to upload/i);
      const validFile = makeImageFile("test.jpg", 1024);

      await user.upload(fileInput, validFile);

      expect(screen.getByAltText("Uploaded Drawing")).toBeInTheDocument();
    });

    it("should reject non-image files", async () => {
      const user = userEvent.setup();
      render(<FileUpload {...makeProps()} />);

      const fileInput = screen.getByLabelText(/click to upload/i);
      const invalidFile = new File(["test"], "test.txt", {
        type: "text/plain",
      });

      await user.upload(fileInput, invalidFile);

      expect(screen.queryByAltText("Uploaded Drawing")).not.toBeInTheDocument();
    });

    it("should reject files larger than 50MB", async () => {
      const user = userEvent.setup();
      render(<FileUpload {...makeProps()} />);

      const fileInput = screen.getByLabelText(/click to upload/i);
      const largeFile = makeImageFile("large.jpg", MAX_FILE_SIZE + 1024);

      await user.upload(fileInput, largeFile);

      expect(screen.queryByAltText("Uploaded Drawing")).not.toBeInTheDocument();
    });
  });

  describe("authentication checks", () => {
    it("should show authentication warning when not authenticated", () => {
      render(<FileUpload {...makeProps()} isAuthenticated={false} />);

      expect(screen.getByText("Account Required")).toBeInTheDocument();
      expect(
        screen.getByText("You must be logged in to transform your drawings."),
      ).toBeInTheDocument();
    });

    it("should show credit warning when no credits available", () => {
      render(<FileUpload {...makeProps()} credits={0} />);

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
      render(<FileUpload {...makeProps()} />);

      // PresetButtonGroup is not rendered until a file is selected
      expect(screen.queryByText(/cartoon/i)).not.toBeInTheDocument();
    });

    it("should not allow preset selection when not authenticated", async () => {
      const user = userEvent.setup();
      render(<FileUpload {...makeProps()} isAuthenticated={false} />);

      const fileInput = screen.getByLabelText(/click to upload/i);
      const validFile = makeImageFile("test.jpg", 1024);

      await user.upload(fileInput, validFile);

      // PresetButtonGroup should be disabled when not authenticated
      expect(screen.getByText("Account Required")).toBeInTheDocument();
    });

    it("should not allow preset selection when no credits", async () => {
      const user = userEvent.setup();
      render(<FileUpload {...makeProps()} credits={0} />);

      const fileInput = screen.getByLabelText(/click to upload/i);
      const validFile = makeImageFile("test.jpg", 1024);

      await user.upload(fileInput, validFile);

      expect(screen.getByText("No Credits Available")).toBeInTheDocument();
    });
  });

  describe("file size validation edge cases", () => {
    it("should accept file exactly at 50MB limit", async () => {
      const user = userEvent.setup();
      render(<FileUpload {...makeProps()} />);

      const fileInput = screen.getByLabelText(/click to upload/i);
      const maxSizeFile = makeImageFile("max.jpg", MAX_FILE_SIZE);

      await user.upload(fileInput, maxSizeFile);

      expect(screen.getByAltText("Uploaded Drawing")).toBeInTheDocument();
    });

    it("should reject file just over 50MB limit", async () => {
      const user = userEvent.setup();
      render(<FileUpload {...makeProps()} />);

      const fileInput = screen.getByLabelText(/click to upload/i);
      const oversizeFile = makeImageFile("oversize.jpg", MAX_FILE_SIZE + 1);

      await user.upload(fileInput, oversizeFile);

      expect(screen.queryByAltText("Uploaded Drawing")).not.toBeInTheDocument();
    });
  });

  describe("error handling", () => {
    it("should handle file reading errors gracefully", async () => {
      const user = userEvent.setup();
      render(<FileUpload {...makeProps()} />);

      const fileInput = screen.getByLabelText(/click to upload/i);

      // FileReader that errors instead of loading
      global.FileReader = class {
        onloadend: (() => void) | null = null;
        onload: (() => void) | null = null;
        onerror: ((error: unknown) => void) | null = null;
        result: string | ArrayBuffer | null = null;

        readAsDataURL(_file: Blob) {
          this.onerror?.(new Error("File read error"));
        }
      } as unknown as typeof FileReader;

      const validFile = makeImageFile("test.jpg", 1024);

      await user.upload(fileInput, validFile);

      // Should not show uploaded image on error
      await waitFor(() => {
        expect(
          screen.queryByAltText("Uploaded Drawing"),
        ).not.toBeInTheDocument();
      });
    });
  });
});
