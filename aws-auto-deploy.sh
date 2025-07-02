#!/bin/bash

# ===================================
# AWS Auto Deploy Script - BebeClick
# Creates EC2 instance and deploys app
# ===================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
AWS_REGION="us-east-1"  # Free tier region
INSTANCE_TYPE="t2.micro"  # Free tier
AMI_ID="ami-0c02fb55956c7d316"  # Ubuntu 22.04 LTS
KEY_NAME="bebeclick-key"
SECURITY_GROUP="bebeclick-sg"
INSTANCE_NAME="bebeclick-server"

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

# Check if AWS CLI is installed
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        error "AWS CLI not found. Please install it first."
    fi
    
    log "AWS CLI found"
}

# Configure AWS credentials
configure_aws() {
    log "Configuring AWS credentials..."
    
    # Use the credentials from the file
    export AWS_ACCESS_KEY_ID="AKIA54HZXHAVNBH6KAR4"
    
    # Prompt for secret key
    echo -n "Enter AWS Secret Access Key: "
    read -s AWS_SECRET_ACCESS_KEY
    echo
    export AWS_SECRET_ACCESS_KEY
    
    export AWS_DEFAULT_REGION=$AWS_REGION
    
    # Test credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        error "Invalid AWS credentials"
    fi
    
    log "AWS credentials configured successfully"
}

# Create key pair
create_key_pair() {
    log "Creating SSH key pair..."
    
    if aws ec2 describe-key-pairs --key-names $KEY_NAME &> /dev/null; then
        warn "Key pair $KEY_NAME already exists"
    else
        aws ec2 create-key-pair --key-name $KEY_NAME --query 'KeyMaterial' --output text > ${KEY_NAME}.pem
        chmod 400 ${KEY_NAME}.pem
        log "Key pair created: ${KEY_NAME}.pem"
    fi
}

# Create security group
create_security_group() {
    log "Creating security group..."
    
    # Check if security group exists
    if aws ec2 describe-security-groups --group-names $SECURITY_GROUP &> /dev/null; then
        warn "Security group $SECURITY_GROUP already exists"
        SG_ID=$(aws ec2 describe-security-groups --group-names $SECURITY_GROUP --query 'SecurityGroups[0].GroupId' --output text)
    else
        # Create security group
        SG_ID=$(aws ec2 create-security-group \
            --group-name $SECURITY_GROUP \
            --description "BebeClick Security Group" \
            --query 'GroupId' --output text)
        
        # Add rules
        aws ec2 authorize-security-group-ingress \
            --group-id $SG_ID \
            --protocol tcp \
            --port 22 \
            --cidr 0.0.0.0/0
        
        aws ec2 authorize-security-group-ingress \
            --group-id $SG_ID \
            --protocol tcp \
            --port 80 \
            --cidr 0.0.0.0/0
        
        aws ec2 authorize-security-group-ingress \
            --group-id $SG_ID \
            --protocol tcp \
            --port 3001 \
            --cidr 0.0.0.0/0
        
        log "Security group created: $SG_ID"
    fi
}

# Create user data script
create_user_data() {
    cat > user-data.sh << 'EOF'
#!/bin/bash
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

# Update system
apt-get update -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Create app directory
mkdir -p /opt/bebeclick
cd /opt/bebeclick

# Download and extract app (placeholder - will be updated)
echo "App deployment placeholder"

# Set permissions
chown -R ubuntu:ubuntu /opt/bebeclick

echo "User data script completed" >> /var/log/user-data.log
EOF
}

# Launch EC2 instance
launch_instance() {
    log "Launching EC2 instance..."
    
    create_user_data
    
    INSTANCE_ID=$(aws ec2 run-instances \
        --image-id $AMI_ID \
        --count 1 \
        --instance-type $INSTANCE_TYPE \
        --key-name $KEY_NAME \
        --security-group-ids $SG_ID \
        --user-data file://user-data.sh \
        --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
        --query 'Instances[0].InstanceId' \
        --output text)
    
    log "Instance launched: $INSTANCE_ID"
    
    # Wait for instance to be running
    log "Waiting for instance to be running..."
    aws ec2 wait instance-running --instance-ids $INSTANCE_ID
    
    # Get public IP
    PUBLIC_IP=$(aws ec2 describe-instances \
        --instance-ids $INSTANCE_ID \
        --query 'Reservations[0].Instances[0].PublicIpAddress' \
        --output text)
    
    log "Instance is running at: $PUBLIC_IP"
    
    # Wait for SSH to be ready
    log "Waiting for SSH to be ready..."
    sleep 60
    
    # Test SSH connection
    for i in {1..10}; do
        if ssh -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no ubuntu@$PUBLIC_IP "echo 'SSH ready'" &> /dev/null; then
            log "SSH connection established"
            break
        fi
        warn "SSH not ready, retrying in 30 seconds... ($i/10)"
        sleep 30
    done
}

# Deploy application
deploy_app() {
    log "Deploying application..."
    
    # Upload deployment package
    scp -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no \
        bebeclick-aws-production.tar.gz ubuntu@$PUBLIC_IP:~/
    
    # Deploy on server
    ssh -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no ubuntu@$PUBLIC_IP << 'DEPLOY_SCRIPT'
        # Extract application
        tar -xzf bebeclick-aws-production.tar.gz
        
        # Move to app directory
        sudo mv bebeclick-aws-production/* /opt/bebeclick/
        sudo chown -R ubuntu:ubuntu /opt/bebeclick
        
        # Start application with PM2
        cd /opt/bebeclick
        pm2 start server.js --name bebeclick-app
        pm2 save
        pm2 startup systemd -u ubuntu --hp /home/ubuntu
        
        # Setup Nginx (optional)
        sudo apt-get install -y nginx
        
        # Create Nginx config
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
        
        # Enable site
        sudo ln -sf /etc/nginx/sites-available/bebeclick /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
        sudo nginx -t && sudo systemctl reload nginx
        
        echo "Deployment completed successfully!"
DEPLOY_SCRIPT
    
    log "Application deployed successfully!"
}

# Main execution
main() {
    log "Starting AWS Auto Deploy for BebeClick"
    
    check_aws_cli
    configure_aws
    create_key_pair
    create_security_group
    launch_instance
    deploy_app
    
    log "Deployment completed successfully!"
    info "Application URL: http://$PUBLIC_IP"
    info "SSH Access: ssh -i ${KEY_NAME}.pem ubuntu@$PUBLIC_IP"
    info "Health Check: curl http://$PUBLIC_IP/health"
    
    # Save deployment info
    cat > deployment-info.txt << EOF
BebeClick Deployment Information
================================
Date: $(date)
Instance ID: $INSTANCE_ID
Public IP: $PUBLIC_IP
SSH Key: ${KEY_NAME}.pem
Security Group: $SG_ID

Access Commands:
- SSH: ssh -i ${KEY_NAME}.pem ubuntu@$PUBLIC_IP
- Health: curl http://$PUBLIC_IP/health
- App: http://$PUBLIC_IP

Management Commands:
- Check status: ssh -i ${KEY_NAME}.pem ubuntu@$PUBLIC_IP "pm2 status"
- View logs: ssh -i ${KEY_NAME}.pem ubuntu@$PUBLIC_IP "pm2 logs"
- Restart app: ssh -i ${KEY_NAME}.pem ubuntu@$PUBLIC_IP "pm2 restart bebeclick-app"
EOF
    
    log "Deployment info saved to: deployment-info.txt"
}

# Run main function
main "$@"
