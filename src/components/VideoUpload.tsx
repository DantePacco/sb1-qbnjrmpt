import React, { useCallback, useState } from 'react';
import { Upload, FileVideo, AlertCircle } from 'lucide-react';
import { VideoFile } from '../types';
import { getVideoDimensions, isVideoFile } from '../utils/videoUtils';

interface VideoUploadProps {
  onVideoUpload: (video: VideoFile) => void;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onVideoUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processVideoFiles = async (files: File[]) => {
    setIsProcessing(true);
    setError(null);

    try {
      for (const file of files) {
        if (!isVideoFile(file)) {
          throw new Error(`${file.name} is not a valid video file`);
        }

        if (file.size > 500 * 1024 * 1024) { // 500MB limit
          throw new Error(`${file.name} is too large. Please choose files under 500MB`);
        }

        const { width, height, duration } = await getVideoDimensions(file);
        
        const videoFile: VideoFile = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          file,
          url: URL.createObjectURL(file),
          duration,
          width,
          height,
          name: file.name,
          textOverlays: [] // Initialize with empty overlays array
        };

        onVideoUpload(videoFile);
        
        // Small delay between processing multiple files
        if (files.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process video files');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file => isVideoFile(file));
    if (files.length > 0) {
      await processVideoFiles(files);
    }
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processVideoFiles(Array.from(files));
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  return (
    <div className="bg-dark-700 rounded-xl p-6 border border-dark-600">
      <h3 className="text-lg font-medium text-white mb-4">Upload Videos</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${isDragging 
            ? 'border-purple-primary bg-purple-primary/10' 
            : 'border-dark-500 hover:border-purple-primary/50'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center w-16 h-16 bg-purple-primary/20 rounded-full mb-4">
            <Upload className="w-8 h-8 text-purple-primary" />
          </div>
          
          <h4 className="text-lg font-medium text-white mb-2">
            {isProcessing ? 'Processing videos...' : 'Drop your videos here'}
          </h4>
          
          <p className="text-gray-400 mb-4">
            {isProcessing 
              ? 'Please wait while we analyze your videos'
              : 'or click to browse your files'
            }
          </p>
          
          <div className="text-sm text-gray-500">
            <p>Supports: MP4, MOV, AVI, WebM</p>
            <p>Max size: 500MB per file</p>
            <p className="text-purple-primary font-medium">Multiple files supported</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoUpload;