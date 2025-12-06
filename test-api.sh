#!/bin/bash

echo "========================================="
echo "Testing Club Nightlife API Authentication"
echo "========================================="

API_URL="http://localhost:5001/api"

# Test 1: Register a new club
echo -e "\n1. Registering new club..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register/club" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Admin User",
    "email": "testadmin@test.com",
    "clubName": "Test Nightclub",
    "password": "TestPass123"
  }')

echo "Response: $REGISTER_RESPONSE"

# Extract token if registration successful
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "❌ Registration failed"
else
  echo "✅ Registration successful! Token: ${TOKEN:0:50}..."
fi

# Test 2: Login
echo -e "\n2. Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testadmin@test.com",
    "password": "TestPass123"
  }')

echo "Response: $LOGIN_RESPONSE"

# Extract login token
LOGIN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$LOGIN_TOKEN" ]; then
  echo "❌ Login failed"
else
  echo "✅ Login successful! Token: ${LOGIN_TOKEN:0:50}..."
fi

# Test 3: Access protected route
echo -e "\n3. Testing protected route (dashboard)..."
DASHBOARD_RESPONSE=$(curl -s -X GET "$API_URL/dashboard/stats" \
  -H "Authorization: Bearer $LOGIN_TOKEN")

echo "Response: $DASHBOARD_RESPONSE"

if echo "$DASHBOARD_RESPONSE" | grep -q "success"; then
  echo "✅ Dashboard access successful"
else
  echo "❌ Dashboard access failed"
fi

echo -e "\n========================================="
echo "Test completed"
echo "========================================="
