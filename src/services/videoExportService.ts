const API_BASE_URL = 'http://localhost:3001/api';

export interface ExportResult {
  success: boolean;
  filename?: string;
  downloadUrl?: string;
  error?: string;
}

export interface BatchExportResult {
  success: boolean;
  processed: number;
  total: number;
  results: Array<{
    originalName: string;
    filename: string;
    downloadUrl: string;
    success: boolean;
  }>;
  errors: Array<{
    originalName: string;
    error: string;
  }>;
}

export class VideoExportService {
  static async exportSingleVideo(
    videoFile: File,
    textOverlays: any[],
    videoName: string,
    maxDuration?: number,
    onProgress?: (progress: number) => void
  ): Promise<ExportResult> {
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('textOverlays', JSON.stringify(textOverlays));
      formData.append('videoName', videoName);
      
      if (maxDuration && maxDuration < 300) {
        formData.append('maxDuration', maxDuration.toString());
      }

      const response = await fetch(`${API_BASE_URL}/process-video`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      };
    }
  }

  static async exportMultipleVideos(
    videos: Array<{
      file: File;
      name: string;
      textOverlays: any[];
      maxDuration?: number;
    }>,
    onProgress?: (progress: number) => void
  ): Promise<BatchExportResult> {
    try {
      const formData = new FormData();
      
      // Add video files
      videos.forEach((video, index) => {
        formData.append('videos', video.file);
      });

      // Add video data
      const videosData = videos.map(video => ({
        name: video.name,
        textOverlays: video.textOverlays,
        maxDuration: video.maxDuration
      }));
      formData.append('videosData', JSON.stringify(videosData));

      const response = await fetch(`${API_BASE_URL}/process-batch`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Batch export failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Batch export error:', error);
      return {
        success: false,
        processed: 0,
        total: videos.length,
        results: [],
        errors: videos.map(video => ({
          originalName: video.name,
          error: error instanceof Error ? error.message : 'Export failed'
        }))
      };
    }
  }

  static async downloadVideo(downloadUrl: string, filename: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}${downloadUrl}`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  static async checkServerStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/status`);
      return response.ok;
    } catch (error) {
      console.error('Server status check failed:', error);
      return false;
    }
  }
}