import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Modal, Slider, Button, Space, Row, Col, Select } from 'antd';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  BorderOutlined,
  ScissorOutlined,
} from '@ant-design/icons';
import { THEME_CONSTANTS } from '../theme';

/**
 * Enhanced ImageCropper Component
 * Provides advanced image cropping functionality with:
 * - Precise drag-to-move crop area
 * - Zoom control (0.5x to 3x)
 * - Rotation control (-180° to 180°)
 * - Resizable crop area with aspect ratio lock
 * - Preset aspect ratios
 * - Rule of thirds grid
 * - High-quality output
 */
export default function ImageCropper({
  open,
  onCancel,
  onCropComplete,
  imageUrl,
  loading = false,
  messageType = 'richCard', // Add messageType prop
}) {
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // Crop state
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 300, height: 200 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [aspectRatio, setAspectRatio] = useState(null);
  const [lockAspectRatio, setLockAspectRatio] = useState(false);

  // Image dimensions
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [displayDimensions, setDisplayDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Handle image load
  const handleImageLoad = useCallback((e) => {
    const img = e.target;
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
    
    setDisplayDimensions({
      width: imgRect.width,
      height: imgRect.height,
    });

    // Initialize crop to center 60% of image
    const initialWidth = Math.min(300, imgRect.width * 0.6);
    const initialHeight = Math.min(200, imgRect.height * 0.6);
    
    setCrop({
      x: (imgRect.width - initialWidth) / 2,
      y: (imgRect.height - initialHeight) / 2,
      width: initialWidth,
      height: initialHeight,
    });
  }, []);

  // Mouse down - start dragging or resizing
  const handleMouseDown = (e, handle = null) => {
    e.preventDefault();
    e.stopPropagation();

    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    
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
  };

  // Mouse move - drag or resize crop area
  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current || (!isDragging && !isResizing)) return;

    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      const newX = Math.max(
        0,
        Math.min(displayDimensions.width - crop.width, mouseX - dragStart.x)
      );
      const newY = Math.max(
        0,
        Math.min(displayDimensions.height - crop.height, mouseY - dragStart.y)
      );

      setCrop(prev => ({ ...prev, x: newX, y: newY }));
    } else if (isResizing && resizeHandle) {
      const deltaX = e.clientX - dragStart.mouseX;
      const deltaY = e.clientY - dragStart.mouseY;
      
      let newCrop = { ...crop };
      
      if (resizeHandle.includes('e')) {
        newCrop.width = Math.max(50, Math.min(
          displayDimensions.width - newCrop.x,
          dragStart.cropWidth + deltaX
        ));
      }
      if (resizeHandle.includes('w')) {
        const newWidth = Math.max(50, dragStart.cropWidth - deltaX);
        const newX = Math.max(0, dragStart.cropX + deltaX);
        if (newX + newWidth <= displayDimensions.width) {
          newCrop.x = newX;
          newCrop.width = newWidth;
        }
      }
      if (resizeHandle.includes('s')) {
        newCrop.height = Math.max(50, Math.min(
          displayDimensions.height - newCrop.y,
          dragStart.cropHeight + deltaY
        ));
      }
      if (resizeHandle.includes('n')) {
        const newHeight = Math.max(50, dragStart.cropHeight - deltaY);
        const newY = Math.max(0, dragStart.cropY + deltaY);
        if (newY + newHeight <= displayDimensions.height) {
          newCrop.y = newY;
          newCrop.height = newHeight;
        }
      }
      
      // Maintain aspect ratio if locked
      if (lockAspectRatio && aspectRatio) {
        if (resizeHandle.includes('e') || resizeHandle.includes('w')) {
          newCrop.height = newCrop.width / aspectRatio;
        } else if (resizeHandle.includes('n') || resizeHandle.includes('s')) {
          newCrop.width = newCrop.height * aspectRatio;
        }
        
        // Ensure crop stays within bounds
        if (newCrop.x + newCrop.width > displayDimensions.width) {
          newCrop.width = displayDimensions.width - newCrop.x;
          newCrop.height = newCrop.width / aspectRatio;
        }
        if (newCrop.y + newCrop.height > displayDimensions.height) {
          newCrop.height = displayDimensions.height - newCrop.y;
          newCrop.width = newCrop.height * aspectRatio;
        }
      }
      
      setCrop(newCrop);
    }
  }, [isDragging, isResizing, resizeHandle, crop, dragStart, displayDimensions, lockAspectRatio, aspectRatio]);

  // Mouse up - stop dragging/resizing
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // Add global mouse event listeners
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

  // Get standard aspect ratio based on message type
  const getStandardAspectRatio = () => {
    switch (messageType) {
      case 'richCard':
        return { ratio: 16/9, label: '16:9 (Rich Card)' };
      case 'carousel':
        return { ratio: 4/3, label: '4:3 (Carousel)' };
      default:
        return { ratio: 4/3, label: '4:3 (Default)' };
    }
  };

  const standardRatio = getStandardAspectRatio();

  // Aspect ratio presets based on message type
  const aspectRatioPresets = [
    { label: standardRatio.label, value: standardRatio.ratio },
    { label: '1:1 (Square)', value: 1 },
    { label: '16:9 (Widescreen)', value: 16/9 },
    { label: '4:3 (Standard)', value: 4/3 },
    { label: 'Free', value: null },
  ];

  // Initialize with standard aspect ratio on component mount
  useEffect(() => {
    if (open && displayDimensions.width > 0) {
      const ratio = standardRatio.ratio;
      setAspectRatio(ratio);
      setLockAspectRatio(true);
      
      // Apply standard ratio to initial crop
      setCrop(prev => {
        const containerWidth = displayDimensions.width;
        const containerHeight = displayDimensions.height;
        
        // Calculate optimal crop size maintaining aspect ratio
        let cropWidth = Math.min(containerWidth * 0.8, 400);
        let cropHeight = cropWidth / ratio;
        
        // If height exceeds container, adjust based on height
        if (cropHeight > containerHeight * 0.8) {
          cropHeight = containerHeight * 0.8;
          cropWidth = cropHeight * ratio;
        }
        
        return {
          x: (containerWidth - cropWidth) / 2,
          y: (containerHeight - cropHeight) / 2,
          width: cropWidth,
          height: cropHeight,
        };
      });
    }
  }, [open, displayDimensions.width, displayDimensions.height, messageType]);

  // Handle aspect ratio change
  const handleAspectRatioChange = (value) => {
    setAspectRatio(value);
    setLockAspectRatio(value !== null);
    
    if (value) {
      setCrop(prev => {
        const newHeight = prev.width / value;
        const maxHeight = displayDimensions.height - prev.y;
        
        if (newHeight <= maxHeight) {
          return { ...prev, height: newHeight };
        } else {
          const newWidth = maxHeight * value;
          return { ...prev, width: newWidth, height: maxHeight };
        }
      });
    }
  };

  // Reset to default crop
  const handleResetCrop = () => {
    const initialWidth = Math.min(300, displayDimensions.width * 0.6);
    const initialHeight = Math.min(200, displayDimensions.height * 0.6);
    
    setCrop({
      x: (displayDimensions.width - initialWidth) / 2,
      y: (displayDimensions.height - initialHeight) / 2,
      width: initialWidth,
      height: initialHeight,
    });
  };

  // Reset zoom
  const handleResetZoom = () => {
    setZoom(1);
  };

  // Reset rotation
  const handleResetRotation = () => {
    setRotation(0);
  };

  // Center crop
  const handleCenterCrop = () => {
    setCrop(prev => ({
      ...prev,
      x: (displayDimensions.width - prev.width) / 2,
      y: (displayDimensions.height - prev.height) / 2,
    }));
  };

  // Rotate left
  const handleRotateLeft = () => {
    setRotation(prev => (prev - 90 + 360) % 360);
  };

  // Rotate right
  const handleRotateRight = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Calculate crop information
  const cropWidth = Math.round(crop.width);
  const cropHeight = Math.round(crop.height);
  const currentAspectRatio = (crop.width / crop.height).toFixed(2);
  const coverage = Math.round(
    (crop.width * crop.height) / (displayDimensions.width * displayDimensions.height) * 100
  );

  return (
    <Modal
      title={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <ScissorOutlined style={{ color: THEME_CONSTANTS.colors.primary }} />
          <span style={{ fontWeight: 600, fontSize: '18px' }}        >✂️ Crop Your Image</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      width={1200}
      footer={
        <Space>
          <Button onClick={onCancel} size="large">
            Cancel
          </Button>
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={() => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const img = new Image();
              
              img.onload = () => {
                // Calculate scale factors
                const scaleX = imageDimensions.width / displayDimensions.width;
                const scaleY = imageDimensions.height / displayDimensions.height;
                
                // Calculate actual crop coordinates
                const actualCropX = Math.round(crop.x * scaleX);
                const actualCropY = Math.round(crop.y * scaleY);
                const actualCropWidth = Math.round(crop.width * scaleX);
                const actualCropHeight = Math.round(crop.height * scaleY);
                
                // Set canvas to maintain aspect ratio with good quality
                const maxOutputWidth = messageType === 'richCard' ? 1200 : 800;
                const outputWidth = Math.min(actualCropWidth, maxOutputWidth);
                const outputHeight = Math.round(outputWidth / (crop.width / crop.height));
                
                canvas.width = outputWidth;
                canvas.height = outputHeight;
                
                // High-quality rendering
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // Apply rotation if needed
                if (rotation !== 0) {
                  ctx.translate(outputWidth / 2, outputHeight / 2);
                  ctx.rotate((rotation * Math.PI) / 180);
                  ctx.translate(-outputWidth / 2, -outputHeight / 2);
                }
                
                // Draw cropped image
                ctx.drawImage(
                  img,
                  actualCropX, actualCropY, actualCropWidth, actualCropHeight,
                  0, 0, outputWidth, outputHeight
                );
                
                // Convert to high-quality blob
                canvas.toBlob((blob) => {
                  if (blob) {
                    const croppedFile = new File([blob], `cropped-${messageType}-image.jpg`, {
                      type: 'image/jpeg',
                      lastModified: Date.now(),
                    });
                    onCropComplete(croppedFile, { 
                      crop: {
                        x: actualCropX,
                        y: actualCropY,
                        width: actualCropWidth,
                        height: actualCropHeight
                      }, 
                      zoom, 
                      rotation,
                      aspectRatio,
                      messageType
                    });
                  }
                }, 'image/jpeg', 0.95);
              };
              
              img.crossOrigin = 'anonymous';
              img.src = imageUrl;
            }}
            style={{ background: THEME_CONSTANTS.colors.primary }}
          >
            {loading ? 'Processing...' : '✂️ Crop & Use Image'}
          </Button>
        </Space>
      }
      bodyStyle={{ padding: '24px' }}
      destroyOnClose
      maskClosable={false}
    >
      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Left side - Image with crop area */}
        <div style={{ flex: 1 }}>
          {/* Instructions */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#495057',
                marginBottom: '8px',
              }}
            >
              🎯 Drag to move • 📏 Drag corners to resize • 🔒 Lock aspect ratio
            </div>
            <div style={{ fontSize: '13px', color: '#6c757d' }}>
              Use the controls on the right to zoom, rotate, and set aspect ratios.
            </div>
          </div>

          {/* Image container */}
          <div
            ref={containerRef}
            style={{
              position: 'relative',
              width: '100%',
              height: '500px',
              background: '#f8f9fa',
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: isDragging ? 'grabbing' : isResizing ? 'crosshair' : 'default',
              marginBottom: '16px',
              border: '2px solid #e9ecef',
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
                transition: (isDragging || isResizing) ? 'none' : 'transform 0.2s ease',
                draggable: false,
                userSelect: 'none',
              }}
              onLoad={handleImageLoad}
            />

            {/* Crop overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.4)',
                pointerEvents: 'none',
              }}
            />

            {/* Crop area */}
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
                boxShadow: `0 0 0 ${crop.x}px rgba(0,0,0,0.4), 
                           0 0 0 9999px rgba(0,0,0,0.4)`,
                clipPath: `polygon(
                  0 0, 0 ${crop.y}px, 
                  ${crop.x}px ${crop.y}px, 
                  ${crop.x}px 0, 
                  ${crop.x + crop.width}px 0, 
                  ${crop.x + crop.width}px ${crop.y}px, 
                  100% ${crop.y}px, 
                  100% 0, 
                  100% ${crop.y + crop.height}px, 
                  ${crop.x + crop.width}px ${crop.y + crop.height}px, 
                  ${crop.x + crop.width}px 100%, 
                  ${crop.x}px 100%, 
                  ${crop.x}px ${crop.y + crop.height}px, 
                  0 ${crop.y + crop.height}px, 
                  0 100%, 
                  0 0
                )`,
              }}
              onMouseDown={(e) => handleMouseDown(e)}
            >
              {/* Corner and edge handles */}
              {[
                { pos: 'nw', cursor: 'nw-resize', style: { top: '-6px', left: '-6px' } },
                { pos: 'ne', cursor: 'ne-resize', style: { top: '-6px', right: '-6px' } },
                { pos: 'sw', cursor: 'sw-resize', style: { bottom: '-6px', left: '-6px' } },
                { pos: 'se', cursor: 'se-resize', style: { bottom: '-6px', right: '-6px' } },
                { pos: 'n', cursor: 'n-resize', style: { top: '-6px', left: '50%', transform: 'translateX(-50%)' } },
                { pos: 's', cursor: 's-resize', style: { bottom: '-6px', left: '50%', transform: 'translateX(-50%)' } },
                { pos: 'w', cursor: 'w-resize', style: { left: '-6px', top: '50%', transform: 'translateY(-50%)' } },
                { pos: 'e', cursor: 'e-resize', style: { right: '-6px', top: '50%', transform: 'translateY(-50%)' } },
              ].map((handle) => (
                <div
                  key={handle.pos}
                  style={{
                    position: 'absolute',
                    width: '12px',
                    height: '12px',
                    background: '#1890ff',
                    border: '2px solid white',
                    borderRadius: '50%',
                    cursor: handle.cursor,
                    zIndex: 10,
                    ...handle.style,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, handle.pos)}
                />
              ))}

              {/* Grid lines */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {/* Rule of thirds lines */}
                <div style={{
                  position: 'absolute',
                  left: '33.33%',
                  top: 0,
                  bottom: 0,
                  width: '1px',
                  background: 'rgba(255,255,255,0.5)',
                }} />
                <div style={{
                  position: 'absolute',
                  left: '66.66%',
                  top: 0,
                  bottom: 0,
                  width: '1px',
                  background: 'rgba(255,255,255,0.5)',
                }} />
                <div style={{
                  position: 'absolute',
                  top: '33.33%',
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'rgba(255,255,255,0.5)',
                }} />
                <div style={{
                  position: 'absolute',
                  top: '66.66%',
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'rgba(255,255,255,0.5)',
                }} />
              </div>

              {/* Center indicator */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '8px',
                  height: '8px',
                  background: '#1890ff',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Right side - Controls */}
        <div style={{ width: '300px' }}>
          {/* Preview */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  color: '#495057',
                }}
              >
                👁️ Crop Preview
              </div>
              <div
                style={{
                  width: messageType === 'richCard' ? '200px' : '150px',
                  height: messageType === 'richCard' ? '112px' : '112px', // 16:9 for rich card, 4:3 for carousel
                  background: '#fff',
                  border: '2px solid #dee2e6',
                  borderRadius: '8px',
                  margin: '0 auto',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    style={{
                      width: `${(displayDimensions.width / crop.width) * (messageType === 'richCard' ? 200 : 150)}px`,
                      height: `${(displayDimensions.height / crop.height) * 112}px`,
                      objectFit: 'cover',
                      position: 'absolute',
                      left: `${-(crop.x / crop.width) * (messageType === 'richCard' ? 200 : 150)}px`,
                      top: `${-(crop.y / crop.height) * 112}px`,
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transformOrigin: 'center',
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Aspect Ratio Control */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  color: '#495057',
                }}
              >
                📐 Aspect Ratio
              </div>
              <Select
                value={aspectRatio}
                onChange={handleAspectRatioChange}
                style={{ width: '100%' }}
                options={aspectRatioPresets}
                placeholder="Select aspect ratio"
              />
              {lockAspectRatio && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#52c41a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  🔒 Aspect ratio locked
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  color: '#495057',
                }}
              >
                ⚡ Quick Actions
              </div>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Button
                  block
                  onClick={handleCenterCrop}
                  icon={<BorderOutlined />}
                >
                  Center Crop
                </Button>
                <Button
                  block
                  onClick={handleResetCrop}
                  icon={<ScissorOutlined />}
                >
                  Reset Crop
                </Button>
                <Button
                  block
                  onClick={handleResetZoom}
                  icon={<ZoomOutOutlined />}
                >
                  Reset Zoom
                </Button>
                <Button
                  block
                  onClick={handleResetRotation}
                  icon={<RotateLeftOutlined />}
                >
                  Reset Rotation
                </Button>
              </Space>
            </div>
          </div>

          {/* Zoom Control */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#495057',
                  }}
                >
                  🔍 Zoom
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: THEME_CONSTANTS.colors.primary,
                    background: '#e3f2fd',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <Slider
                min={0.5}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(value) => setZoom(value)}
                trackStyle={{ background: THEME_CONSTANTS.colors.primary }}
                handleStyle={{ borderColor: THEME_CONSTANTS.colors.primary }}
              />
            </div>
          </div>

          {/* Rotation Control */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#495057',
                  }}
                >
                  🔄 Rotate
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: THEME_CONSTANTS.colors.primary,
                    background: '#e3f2fd',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {rotation}°
                </span>
              </div>
              <Slider
                min={-180}
                max={180}
                step={15}
                value={rotation}
                onChange={(value) => setRotation(value)}
                trackStyle={{ background: THEME_CONSTANTS.colors.primary }}
                handleStyle={{ borderColor: THEME_CONSTANTS.colors.primary }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <Button
                  size="small"
                  onClick={handleRotateLeft}
                  style={{ flex: 1 }}
                >
                  ↺ -90°
                </Button>
                <Button
                  size="small"
                  onClick={handleRotateRight}
                  style={{ flex: 1 }}
                >
                  ↻ +90°
                </Button>
              </div>
            </div>
          </div>

          {/* Crop Information */}
          <div
            style={{
              background: '#eff6ff',
              border: `1px solid #bfdbfe`,
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <h4
              style={{
                fontWeight: 'semibold',
                color: '#1e3a8a',
                marginBottom: '12px',
              }}
            >
              📊 Crop Information
            </h4>
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <div style={{ fontSize: '12px', color: '#1e40af' }}>
                  Original Size
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#1e3a8a',
                  }}
                >
                  {imageDimensions.width}×{imageDimensions.height}px
                </div>
              </Col>
              <Col span={12}>
                <div style={{ fontSize: '12px', color: '#1e40af' }}>
                  Crop Size
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#1e3a8a',
                  }}
                >
                  {cropWidth}×{cropHeight}px
                </div>
              </Col>
              <Col span={12}>
                <div style={{ fontSize: '12px', color: '#1e40af' }}>
                  Aspect Ratio
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#1e3a8a',
                  }}
                >
                  {currentAspectRatio}
                </div>
              </Col>
              <Col span={12}>
                <div style={{ fontSize: '12px', color: '#1e40af' }}>
                  Coverage
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#1e3a8a',
                  }}
                >
                  {coverage}%
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </div>
    </Modal>
  );
}