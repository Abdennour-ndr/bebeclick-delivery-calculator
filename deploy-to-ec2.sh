#!/bin/bash

# BebeClick Delivery Calculator - AWS EC2 Deployment Script
echo "🚀 Starting deployment to AWS EC2..."

# Variables
APP_NAME="bebeclick-delivery-calculator"
EC2_USER="ubuntu"
EC2_HOST="ec2-3-83-245-139.compute-1.amazonaws.com"
REMOTE_DIR="/home/ubuntu/bebeclick-delivery-calculator"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📦 Building application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"

echo -e "${YELLOW}📤 Uploading files to EC2...${NC}"

# Create deployment package
echo "Creating deployment package..."
tar -czf deployment.tar.gz \
    dist/ \
    production-server.js \
    server-package.json \
    --exclude=node_modules \
    --exclude=.git

# Upload to EC2
echo "Uploading to EC2..."
scp -i ~/.ssh/bebeclick-key.pem deployment.tar.gz ${EC2_USER}@${EC2_HOST}:/tmp/

# Deploy on EC2
echo -e "${YELLOW}🔧 Deploying on EC2...${NC}"
ssh -i ~/.ssh/bebeclick-key.pem ${EC2_USER}@${EC2_HOST} << 'EOF'
    # Stop existing application
    sudo pkill -f "node.*server.js" || true
    
    # Create app directory
    sudo mkdir -p /home/ubuntu/bebeclick-delivery-calculator
    cd /home/ubuntu/bebeclick-delivery-calculator
    
    # Extract new files
    sudo tar -xzf /tmp/deployment.tar.gz
    
    # Install dependencies
    sudo cp server-package.json package.json
    sudo npm install --production
    
    # Set permissions
    sudo chown -R ubuntu:ubuntu /home/ubuntu/bebeclick-delivery-calculator
    
    # Start application with PM2
    npm install -g pm2
    pm2 stop bebeclick-delivery-calculator || true
    pm2 delete bebeclick-delivery-calculator || true
    pm2 start production-server.js --name bebeclick-delivery-calculator
    pm2 save
    pm2 startup
    
    # Clean up
    rm /tmp/deployment.tar.gz
    
    echo "✅ Deployment completed!"
    echo "🌐 Application is running on: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
EOF

# Clean up local files
rm deployment.tar.gz

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your application should be available at: http://ec2-3-83-245-139.compute-1.amazonaws.com:3000${NC}"
