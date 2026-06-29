import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";

const OUTPUT_SIZE = 256;          // px — final square avatar
const JPEG_QUALITY = 0.85;        // ~50-80 KB at 256x256
const MAX_INPUT_BYTES = 8 * 1024 * 1024;  // 8 MB raw upload limit

/**
 * Crop the source image to the selected pixel area and downscale to OUTPUT_SIZE × OUTPUT_SIZE.
 * Returns a JPEG data URL.
 */
async function getCroppedDataURL(imageSrc, pixelCrop) {
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    img,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, OUTPUT_SIZE, OUTPUT_SIZE
  );

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

export default function AvatarUploadModal({ open, onOpenChange, onSave, saving }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      toast.error("Image too large. Max 8 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      toast.error("Please select and crop an image first");
      return;
    }
    try {
      const dataUrl = await getCroppedDataURL(imageSrc, croppedAreaPixels);
      await onSave(dataUrl);
      handleClose();
    } catch (err) {
      toast.error("Failed to process image");
    }
  };

  const handleClose = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
      <DialogContent className="max-w-md" data-testid="avatar-upload-modal">
        <DialogHeader>
          <DialogTitle>Update profile picture</DialogTitle>
        </DialogHeader>

        {!imageSrc ? (
          <label
            htmlFor="avatar-file-input"
            className="flex flex-col items-center justify-center gap-3 py-12 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-colors"
            data-testid="avatar-file-dropzone"
          >
            <ImagePlus className="w-10 h-10 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Click to choose an image</p>
              <p className="text-xs text-muted-foreground mt-1">JPEG, PNG or WebP · max 8 MB</p>
            </div>
            <input
              id="avatar-file-input"
              data-testid="avatar-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFile}
            />
          </label>
        ) : (
          <div className="space-y-4">
            {/* Cropper canvas */}
            <div className="relative w-full h-64 bg-muted/40 rounded-xl overflow-hidden" data-testid="avatar-cropper">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Zoom slider */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Zoom</label>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.05}
                onValueChange={(v) => setZoom(v[0])}
                data-testid="avatar-zoom-slider"
              />
            </div>

            <button
              type="button"
              onClick={() => setImageSrc(null)}
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              data-testid="avatar-choose-different"
            >
              Choose a different image
            </button>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={saving}
            data-testid="avatar-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!imageSrc || !croppedAreaPixels || saving}
            data-testid="avatar-save-btn"
          >
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving</> : "Save photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
