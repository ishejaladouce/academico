#!/bin/bash

# AcademicO Deployment Script
# This script helps deploy the application to your servers

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Server information
WEB01_IP="3.84.27.55"
WEB02_IP="54.166.161.27"
LB01_IP="54.91.114.171"
USER="ubuntu"
APP_DIR="/var/www/academico"
LOCAL_DIR="."

echo -e "${GREEN}AcademicO Deployment Script${NC}"
echo "================================"
echo ""

# Function to deploy to a server
deploy_to_server() {
    local SERVER_IP=$1
    local SERVER_NAME=$2
    
    echo -e "${YELLOW}Deploying to ${SERVER_NAME} (${SERVER_IP})...${NC}"
    
    # Check if server is reachable
    if ! ping -c 1 -W 2 $SERVER_IP > /dev/null 2>&1; then
        echo -e "${RED}Error: Cannot reach ${SERVER_NAME} (${SERVER_IP})${NC}"
        return 1
    fi
    
    # Create directory on server
    echo "Creating directory on server..."
    ssh ${USER}@${SERVER_IP} "sudo mkdir -p ${APP_DIR} && sudo chown -R ${USER}:${USER} ${APP_DIR}"
    
    # Upload files
    echo "Uploading files..."
    rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'deploy.sh' \
        ${LOCAL_DIR}/ ${USER}@${SERVER_IP}:${APP_DIR}/
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Files uploaded successfully to ${SERVER_NAME}${NC}"
        
        # Set permissions
        echo "Setting permissions..."
        ssh ${USER}@${SERVER_IP} "sudo chown -R www-data:www-data ${APP_DIR} && sudo chmod -R 755 ${APP_DIR}"
        
        return 0
    else
        echo -e "${RED}Error uploading files to ${SERVER_NAME}${NC}"
        return 1
    fi
}

# Main menu
echo "Select deployment option:"
echo "1) Deploy to Web01 only"
echo "2) Deploy to Web02 only"
echo "3) Deploy to both Web01 and Web02"
echo "4) Test server connectivity"
echo "5) Exit"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        deploy_to_server $WEB01_IP "Web01"
        ;;
    2)
        deploy_to_server $WEB02_IP "Web02"
        ;;
    3)
        echo -e "${YELLOW}Deploying to both servers...${NC}"
        deploy_to_server $WEB01_IP "Web01"
        deploy_to_server $WEB02_IP "Web02"
        echo -e "${GREEN}Deployment complete!${NC}"
        echo ""
        echo "Next steps:"
        echo "1. SSH to each server and configure Nginx (see docs/deployment.md)"
        echo "2. Test the application on each server"
        echo "3. Configure load balancer on Lb01"
        ;;
    4)
        echo "Testing server connectivity..."
        for ip in $WEB01_IP $WEB02_IP $LB01_IP; do
            if ping -c 1 -W 2 $ip > /dev/null 2>&1; then
                echo -e "${GREEN}✓ ${ip} is reachable${NC}"
            else
                echo -e "${RED}✗ ${ip} is NOT reachable${NC}"
            fi
        done
        ;;
    5)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Done!${NC}"

