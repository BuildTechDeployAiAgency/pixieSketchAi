
import { Button } from "@/components/ui/button";

interface ImagePreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const ImagePreviewModal = ({ imageUrl, onClose }: ImagePreviewModalProps) => {
  if (!imageUrl) return null;
  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="max-w-4xl max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
        <img 
          src={imageUrl} 
          alt="Preview"
          className="max-w-full max-h-full object-contain rounded-lg"
        />
        <Button
          variant="outline"
          size="sm"
          className="absolute top-4 right-4 bg-white"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
};
