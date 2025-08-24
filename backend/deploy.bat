@echo off
REM Hostinger Deployment Script for WiFi-Kids Backend (Windows)
REM Run this script to prepare files for deployment

echo 🚀 WiFi-Kids Backend - Hostinger Deployment Preparation
echo ==================================================

REM Create deployment directory
set DEPLOY_DIR=hostinger_deploy
echo 📁 Creating deployment directory: %DEPLOY_DIR%
if not exist %DEPLOY_DIR% mkdir %DEPLOY_DIR%

REM Copy essential files
echo 📄 Copying application files...
xcopy /E /I api %DEPLOY_DIR%\api
copy passenger_wsgi.py %DEPLOY_DIR%\
copy app.py %DEPLOY_DIR%\
copy requirements.txt %DEPLOY_DIR%\
copy alembic.ini %DEPLOY_DIR%\
if exist alembic xcopy /E /I alembic %DEPLOY_DIR%\alembic

REM Copy environment template
echo 📄 Copying environment template...
copy .env.production %DEPLOY_DIR%\.env

REM Create .htaccess for subdirectory deployment
echo 📄 Creating .htaccess file...
(
echo PassengerAppRoot /home/username/public_html/domain.com/api
echo PassengerBaseURI /api
echo PassengerAppType wsgi
echo PassengerStartupFile passenger_wsgi.py
) > %DEPLOY_DIR%\.htaccess

REM Create deployment info
echo 📄 Creating deployment info...
(
echo WiFi-Kids Backend Deployment Package
echo Generated on: %date% %time%
echo.
echo Files included:
echo - passenger_wsgi.py ^(WSGI entry point for Hostinger^)
echo - app.py ^(Alternative entry point^)
echo - requirements.txt ^(Production dependencies^)
echo - .env ^(Environment variables - EDIT THIS FILE!^)
echo - api/ ^(FastAPI application^)
echo - alembic.ini ^& alembic/ ^(Database migrations^)
echo - .htaccess ^(Apache configuration^)
echo.
echo Next steps:
echo 1. Upload all files to your Hostinger hosting
echo 2. Edit .env file with your actual values
echo 3. Install dependencies: pip install -r requirements.txt --user  
echo 4. Run migrations: alembic upgrade head
echo 5. Configure Python app in Hostinger control panel
echo.
echo See DEPLOYMENT_HOSTINGER.md for detailed instructions.
) > %DEPLOY_DIR%\DEPLOYMENT_INFO.txt

echo ✅ Deployment package ready!
echo.
echo 📦 Files prepared in: %DEPLOY_DIR%\
echo.
echo Next steps:
echo 1. 📤 Upload the contents of %DEPLOY_DIR% to your Hostinger hosting
echo 2. ✏️  Edit .env file with your database and API credentials
echo 3. 🐍 Configure Python App in Hostinger control panel
echo.
echo 📋 See DEPLOYMENT_HOSTINGER.md for detailed instructions

pause