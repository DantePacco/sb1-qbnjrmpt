import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Clock } from 'lucide-react';
import { VideoFile, TextOverlay } from '../types';
import { formatTime } from '../utils/videoUtils';

interface VideoPreviewProps {
  video: VideoFile;
  textOverlays: TextOverlay[];
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  maxDuration: number;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  video,
  textOverlays,
  currentTime,
  onTimeUpdate,
  isPlaying,
  onPlayPause,
  maxDuration
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [volume, setVolume] = useState(1);
  
  const effectiveDuration = maxDuration < 300 ? Math.min(video.duration, maxDuration) : video.duration;
  const isVideoTrimmed = maxDuration < 300 && video.duration > maxDuration;
  
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      const currentVideoTime = videoElement.currentTime;
      
      // If we've reached the effective duration limit, pause and reset
      if (currentVideoTime >= effectiveDuration) {
        videoElement.pause();
        videoElement.currentTime = effectiveDuration;
        onTimeUpdate(effectiveDuration);
        return;
      }
      
      onTimeUpdate(currentVideoTime);
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    return () => videoElement.removeEventListener('timeupdate', handleTimeUpdate);
  }, [onTimeUpdate, effectiveDuration]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying && currentTime < effectiveDuration) {
      videoElement.play();
    } else {
      videoElement.pause();
    }
  }, [isPlaying, effectiveDuration, currentTime]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.volume = volume;
    }
  }, [volume]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      onTimeUpdate(time);
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(effectiveDuration, videoRef.current.currentTime + seconds));
      videoRef.current.currentTime = newTime;
      onTimeUpdate(newTime);
    }
  };

  const activeOverlays = textOverlays.filter(
    overlay => currentTime >= overlay.startTime && currentTime <= Math.min(overlay.endTime, effectiveDuration)
  );

  return (
    <div className="bg-dark-700 rounded-xl overflow-hidden border border-dark-600">
      {isVideoTrimmed && (
        <div className="bg-yellow-900/30 border-b border-yellow-600 px-4 py-2">
          <div className="flex items-center justify-center space-x-2 text-yellow-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              Video trimmed to {formatTime(effectiveDuration)} (from {formatTime(video.duration)})
            </span>
          </div>
        </div>
      )}
      
      <div className="relative bg-black aspect-reel max-w-sm mx-auto">
        <video
          ref={videoRef}
          src={video.url}
          className="w-full h-full object-cover"
          muted={false}
        />
        
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
        
        {/* Duration Limit Indicator */}
        {isVideoTrimmed && (
          <div className="absolute top-2 right-2 bg-yellow-600 text-black px-2 py-1 rounded text-xs font-medium">
            {maxDuration}s limit
          </div>
        )}
        
        {/* Text Overlays */}
        {activeOverlays.map((overlay) => (
          <div
            key={overlay.id}
            className="absolute pointer-events-none"
            style={{
              left: `${overlay.x}%`,
              top: `${overlay.y}%`,
              width: `${overlay.width}%`,
              height: `${overlay.height}%`,
              fontSize: `${overlay.fontSize}px`,
              fontWeight: overlay.fontWeight,
              color: overlay.color,
              opacity: overlay.opacity,
              fontFamily: overlay.fontFamily,
              textAlign: overlay.textAlign,
              display: 'flex',
              alignItems: 'center',
              justifyContent: overlay.textAlign === 'center' ? 'center' : overlay.textAlign === 'right' ? 'flex-end' : 'flex-start',
              padding: '8px',
              borderRadius: '4px',
              textShadow: overlay.outlineWidth > 0 ? `
                -${overlay.outlineWidth}px -${overlay.outlineWidth}px 0 ${overlay.outlineColor},
                ${overlay.outlineWidth}px -${overlay.outlineWidth}px 0 ${overlay.outlineColor},
                -${overlay.outlineWidth}px ${overlay.outlineWidth}px 0 ${overlay.outlineColor},
                ${overlay.outlineWidth}px ${overlay.outlineWidth}px 0 ${overlay.outlineColor}
              ` : 'none',
            }}
          >
            {overlay.text}
          </div>
        ))}
        
        {/* Safe Area Guidelines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-[15%] border-b border-yellow-400 opacity-30"></div>
          <div className="absolute inset-x-0 bottom-0 h-[15%] border-t border-yellow-400 opacity-30"></div>
          <div className="absolute inset-y-0 left-0 w-[15%] border-r border-yellow-400 opacity-30"></div>
          <div className="absolute inset-y-0 right-0 w-[15%] border-l border-yellow-400 opacity-30"></div>
        </div>
      </div>
      
      {/* Video Controls */}
      <div className="p-4 space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="0"
            max={effectiveDuration}
            value={Math.min(currentTime, effectiveDuration)}
            onChange={handleSeek}
            className="flex-1 h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer slider"
          />
          <span className="text-sm text-gray-400 min-w-0">
            {formatTime(Math.min(currentTime, effectiveDuration))} / {formatTime(effectiveDuration)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => skipTime(-10)}
              className="p-2 hover:bg-dark-600 rounded-lg transition-colors duration-200"
            >
              <SkipBack className="w-5 h-5 text-gray-300" />
            </button>
            
            <button
              onClick={onPlayPause}
              disabled={currentTime >= effectiveDuration}
              className="p-3 bg-purple-primary hover:bg-purple-600 disabled:bg-gray-600 rounded-lg transition-colors duration-200"
            >
              {isPlaying && currentTime < effectiveDuration ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white" />
              )}
            </button>
            
            <button
              onClick={() => skipTime(10)}
              className="p-2 hover:bg-dark-600 rounded-lg transition-colors duration-200"
            >
              <SkipForward className="w-5 h-5 text-gray-300" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-gray-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;