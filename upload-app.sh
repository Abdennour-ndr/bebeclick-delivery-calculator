#!/bin/bash

# BebeClick App Upload and Deployment Script
# Run this after creating EC2 instance manually

echo "🚀 BebeClick App Deployment Script"
echo "=================================="

# Check if required files exist
if [ ! -f "bebeclick-aws-production.zip" ]; then
    echo "❌ bebeclick-aws-production.zip not found!"
    echo "💡 Creating deployment package..."
    
    if [ -d "aws-deployment" ]; then
        zip -r bebeclick-aws-production.zip aws-deployment/*
        echo "✅ Package created"
    else
        echo "❌ aws-deployment folder not found!"
        exit 1
    fi
fi

# Get server details
echo ""
read -p "🌐 Enter your EC2 Public IP: " SERVER_IP
read -p "🔑 Enter your SSH key filename (e.g., bebeclick-key.pem): " KEY_FILE

# Validate inputs
if [ -z "$SERVER_IP" ] || [ -z "$KEY_FILE" ]; then
    echo "❌ Server IP and Key file are required!"
    exit 1
fi

if [ ! -f "$KEY_FILE" ]; then
    echo "❌ SSH key file $KEY_FILE not found!"
    echo "💡 Make sure you downloaded the .pem file from AWS"
    exit 1
fi

# Set correct permissions for SSH key
chmod 400 "$KEY_FILE"

echo ""
echo "📦 Uploading application..."

# Upload application
scp -i "$KEY_FILE" -o StrictHostKeyChecking=no bebeclick-aws-production.zip ubuntu@$SERVER_IP:~/

if [ $? -eq 0 ]; then
    echo "✅ Upload successful!"
else
    echo "❌ Upload failed!"
    exit 1
fi

echo ""
echo "🔧 Setting up server..."

# Connect and setup server
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no ubuntu@$SERVER_IP << 'EOF'
    echo "🔄 Updating system..."
    sudo apt update -y
    
    echo "📦 Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    echo "🔧 Installing PM2 and Nginx..."
    sudo npm install -g pm2
    sudo apt install -y nginx
    
    echo "📂 Extracting application..."
    unzip -o bebeclick-aws-production.zip
    
    echo "🚀 Starting application..."
    cd bebeclick-aws-production
    pm2 start server.js --name bebeclick-app
    pm2 save
    pm2 startup systemd -u ubuntu --hp /home/ubuntu
    
    echo "🌐 Setting up Nginx..."
    sudo tee /etc/nginx/sites-available/bebeclick << 'NGINX_CONF'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_CONF
    
    sudo ln -sf /etc/nginx/sites-available/bebeclick /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl reload nginx
    
    echo ""
    echo "✅ Deployment completed successfully!"
    echo "🌐 Your app is now available at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
    echo "🔍 Health check: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/health"
    
    echo ""
    echo "📊 Application status:"
    pm2 status
EOF

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================"
echo "🌐 Your app: http://$SERVER_IP"
echo "🔍 Health check: http://$SERVER_IP/health"
echo "🔧 SSH access: ssh -i $KEY_FILE ubuntu@$SERVER_IP"

echo ""
echo "📋 Management commands:"
echo "- Check status: ssh -i $KEY_FILE ubuntu@$SERVER_IP 'pm2 status'"
echo "- View logs: ssh -i $KEY_FILE ubuntu@$SERVER_IP 'pm2 logs'"
echo "- Restart app: ssh -i $KEY_FILE ubuntu@$SERVER_IP 'pm2 restart bebeclick-app'"
