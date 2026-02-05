import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal,
  Slider,
  Button,
  Space,
  Row,
  Col,
  Card,
  Spin,
  message,
  Select,
  Alert,
} from 'antd';
import {
  ZoomInOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  UndoOutlined,
  ScissorOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';

/**
 * ═══════════════════════════════════════════════════════════════════════
 * PROFESSIONAL RCS IMAGE CROPPER - PERFECT GRID/PREVIEW SYNC (FULLY FIXED)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * ✅ PERFECT GRID/PREVIEW SYNCHRONIZATION - NOW WORKING!
 * ✅ Grid lines match exactly with preview
 * ✅ Same aspect ratio for both sections
 * ✅ Identical grid positioning
 * ✅ FIXED: Preview now shows complete 9-section grid perfectly
 */

const RCS_ASPECT_RATIOS = {
  logo: {
    ratio: 1,
    label: 'Brand Logo - 1:1',
    description: 'Square 224×224 pixels',
    optimalWidth: 224,
    optimalHeight: 224,
    minWidth: 224,
    minHeight: 224,
  },
  banner: {
    ratio: 1440 / 448,
    label: 'Company Banner - 1440:448',
    description: 'Wide 1440×448 pixels',
    optimalWidth: 1440,
    optimalHeight: 448,
    minWidth: 1440,
    minHeight: 448,
  },
  richCard: {
    ratio: 16 / 9,
    label: 'Rich Card - 16:9',
    description: 'Recommended for single card',
    optimalWidth: 1440,
    optimalHeight: 720,
    minWidth: 400,
    minHeight: 225,
  },
  carousel: {
    ratio: 4 / 3,
    label: 'Carousel - 4:3',
    description: 'Recommended for carousel',
    optimalWidth: 960,
    optimalHeight: 720,
    minWidth: 300,
    minHeight: 225,
  },
};

// ✅ REUSABLE GRID LINES - IDENTICAL IN BOTH CROP AND PREVIEW
const GridLines = ({ showGrid = true }) => {
  if (!showGrid) return null;
  
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
      {/* Vertical lines at 33.33% and 66.66% */}
      <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.5)' }} />
      <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.5)' }} />
      {/* Horizontal lines at 33.33% and 66.66% */}
      <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.5)' }} />
      <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.5)' }} />
    </div>
  );
};

export default function RCSImageCropper({
  open,
  onCancel,
  onCropComplete,
  imageUrl,
  loading = false,
  messageType = 'logo',
}) {
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // STATE MANAGEMENT
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 300, height: 225 });
  const [originalCrop, setOriginalCrop] = useState({ x: 0, y: 0, width: 300, height: 225 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);

  // Auto-select format based on messageType prop
  const selectedRatioKey = messageType;
  const selectedRatio = RCS_ASPECT_RATIOS[selectedRatioKey];

  const cropInfo = useMemo(() => {
    const scaleX = imageDimensions.width / displayDimensions.width || 1;
    const scaleY = imageDimensions.height / displayDimensions.height || 1;

    const actualWidth = Math.round(crop.width * scaleX);
    const actualHeight = Math.round(crop.height * scaleY);
    const currentAspect = (crop.width / crop.height).toFixed(2);
    const coverage = Math.round(
      ((crop.width * crop.height) / (displayDimensions.width * displayDimensions.height)) * 100
    );

    return {
      displayWidth: Math.round(crop.width),
      displayHeight: Math.round(crop.height),
      actualWidth,
      actualHeight,
      currentAspect,
      coverage,
    };
  }, [crop, imageDimensions, displayDimensions]);

const previewCanvasRef = useRef(null);

  useEffect(() => {
  if (!imageUrl || !previewCanvasRef.current || imageLoading) return;

  const canvas = previewCanvasRef.current;
  const ctx = canvas.getContext('2d');
  const img = new Image();

  img.onload = () => {
    const scaleX = imageDimensions.width / displayDimensions.width;
    const scaleY = imageDimensions.height / displayDimensions.height;

    const sx = crop.x * scaleX;
    const sy = crop.y * scaleY;
    const sw = crop.width * scaleX;
    const sh = crop.height * scaleY;

    const aspect = crop.width / crop.height;
    const previewWidth = 360;
    const previewHeight = Math.round(previewWidth / aspect);

    canvas.width = previewWidth;
    canvas.height = previewHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    ctx.drawImage(
      img,
      sx,
      sy,
      sw,
      sh,
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.restore();
  };

  img.crossOrigin = 'anonymous';
  img.src = imageUrl;
}, [
  crop,
  rotation,
  zoom,
  imageUrl,
  imageDimensions,
  displayDimensions,
  imageLoading
]);



  // IMAGE LOADING
  const handleImageLoad = useCallback((e) => {
    const img = e.target;
    const container = containerRef.current;
    if (!container) return;

    const imgRect = img.getBoundingClientRect();

    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });

    setDisplayDimensions({
      width: imgRect.width,
      height: imgRect.height,
    });

    const ratio = selectedRatio.ratio || 16 / 9;
    const maxWidth = imgRect.width * 0.9;
    const maxHeight = imgRect.height * 0.9;

    let cropWidth = Math.min(maxWidth, 500);
    let cropHeight = cropWidth / ratio;

    if (cropHeight > maxHeight) {
      cropHeight = maxHeight;
      cropWidth = cropHeight * ratio;
    }

    const initialCrop = {
      x: (imgRect.width - cropWidth) / 2,
      y: (imgRect.height - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    };

    setCrop(initialCrop);
    setOriginalCrop(initialCrop);
    setImageLoading(false);
  }, [selectedRatio.ratio]);

  // CROP AREA MANIPULATION
  const handleMouseDown = useCallback((e, handle = null) => {
    if (imageLoading) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }

    setDragStart({
      x: e.clientX - rect.left - crop.x,
      y: e.clientY - rect.top - crop.y,
      cropX: crop.x,
      cropY: crop.y,
      cropWidth: crop.width,
      cropHeight: crop.height,
      mouseX: e.clientX,
      mouseY: e.clientY,
    });
  }, [crop, imageLoading]);

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current || (!isDragging && !isResizing)) return;

    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      const newX = Math.max(0, Math.min(displayDimensions.width - crop.width, mouseX - dragStart.x));
      const newY = Math.max(0, Math.min(displayDimensions.height - crop.height, mouseY - dragStart.y));
      setCrop((prev) => ({ ...prev, x: newX, y: newY }));
    } else if (isResizing && resizeHandle) {
      const deltaX = e.clientX - dragStart.mouseX;
      const deltaY = e.clientY - dragStart.mouseY;

      let newCrop = { ...crop };
      const ratio = selectedRatio.ratio;

      if (resizeHandle.includes('e')) {
        newCrop.width = Math.max(100, dragStart.cropWidth + deltaX);
      }
      if (resizeHandle.includes('w')) {
        const newWidth = Math.max(100, dragStart.cropWidth - deltaX);
        const newX = Math.max(0, dragStart.cropX + deltaX);
        if (newX + newWidth <= displayDimensions.width) {
          newCrop.x = newX;
          newCrop.width = newWidth;
        }
      }
      if (resizeHandle.includes('s')) {
        newCrop.height = Math.max(100, dragStart.cropHeight + deltaY);
      }
      if (resizeHandle.includes('n')) {
        const newHeight = Math.max(100, dragStart.cropHeight - deltaY);
        const newY = Math.max(0, dragStart.cropY + deltaY);
        if (newY + newHeight <= displayDimensions.height) {
          newCrop.y = newY;
          newCrop.height = newHeight;
        }
      }

      if (lockAspectRatio && ratio) {
        if (resizeHandle.includes('e') || resizeHandle.includes('w')) {
          newCrop.height = newCrop.width / ratio;
        } else if (resizeHandle.includes('n') || resizeHandle.includes('s')) {
          newCrop.width = newCrop.height * ratio;
        }

        if (newCrop.x + newCrop.width > displayDimensions.width) {
          newCrop.width = displayDimensions.width - newCrop.x;
          newCrop.height = newCrop.width / ratio;
        }
        if (newCrop.y + newCrop.height > displayDimensions.height) {
          newCrop.height = displayDimensions.height - newCrop.y;
          newCrop.width = newCrop.height * ratio;
        }
      }

      setCrop(newCrop);
    }
  }, [isDragging, isResizing, resizeHandle, crop, dragStart, displayDimensions, lockAspectRatio, selectedRatio.ratio]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open || imageLoading) return;

      const moveStep = 15;

      switch (e.key) {
        case 'ArrowUp':
          setCrop((prev) => ({ ...prev, y: Math.max(0, prev.y - moveStep) }));
          e.preventDefault();
          break;
        case 'ArrowDown':
          setCrop((prev) => ({
            ...prev,
            y: Math.min(displayDimensions.height - prev.height, prev.y + moveStep),
          }));
          e.preventDefault();
          break;
        case 'ArrowLeft':
          setCrop((prev) => ({ ...prev, x: Math.max(0, prev.x - moveStep) }));
          e.preventDefault();
          break;
        case 'ArrowRight':
          setCrop((prev) => ({
            ...prev,
            x: Math.min(displayDimensions.width - prev.width, prev.x + moveStep),
          }));
          e.preventDefault();
          break;
        case '+':
        case '=':
          setZoom((prev) => Math.min(3, prev + 0.1));
          e.preventDefault();
          break;
        case '-':
          setZoom((prev) => Math.max(0.5, prev - 0.1));
          e.preventDefault();
          break;
        case 'r':
          if (e.ctrlKey || e.metaKey) {
            handleReset();
            e.preventDefault();
          }
          break;
        default:
          break;
      }
    };

    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, imageLoading, displayDimensions]);

  // CONTROL ACTIONS
  const handleCenterCrop = () => {
    setCrop((prev) => ({
      ...prev,
      x: (displayDimensions.width - prev.width) / 2,
      y: (displayDimensions.height - prev.height) / 2,
    }));
  };

  const handleReset = () => {
    setCrop(originalCrop);
    setZoom(1);
    setRotation(0);
    message.success('Crop reset to original');
  };

  const handleRotate = (direction) => {
    setRotation((prev) => {
      const newRotation = direction === 'left' ? prev - 90 : prev + 90;
      return newRotation % 360;
    });
  };

  const handleZoomChange = (value) => {
    setZoom(value);
  };

  const handleRotationChange = (value) => {
    setRotation(value);
  };

  const toggleAspectLock = () => {
    if (selectedRatioKey !== 'freeform') {
      setLockAspectRatio(!lockAspectRatio);
    }
  };

  // CROP COMPLETION
  const handleCropComplete = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const scaleX = imageDimensions.width / displayDimensions.width;
      const scaleY = imageDimensions.height / displayDimensions.height;

      const actualCropX = Math.round(crop.x * scaleX);
      const actualCropY = Math.round(crop.y * scaleY);
      const actualCropWidth = Math.round(crop.width * scaleX);
      const actualCropHeight = Math.round(crop.height * scaleY);

      // Use exact optimal dimensions for output
      const outputWidth = selectedRatio.optimalWidth;
      const outputHeight = selectedRatio.optimalHeight;

      canvas.width = outputWidth;
      canvas.height = outputHeight;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (rotation !== 0) {
        ctx.translate(outputWidth / 2, outputHeight / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-outputWidth / 2, -outputHeight / 2);
      }

      ctx.drawImage(
        img,
        actualCropX,
        actualCropY,
        actualCropWidth,
        actualCropHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const fileName = `rcs-${selectedRatioKey}-${Date.now()}.jpg`;
            const croppedFile = new File([blob], fileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            onCropComplete(croppedFile, {
              crop: {
                x: actualCropX,
                y: actualCropY,
                width: actualCropWidth,
                height: actualCropHeight,
              },
              zoom,
              rotation,
              aspectRatio: selectedRatio.ratio,
              messageType: selectedRatioKey,
              outputDimensions: {
                width: outputWidth,
                height: outputHeight,
              },
            });

            message.success(`Image cropped to ${outputWidth}×${outputHeight} pixels! ✂️`);
          }
        },
        'image/jpeg',
        0.95
      );
    };

    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
  };

  // FORMAT SELECTOR OPTIONS
  const formatOptions = Object.entries(RCS_ASPECT_RATIOS).map(([key, value]) => ({
    label: value.label,
    value: key,
    description: value.description,
  }));

  // RESIZE HANDLES
  const handles = [
    { pos: 'nw', cursor: 'nw-resize', style: { top: '-7px', left: '-7px' } },
    { pos: 'ne', cursor: 'ne-resize', style: { top: '-7px', right: '-7px' } },
    { pos: 'sw', cursor: 'sw-resize', style: { bottom: '-7px', left: '-7px' } },
    { pos: 'se', cursor: 'se-resize', style: { bottom: '-7px', right: '-7px' } },
    { pos: 'n', cursor: 'n-resize', style: { top: '-7px', left: '50%', transform: 'translateX(-50%)' } },
    { pos: 's', cursor: 's-resize', style: { bottom: '-7px', left: '50%', transform: 'translateX(-50%)' } },
    { pos: 'w', cursor: 'w-resize', style: { left: '-7px', top: '50%', transform: 'translateY(-50%)' } },
    { pos: 'e', cursor: 'e-resize', style: { right: '-7px', top: '50%', transform: 'translateY(-50%)' } },
  ];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ScissorOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
          <span style={{ fontWeight: 600, fontSize: '16px' }}>RCS Image Cropper</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      width="95%"
      style={{ maxWidth: '1400px' }}
      footer={
        <Space style={{ width: '100%', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button onClick={onCancel} size="large">
            Cancel
          </Button>
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handleCropComplete}
            style={{ minWidth: '120px' }}
            icon={<ScissorOutlined />}
          >
            {loading ? 'Processing...' : 'Crop & Use'}
          </Button>
        </Space>
      }
      bodyStyle={{ padding: window.innerWidth < 768 ? '12px' : '24px', maxHeight: '90vh', overflowY: 'auto' }}
      destroyOnClose
      maskClosable={false}
      centered
    >
      <Spin spinning={imageLoading} tip="Loading image...">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
          {/* Format Info Banner */}
          <Alert
            message={`Cropping for ${selectedRatio.label}`}
            description={`Output: ${selectedRatio.optimalWidth}×${selectedRatio.optimalHeight} pixels`}
            type="info"
            showIcon
            style={{ marginBottom: 0 }}
          />

          {/* MAIN CONTENT - RESPONSIVE */}
          <div style={{ display: 'flex', flexDirection: window.innerWidth < 992 ? 'column' : 'row', gap: '16px', flex: 1, minHeight: 0 }}>
            {/* LEFT SIDE - IMAGE EDITOR */}
            <div style={{ flex: window.innerWidth < 992 ? '1' : '1.5', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <Card
                size="small"
                style={{ borderColor: '#f0f0f0', flex: 1, display: 'flex', flexDirection: 'column' }}
                bodyStyle={{ padding: '0', flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                <div
                  ref={containerRef}
                  style={{
                    position: 'relative',
                    width: '100%',
                    flex: 1,
                    minHeight: window.innerWidth < 768 ? '300px' : '400px',
                    background: '#0a0a0a',
                    overflow: 'hidden',
                    cursor: isDragging ? 'grabbing' : isResizing ? 'crosshair' : 'default',
                    borderRadius: '8px 8px 0 0',
                  }}
                >
                  {/* Image */}
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Crop source"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transition: isDragging || isResizing ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      draggable: false,
                      userSelect: 'none',
                    }}
                    onLoad={handleImageLoad}
                  />

                  {/* Dark overlay outside crop area */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(0,0,0,0.5)',
                      pointerEvents: 'none',
                      mixBlendMode: 'multiply',
                    }}
                  />

                  {/* Crop Area with Grid Lines */}
                  <div
                    style={{
                      position: 'absolute',
                      left: crop.x,
                      top: crop.y,
                      width: crop.width,
                      height: crop.height,
                      border: '2px solid #1890ff',
                      background: 'transparent',
                      cursor: 'move',
                      boxShadow: `inset 0 0 0 1px rgba(24, 144, 255, 0.3), 0 0 20px rgba(24, 144, 255, 0.2)`,
                      transition: isDragging || isResizing ? 'none' : 'box-shadow 0.2s ease',
                    }}
                    onMouseDown={(e) => handleMouseDown(e)}
                  >
                    {/* Resize Handles */}
                    {handles.map((handle) => (
                      <div
                        key={handle.pos}
                        style={{
                          position: 'absolute',
                          width: '14px',
                          height: '14px',
                          background: '#1890ff',
                          border: '2px solid white',
                          borderRadius: '50%',
                          cursor: handle.cursor,
                          zIndex: 10,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          transition: 'transform 0.2s ease',
                          ...handle.style,
                        }}
                        onMouseDown={(e) => handleMouseDown(e, handle.pos)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title={`Resize ${handle.pos.toUpperCase()}`}
                      />
                    ))}

                    {/* Grid Lines - SYNCHRONIZED */}
                    <GridLines showGrid={showGrid} />

                    {/* Center Crosshair */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '12px',
                        height: '12px',
                        border: '2px solid rgba(255,255,255,0.6)',
                        borderRadius: '50%',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Keyboard Shortcuts Info */}
                <div
                  style={{
                    padding: '10px 12px',
                    background: '#fafafa',
                    borderTop: '1px solid #f0f0f0',
                    fontSize: '11px',
                    color: '#595959',
                    borderRadius: '0 0 8px 8px',
                  }}
                >
                  ⌨️ Arrow keys to move • +/- to zoom • R to reset
                </div>
              </Card>
            </div>

            {/* RIGHT SIDE - CONTROLS PANEL - RESPONSIVE */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px', position: window.innerWidth < 992 ? 'relative' : 'sticky', top: '0', alignSelf: 'flex-start' }}>
              <Card size="small" title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '18px' }}></span><span style={{ fontWeight: 600 }}>Live Preview</span></div>} style={{ borderRadius: '12px', border: '1px solid #e0e7ff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} bodyStyle={{ padding: '12px', background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)' }}>
                <div style={{ width: '100%', maxWidth: window.innerWidth < 768 ? '100%' : '360px', margin: '0 auto', position: 'relative', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <canvas ref={previewCanvasRef} style={{ width: '100%', display: 'block', background: '#000' }} />
                  <GridLines showGrid={showGrid} />
                </div>
              </Card>

              {/* Zoom Control
              <Card size="small" title={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ZoomInOutlined style={{ fontSize: '14px', color: '#1890ff' }} /><span style={{ fontWeight: 600 }}>Zoom</span></div><span style={{ fontSize: '12px', fontWeight: 700, color: '#1890ff', background: '#e6f7ff', padding: '2px 8px', borderRadius: '4px' }}>{Math.round(zoom * 100)}%</span></div>} style={{ borderRadius: '10px', border: '1px solid #e8e8e8' }} bodyStyle={{ padding: '12px 16px' }}>
                <Slider min={0.5} max={3} step={0.1} value={zoom} onChange={handleZoomChange} marks={{ 0.5: '50%', 1: '100%', 3: '300%' }} trackStyle={{ background: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)', height: '6px' }} railStyle={{ background: '#e8e8e8', height: '6px' }} handleStyle={{ borderColor: '#1890ff', height: '18px', width: '18px', marginTop: '-6px', boxShadow: '0 2px 6px rgba(24, 144, 255, 0.3)' }} />
              </Card> */}

              {/* Rotation Control */}
              <Card size="small" title={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><RotateRightOutlined style={{ fontSize: '14px', color: '#1890ff' }} /><span style={{ fontWeight: 600 }}>Rotate</span></div><span style={{ fontSize: '12px', fontWeight: 700, color: '#1890ff', background: '#e6f7ff', padding: '2px 8px', borderRadius: '4px' }}>{rotation}°</span></div>} style={{ borderRadius: '10px', border: '1px solid #e8e8e8' }} bodyStyle={{ padding: '12px 16px' }}>
                <Slider min={-180} max={180} step={15} value={rotation} onChange={handleRotationChange} trackStyle={{ background: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)', height: '6px' }} railStyle={{ background: '#e8e8e8', height: '6px' }} handleStyle={{ borderColor: '#1890ff', height: '18px', width: '18px', marginTop: '-6px', boxShadow: '0 2px 6px rgba(24, 144, 255, 0.3)' }} />
                <Space style={{ width: '100%', marginTop: '12px', gap: '8px' }}>
                  <Button size="middle" block onClick={() => handleRotate('left')} icon={<RotateLeftOutlined />} style={{ height: '36px', fontWeight: 500, borderRadius: '8px' }}>-90°</Button>
                  <Button size="middle" block onClick={() => handleRotate('right')} icon={<RotateRightOutlined />} style={{ height: '36px', fontWeight: 500, borderRadius: '8px' }}>+90°</Button>
                </Space>
              </Card>

              {/* Quick Actions */}
              <Card size="small" title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '16px' }}>⚡</span><span style={{ fontWeight: 600 }}>Quick Actions</span></div>} style={{ borderRadius: '10px', border: '1px solid #e8e8e8' }} bodyStyle={{ padding: '12px' }}>
                <Row gutter={[8, 8]}>
                  <Col span={12}><Button type="default" block onClick={handleCenterCrop} style={{ height: '38px', fontSize: '13px', fontWeight: 500, borderRadius: '8px' }}>Center Crop</Button></Col>
                  <Col span={12}><Button type="default" block onClick={() => setShowGrid(!showGrid)} style={{ height: '38px', fontSize: '13px', fontWeight: 500, borderRadius: '8px' }}>{showGrid ? 'Hide Grid' : 'Show Grid'}</Button></Col>
                  <Col span={24}><Button type="primary" danger block onClick={handleReset} icon={<UndoOutlined />} style={{ height: '38px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', boxShadow: '0 2px 6px rgba(255, 77, 79, 0.3)' }}>Reset All</Button></Col>
                </Row>
              </Card>
            </div>
          </div>

          {/* Crop Info - Bottom - RESPONSIVE */}
          <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)', borderRadius: '12px', padding: window.innerWidth < 768 ? '12px' : '16px', border: '1px solid #e0e7ff' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>

              <span>Crop Information</span>
            </div>
            <Row gutter={window.innerWidth < 768 ? [8, 8] : 16}>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center', padding: window.innerWidth < 768 ? '8px' : '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e8e8e8' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Display</div>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: window.innerWidth < 768 ? '12px' : '14px' }}>{cropInfo.displayWidth} × {cropInfo.displayHeight}</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center', padding: window.innerWidth < 768 ? '8px' : '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e8e8e8' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Output</div>
                  <div style={{ fontWeight: 700, color: '#1890ff', fontSize: window.innerWidth < 768 ? '12px' : '14px' }}>{cropInfo.actualWidth} × {cropInfo.actualHeight}</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center', padding: window.innerWidth < 768 ? '8px' : '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e8e8e8' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Aspect</div>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: window.innerWidth < 768 ? '12px' : '14px' }}>{cropInfo.currentAspect}</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center', padding: window.innerWidth < 768 ? '8px' : '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e8e8e8' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Coverage</div>
                  <div style={{ fontWeight: 700, color: '#10b981', fontSize: window.innerWidth < 768 ? '12px' : '14px' }}>{cropInfo.coverage}%</div>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </Spin>
    </Modal>
  );
}