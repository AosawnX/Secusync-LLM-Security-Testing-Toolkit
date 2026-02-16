#!/bin/bash

# SecuSync AWS EC2 Deployment Script
# Tested on Ubuntu 24.04 LTS
# Run as root: sudo bash setup_ec2.sh

set -e

APP_DIR="/home/ubuntu/secusync"
REPO_URL="https://github.com/AosawnX/Secusync-LLM-Security-Testing-Toolkit.git"

echo ">>> Updating System..."
apt update && apt upgrade -y

echo ">>> Installing Dependencies (Python, Node, Nginx, Git)..."
apt install -y python3-pip python3-venv git nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo ">>> Setting up Project Directory..."
mkdir -p $APP_DIR
chown -R ubuntu:ubuntu $APP_DIR

# Clone Logic
if [ -d "$APP_DIR/.git" ]; then
    echo ">>> Repo exists, pulling latest..."
    cd $APP_DIR
    sudo -u ubuntu git pull origin main
else
    echo ">>> Cloning Repo..."
    # Note: Requires public repo or SSH keys set up. 
    # If private, user must set up keys first or clone manually.
    if [ ! "$(ls -A $APP_DIR)" ]; then
         sudo -u ubuntu git clone $REPO_URL $APP_DIR
    else
         echo ">>> Directory not empty, skipping clone. Assuming manual upload."
    fi
fi

cd $APP_DIR

echo ">>> Setting up Backend..."
cd backend
if [ ! -d "venv" ]; then
    sudo -u ubuntu python3 -m venv venv
fi
sudo -u ubuntu ./venv/bin/pip install -r requirements.txt

# Create .env if missing (Template)
if [ ! -f ".env" ]; then
    echo ">>> Creating dummy .env - PLEASE EDIT IT!"
    echo "JUDGE_API_KEY=replace_me" > .env
    echo "JUDGE_MODEL=llama-3.3-70b-versatile" >> .env
    echo "JUDGE_BASE_URL=https://api.groq.com/openai/v1" >> .env
    chown ubuntu:ubuntu .env
fi

echo ">>> Building Frontend..."
cd ../
sudo -u ubuntu npm install
sudo -u ubuntu npm run build

echo ">>> Configuring Nginx..."
cp deployment/nginx.conf /etc/nginx/sites-available/secusync
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/secusync /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

echo ">>> Setting up Backend Service..."
cp deployment/secusync-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable secusync-backend
systemctl restart secusync-backend

echo ">>> Deployment Complete!"
echo ">>> Public IP: $(curl -s ifconfig.me)"
echo ">>> Please edit backend/.env with real keys and restart service: systemctl restart secusync-backend"
