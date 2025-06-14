import React from 'react';
import { TextOverlay } from '../types';
import { formatTime } from '../utils/videoUtils';
import { Clock } from 'lucide-react';

interface TimelineProps {
  duration: number;
  currentTime: number;
  textOverlays: TextOverlay[];
  onSeek: (time: number) => void;
  onUpdateOverlay: (id: string, updates: Partial<TextOverlay>) => void;
  maxDuration: number;
}

const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  textOverlays,
  onSeek,
  onUpdateOverlay,
  maxDuration
}) => {
  const timelineRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState<string | null>(null);
  const [dragType, setDragType] = React.useState<'start' | 'end' | 'move' | null>(null);

  const effectiveDuration = maxDuration < 300 ? Math.min(duration, maxDuration) : duration;
  const isVideoTrimmed = maxDuration < 300 && duration > maxDuration;

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || isDragging) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * effectiveDuration;
    
    onSeek(Math.max(0, Math.min(effectiveDuration, time)));
  };

  const handleOverlayMouseDown = (e: React.MouseEvent, overlayId: string, type: 'start' | 'end' | 'move') => {
    e.stopPropagation();
    setIsDragging(overlayId);
    setDragType(type);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !timelineRef.current || !dragType) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const time = percentage * effectiveDuration;

    const overlay = textOverlays.find(o => o.id === isDragging);
    if (!overlay) return;

    if (dragType === 'start') {
      onUpdateOverlay(isDragging, { 
        startTime: Math.max(0, Math.min(time, Math.min(overlay.endTime - 0.1, effectiveDuration - 0.1)))
      });
    } else if (dragType === 'end') {
      onUpdateOverlay(isDragging, { 
        endTime: Math.max(overlay.startTime + 0.1, Math.min(time, effectiveDuration))
      });
    } else if (dragType === 'move') {
      const overlayDuration = overlay.endTime - overlay.startTime;
      const newStartTime = Math.max(0, Math.min(time, effectiveDuration - overlayDuration));
      onUpdateOverlay(isDragging, {
        startTime: newStartTime,
        endTime: Math.min(newStartTime + overlayDuration, effectiveDuration)
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
    setDragType(null);
  };

  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && timelineRef.current && dragType) {
        handleMouseMove(e as any);
      }
    };

    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragType]);

  return (
    <div className="bg-dark-700 rounded-xl border border-dark-600 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white flex items-center">
          Timeline
          {isVideoTrimmed && (
            <span className="ml-2 text-xs bg-yellow-600 text-black px-2 py-1 rounded">
              Trimmed to {maxDuration}s
            </span>
          )}
        </h3>
        <div className="text-sm text-gray-400 flex items-center space-x-2">
          <span>{formatTime(Math.min(currentTime, effectiveDuration))} / {formatTime(effectiveDuration)}</span>
          {isVideoTrimmed && (
            <span className="text-yellow-400 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Original: {formatTime(duration)}
            </span>
          )}
        </div>
      </div>

      <div 
        ref={timelineRef}
        className="relative h-16 bg-dark-800 rounded-lg cursor-pointer select-none"
        onClick={handleTimelineClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Time markers */}
        <div className="absolute inset-x-0 top-0 h-4 flex items-center">
          {Array.from({ length: Math.floor(effectiveDuration / 5) + 1 }, (_, i) => i * 5)
            .filter(time => time <= effectiveDuration)
            .map(time => (
            <div
              key={time}
              className="absolute transform -translate-x-1/2"
              style={{ left: `${(time / effectiveDuration) * 100}%` }}
            >
              <div className="w-px h-2 bg-gray-500"></div>
              <div className="text-xs text-gray-400 mt-1">{formatTime(time)}</div>
            </div>
          ))}
        </div>

        {/* Duration limit indicator */}
        {isVideoTrimmed && (
          <div className="absolute inset-y-0 right-0 w-1 bg-yellow-600 opacity-50 rounded-r-lg">
            <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 text-xs text-yellow-400 whitespace-nowrap">
              Trim point
            </div>
          </div>
        )}

        {/* Text overlay blocks */}
        <div className="absolute inset-x-0 bottom-0 h-8">
          {textOverlays.map((overlay, index) => {
            const left = (overlay.startTime / effectiveDuration) * 100;
            const overlayEndTime = Math.min(overlay.endTime, effectiveDuration);
            const width = ((overlayEndTime - overlay.startTime) / effectiveDuration) * 100;
            const isTrimmed = overlay.endTime > effectiveDuration;
            
            return (
              <div
                key={overlay.id}
                className={`
                  absolute h-6 border rounded cursor-move
                  ${isDragging === overlay.id ? 'z-10' : ''}
                  ${isTrimmed 
                    ? 'bg-yellow-600/80 border-yellow-600' 
                    : 'bg-purple-primary/80 border-purple-primary'
                  }
                `}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  bottom: `${index * 7}px`,
                }}
                onMouseDown={(e) => handleOverlayMouseDown(e, overlay.id, 'move')}
              >
                {/* Start handle */}
                <div
                  className={`
                    absolute left-0 top-0 w-2 h-full cursor-w-resize rounded-l
                    ${isTrimmed ? 'bg-yellow-600' : 'bg-purple-primary'}
                  `}
                  onMouseDown={(e) => handleOverlayMouseDown(e, overlay.id, 'start')}
                />
                
                {/* End handle */}
                <div
                  className={`
                    absolute right-0 top-0 w-2 h-full cursor-e-resize rounded-r
                    ${isTrimmed ? 'bg-yellow-600' : 'bg-purple-primary'}
                  `}
                  onMouseDown={(e) => handleOverlayMouseDown(e, overlay.id, 'end')}
                />
                
                {/* Overlay content */}
                <div className="px-2 h-full flex items-center">
                  <span className="text-xs text-white truncate">
                    {overlay.text.substring(0, 15)}...
                    {isTrimmed && ' (trimmed)'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
          style={{ left: `${(Math.min(currentTime, effectiveDuration) / effectiveDuration) * 100}%` }}
        >
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;