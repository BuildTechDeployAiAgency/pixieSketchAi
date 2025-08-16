import { Download, Play, RotateCcw, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "./utils";

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

interface SketchCardProps {
  sketch: Sketch;
  onPreview: (imgUrl: string) => void;
  onDownload: (imgUrl: string, filename: string) => void;
  onDelete: (id: string) => void;
  onRetry: (id: string) => void;
  onMarkAsViewed: (id: string) => void;
}

export const SketchCard = ({
  sketch,
  onPreview,
  onDownload,
  onDelete,
  onRetry,
  onMarkAsViewed,
}: SketchCardProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            ✓ Complete
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            ⏳ Processing
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            ⚠ Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const handleImageClick = () => {
    if (sketch.is_new) {
      onMarkAsViewed(sketch.id);
    }
    onPreview(sketch.animated_image_url || sketch.original_image_url || "");
  };

  return (
    <div
      className={`border transition-shadow relative rounded-xl bg-white ${sketch.is_new ? "border-purple-300 shadow-lg ring-2 ring-purple-200" : "border-gray-200 hover:shadow-lg"}`}
    >
      {sketch.is_new && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge className="bg-red-500 text-white hover:bg-red-600 text-xs">
            NEW
          </Badge>
        </div>
      )}
      <div className="p-4 pb-2">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-semibold">{sketch.name}</h3>
            <div className="text-gray-400 text-xs">
              {formatDate(sketch.created_at)}
            </div>
          </div>
          {getStatusBadge(sketch.status)}
        </div>
      </div>

      <div className="px-4 space-y-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">
            Original Drawing:
          </p>
          <div
            className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border cursor-pointer"
            onClick={() =>
              sketch.original_image_url && onPreview(sketch.original_image_url)
            }
          >
            {sketch.original_image_url ? (
              <img
                src={sketch.original_image_url}
                alt={sketch.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-gray-400">No image</div>
            )}
          </div>
        </div>
        {sketch.status === "completed" && sketch.animated_image_url && (
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">
              Magic Result:
            </p>
            <div
              className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center border relative cursor-pointer"
              onClick={handleImageClick}
            >
              <img
                src={sketch.animated_image_url}
                alt={`${sketch.name} animated`}
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                <Play className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        )}
        {sketch.status === "processing" && (
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">
              Creating Magic:
            </p>
            <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center border">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-sm text-purple-600">Processing...</p>
              </div>
            </div>
          </div>
        )}
        {sketch.status === "failed" && (
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">
              Processing Failed:
            </p>
            <div className="aspect-square bg-red-50 rounded-lg flex items-center justify-center border border-red-200">
              <div className="text-center space-y-2">
                <div className="text-red-500 text-2xl">⚠</div>
                <p className="text-sm text-red-600">Failed to process</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap p-4 border-t">
        {sketch.status === "completed" ? (
          <>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() =>
                sketch.animated_image_url &&
                onDownload(
                  sketch.animated_image_url,
                  `${sketch.name}_animated.jpg`,
                )
              }
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => handleImageClick()}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-shrink-0"
              onClick={() => onDelete(sketch.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        ) : sketch.status === "failed" ? (
          <>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
              onClick={() => onRetry(sketch.id)}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Retry Processing
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-shrink-0"
              onClick={() => onDelete(sketch.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" className="flex-1" disabled>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-1"></div>
              Processing
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-shrink-0"
              onClick={() => onDelete(sketch.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
