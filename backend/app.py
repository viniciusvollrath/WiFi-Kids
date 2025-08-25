#!/usr/bin/env python3
"""
WSGI Entry point for WiFi-Kids Backend API
This file is used for deployment on hosting services like Hostinger
"""
import os
import sys

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the FastAPI app
from api.main import app

# For WSGI servers (like mod_wsgi, gunicorn, etc.)
application = app

if __name__ == "__main__":
    import uvicorn
    
    # For local testing
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        reload=False
    )