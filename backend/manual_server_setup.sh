#!/bin/bash
# Manual WiFi-Kids Server Setup Script
# Run this on the server step by step

echo "🔧 Manual WiFi-Kids Server Setup"
echo "================================="

# Step 1: Create project directory
echo "📁 Creating project directory..."
mkdir -p /var/www/wifikids
cd /var/www/wifikids

# Step 2: Check Python
echo "🐍 Checking Python installation..."
python3 --version
pip3 --version

# Step 3: Create virtual environment
echo "🏗️ Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Step 4: Install basic dependencies
echo "📦 Installing basic Python packages..."
pip install --upgrade pip
pip install fastapi uvicorn sqlalchemy alembic python-dotenv

# Step 5: Create basic structure
echo "📂 Creating directory structure..."
mkdir -p api logs

# Step 6: Set up database (MySQL)
echo "🗄️ Setting up MySQL database..."
# Check if MySQL is running
systemctl status mysql || systemctl status mysqld

echo ""
echo "✅ Manual setup completed!"
echo "📁 Project directory: /var/www/wifikids"
echo "🐍 Virtual environment: source /var/www/wifikids/venv/bin/activate"
echo ""
echo "Next: Upload your backend files to /var/www/wifikids/"