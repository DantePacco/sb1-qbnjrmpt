export interface VideoFile {
  id: string;
  file: File;
  url: string;
  duration: number;
  width: number;
  height: number;
  name: string;
  textOverlays: TextOverlay[]; // Each video has its own overlays
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: string;
  color: string;
  outlineColor: string;
  outlineWidth: number;
  opacity: number;
  startTime: number;
  endTime: number;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
  animation: 'none' | 'fadeIn' | 'slideUp' | 'typewriter';
}

export interface Project {
  id: string;
  name: string;
  videos: VideoFile[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ExportSettings {
  quality: 'high' | 'medium' | 'low';
  format: 'mp4' | 'webm';
  bitrate: number;
}