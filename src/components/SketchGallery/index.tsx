import { useState, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { SketchCard } from "./SketchCard";
import { ImagePreviewModal } from "./ImagePreviewModal";

interface Sketch {
  id: string;
  name: string;
  original_image_url: string | null;
  animated_image_url: string | null;
  status: "processing" | "completed" | "failed";
  is_new: boolean;
  created_at: string;
  updated_at: string;
}

interface SketchGalleryProps {
  sketchesData: {
    sketches: Sketch[];
    isLoading: boolean;
    error: string | null;
    newSketchCount: number;
    updateSketchStatus: (
      id: string,
      status: "processing" | "completed" | "failed",
      animatedImageUrl?: string,
    ) => Promise<void>;
    markSketchAsViewed: (id: string) => Promise<void>;
    deleteSketch: (id: string) => Promise<void>;
    retrySketch: (id: string) => Promise<void>;
    retryFetchSketches: () => void;
  };
}

export const SketchGallery = ({ sketchesData }: SketchGalleryProps) => {
  const {
    sketches,
    isLoading,
    error,
    newSketchCount,
    updateSketchStatus,
    markSketchAsViewed,
    deleteSketch,
    retrySketch,
    retryFetchSketches,
  } = sketchesData;

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleDownload = useCallback(
    async (imageUrl: string, filename: string) => {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Download failed", error);
      }
    },
    [],
  );

  if (isLoading) {
    return (
      <Card className="border-0 shadow-xl">
        <CardHeader className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <CardTitle className="text-2xl text-gray-600">
            Loading Your Sketches...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-xl">
        <CardHeader className="text-center py-12">
          <CardTitle className="text-2xl text-red-600 mb-4">
            Failed to Load Sketches
          </CardTitle>
          <CardDescription className="text-lg mb-6">{error}</CardDescription>
          <Button
            onClick={retryFetchSketches}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardHeader>
      </Card>
    );
  }

  if (sketches.length === 0) {
    return (
      <Card className="border-0 shadow-xl">
        <CardHeader className="text-center py-12">
          <CardTitle className="text-2xl text-gray-600">
            No Sketches Yet
          </CardTitle>
          <CardDescription className="text-lg">
            Upload your first drawing to see it here!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            🎨 My Sketches
            {newSketchCount > 0 && (
              <Badge className="bg-red-500 text-white hover:bg-red-600 ml-2">
                {newSketchCount} new
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            View and download your magical transformations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sketches.map((sketch) => (
              <SketchCard
                key={`${sketch.id}-${sketch.status}-${sketch.updated_at}`}
                sketch={sketch}
                onPreview={(imgUrl) => setPreviewImage(imgUrl)}
                onDownload={handleDownload}
                onDelete={deleteSketch}
                onRetry={retrySketch}
                onMarkAsViewed={markSketchAsViewed}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      <ImagePreviewModal
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};
