# Backend Deployment Guide

## Option 1: Railway (Recommended)

Railway provides easy deployment with FFmpeg support and a generous free tier.

### Steps:

1. **Create Railway Account**: Go to [railway.app](https://railway.app) and sign up
2. **Connect GitHub**: Link your GitHub account
3. **Deploy from GitHub**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Set the root directory to `/server`
4. **Environment Variables**: Railway will auto-detect the Node.js app
5. **Custom Domain**: Railway provides a free subdomain

### Configuration:
- The `nixpacks.toml` file ensures FFmpeg is installed
- The `railway.json` configures the deployment
- Health checks are automatically configured

---

## Option 2: Render

Render offers free hosting with automatic builds.

### Steps:

1. **Create Render Account**: Go to [render.com](https://render.com)
2. **New Web Service**:
   - Connect your GitHub repository
   - Set root directory to `server`
   - Build command: `npm install`
   - Start command: `npm start`
3. **Environment Variables**: 
   - `NODE_ENV=production`
   - `PORT=3001` (Render will override this)

### Dockerfile for Render:
```dockerfile
FROM node:18-alpine
RUN apk add --no-cache ffmpeg
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
RUN mkdir -p uploads output temp
EXPOSE 3001
CMD ["npm", "start"]
```

---

## Option 3: Heroku

Heroku requires a buildpack for FFmpeg but is reliable.

### Steps:

1. **Install Heroku CLI**
2. **Create Heroku App**:
   ```bash
   cd server
   heroku create your-app-name
   ```
3. **Add FFmpeg Buildpack**:
   ```bash
   heroku buildpacks:add --index 1 https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git
   heroku buildpacks:add --index 2 heroku/nodejs
   ```
4. **Deploy**:
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

---

## Option 4: DigitalOcean App Platform

DigitalOcean provides a simple deployment platform.

### Steps:

1. **Create DigitalOcean Account**
2. **Create App**:
   - Connect GitHub repository
   - Set source directory to `server`
   - Auto-detect Node.js
3. **Configure**:
   - Build command: `npm install`
   - Run command: `npm start`

---

## Option 5: VPS (Advanced)

For full control, deploy to a VPS like DigitalOcean Droplet, Linode, or AWS EC2.

### Requirements:
- Ubuntu/Debian server
- Node.js 18+
- FFmpeg
- PM2 for process management
- Nginx for reverse proxy

### Setup Script:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install FFmpeg
sudo apt install ffmpeg -y

# Install PM2
sudo npm install -g pm2

# Clone and setup your app
git clone your-repo
cd your-repo/server
npm install --only=production

# Start with PM2
pm2 start index.js --name "video-processor"
pm2 startup
pm2 save

# Setup Nginx (optional)
sudo apt install nginx -y
# Configure reverse proxy
```

---

## Updating Frontend for Production

After deploying your backend, update the frontend API URL:

```typescript
// src/services/videoExportService.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.railway.app/api'  // Replace with your actual URL
  : 'http://localhost:3001/api';
```

Then redeploy your frontend to Netlify.

---

## Recommended Approach

1. **Start with Railway** - Easiest setup, free tier, FFmpeg included
2. **If you need more control** - Use DigitalOcean App Platform
3. **For production at scale** - Consider a VPS with proper monitoring

Railway is the best choice for getting started quickly with minimal configuration.