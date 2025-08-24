#!/bin/bash
# WiFi-Kids Backend Server Deployment Script
# Run this script on your server: bash server_deploy.sh

set -e  # Exit on any error

echo "🚀 WiFi-Kids Backend Server Deployment"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: System Information
log "Step 1: Checking system information..."
echo "OS Information:"
cat /etc/os-release
echo ""
echo "Python version:"
python3 --version || python --version
echo ""
echo "Current directory: $(pwd)"
echo "Available space:"
df -h

# Step 2: Install dependencies
log "Step 2: Installing system dependencies..."
if command -v apt-get &> /dev/null; then
    log "Detected Ubuntu/Debian system"
    apt-get update
    apt-get install -y python3 python3-pip python3-venv git curl wget nginx mysql-server
elif command -v yum &> /dev/null; then
    log "Detected CentOS/RHEL system"
    yum update -y
    yum install -y python3 python3-pip git curl wget nginx mysql-server
else
    warn "Unknown package manager. Please install manually: python3, pip3, git, nginx, mysql"
fi

# Step 3: Setup directories
log "Step 3: Setting up directories..."
PROJECT_DIR="/var/www/wifikids"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Step 4: Setup Python environment
log "Step 4: Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Step 5: Get code (placeholder - we'll need to upload files)
log "Step 5: Preparing for code upload..."
echo "Please upload your backend files to: $PROJECT_DIR"
echo "You can use: scp -r C:\\Users\\paulo\\WiFi-Kids\\backend\\* root@72.60.69.196:$PROJECT_DIR/"

# Create placeholder structure
mkdir -p api logs

# Step 6: Install Python dependencies (will run after files are uploaded)
cat > install_deps.sh << 'EOF'
#!/bin/bash
source /var/www/wifikids/venv/bin/activate
cd /var/www/wifikids
pip install --upgrade pip
pip install -r requirements.txt
EOF

chmod +x install_deps.sh

# Step 7: Database setup
log "Step 7: Setting up database..."
systemctl start mysql
systemctl enable mysql

# Secure MySQL installation
mysql -e "CREATE DATABASE IF NOT EXISTS wifikids_prod;"
mysql -e "CREATE USER IF NOT EXISTS 'wifikids'@'localhost' IDENTIFIED BY 'secure_password_2024';"
mysql -e "GRANT ALL PRIVILEGES ON wifikids_prod.* TO 'wifikids'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

log "Database created: wifikids_prod"
log "Database user: wifikids"
log "Database password: secure_password_2024"

# Step 8: Create environment file
log "Step 8: Creating environment configuration..."
cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=mysql+pymysql://wifikids:secure_password_2024@localhost/wifikids_prod

# OpenAI Configuration - YOU NEED TO EDIT THIS!
OPENAI_API_KEY=REPLACE_WITH_YOUR_ACTUAL_OPENAI_KEY
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.3
OPENAI_MAX_TOKENS=1000

# Session Settings
SESSION_TTL_SEC=1800
CHALLENGE_REQUIRED=true
CHALLENGE_ATTEMPTS=3

# CORS - Updated with your domain
CORS_ORIGINS=https://app.wifikids.fun,http://localhost:5174

# Production Settings
DEBUG=false
TESTING=false
DEFAULT_TIMEZONE=America/Sao_Paulo
ACCESS_WINDOWS=07:00-21:00

# Agent Configuration
AGENT_TYPE=langchain
AGENT_DEFAULT_PERSONA=tutor
AGENT_SUBJECTS=math,history,geography,english,physics
AGENT_FALLBACK_ENABLED=true
ROUTER_ENABLED=true
ROUTER_PREFER_LLM=openai
ROUTER_FALLBACK_TO_MOCK=false

# Validation Configuration
VALIDATION_ENABLE_PARTIAL_CREDIT=true
VALIDATION_CASE_SENSITIVE=false
VALIDATION_IGNORE_WHITESPACE=true
VALIDATION_DEFAULT_THRESHOLD=0.75
EOF

# Step 9: Nginx configuration
log "Step 9: Configuring Nginx..."
cat > /etc/nginx/sites-available/wifikids << 'EOF'
server {
    listen 80;
    server_name api.wifikids.fun;
    
    location / {
        proxy_pass http://127.0.0.1:8002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/wifikids /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
systemctl enable nginx

# Step 10: Create startup script
log "Step 10: Creating startup script..."
cat > start_app.sh << 'EOF'
#!/bin/bash
cd /var/www/wifikids
source venv/bin/activate
uvicorn api.main:app --host 0.0.0.0 --port 8002 --workers 4
EOF

chmod +x start_app.sh

# Step 11: Create systemd service
log "Step 11: Creating systemd service..."
cat > /etc/systemd/system/wifikids.service << 'EOF'
[Unit]
Description=WiFi-Kids FastAPI Application
After=network.target

[Service]
User=root
Group=root
WorkingDirectory=/var/www/wifikids
Environment=PATH=/var/www/wifikids/venv/bin
ExecStart=/var/www/wifikids/venv/bin/uvicorn api.main:app --host 0.0.0.0 --port 8002 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable wifikids

log "✅ Server setup completed!"
echo ""
echo "🎯 Next Steps:"
echo "1. Upload your backend files to: $PROJECT_DIR"
echo "2. Run: bash install_deps.sh"
echo "3. Edit .env file with your OpenAI API key"
echo "4. Run database migrations: source venv/bin/activate && alembic upgrade head"
echo "5. Start the application: systemctl start wifikids"
echo "6. Test: curl http://localhost:8002/ping"
echo ""
echo "📁 Project directory: $PROJECT_DIR"
echo "🗄️ Database: wifikids_prod (user: wifikids, pass: secure_password_2024)"
echo "🌐 Nginx config: /etc/nginx/sites-available/wifikids"
echo ""