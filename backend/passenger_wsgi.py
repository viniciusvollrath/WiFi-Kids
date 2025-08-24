#!/usr/bin/env python3
"""
Passenger WSGI Entry Point for Hostinger
This is specifically for Hostinger's Passenger WSGI system
"""
import os
import sys

# Get the current directory (where this file is located)
current_dir = os.path.dirname(os.path.abspath(__file__))

# Add current directory to Python path
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Set up environment
os.environ.setdefault('PYTHONPATH', current_dir)

# Import and configure the FastAPI app
try:
    from api.main import app
    
    # Update CORS for production
    from api.core.settings import get_settings
    settings = get_settings()
    
    # The WSGI application that Passenger will use
    application = app
    
except ImportError as e:
    # Fallback error application
    def application(environ, start_response):
        status = '500 Internal Server Error'
        headers = [('Content-type', 'text/plain')]
        start_response(status, headers)
        return [f'Error importing application: {str(e)}'.encode('utf-8')]

# For debugging
if __name__ == "__main__":
    print("Passenger WSGI entry point loaded successfully")
    print(f"Python path: {sys.path}")
    print(f"Current directory: {current_dir}")