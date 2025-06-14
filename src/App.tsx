import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import VideoUpload from './components/VideoUpload';
import VideoPreview from './components/VideoPreview';
import VideoList from './components/VideoList';
import Timeline from './components/Timeline';
import ExportModal from './components/ExportModal';
import { VideoFile, TextOverlay } from './types';
import { VideoExportService } from './services/videoExportService';

function App() {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportResults, setExportResults] = useState<any[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [maxDuration, setMaxDuration] = useState(300); // Default: no limit (5 minutes)

  const currentVideo = videos[currentVideoIndex] || null;

  const handleVideoUpload = useCallback((video: VideoFile) => {
    setVideos(prev => [...prev, video]);
    if (videos.length === 0) {
      setCurrentVideoIndex(0);
    }
  }, [videos.length]);

  const handleRemoveVideo = useCallback((videoId: string) => {
    const videoIndex = videos.findIndex(v => v.id === videoId);
    if (videoIndex === -1) return;

    // Clean up URL
    URL.revokeObjectURL(videos[videoIndex].url);
    
    setVideos(prev => prev.filter(v => v.id !== videoId));
    
    // Adjust current video index
    if (videoIndex === currentVideoIndex && videos.length > 1) {
      if (videoIndex === videos.length - 1) {
        setCurrentVideoIndex(videoIndex - 1);
      }
    } else if (videoIndex < currentVideoIndex) {
      setCurrentVideoIndex(prev => prev - 1);
    } else if (videos.length === 1) {
      setCurrentVideoIndex(0);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [videos, currentVideoIndex]);

  const handleSelectVideo = useCallback((videoId: string) => {
    const index = videos.findIndex(v => v.id === videoId);
    if (index !== -1) {
      setCurrentVideoIndex(index);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [videos]);

  const handleAddOverlay = useCallback((videoId: string, overlay: Omit<TextOverlay, 'id'>) => {
    const newOverlay: TextOverlay = {
      ...overlay,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    
    setVideos(prev => prev.map(video => 
      video.id === videoId 
        ? { ...video, textOverlays: [...video.textOverlays, newOverlay] }
        : video
    ));
  }, []);

  const handleUpdateOverlay = useCallback((videoId: string, overlayId: string, updates: Partial<TextOverlay>) => {
    setVideos(prev => prev.map(video => 
      video.id === videoId 
        ? {
            ...video,
            textOverlays: video.textOverlays.map(overlay => 
              overlay.id === overlayId ? { ...overlay, ...updates } : overlay
            )
          }
        : video
    ));
  }, []);

  const handleDeleteOverlay = useCallback((videoId: string, overlayId: string) => {
    setVideos(prev => prev.map(video => 
      video.id === videoId 
        ? { ...video, textOverlays: video.textOverlays.filter(overlay => overlay.id !== overlayId) }
        : video
    ));
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const handleMaxDurationChange = useCallback((duration: number) => {
    setMaxDuration(duration);
    
    // Update text overlays for all videos to respect the new duration limit
    if (duration < 300) {
      setVideos(prev => prev.map(video => ({
        ...video,
        textOverlays: video.textOverlays.map(overlay => ({
          ...overlay,
          startTime: Math.min(overlay.startTime, duration - 0.5),
          endTime: Math.min(overlay.endTime, duration)
        }))
      })));
    }
  }, []);

  const handleMultiExport = useCallback(async () => {
    if (videos.length === 0) return;
    
    // Check if server is available
    const serverAvailable = await VideoExportService.checkServerStatus();
    if (!serverAvailable) {
      alert('Video processing server is not available. Please make sure the server is running on port 3001.');
      return;
    }
    
    setIsExporting(true);
    setExportProgress(0);
    setExportResults([]);
    setShowExportModal(true);
    
    try {
      const videosToExport = videos.map(video => ({
        file: video.file,
        name: video.name,
        textOverlays: video.textOverlays,
        maxDuration: maxDuration < 300 ? maxDuration : undefined // Only pass if there's a limit
      }));

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 1000);

      const result = await VideoExportService.exportMultipleVideos(
        videosToExport,
        (progress) => setExportProgress(progress)
      );

      clearInterval(progressInterval);
      setExportProgress(100);

      // Format results for display
      const formattedResults = [
        ...result.results.map(r => ({
          originalName: r.originalName,
          filename: r.filename,
          downloadUrl: r.downloadUrl,
          success: r.success
        })),
        ...result.errors.map(e => ({
          originalName: e.originalName,
          success: false,
          error: e.error
        }))
      ];

      setExportResults(formattedResults);
      
    } catch (error) {
      console.error('Export failed:', error);
      setExportResults(videos.map(video => ({
        originalName: video.name,
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      })));
    } finally {
      setIsExporting(false);
    }
  }, [videos, maxDuration]);

  const handleSettings = useCallback(() => {
    alert('Settings panel would open here');
  }, []);

  // Get effective duration for current video (limited by maxDuration if set)
  const getEffectiveDuration = (video: VideoFile) => {
    return maxDuration < 300 ? Math.min(video.duration, maxDuration) : video.duration;
  };

  return (
    <div className="h-screen bg-dark-900 font-inter flex flex-col">
      <Header 
        onExport={handleMultiExport}
        onSettings={handleSettings}
        isExporting={isExporting}
        videoCount={videos.length}
        maxDuration={maxDuration}
        onMaxDurationChange={handleMaxDurationChange}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-80 p-6 space-y-6 overflow-y-auto">
          <VideoUpload
            onVideoUpload={handleVideoUpload}
          />
          
          {videos.length > 0 && (
            <VideoList
              videos={videos}
              currentVideoId={currentVideo?.id || ''}
              onSelectVideo={handleSelectVideo}
              onRemoveVideo={handleRemoveVideo}
              onAddOverlay={handleAddOverlay}
              onUpdateOverlay={handleUpdateOverlay}
              onDeleteOverlay={handleDeleteOverlay}
              currentTime={currentTime}
              maxDuration={maxDuration}
            />
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 flex flex-col space-y-6">
          {currentVideo ? (
            <>
              <div className="flex-1 flex items-center justify-center">
                <VideoPreview
                  video={currentVideo}
                  textOverlays={currentVideo.textOverlays}
                  currentTime={currentTime}
                  onTimeUpdate={handleTimeUpdate}
                  isPlaying={isPlaying}
                  onPlayPause={handlePlayPause}
                  maxDuration={maxDuration}
                />
              </div>
              
              <Timeline
                duration={getEffectiveDuration(currentVideo)}
                currentTime={currentTime}
                textOverlays={currentVideo.textOverlays}
                onSeek={handleTimeUpdate}
                onUpdateOverlay={(overlayId, updates) => handleUpdateOverlay(currentVideo.id, overlayId, updates)}
                maxDuration={maxDuration}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM5 8a1 1 0 000 2h8a1 1 0 100-2H5z"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">
                  Ready to Create Amazing Reels?
                </h2>
                <p className="text-gray-400 max-w-md">
                  Upload your videos to get started. Add multiple videos and we'll help you transform them into engaging Instagram Reels with professional captions.
                </p>
                {maxDuration < 300 && (
                  <div className="mt-4 p-3 bg-purple-primary/20 border border-purple-primary rounded-lg">
                    <p className="text-purple-primary text-sm">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Duration limit: {maxDuration} seconds
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        results={exportResults}
        isProcessing={isExporting}
        progress={exportProgress}
      />
    </div>
  );
}

export default App;