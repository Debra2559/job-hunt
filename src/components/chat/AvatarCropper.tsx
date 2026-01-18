import { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface AvatarCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function AvatarCropper({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
}: AvatarCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [loading, setLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }, []);

  const getCroppedImg = useCallback(async (): Promise<Blob | null> => {
    const image = imgRef.current;
    if (!image || !completedCrop) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set output size (square avatar)
    const outputSize = 256;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Calculate the actual crop dimensions in natural image coordinates
    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // Create an offscreen canvas for rotation and scaling
    const offscreen = document.createElement('canvas');
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return null;

    // Set offscreen canvas size to accommodate rotation
    const rotateRads = (rotate * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rotateRads));
    const cos = Math.abs(Math.cos(rotateRads));
    const newWidth = image.naturalWidth * cos + image.naturalHeight * sin;
    const newHeight = image.naturalWidth * sin + image.naturalHeight * cos;
    
    offscreen.width = newWidth * scale;
    offscreen.height = newHeight * scale;

    // Apply transformations
    offCtx.translate(offscreen.width / 2, offscreen.height / 2);
    offCtx.rotate(rotateRads);
    offCtx.scale(scale, scale);
    offCtx.translate(-image.naturalWidth / 2, -image.naturalHeight / 2);
    offCtx.drawImage(image, 0, 0);

    // Calculate adjusted crop position for scaled/rotated image
    const adjustedCropX = cropX * scale + (offscreen.width - image.naturalWidth * scale) / 2;
    const adjustedCropY = cropY * scale + (offscreen.height - image.naturalHeight * scale) / 2;
    const adjustedCropWidth = cropWidth * scale;
    const adjustedCropHeight = cropHeight * scale;

    // Draw the cropped area to the output canvas
    ctx.drawImage(
      offscreen,
      adjustedCropX,
      adjustedCropY,
      adjustedCropWidth,
      adjustedCropHeight,
      0,
      0,
      outputSize,
      outputSize
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        0.9
      );
    });
  }, [completedCrop, scale, rotate]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const blob = await getCroppedImg();
      if (blob) {
        onCropComplete(blob);
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScale(1);
    setRotate(0);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, 1));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>裁剪头像</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Crop Area */}
          <div className="flex justify-center bg-muted/30 rounded-lg p-4 max-h-[400px] overflow-auto">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
              className="max-w-full"
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={onImageLoad}
                style={{
                  transform: `scale(${scale}) rotate(${rotate}deg)`,
                  maxHeight: '350px',
                  maxWidth: '100%',
                }}
                className="transition-transform"
              />
            </ReactCrop>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom */}
            <div className="flex items-center gap-3">
              <ZoomOut className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[scale]}
                onValueChange={([value]) => setScale(value)}
                min={0.5}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <ZoomIn className="w-4 h-4 text-muted-foreground" />
            </div>

            {/* Rotate */}
            <div className="flex items-center gap-3">
              <RotateCcw className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[rotate]}
                onValueChange={([value]) => setRotate(value)}
                min={-180}
                max={180}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10 text-right">{rotate}°</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset}>
            重置
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !completedCrop}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                处理中...
              </>
            ) : (
              '确认'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
