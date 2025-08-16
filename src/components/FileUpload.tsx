import { useState, useEffect } from "react";
import {
  Upload,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PresetButtonGroup } from "./PresetButtonGroup";
import { useSketches } from "@/hooks/useSketches";
import type { PresetOption } from "@/types/presets";

interface FileUploadProps {
  credits: number;
  setCredits: (credits: number) => void;
  isAuthenticated: boolean;
  onCreditUpdate?: () => void;
}

export const FileUpload = ({
  credits,
  setCredits,
  isAuthenticated,
  onCreditUpdate,
}: FileUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPreset, setProcessingPreset] = useState<PresetOption | null>(
    null,
  );
  const { toast } = useToast();
  const { createSketch, updateSketchStatus } = useSketches();

  // Removed diagnostic import since bucket is now created

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 50MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // Generate preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = async (preset: PresetOption) => {
    if (!selectedFile || !isAuthenticated) {
      toast({
        title: "Upload Required",
        description:
          "Please upload a drawing and ensure you're logged in first",
        variant: "destructive",
      });
      return;
    }

    if (credits <= 0) {
      toast({
        title: "No Credits",
        description:
          "You need credits to transform drawings. Please purchase credits first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingPreset(preset);

      console.log(
        `🎨 Starting ${preset} transformation for file:`,
        selectedFile.name,
      );

      // Upload original image to storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      console.log("📤 Uploading original image to storage:", fileName);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("sketches")
        .upload(fileName, selectedFile);

      if (uploadError) {
        console.error("❌ Storage upload error:", uploadError);

        // Provide more helpful error messages
        if (uploadError.message?.includes("not found")) {
          throw new Error(
            'Storage bucket "sketches" not found. Please contact support.',
          );
        } else if (uploadError.message?.includes("policy")) {
          throw new Error(
            "Upload permission denied. Please ensure you are logged in.",
          );
        } else if (uploadError.message?.includes("size")) {
          throw new Error(
            "File too large. Please upload an image smaller than 50MB.",
          );
        } else {
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }
      }

      console.log("✅ Image uploaded successfully:", uploadData);

      // Get public URL for the uploaded image
      const {
        data: { publicUrl },
      } = supabase.storage.from("sketches").getPublicUrl(fileName);

      console.log("🔗 Public URL generated:", publicUrl);

      // Create sketch record in database
      const sketchName = `Drawing ${new Date().toLocaleDateString()}, ${new Date().toLocaleTimeString()}`;
      console.log("💾 Creating sketch record:", sketchName);

      const sketch = await createSketch(sketchName, publicUrl);

      if (!sketch) {
        throw new Error("Failed to create sketch record");
      }

      console.log("✅ Sketch record created:", sketch.id);

      // Convert file to base64 for API
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      console.log("🔄 Converted to base64, length:", base64Data.length);

      // Call the process-sketch function
      console.log("🚀 Calling process-sketch function...");

      const { data: processData, error: processError } =
        await supabase.functions.invoke("process-sketch", {
          body: {
            imageData: base64Data,
            preset: preset,
            sketchId: sketch.id,
          },
        });

      console.log("📡 Process function response:", {
        processData,
        processError,
      });

      if (processError) {
        console.error("❌ Process function error:", processError);
        await updateSketchStatus(sketch.id, "failed");
        throw new Error(
          `Processing failed: ${processError.message || "Unknown error"}`,
        );
      }

      if (!processData || !processData.success) {
        console.error("❌ Process function returned failure:", processData);
        await updateSketchStatus(sketch.id, "failed");
        throw new Error(
          `Processing failed: ${processData?.error || "Unknown error"}`,
        );
      }

      console.log("✅ Processing successful, updating database...");

      // Update sketch with animated result
      await updateSketchStatus(
        sketch.id,
        "completed",
        processData.animatedImageUrl,
      );

      console.log("🎉 Transformation completed successfully!");

      // Credits are now deducted server-side, trigger credit balance refresh
      if (onCreditUpdate) {
        onCreditUpdate();
      }

      // Also update local state for immediate feedback
      setCredits(Math.max(0, credits - 1));

      toast({
        title: "🎉 Transformation Complete!",
        description: `Your drawing has been transformed using ${preset} style!`,
      });

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error("💥 Transformation error:", error);

      toast({
        title: "Transformation Failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingPreset(null);
    }
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Upload Your Drawing</CardTitle>
        <CardDescription>
          Transform your child's artwork into magical animations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="upload-file"
        />

        <label htmlFor="upload-file" className="cursor-pointer">
          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Uploaded Drawing"
                className="aspect-square object-contain rounded-lg shadow-md mx-auto"
              />
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <Clock className="h-12 w-12 text-white animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg py-12 bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">
              <Upload className="h-10 w-10 mb-2 mx-auto" />
              <p className="text-lg font-medium">Click to Upload</p>
              <p className="text-sm">Or drag and drop a file (Max 50MB)</p>
            </div>
          )}
        </label>

        {selectedFile && (
          <PresetButtonGroup
            onPresetSelect={handlePresetSelect}
            isProcessing={isProcessing}
            disabled={!isAuthenticated}
            processingPreset={processingPreset}
          />
        )}

        {!isAuthenticated && (
          <div className="rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle
                  className="h-5 w-5 text-yellow-400"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Account Required
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>You must be logged in to transform your drawings.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isAuthenticated && credits <= 0 && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle
                  className="h-5 w-5 text-red-400"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  No Credits Available
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    You need credits to transform drawings. Please purchase
                    credits first.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
