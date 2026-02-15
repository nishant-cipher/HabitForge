#!/bin/bash

# HabitForge API Gateway Test Script
# This script tests all endpoints through the API Gateway

echo "=========================================="
echo "HabitForge API Gateway Test Suite"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local token=$5
    
    echo -e "${YELLOW}Testing: $name${NC}"
    
    if [ -z "$token" ]; then
        # No auth required
        if [ -z "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        fi
    else
        # Auth required
        if [ -z "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $token")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $token" \
                -H "Content-Type: application/json" \
                -d "$data")
        fi
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    echo "  Status: $http_code"
    echo "  Response: $(echo $body | jq -c '.' 2>/dev/null || echo $body)"
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "  ${GREEN}✅ PASSED${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "  ${RED}❌ FAILED${NC}"
        FAILED=$((FAILED + 1))
    fi
    echo ""
    
    echo "$body"
}

# Generate unique email for this test run
TIMESTAMP=$(date +%s)
TEST_EMAIL="test${TIMESTAMP}@example.com"
TEST_USERNAME="test${TIMESTAMP}"

echo "Test User: $TEST_EMAIL"
echo ""

# ==========================================
# 1. AUTHENTICATION TESTS
# ==========================================
echo "=========================================="
echo "1. AUTHENTICATION TESTS"
echo "=========================================="
echo ""

# Register
echo "1.1 Register User"
REGISTER_RESPONSE=$(test_endpoint "Register User" "POST" "/api/auth/register" \
    "{\"email\":\"$TEST_EMAIL\",\"username\":\"$TEST_USERNAME\",\"password\":\"password123\",\"mode\":\"BALANCED\"}")

# Extract token
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.accessToken' 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
    echo -e "${RED}❌ Failed to get access token. Stopping tests.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Access token obtained${NC}"
echo ""

# Login with email
echo "1.2 Login with Email"
test_endpoint "Login with Email" "POST" "/api/auth/login" \
    "{\"email\":\"$TEST_EMAIL\",\"password\":\"password123\"}" > /dev/null

# Login with username
echo "1.3 Login with Username"
test_endpoint "Login with Username" "POST" "/api/auth/login" \
    "{\"username\":\"$TEST_USERNAME\",\"password\":\"password123\"}" > /dev/null

# ==========================================
# 2. USER PROFILE TESTS
# ==========================================
echo "=========================================="
echo "2. USER PROFILE TESTS"
echo "=========================================="
echo ""

echo "2.1 Get User Profile"
test_endpoint "Get Profile" "GET" "/api/users/profile" "" "$ACCESS_TOKEN" > /dev/null

# ==========================================
# 3. HABIT TESTS
# ==========================================
echo "=========================================="
echo "3. HABIT TESTS"
echo "=========================================="
echo ""

echo "3.1 Create Habit"
HABIT_RESPONSE=$(test_endpoint "Create Habit" "POST" "/api/habits" \
    "{\"name\":\"Morning Exercise\",\"description\":\"30 min cardio\",\"category\":\"HEALTH\",\"difficulty\":3,\"frequency\":\"DAILY\"}" \
    "$ACCESS_TOKEN")

HABIT_ID=$(echo "$HABIT_RESPONSE" | jq -r '.data._id' 2>/dev/null)

echo "3.2 Get All Habits"
test_endpoint "Get Habits" "GET" "/api/habits" "" "$ACCESS_TOKEN" > /dev/null

# ==========================================
# 4. GAMIFICATION TESTS
# ==========================================
echo "=========================================="
echo "4. GAMIFICATION TESTS"
echo "=========================================="
echo ""

if [ ! -z "$HABIT_ID" ] && [ "$HABIT_ID" != "null" ]; then
    echo "4.1 Log Habit Completion"
    test_endpoint "Log Completion" "POST" "/api/gamification/$HABIT_ID/log" \
        "{\"notes\":\"Felt great!\",\"completionTimeMinutes\":30}" \
        "$ACCESS_TOKEN" > /dev/null
    
    echo "4.2 Get Habit Stats"
    test_endpoint "Get Stats" "GET" "/api/gamification/$HABIT_ID/stats" "" "$ACCESS_TOKEN" > /dev/null
    
    echo "4.3 Get Habit Logs"
    test_endpoint "Get Logs" "GET" "/api/gamification/$HABIT_ID/logs" "" "$ACCESS_TOKEN" > /dev/null
else
    echo -e "${YELLOW}⚠️  Skipping gamification tests (no habit ID)${NC}"
    echo ""
fi

# ==========================================
# 5. CLUB TESTS
# ==========================================
echo "=========================================="
echo "5. CLUB TESTS"
echo "=========================================="
echo ""

echo "5.1 Create Club"
CLUB_RESPONSE=$(test_endpoint "Create Club" "POST" "/api/clubs" \
    "{\"name\":\"Fitness Warriors\",\"description\":\"A club for fitness enthusiasts\"}" \
    "$ACCESS_TOKEN")

CLUB_ID=$(echo "$CLUB_RESPONSE" | jq -r '.data._id' 2>/dev/null)

echo "5.2 Get My Clubs"
test_endpoint "Get Clubs" "GET" "/api/clubs" "" "$ACCESS_TOKEN" > /dev/null

if [ ! -z "$CLUB_ID" ] && [ "$CLUB_ID" != "null" ]; then
    echo "5.3 Get Club Details"
    test_endpoint "Get Club Details" "GET" "/api/clubs/$CLUB_ID" "" "$ACCESS_TOKEN" > /dev/null
    
    echo "5.4 Get Club Members"
    test_endpoint "Get Members" "GET" "/api/clubs/$CLUB_ID/members" "" "$ACCESS_TOKEN" > /dev/null
    
    echo "5.5 Add Club Task"
    CLUB_HABIT_RESPONSE=$(test_endpoint "Add Task" "POST" "/api/clubs/$CLUB_ID/habits" \
        "{\"name\":\"Daily Push-ups\",\"description\":\"50 push-ups\",\"category\":\"HEALTH\",\"difficulty\":3,\"frequency\":\"DAILY\"}" \
        "$ACCESS_TOKEN")
    
    CLUB_HABIT_ID=$(echo "$CLUB_HABIT_RESPONSE" | jq -r '.data._id' 2>/dev/null)
    
    echo "5.6 Get Club Tasks"
    test_endpoint "Get Tasks" "GET" "/api/clubs/$CLUB_ID/habits" "" "$ACCESS_TOKEN" > /dev/null
    
    if [ ! -z "$CLUB_HABIT_ID" ] && [ "$CLUB_HABIT_ID" != "null" ]; then
        echo "5.7 Accept Club Task"
        test_endpoint "Accept Task" "POST" "/api/clubs/$CLUB_ID/habits/$CLUB_HABIT_ID/accept" "" "$ACCESS_TOKEN" > /dev/null
    fi
    
    echo "5.8 Get Activity Feed"
    test_endpoint "Get Activity" "GET" "/api/clubs/$CLUB_ID/activity?limit=50" "" "$ACCESS_TOKEN" > /dev/null
    
    echo "5.9 Send Chat Message"
    test_endpoint "Send Message" "POST" "/api/clubs/$CLUB_ID/chat" \
        "{\"message\":\"Hello everyone!\"}" \
        "$ACCESS_TOKEN" > /dev/null
    
    echo "5.10 Get Chat Messages"
    test_endpoint "Get Chat" "GET" "/api/clubs/$CLUB_ID/chat?limit=100" "" "$ACCESS_TOKEN" > /dev/null
else
    echo -e "${YELLOW}⚠️  Skipping club detail tests (no club ID)${NC}"
    echo ""
fi

# ==========================================
# 6. ANALYTICS TESTS
# ==========================================
echo "=========================================="
echo "6. ANALYTICS TESTS"
echo "=========================================="
echo ""

echo "6.1 Get Dashboard"
test_endpoint "Get Dashboard" "GET" "/api/analytics/dashboard" "" "$ACCESS_TOKEN" > /dev/null

echo "6.2 Get Trends (Weekly)"
test_endpoint "Get Trends Weekly" "GET" "/api/analytics/trends?period=WEEKLY" "" "$ACCESS_TOKEN" > /dev/null

echo "6.3 Get Trends (Daily)"
test_endpoint "Get Trends Daily" "GET" "/api/analytics/trends?period=DAILY" "" "$ACCESS_TOKEN" > /dev/null

# ==========================================
# SUMMARY
# ==========================================
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo ""
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
