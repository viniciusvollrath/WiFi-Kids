# Hostinger Deployment Guide for WiFi-Kids Backend

## Prerequisites

### Hostinger Plan Requirements
- **Premium or Business hosting plan** (shared hosting with Python support)
- **SSH Access** (for advanced setup)
- **Database**: MySQL or PostgreSQL 
- **Python 3.11+** support
- **OpenAI API Key** (required for AI functionality)

### Check Your Hostinger Panel
1. Login to Hostinger control panel
2. Go to **Advanced → Python App**
3. Verify Python 3.11+ is available
4. Check if you have database access (MySQL/PostgreSQL)

---

## Step-by-Step Deployment

### 1. Prepare Your Files
Upload these files to your Hostinger account:

**Required files to upload:**
```
backend/
├── passenger_wsgi.py          # WSGI entry point for Hostinger
├── app.py                     # Alternative entry point
├── requirements.txt           # Production dependencies
├── .env.production           # Environment template
├── api/                      # Your FastAPI application
├── alembic.ini              # Database migrations
└── alembic/                 # Migration files
```

### 2. Database Setup

#### Option A: MySQL (Recommended for Hostinger)
1. In Hostinger panel, go to **Databases → MySQL Databases**
2. Create a new database: `wifikids_prod`
3. Create a database user with full privileges
4. Note your connection details:
   - Host: `localhost` (usually)
   - Database: `wifikids_prod`
   - Username: `your_username`
   - Password: `your_password`

#### Option B: PostgreSQL (if available)
1. Go to **Databases → PostgreSQL**
2. Create database and user
3. Note connection details

### 3. Environment Configuration

1. **Copy `.env.production` to `.env`**
2. **Edit `.env` with your actual values:**

```env
# Database - MySQL example
DATABASE_URL=mysql+pymysql://your_username:your_password@localhost/wifikids_prod

# OpenAI (REQUIRED)
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini

# CORS - Add your frontend domain
CORS_ORIGINS=https://your-frontend-domain.com

# Other settings (adjust as needed)
SESSION_TTL_SEC=1800
CHALLENGE_REQUIRED=true
AGENT_TYPE=langchain
DEBUG=false
```

### 4. Upload Files to Hostinger

#### Via File Manager (Easy):
1. Go to **Files → File Manager**
2. Navigate to your domain's folder (usually `public_html/yourdomain.com/`)
3. Create a subfolder: `api/` or `backend/`
4. Upload all backend files to this folder

#### Via SSH (Advanced):
```bash
# Connect to your Hostinger server
ssh your_username@your_server_ip

# Navigate to your domain folder
cd public_html/yourdomain.com/

# Create backend directory
mkdir api
cd api

# Upload files (you can use scp, git clone, or file manager)
```

### 5. Install Dependencies

If you have SSH access:
```bash
# Navigate to your backend directory
cd /path/to/your/backend

# Install dependencies
pip install -r requirements.txt --user

# Or if pip3 is required
pip3 install -r requirements.txt --user
```

If you don't have SSH:
- Use Hostinger's Python App feature in the control panel
- Upload `requirements.txt` and use the panel to install dependencies

### 6. Database Migration

Run database migrations:
```bash
# Via SSH
cd /path/to/your/backend
alembic upgrade head

# Or create a script to run via cron/panel
python -c "from alembic import command; from alembic.config import Config; cfg = Config('alembic.ini'); command.upgrade(cfg, 'head')"
```

### 7. Configure Python App in Hostinger Panel

1. Go to **Advanced → Python App**
2. **Create New Python App**:
   - **Python Version**: 3.11 (or latest available)
   - **Application Root**: `/public_html/yourdomain.com/api/`
   - **Application URL**: `api.yourdomain.com` or `yourdomain.com/api`
   - **Application Startup File**: `passenger_wsgi.py`
   - **Application Entry Point**: `application`

3. **Add Environment Variables** in the panel:
   ```
   OPENAI_API_KEY=your_actual_key
   DATABASE_URL=mysql+pymysql://user:pass@localhost/db
   CORS_ORIGINS=https://your-frontend.com
   ```

### 8. Test Your Deployment

Visit your API URL:
- `https://api.yourdomain.com/ping` should return `{"message": "pong"}`
- `https://api.yourdomain.com/docs` should show FastAPI documentation

---

## Troubleshooting

### Common Issues

#### 1. "Module not found" errors
```bash
# Check Python path
python -c "import sys; print(sys.path)"

# Install missing packages
pip install --user missing_package_name
```

#### 2. Database connection errors
- Verify database credentials in `.env`
- Check if database server is running
- Test connection: `python -c "from sqlalchemy import create_engine; create_engine('your_database_url').connect()"`

#### 3. Permission errors
- Ensure files have correct permissions: `chmod 755`
- Check if user has write access to database file (if using SQLite)

#### 4. CORS errors
- Add your frontend domain to `CORS_ORIGINS` in `.env`
- Restart the application

#### 5. Python version issues
- Verify Python 3.11+ is available: `python --version`
- Use `python3` or `python3.11` if needed

---

## Production Checklist

- [ ] Database created and configured
- [ ] `.env` file with production values
- [ ] OpenAI API key added
- [ ] Dependencies installed
- [ ] Database migrations run
- [ ] Python app configured in Hostinger panel
- [ ] CORS origins updated for your frontend
- [ ] API endpoints tested (ping, docs)
- [ ] Frontend connected and working

---

## Maintenance

### Updating the Application
1. Upload new files via File Manager or SSH
2. Restart Python app in Hostinger panel
3. Run migrations if database schema changed

### Monitoring
- Check error logs in Hostinger panel
- Monitor OpenAI API usage
- Watch database size limits

### Backup
- Export database regularly
- Keep backup of `.env` file (without sensitive data in version control)

---

## Support

If you encounter issues:
1. Check Hostinger documentation for Python apps
2. Review error logs in the control panel  
3. Test locally first before deploying
4. Verify all environment variables are set correctly