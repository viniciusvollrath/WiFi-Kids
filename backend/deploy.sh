#!/bin/bash
# Hostinger Deployment Script for WiFi-Kids Backend
# Run this script to prepare files for deployment

echo "🚀 WiFi-Kids Backend - Hostinger Deployment Preparation"
echo "=================================================="

# Create deployment directory
DEPLOY_DIR="hostinger_deploy"
echo "📁 Creating deployment directory: $DEPLOY_DIR"
mkdir -p $DEPLOY_DIR

# Copy essential files
echo "📄 Copying application files..."
cp -r api/ $DEPLOY_DIR/
cp passenger_wsgi.py $DEPLOY_DIR/
cp app.py $DEPLOY_DIR/
cp requirements.txt $DEPLOY_DIR/
cp alembic.ini $DEPLOY_DIR/
cp -r alembic/ $DEPLOY_DIR/ 2>/dev/null || echo "⚠️  Alembic directory not found, skipping..."

# Copy environment template
echo "📄 Copying environment template..."
cp .env.production $DEPLOY_DIR/.env

# Create .htaccess for subdirectory deployment (if needed)
echo "📄 Creating .htaccess file..."
cat > $DEPLOY_DIR/.htaccess << 'EOF'
PassengerAppRoot /home/username/public_html/domain.com/api
PassengerBaseURI /api
PassengerAppType wsgi
PassengerStartupFile passenger_wsgi.py
EOF

# Create deployment info
echo "📄 Creating deployment info..."
cat > $DEPLOY_DIR/DEPLOYMENT_INFO.txt << EOF
WiFi-Kids Backend Deployment Package
Generated on: $(date)

Files included:
- passenger_wsgi.py (WSGI entry point for Hostinger)
- app.py (Alternative entry point)
- requirements.txt (Production dependencies)
- .env (Environment variables - EDIT THIS FILE!)
- api/ (FastAPI application)
- alembic.ini & alembic/ (Database migrations)
- .htaccess (Apache configuration)

Next steps:
1. Upload all files to your Hostinger hosting
2. Edit .env file with your actual values
3. Install dependencies: pip install -r requirements.txt --user  
4. Run migrations: alembic upgrade head
5. Configure Python app in Hostinger control panel

See DEPLOYMENT_HOSTINGER.md for detailed instructions.
EOF

# Create zip file for easy upload
echo "📦 Creating deployment package..."
cd $DEPLOY_DIR
zip -r ../wifikids-backend-hostinger.zip . -x "*.pyc" "*__pycache__*" "*.git*"
cd ..

echo "✅ Deployment package ready!"
echo ""
echo "📦 Files prepared in: $DEPLOY_DIR/"
echo "📦 Zip package created: wifikids-backend-hostinger.zip"
echo ""
echo "Next steps:"
echo "1. 📤 Upload the zip file to your Hostinger hosting"
echo "2. 🔧 Extract files in your domain directory"  
echo "3. ✏️  Edit .env file with your database and API credentials"
echo "4. 🐍 Configure Python App in Hostinger control panel"
echo ""
echo "📋 See DEPLOYMENT_HOSTINGER.md for detailed instructions"