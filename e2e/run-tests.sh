#!/bin/bash

echo "======================================"
echo "Club Nightlife E2E Test Suite"
echo "======================================"

# Check if app is running
echo "Checking if application is running..."
if ! curl -s http://localhost:3001 > /dev/null; then
    echo "Error: Frontend is not running on port 3001"
    echo "Please start the application with: docker-compose up -d"
    exit 1
fi

if ! curl -s http://localhost:5001/health > /dev/null; then
    echo "Error: Backend is not running on port 5001"
    echo "Please start the application with: docker-compose up -d"
    exit 1
fi

echo "Application is running!"
echo ""

# Install dependencies if needed
if [ ! -f "/home/isilvera/.cache/ms-playwright/chromium-1194/INSTALLATION_COMPLETE" ]; then
    echo "Installing Playwright dependencies..."
    ./install-playwright-wsl.sh
fi

echo "Running E2E tests..."
echo ""

# Run all tests
npx playwright test e2e/tests --reporter=html

echo ""
echo "======================================"
echo "Tests completed!"
echo "======================================"
echo "View report with: npx playwright show-report"
