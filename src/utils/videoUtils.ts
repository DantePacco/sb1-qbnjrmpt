export const createVideoThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.onloadeddata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      video.currentTime = 1; // Get frame at 1 second
    };

    video.onseeked = () => {
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };

    video.onerror = reject;
    video.src = URL.createObjectURL(file);
  });
};

export const getVideoDimensions = (file: File): Promise<{ width: number; height: number; duration: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    
    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration
      });
    };

    video.onerror = reject;
    video.src = URL.createObjectURL(file);
  });
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const isVideoFile = (file: File): boolean => {
  return file.type.startsWith('video/');
};

export const calculateReelDimensions = (originalWidth: number, originalHeight: number) => {
  const reelAspectRatio = 9 / 16;
  const originalAspectRatio = originalWidth / originalHeight;

  if (originalAspectRatio > reelAspectRatio) {
    // Original is wider, fit by height
    return {
      width: originalHeight * reelAspectRatio,
      height: originalHeight,
      scale: 1,
      offsetX: (originalWidth - originalHeight * reelAspectRatio) / 2,
      offsetY: 0
    };
  } else {
    // Original is taller or same aspect ratio, fit by width
    return {
      width: originalWidth,
      height: originalWidth / reelAspectRatio,
      scale: 1,
      offsetX: 0,
      offsetY: (originalHeight - originalWidth / reelAspectRatio) / 2
    };
  }
};