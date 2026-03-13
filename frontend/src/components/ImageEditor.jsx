import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

export default function ImageEditor({ imageFile, imageUrl, onChange, initialCrop }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // 加载图片并获取尺寸，支持 initialCrop 回填
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
      if (containerSize.width > 0 && containerSize.height > 0) {
        const minScale = Math.max(
          containerSize.width / img.width,
          containerSize.height / img.height
        );
        // 如果有 initialCrop 则回填，否则用 minScale
        if (initialCrop && initialCrop.scale != null) {
          setScale(initialCrop.scale);
          setPosition({
            x: initialCrop.x ?? 0,
            y: initialCrop.y ?? 0,
          });
        } else {
          setScale(minScale);
        }
      }
    };

    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      img.src = url;
      return () => URL.revokeObjectURL(url);
    } else if (imageUrl) {
      img.src = imageUrl;
    }
  }, [imageFile, imageUrl, containerSize, initialCrop]);

  // 监听容器尺寸变化
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateContainerSize();
    const resizeObserver = new ResizeObserver(updateContainerSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // 计算最小缩放（确保图片填满容器，无空白）
  const minScale = useMemo(() => {
    if (imageSize.width === 0 || imageSize.height === 0) return 1;
    if (containerSize.width === 0 || containerSize.height === 0) return 1;
    return Math.max(
      containerSize.width / imageSize.width,
      containerSize.height / imageSize.height
    );
  }, [imageSize, containerSize]);

  const maxScale = 3; // 最大3倍

  // 缩放处理
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = -e.deltaY / 1000;
    const newScale = Math.min(Math.max(scale + delta, minScale), maxScale);
    setScale(newScale);
  }, [scale, minScale]);

  // 拖动开始
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [position]);

  // 拖动中
  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const newX = e.clientX - startPos.x;
    const newY = e.clientY - startPos.y;

    // 约束位置，确保图片填满容器
    const constrained = constrainPosition(newX, newY, scale);
    setPosition(constrained);
  }, [dragging, startPos, scale]);

  // 拖动结束
  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  // 约束位置计算
  const constrainPosition = useCallback((x, y, currentScale) => {
    const imgWidth = imageSize.width * currentScale;
    const imgHeight = imageSize.height * currentScale;
    
    const minX = containerSize.width - imgWidth;
    const maxX = 0;
    const minY = containerSize.height - imgHeight;
    const maxY = 0;
    
    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY)
    };
  }, [imageSize, containerSize]);

  // 全局鼠标事件监听
  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  // 触发变化回调（增加容器尺寸用于落库换算）
  useEffect(() => {
    if (onChange) {
      onChange({
        scale,
        position,
        minScale,
        maxScale,
        refW: containerSize.width,
        refH: containerSize.height,
      });
    }
  }, [scale, position, onChange, minScale, maxScale, containerSize]);

  // 样式
  const imageStyle = {
    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
    transformOrigin: '0 0',
    cursor: dragging ? 'grabbing' : 'grab'
  };

  const src = imageUrl || (imageFile ? URL.createObjectURL(imageFile) : null);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-lg">
      {/* 缩放提示 */}
      <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-medium pointer-events-none">
        <span className="material-symbols-outlined align-middle" style={{ fontSize: '14px' }}>zoom_in_map</span>
        <span className="ml-1">滚轮缩放</span>
        <span className="mx-2">|</span>
        <span className="material-symbols-outlined align-middle" style={{ fontSize: '14px' }}>pan_tool</span>
        <span className="ml-1">拖动调整</span>
        <span className="mx-2">|</span>
        <span>{Math.round(scale * 100)}%</span>
      </div>
      
      {/* 图片容器：图片从左上角定位，约束后不会出现空白 */}
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden"
        onWheel={handleWheel}
      >
        {src && (
          <img
            ref={imageRef}
            src={src}
            alt="Preview"
            style={imageStyle}
            className="absolute left-0 top-0 max-w-none max-h-none select-none origin-top-left"
            draggable={false}
            onMouseDown={handleMouseDown}
          />
        )}
      </div>
    </div>
  );
}
