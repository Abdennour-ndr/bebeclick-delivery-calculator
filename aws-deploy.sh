#!/bin/bash

# ===================================
# AWS EC2 Deployment Script
# BebeClick Delivery Calculator
# Optimized for t2.micro/t3.micro
# ===================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="bebeclick-calculator"
APP_DIR="/opt/$APP_NAME"
SERVICE_NAME="bebeclick"
NGINX_CONF="/etc/nginx/sites-available/$APP_NAME"
BACKUP_DIR="/opt/backups"
LOG_FILE="/var/log/$APP_NAME-deploy.log"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a $LOG_FILE
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
    fi
}

check_system() {
    log "Checking system requirements..."
    
    # Check Ubuntu version
    if ! grep -q "Ubuntu" /etc/os-release; then
        warn "This script is optimized for Ubuntu. Proceeding anyway..."
    fi
    
    # Check available memory
    MEMORY_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    MEMORY_MB=$((MEMORY_KB / 1024))
    
    if [ $MEMORY_MB -lt 900 ]; then
        warn "Low memory detected: ${MEMORY_MB}MB. Consider upgrading to t3.micro for better performance."
    else
        log "Memory check passed: ${MEMORY_MB}MB available"
    fi
    
    # Check disk space
    DISK_SPACE=$(df / | awk 'NR==2 {print $4}')
    DISK_SPACE_GB=$((DISK_SPACE / 1024 / 1024))
    
    if [ $DISK_SPACE_GB -lt 2 ]; then
        error "Insufficient disk space. At least 2GB free space required."
    else
        log "Disk space check passed: ${DISK_SPACE_GB}GB available"
    fi
}

install_dependencies() {
    log "Installing system dependencies..."
    
    # Update package list
    apt-get update -qq
    
    # Install essential packages
    apt-get install -y \
        curl \
        wget \
        git \
        nginx \
        supervisor \
        ufw \
        htop \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release
    
    # Install Node.js 18
    if ! command -v node &> /dev/null; then
        log "Installing Node.js 18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    fi
    
    # Install PM2 for process management
    if ! command -v pm2 &> /dev/null; then
        log "Installing PM2..."
        npm install -g pm2
    fi
    
    # Install Docker (optional, for containerized deployment)
    if ! command -v docker &> /dev/null; then
        log "Installing Docker..."
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        apt-get update -qq
        apt-get install -y docker-ce docker-ce-cli containerd.io
        systemctl enable docker
        systemctl start docker
    fi
    
    log "Dependencies installed successfully"
}

setup_firewall() {
    log "Configuring firewall..."
    
    # Reset UFW
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Enable firewall
    ufw --force enable
    
    log "Firewall configured successfully"
}

create_app_user() {
    log "Creating application user..."
    
    if ! id "$APP_NAME" &>/dev/null; then
        useradd -r -s /bin/false -d $APP_DIR $APP_NAME
        log "User $APP_NAME created"
    else
        log "User $APP_NAME already exists"
    fi
}

setup_directories() {
    log "Setting up directories..."
    
    # Create application directory
    mkdir -p $APP_DIR
    mkdir -p $BACKUP_DIR
    mkdir -p /var/log/$APP_NAME
    
    # Set permissions
    chown -R $APP_NAME:$APP_NAME $APP_DIR
    chown -R $APP_NAME:$APP_NAME /var/log/$APP_NAME
    
    log "Directories created successfully"
}

deploy_application() {
    log "Deploying application..."
    
    # Backup existing deployment
    if [ -d "$APP_DIR/current" ]; then
        log "Creating backup of current deployment..."
        BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
        cp -r $APP_DIR/current $BACKUP_DIR/$BACKUP_NAME
        log "Backup created: $BACKUP_DIR/$BACKUP_NAME"
    fi
    
    # Create new deployment directory
    DEPLOY_DIR="$APP_DIR/releases/$(date +%Y%m%d-%H%M%S)"
    mkdir -p $DEPLOY_DIR
    
    # Copy application files (assuming they're in current directory)
    if [ -f "bebeclick-production.tar.gz" ]; then
        log "Extracting production build..."
        tar -xzf bebeclick-production.tar.gz -C $DEPLOY_DIR
    elif [ -d "dist-optimized" ]; then
        log "Copying optimized build..."
        cp -r dist-optimized/* $DEPLOY_DIR/
        cp server.js $DEPLOY_DIR/
        cp -r src $DEPLOY_DIR/
        cp package*.json $DEPLOY_DIR/
    else
        error "No production build found. Run 'node optimize-build.js' first."
    fi
    
    # Install production dependencies
    cd $DEPLOY_DIR
    if [ -f "package.json" ]; then
        log "Installing production dependencies..."
        npm ci --only=production --silent
    fi
    
    # Update symlink
    rm -f $APP_DIR/current
    ln -sf $DEPLOY_DIR $APP_DIR/current
    
    # Set permissions
    chown -R $APP_NAME:$APP_NAME $APP_DIR
    
    log "Application deployed successfully"
}

configure_nginx() {
    log "Configuring Nginx..."
    
    # Create Nginx configuration
    cat > $NGINX_CONF << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Static files with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp)$ {
        root /opt/bebeclick-calculator/current;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
        try_files $uri =404;
    }
    
    # API routes
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Health check
    location /health {
        proxy_pass http://127.0.0.1:3001/health;
        access_log off;
    }
    
    # Frontend routes
    location / {
        root /opt/bebeclick-calculator/current;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
EOF
    
    # Enable site
    ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    nginx -t || error "Nginx configuration test failed"
    
    # Reload Nginx
    systemctl reload nginx
    
    log "Nginx configured successfully"
}

configure_pm2() {
    log "Configuring PM2..."
    
    # Create PM2 ecosystem file
    cat > $APP_DIR/current/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'bebeclick-backend',
    script: 'server.js',
    cwd: '/opt/bebeclick-calculator/current',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/bebeclick-calculator/error.log',
    out_file: '/var/log/bebeclick-calculator/out.log',
    log_file: '/var/log/bebeclick-calculator/combined.log',
    time: true,
    max_memory_restart: '500M',
    node_args: '--max-old-space-size=400'
  }]
};
EOF
    
    # Start application with PM2
    cd $APP_DIR/current
    sudo -u $APP_NAME pm2 start ecosystem.config.js
    sudo -u $APP_NAME pm2 save
    
    # Setup PM2 startup
    pm2 startup systemd -u $APP_NAME --hp $APP_DIR
    
    log "PM2 configured successfully"
}

setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create log rotation
    cat > /etc/logrotate.d/$APP_NAME << 'EOF'
/var/log/bebeclick-calculator/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 bebeclick-calculator bebeclick-calculator
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
    
    log "Monitoring setup completed"
}

# Main deployment process
main() {
    log "Starting AWS EC2 deployment for BebeClick Delivery Calculator"
    
    check_root
    check_system
    install_dependencies
    setup_firewall
    create_app_user
    setup_directories
    deploy_application
    configure_nginx
    configure_pm2
    setup_monitoring
    
    log "Deployment completed successfully!"
    info "Application is now running at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
    info "Monitor logs with: pm2 logs"
    info "Check status with: pm2 status"
    info "Restart with: pm2 restart bebeclick-backend"
}

# Run main function
main "$@"
