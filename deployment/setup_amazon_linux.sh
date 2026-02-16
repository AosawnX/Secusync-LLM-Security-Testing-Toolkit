#!/bin/bash

# SecuSync Amazon Linux Deployment Script
# Tested on Amazon Linux 2 / 2023
# Run as root: sudo bash setup_amazon_linux.sh

set -e

APP_USER="ec2-user"
APP_DIR="/home/$APP_USER/secusync"
REPO_URL="https://github.com/AosawnX/Secusync-LLM-Security-Testing-Toolkit.git"

echo ">>> Checking Swap Space..."
if [ ! -f /swapfile ]; then
    echo ">>> Creating 2GB Swap File for T2.micro..."
    dd if=/dev/zero of=/swapfile bs=128M count=16
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo "/swapfile swap swap defaults 0 0" >> /etc/fstab
fi

echo ">>> Updating System..."
yum update -y

echo ">>> Installing Dependencies (Python, Nginx, Git, GCC)..."
yum install -y python3-pip git nginx python3-devel gcc
# Amazon Linux 2023 uses dnf and has python3.
# Ensure 'tar' is installed for npm
yum install -y tar gzip

echo ">>> Installing Node.js 20..."
# Amazon Linux 2023 way
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs --setopt=nodesource-nodejs.module_hotfixes=1

echo ">>> Setting up Project Directory..."
mkdir -p $APP_DIR
chown -R $APP_USER:$APP_USER $APP_DIR

# Clone Logic
if [ -d "$APP_DIR/.git" ]; then
    echo ">>> Repo exists, pulling latest..."
    cd $APP_DIR
    sudo -u $APP_USER git pull origin main
else
    echo ">>> Cloning Repo..."
    # Note: Requires public repo or SSH keys set up. 
    if [ ! "$(ls -A $APP_DIR)" ]; then
         sudo -u $APP_USER git clone $REPO_URL $APP_DIR
    else
         echo ">>> Directory not empty, skipping clone. Assuming manual upload."
    fi
fi

cd $APP_DIR

echo ">>> Setting up Backend..."
cd backend
if [ ! -d "venv" ]; then
    sudo -u $APP_USER python3 -m venv venv
fi
sudo -u $APP_USER ./venv/bin/pip install -r requirements.txt

# Create .env if missing
if [ ! -f ".env" ]; then
    echo ">>> Creating dummy .env - PLEASE EDIT IT!"
    echo "JUDGE_API_KEY=replace_me" > .env
    echo "JUDGE_MODEL=llama-3.3-70b-versatile" >> .env
    echo "JUDGE_BASE_URL=https://api.groq.com/openai/v1" >> .env
    chown $APP_USER:$APP_USER .env
fi

echo ">>> Building Frontend..."
cd ../
sudo -u $APP_USER npm install
sudo -u $APP_USER npm run build

echo ">>> Configuring Nginx..."
# Generate Nginx Conf dynamically
cat > /etc/nginx/conf.d/secusync.conf <<EOF
server {
    listen 80;
    server_name _;
    root $APP_DIR/dist;
    index index.html;
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Amazon Linux Nginx default server might conflict
mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak || true
nginx -t
systemctl enable nginx
systemctl restart nginx

echo ">>> Setting up Backend Service..."
# Generate Systemd Service dynamically
cat > /etc/systemd/system/secusync-backend.service <<EOF
[Unit]
Description=SecuSync Backend API
After=network.target

[Service]
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR/backend
ExecStart=$APP_DIR/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable secusync-backend
systemctl restart secusync-backend

echo ">>> Deployment Complete!"
echo ">>> Public IP: $(curl -s ifconfig.me)"
echo ">>> Please edit backend/.env with real keys and restart service: sudo systemctl restart secusync-backend"
