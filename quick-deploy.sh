#!/bin/bash

# BebeClick Delivery Calculator - Quick Deploy Script
echo "🚀 Quick Deploy for BebeClick Delivery Calculator"

# Create deployment directory
mkdir -p deploy-package
cd deploy-package

# Copy necessary files
cp ../dist . -r
cp ../production-server.js server.js
cp ../package-production.json package.json

# Create simple start script
cat > start.sh << 'EOF'
#!/bin/bash
echo "Starting BebeClick Delivery Calculator..."
npm install --production
node server.js
EOF

chmod +x start.sh

# Create deployment archive
tar -czf ../bebeclick-deploy.tar.gz .

cd ..
rm -rf deploy-package

echo "✅ Deployment package created: bebeclick-deploy.tar.gz"
echo ""
echo "📋 Manual deployment instructions:"
echo "1. Upload bebeclick-deploy.tar.gz to your server"
echo "2. Extract: tar -xzf bebeclick-deploy.tar.gz"
echo "3. Run: ./start.sh"
echo ""
echo "🌐 Or use one of these free platforms:"
echo "- Railway.app"
echo "- Render.com" 
echo "- Fly.io"
echo "- Vercel (for static hosting)"
