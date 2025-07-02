# BebeClick Delivery Calculator - AWS Deployment

## Quick Start

1. Upload this package to your AWS EC2 instance
2. Extract: `tar -xzf bebeclick-aws-production.tar.gz`
3. Install Node.js 18+ if not installed
4. Start server: `node server.js`

## Production Deployment

1. `chmod +x deploy.sh`
2. `sudo ./deploy.sh`

## Server Details

- **Port**: 3001 (configurable via PORT env var)
- **Static Files**: ./public/
- **Health Check**: http://your-server:3001/health
- **Memory Usage**: ~50-100MB
- **CPU Usage**: Minimal

## Files Included

- `server.js` - Production server (CommonJS)
- `public/` - Optimized static files
- `package.json` - Minimal dependencies
- `deploy.sh` - Automated deployment script
- `README.md` - Complete deployment guide

## Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (default: production)

## Support

Check logs and monitor with:
- Health: `curl http://localhost:3001/health`
- Memory: Check server console output
- Errors: Server will log to console

Built on: 2025-07-01T00:30:54.836Z
Version: 1.0.0
