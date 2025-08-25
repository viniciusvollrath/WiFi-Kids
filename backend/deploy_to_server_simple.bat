@echo off
REM WiFi-Kids Secure Server Deployment Script
REM This script will deploy to your server without exposing API keys

echo 🚀 WiFi-Kids Secure Server Deployment
echo ==========================================

set SERVER_IP=72.60.69.196
set SERVER_USER=root
set PROJECT_DIR=/var/www/wifikids

echo 📁 Step 1: Preparing deployment files locally...
if not exist hostinger_deploy call deploy.bat

echo.
echo 📤 Step 2: Uploading deployment script to server...
scp server_deploy.sh %SERVER_USER%@%SERVER_IP%:/tmp/

if %errorlevel% neq 0 (
    echo ❌ Failed to upload deployment script
    echo Make sure you can connect: ssh %SERVER_USER%@%SERVER_IP%
    pause
    exit /b 1
)

echo.
echo 🔧 Step 3: Running server setup (this may take 5-10 minutes)...
echo This will install: Python, MySQL, Nginx, and configure everything
echo.
ssh %SERVER_USER%@%SERVER_IP% "chmod +x /tmp/server_deploy.sh && bash /tmp/server_deploy.sh"

echo.
echo 📤 Step 4: Uploading your backend code...
scp -r hostinger_deploy/* %SERVER_USER%@%SERVER_IP%:%PROJECT_DIR%/

echo.
echo 🐍 Step 5: Installing Python dependencies...
ssh %SERVER_USER%@%SERVER_IP% "cd %PROJECT_DIR% && bash install_deps.sh"

echo.
echo 🔑 Step 6: IMPORTANT - Setting up your OpenAI API Key
echo.
echo I will now open a secure editor on the server for you to add your API key.
echo Look for the line: OPENAI_API_KEY=REPLACE_WITH_YOUR_ACTUAL_OPENAI_KEY
echo Replace it with: OPENAI_API_KEY=sk-your-actual-key-here
echo.
echo Press Ctrl+X, then Y, then Enter to save
echo Press any key when ready...
pause

ssh %SERVER_USER%@%SERVER_IP% "nano %PROJECT_DIR%/.env"

echo.
echo 🗄️ Step 7: Setting up database...
ssh %SERVER_USER%@%SERVER_IP% "cd %PROJECT_DIR% && source venv/bin/activate && alembic upgrade head"

echo.
echo 🚀 Step 8: Starting your WiFi-Kids API...
ssh %SERVER_USER%@%SERVER_IP% "systemctl start wifikids"

echo.
echo ✅ Step 9: Testing your deployment...
ssh %SERVER_USER%@%SERVER_IP% "curl -s http://localhost:8002/ping"

echo.
echo 🎉 Deployment Complete!
echo.
echo 🌐 Your API is now available at:
echo    http://%SERVER_IP%:8002/ping
echo    http://api.wifikids.fun/ping (if DNS is configured)
echo.
echo 📊 API Documentation:
echo    http://%SERVER_IP%:8002/docs
echo.
echo 🔧 Useful maintenance commands:
echo    Check logs: ssh %SERVER_USER%@%SERVER_IP% "journalctl -u wifikids -f"
echo    Restart: ssh %SERVER_USER%@%SERVER_IP% "systemctl restart wifikids"
echo    Status: ssh %SERVER_USER%@%SERVER_IP% "systemctl status wifikids"
echo.
echo ✅ Your frontend should now be able to connect to: http://%SERVER_IP%:8002
echo.
pause