import React, { useState, useEffect } from 'react';
import { Play, Trash2, FileVideo, ChevronDown, ChevronRight, Type, Clock, Move, AlertTriangle } from 'lucide-react';
import { VideoFile, TextOverlay } from '../types';
import { formatTime } from '../utils/videoUtils';

interface VideoListProps {
  videos: VideoFile[];
  currentVideoId: string;
  onSelectVideo: (videoId: string) => void;
  onRemoveVideo: (videoId: string) => void;
  onAddOverlay: (videoId: string, overlay: Omit<TextOverlay, 'id'>) => void;
  onUpdateOverlay: (videoId: string, overlayId: string, updates: Partial<TextOverlay>) => void;
  onDeleteOverlay: (videoId: string, overlayId: string) => void;
  currentTime: number;
  maxDuration: number;
}

const VideoList: React.FC<VideoListProps> = ({
  videos,
  currentVideoId,
  onSelectVideo,
  onRemoveVideo,
  onAddOverlay,
  onUpdateOverlay,
  onDeleteOverlay,
  currentTime,
  maxDuration
}) => {
  const [expandedVideos, setExpandedVideos] = useState<Set<string>>(new Set());

  const toggleVideoExpanded = (videoId: string) => {
    const newExpanded = new Set(expandedVideos);
    const video = videos.find(v => v.id === videoId);
    
    if (newExpanded.has(videoId)) {
      newExpanded.delete(videoId);
    } else {
      newExpanded.add(videoId);
      
      // Auto-create text overlay if video doesn't have one
      if (video && video.textOverlays.length === 0) {
        const effectiveDuration = maxDuration < 300 ? Math.min(video.duration, maxDuration) : video.duration;
        const newOverlay: Omit<TextOverlay, 'id'> = {
          text: 'Enter your text here',
          x: 15, // Safe area margin
          y: 50,
          width: 70,
          height: 20,
          fontSize: 24,
          fontWeight: '600',
          color: '#ffffff',
          outlineColor: '#000000',
          outlineWidth: 2,
          opacity: 1,
          startTime: 0,
          endTime: Math.min(5, effectiveDuration),
          fontFamily: 'Inter',
          textAlign: 'center',
          animation: 'none'
        };
        
        onAddOverlay(videoId, newOverlay);
      }
    }
    setExpandedVideos(newExpanded);
  };

  const handleFormInteraction = (e: React.MouseEvent | React.FocusEvent) => {
    e.stopPropagation();
  };

  const fontOptions = [
    { value: 'Inter', label: 'Inter' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Times New Roman', label: 'Times New Roman' },
  ];

  const animationOptions = [
    { value: 'none', label: 'None' },
    { value: 'fadeIn', label: 'Fade In' },
    { value: 'slideUp', label: 'Slide Up' },
    { value: 'typewriter', label: 'Typewriter' },
  ];

  return (
    <div className="bg-dark-700 rounded-xl border border-dark-600">
      <div className="p-4 border-b border-dark-600">
        <h3 className="text-lg font-medium text-white flex items-center">
          <FileVideo className="w-5 h-5 mr-2" />
          Videos ({videos.length})
        </h3>
        {maxDuration < 300 && (
          <p className="text-xs text-purple-primary mt-1 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Limited to {maxDuration}s duration
          </p>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {videos.map((video, index) => {
          const isExpanded = expandedVideos.has(video.id);
          const isCurrentVideo = video.id === currentVideoId;
          const textOverlay = video.textOverlays[0]; // Get the first (and only) text overlay
          const effectiveDuration = maxDuration < 300 ? Math.min(video.duration, maxDuration) : video.duration;
          const isVideoTrimmed = maxDuration < 300 && video.duration > maxDuration;
          
          return (
            <div key={video.id} className="border-b border-dark-600 last:border-b-0">
              {/* Video Header */}
              <div
                className={`
                  flex items-center space-x-3 p-4 cursor-pointer transition-all duration-200
                  ${isCurrentVideo 
                    ? 'bg-purple-primary/20 border-l-4 border-l-purple-primary' 
                    : 'hover:bg-dark-600'
                  }
                `}
                onClick={() => onSelectVideo(video.id)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVideoExpanded(video.id);
                  }}
                  className="p-1 hover:bg-dark-500 rounded transition-colors duration-200"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                <div className="flex items-center justify-center w-10 h-10 bg-purple-primary/20 rounded-lg flex-shrink-0">
                  {isCurrentVideo ? (
                    <Play className="w-5 h-5 text-purple-primary" />
                  ) : (
                    <span className="text-sm font-medium text-purple-primary">{index + 1}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{video.name}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <span>{video.width} × {video.height}</span>
                    <span>•</span>
                    <span>{formatTime(effectiveDuration)}</span>
                    {isVideoTrimmed && (
                      <>
                        <span>•</span>
                        <span className="text-yellow-400 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Trimmed
                        </span>
                      </>
                    )}
                    {textOverlay && (
                      <>
                        <span>•</span>
                        <span className="text-purple-primary">Text added</span>
                      </>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveVideo(video.id);
                  }}
                  className="p-2 hover:bg-red-600/20 rounded-lg transition-colors duration-200 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>

              {/* Text Editor Panel */}
              {isExpanded && (
                <div className="p-4 bg-dark-800 border-t border-dark-600">
                  {isVideoTrimmed && (
                    <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg">
                      <div className="flex items-center space-x-2 text-yellow-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">Video will be trimmed</span>
                      </div>
                      <p className="text-xs text-yellow-300 mt-1">
                        Original: {formatTime(video.duration)} → Export: {formatTime(effectiveDuration)}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-white flex items-center">
                      <Type className="w-4 h-4 mr-2" />
                      Text Overlay
                    </h4>
                    {textOverlay && (
                      <button
                        onClick={() => onDeleteOverlay(video.id, textOverlay.id)}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 text-sm"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove Text</span>
                      </button>
                    )}
                  </div>

                  {textOverlay ? (
                    <div className="space-y-4" onClick={handleFormInteraction}>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Text Content</label>
                        <textarea
                          value={textOverlay.text}
                          onChange={(e) => onUpdateOverlay(video.id, textOverlay.id, { text: e.target.value })}
                          onClick={handleFormInteraction}
                          onFocus={handleFormInteraction}
                          className="w-full px-3 py-2 bg-dark-900 border border-dark-500 rounded-lg text-white focus:border-purple-primary focus:outline-none resize-none"
                          rows={3}
                          placeholder="Enter your caption text here..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Start Time (seconds)</label>
                          <input
                            type="number"
                            min="0"
                            max={effectiveDuration}
                            step="0.1"
                            value={textOverlay.startTime}
                            onChange={(e) => onUpdateOverlay(video.id, textOverlay.id, { startTime: parseFloat(e.target.value) })}
                            onClick={handleFormInteraction}
                            onFocus={handleFormInteraction}
                            className="w-full px-3 py-2 bg-dark-900 border border-dark-500 rounded-lg text-white focus:border-purple-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">End Time (seconds)</label>
                          <input
                            type="number"
                            min={textOverlay.startTime}
                            max={effectiveDuration}
                            step="0.1"
                            value={Math.min(textOverlay.endTime, effectiveDuration)}
                            onChange={(e) => onUpdateOverlay(video.id, textOverlay.id, { endTime: Math.min(parseFloat(e.target.value), effectiveDuration) })}
                            onClick={handleFormInteraction}
                            onFocus={handleFormInteraction}
                            className="w-full px-3 py-2 bg-dark-900 border border-dark-500 rounded-lg text-white focus:border-purple-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Font Size</label>
                          <div className="space-y-2">
                            <input
                              type="range"
                              min="12"
                              max="48"
                              value={textOverlay.fontSize}
                              onChange={(e) => onUpdateOverlay(video.id, textOverlay.id, { fontSize: parseInt(e.target.value) })}
                              onClick={handleFormInteraction}
                              onFocus={handleFormInteraction}
                              className="w-full h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <span className="text-sm text-gray-400">{textOverlay.fontSize}px</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Font Weight</label>
                          <select
                            value={textOverlay.fontWeight}
                            onChange={(e) => onUpdateOverlay(video.id, textOverlay.id, { fontWeight: e.target.value })}
                            onClick={handleFormInteraction}
                            onFocus={handleFormInteraction}
                            className="w-full px-3 py-2 bg-dark-900 border border-dark-500 rounded-lg text-white focus:border-purple-primary focus:outline-none"
                          >
                            <option value="300">Light</option>
                            <option value="400">Normal</option>
                            <option value="600">Semi Bold</option>
                            <option value="700">Bold</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Font Family</label>
                        <select
                          value={textOverlay.fontFamily}
                          onChange={(e) => onUpdateOverlay(video.id, textOverlay.id, { fontFamily: e.target.value })}
                          onClick={handleFormInteraction}
                          onFocus={handleFormInteraction}
                          className="w-full px-3 py-2 bg-dark-900 border border-dark-500 rounded-lg text-white focus:border-purple-primary focus:outline-none"
                        >
                          {fontOptions.map(font => (
                            <option key={font.value} value={font.value}>{font.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Text Color</label>
                          <input
                            type="color"
                            value={textOverlay.color}
                            onChange={(e) => onUpdateOverlay(video.id, textOverlay.id, { color: e.target.value })}
                            onClick={handleFormInteraction}
                            onFocus={handleFormInteraction}
                            className="w-full h-10 bg-dark-900 border border-dark-500 rounded-lg cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Outline Color</label>
                          <input
                            type="color"
                            value={textOverlay.outlineColor}
                            onChange={(e) => onUpdateOverlay(video.id, textOverlay.id, { outlineColor: e.target.value })}
                            onClick={handleFormInteraction}
                            onFocus={handleFormInteraction}
                            className="w-full h-10 bg-dark-900 border border-dark-500 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Outline Width</label>
                        <div className="space-y-2">
                          <input
                            type="range"
                            min="0"
                            max="8"
                            value={textOverlay.outlineWidth}
                            onChange={(e) => onUpdateOverlay(video.id, textOverlay.id, { outlineWidth: parseInt(e.target.value) })}
                            onClick={handleFormInteraction}
                            onFocus={handleFormInteraction}
                            className="w-full h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <span className="text-sm text-gray-400">{textOverlay.outlineWidth}px</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Text Position</label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Horizontal (%)</label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={textOverlay.x}
                              onChange={(e) => onUpdateOverlay(video.id, textOverlay.id, { x: parseInt(e.target.value) })}
                              onClick={handleFormInteraction}
                              onFocus={handleFormInteraction}
                              className="w-full h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <span className="text-xs text-gray-400">{textOverlay.x}%</span>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Vertical (%)</label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={textOverlay.y}
                              onChange={(e) => onUpdateOverlay(video.id, textOverlay.id, { y: parseInt(e.target.value) })}
                              onClick={handleFormInteraction}
                              onFocus={handleFormInteraction}
                              className="w-full h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <span className="text-xs text-gray-400">{textOverlay.y}%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Animation</label>
                        <select
                          value={textOverlay.animation}
                          onChange={(e) => onUpdateOverlay(video.id, textOverlay.id, { animation: e.target.value as any })}
                          onClick={handleFormInteraction}
                          onFocus={handleFormInteraction}
                          className="w-full px-3 py-2 bg-dark-900 border border-dark-500 rounded-lg text-white focus:border-purple-primary focus:outline-none"
                        >
                          {animationOptions.map(animation => (
                            <option key={animation.value} value={animation.value}>{animation.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="pt-2 border-t border-dark-600">
                        <div className="text-xs text-gray-400 flex items-center justify-between">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Duration: {(Math.min(textOverlay.endTime, effectiveDuration) - textOverlay.startTime).toFixed(1)} seconds
                          </span>
                          {textOverlay.endTime > effectiveDuration && (
                            <span className="text-yellow-400">
                              Trimmed to {effectiveDuration}s
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Type className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Text overlay will be created automatically</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VideoList;