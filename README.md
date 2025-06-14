# Instagram Reel Caption Editor

A professional video editing application for creating Instagram Reels with custom text overlays and captions.

## Features

- **Multi-Video Support**: Upload and edit multiple videos simultaneously
- **Professional Text Overlays**: Add customizable text with fonts, colors, outlines, and animations
- **Real-time Preview**: See your changes instantly with video playback controls
- **Timeline Editor**: Precise timing control for text overlays
- **Batch Export**: Process multiple videos at once with server-side rendering
- **Professional Quality**: FFmpeg-powered video processing for production-ready output

## Setup Instructions

### Prerequisites

1. **Node.js** (v18 or higher)
2. **FFmpeg** - Required for video processing

#### Installing FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
1. Download FFmpeg from https://ffmpeg.org/download.html
2. Extract and add to your system PATH
3. Or use chocolatey: `choco install ffmpeg`

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install ffmpeg
```

### Installation

1. **Install client dependencies:**
```bash
npm install
```

2. **Install server dependencies:**
```bash
cd server
npm install
cd ..
```

3. **Start the development environment:**
```bash
npm run dev
```

This will start both the client (port 5173) and server (port 3001) simultaneously.

### Manual Server Setup (Alternative)

If you prefer to run the server separately:

```bash
# Terminal 1 - Start the server
cd server
npm run dev

# Terminal 2 - Start the client
npm run dev:client
```

## Usage

1. **Upload Videos**: Drag and drop or click to upload video files (MP4, MOV, AVI, WebM)
2. **Add Text Overlays**: Click "Add Text" for any video to create captions
3. **Customize Text**: Adjust font, size, color, position, and timing
4. **Preview**: Use the video player to see your changes in real-time
5. **Export**: Click "Export All Reels" to process all videos with their overlays

## Server Architecture

The application uses a Node.js/Express server with FFmpeg for professional video processing:

- **Upload Endpoint**: `/api/process-video` - Single video processing
- **Batch Endpoint**: `/api/process-batch` - Multiple video processing
- **Download Endpoint**: `/api/download/:filename` - Processed video downloads
- **Status Endpoint**: `/api/status` - Server health check

## File Structure

```
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── services/          # API services
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── server/                # Node.js backend
│   ├── index.js           # Main server file
│   ├── uploads/           # Temporary upload storage
│   ├── output/            # Processed video output
│   └── package.json       # Server dependencies
└── README.md
```

## Technical Details

### Video Processing Pipeline

1. **Upload**: Videos are uploaded via multipart form data
2. **Analysis**: FFmpeg analyzes video dimensions and metadata
3. **Text Rendering**: Text overlays are rendered using FFmpeg's drawtext filter
4. **Encoding**: Videos are re-encoded with H.264 for optimal compatibility
5. **Cleanup**: Temporary files are automatically cleaned up

### Text Overlay Features

- **Positioning**: Percentage-based positioning for responsive design
- **Timing**: Frame-accurate start/end times
- **Styling**: Font family, size, weight, color, and outline
- **Animations**: Fade in, slide up, and typewriter effects
- **Safe Areas**: Visual guides for Instagram's safe viewing areas

### Performance Optimizations

- **Concurrent Processing**: Multiple videos processed in parallel
- **Memory Management**: Automatic cleanup of temporary files
- **Progress Tracking**: Real-time processing progress updates
- **Error Handling**: Robust error handling with detailed feedback

## Troubleshooting

### Common Issues

1. **FFmpeg not found**: Ensure FFmpeg is installed and in your system PATH
2. **Server not starting**: Check if port 3001 is available
3. **Upload fails**: Verify file size is under 500MB limit
4. **Export fails**: Check server logs for detailed error messages

### Server Logs

Monitor server activity:
```bash
cd server
npm run dev
```

### Client Development

For client-only development:
```bash
npm run dev:client
```

## Production Deployment

For production deployment, you'll need to:

1. Build the client: `npm run build`
2. Set up a production server environment
3. Configure proper file storage (AWS S3, etc.)
4. Set up process monitoring (PM2, etc.)
5. Configure reverse proxy (Nginx, etc.)

## License

This project is licensed under the MIT License.