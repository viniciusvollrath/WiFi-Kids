#!/bin/bash

# WiFi-Kids Local Deployment Script
# This script builds and tests the application locally before deployment

set -e

echo "🚀 WiFi-Kids Local Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "CLAUDE.md" ]; then
    print_error "Please run this script from the WiFi-Kids root directory"
    exit 1
fi

# Check for required commands
command -v node >/dev/null 2>&1 || { print_error "Node.js is required but not installed. Aborting."; exit 1; }
command -v python3 >/dev/null 2>&1 || { print_error "Python 3.11+ is required but not installed. Aborting."; exit 1; }

# Step 1: Backend Setup
print_status "Setting up backend environment..."
cd backend

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source .venv/bin/activate

# Install backend dependencies
print_status "Installing backend dependencies..."
pip install --upgrade pip
pip install -e .

# Run backend tests
print_status "Running backend tests..."
if ! python run_tests.py --coverage; then
    print_error "Backend tests failed"
    exit 1
fi
print_success "Backend tests passed"

# Step 2: Frontend Setup
print_status "Setting up frontend environment..."
cd ../ui/webapp/apps/pwa

# Install frontend dependencies
print_status "Installing frontend dependencies..."
npm ci

# Run frontend tests
print_status "Running frontend tests..."
if ! npm run test:run; then
    print_error "Frontend tests failed"
    exit 1
fi
print_success "Frontend tests passed"

# Build frontend
print_status "Building frontend for production..."
export VITE_API_URL="http://localhost:8002"
export VITE_MOCK="false"
export VITE_DEBUG="false"

if ! npm run build; then
    print_error "Frontend build failed"
    exit 1
fi
print_success "Frontend build completed"

# Step 3: Preview deployment
print_status "Starting preview server..."
print_success "✨ Local deployment ready!"
print_status "Frontend: http://localhost:8080 (preview)"
print_status "Backend:  http://localhost:8002 (if running)"
print_status ""
print_status "To start the backend server:"
print_status "  cd backend && source .venv/bin/activate && uvicorn api.main:app --host 0.0.0.0 --port 8002 --reload"
print_status ""
print_status "To start the preview server:"
print_status "  npm run preview"

# Go back to root
cd ../../../../

print_success "🎉 Local deployment completed successfully!"