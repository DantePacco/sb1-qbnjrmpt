import express from 'express';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Create necessary directories
const uploadsDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');
const tempDir = path.join(__dirname, 'temp');

await fs.ensureDir(uploadsDir);
await fs.ensureDir(outputDir);
await fs.ensureDir(tempDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Utility function to create text overlay filter
const createTextFilter = (overlay, videoWidth, videoHeight) => {
  const x = Math.round((overlay.x / 100) * videoWidth);
  const y = Math.round((overlay.y / 100) * videoHeight);
  const fontSize = Math.round(overlay.fontSize * (videoWidth / 400)); // Scale font size
  
  // Escape special characters in text
  const escapedText = overlay.text.replace(/'/g, "\\'").replace(/:/g, "\\:");
  
  let filter = `drawtext=text='${escapedText}':x=${x}:y=${y}:fontsize=${fontSize}:fontcolor=${overlay.color}`;
  
  // Add outline if specified
  if (overlay.outlineWidth > 0) {
    filter += `:borderw=${overlay.outlineWidth}:bordercolor=${overlay.outlineColor}`;
  }
  
  // Add font family if available
  if (overlay.fontFamily && overlay.fontFamily !== 'Inter') {
    filter += `:fontfile=/System/Library/Fonts/${overlay.fontFamily}.ttf`;
  }
  
  // Add timing
  filter += `:enable='between(t,${overlay.startTime},${overlay.endTime})'`;
  
  return filter;
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server running',
    ffmpegAvailable: true,
    timestamp: new Date().toISOString()
  });
});

// Get processing status
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'Server running',
    ffmpegAvailable: true,
    timestamp: new Date().toISOString()
  });
});

// Process single video endpoint
app.post('/api/process-video', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const { textOverlays, videoName, maxDuration } = req.body;
    const overlays = JSON.parse(textOverlays || '[]');
    const durationLimit = maxDuration ? parseFloat(maxDuration) : null;
    
    const inputPath = req.file.path;
    const outputFilename = `processed-${videoName || 'video'}-${uuidv4()}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    // Get video dimensions
    const videoInfo = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata);
      });
    });

    const videoStream = videoInfo.streams.find(stream => stream.codec_type === 'video');
    const videoWidth = videoStream.width;
    const videoHeight = videoStream.height;

    // Create FFmpeg command
    let command = ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx264',
        '-preset medium',
        '-crf 23',
        '-c:a aac',
        '-b:a 128k',
        '-movflags +faststart'
      ]);

    // Apply duration limit if specified
    if (durationLimit && durationLimit > 0) {
      command = command.duration(durationLimit);
    }

    // Add text overlays
    if (overlays.length > 0) {
      const textFilters = overlays.map(overlay => 
        createTextFilter(overlay, videoWidth, videoHeight)
      );
      
      // Combine all text filters
      const filterComplex = textFilters.join(',');
      command = command.complexFilter(filterComplex);
    }

    // Process video
    await new Promise((resolve, reject) => {
      command
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg process started:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('Processing: ' + progress.percent + '% done');
        })
        .on('end', () => {
          console.log('Video processing completed');
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .run();
    });

    // Clean up input file
    await fs.remove(inputPath);

    res.json({
      success: true,
      filename: outputFilename,
      downloadUrl: `/api/download/${outputFilename}`
    });

  } catch (error) {
    console.error('Video processing error:', error);
    
    // Clean up files on error
    if (req.file) {
      await fs.remove(req.file.path).catch(() => {});
    }
    
    res.status(500).json({ 
      error: 'Video processing failed', 
      details: error.message 
    });
  }
});

// Batch process multiple videos
app.post('/api/process-batch', upload.array('videos', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No video files provided' });
    }

    const { videosData } = req.body;
    const videos = JSON.parse(videosData || '[]');
    
    const results = [];
    const errors = [];

    // Process each video
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const videoData = videos[i];
      
      try {
        const inputPath = file.path;
        const outputFilename = `processed-${videoData.name}-${uuidv4()}.mp4`;
        const outputPath = path.join(outputDir, outputFilename);

        // Get video dimensions
        const videoInfo = await new Promise((resolve, reject) => {
          ffmpeg.ffprobe(inputPath, (err, metadata) => {
            if (err) reject(err);
            else resolve(metadata);
          });
        });

        const videoStream = videoInfo.streams.find(stream => stream.codec_type === 'video');
        const videoWidth = videoStream.width;
        const videoHeight = videoStream.height;

        // Create FFmpeg command
        let command = ffmpeg(inputPath)
          .outputOptions([
            '-c:v libx264',
            '-preset medium',
            '-crf 23',
            '-c:a aac',
            '-b:a 128k',
            '-movflags +faststart'
          ]);

        // Apply duration limit if specified
        if (videoData.maxDuration && videoData.maxDuration > 0) {
          command = command.duration(videoData.maxDuration);
        }

        // Add text overlays
        if (videoData.textOverlays && videoData.textOverlays.length > 0) {
          const textFilters = videoData.textOverlays.map(overlay => 
            createTextFilter(overlay, videoWidth, videoHeight)
          );
          
          const filterComplex = textFilters.join(',');
          command = command.complexFilter(filterComplex);
        }

        // Process video
        await new Promise((resolve, reject) => {
          command
            .output(outputPath)
            .on('end', resolve)
            .on('error', reject)
            .run();
        });

        // Clean up input file
        await fs.remove(inputPath);

        results.push({
          originalName: videoData.name,
          filename: outputFilename,
          downloadUrl: `/api/download/${outputFilename}`,
          success: true
        });

      } catch (error) {
        console.error(`Error processing video ${videoData.name}:`, error);
        errors.push({
          originalName: videoData.name,
          error: error.message
        });
        
        // Clean up input file on error
        await fs.remove(file.path).catch(() => {});
      }
    }

    res.json({
      success: true,
      processed: results.length,
      total: req.files.length,
      results,
      errors
    });

  } catch (error) {
    console.error('Batch processing error:', error);
    
    // Clean up all uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        await fs.remove(file.path).catch(() => {});
      }
    }
    
    res.status(500).json({ 
      error: 'Batch processing failed', 
      details: error.message 
    });
  }
});

// Download processed video
app.get('/api/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(outputDir, filename);
    
    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Download failed' });
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Clean up old files (run every hour)
const cleanupOldFiles = async () => {
  try {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Clean output directory
    const outputFiles = await fs.readdir(outputDir);
    for (const file of outputFiles) {
      const filePath = path.join(outputDir, file);
      const stats = await fs.stat(filePath);
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.remove(filePath);
        console.log(`Cleaned up old file: ${file}`);
      }
    }

    // Clean uploads directory
    const uploadFiles = await fs.readdir(uploadsDir);
    for (const file of uploadFiles) {
      const filePath = path.join(uploadsDir, file);
      const stats = await fs.stat(filePath);
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.remove(filePath);
        console.log(`Cleaned up old upload: ${file}`);
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

// Run cleanup every hour
setInterval(cleanupOldFiles, 60 * 60 * 1000);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// For any other routes, return a simple message (this prevents the "Cannot GET /" error)
app.get('*', (req, res) => {
  res.json({ 
    message: 'Video Processing Server is running',
    status: 'OK',
    endpoints: {
      health: '/api/health',
      status: '/api/status',
      processVideo: '/api/process-video',
      processBatch: '/api/process-batch'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Video processing server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎬 Upload endpoint: http://localhost:${PORT}/api/process-video`);
  console.log(`📦 Batch endpoint: http://localhost:${PORT}/api/process-batch`);
  console.log('');
  console.log('Server is ready to process videos!');
});