#!/usr/bin/env bash
# Mekari Talenta API Integration Example (Bash / cURL)
#
# Demonstrates HMAC-SHA256 authentication using OpenSSL and cURL:
# 1. GET /v2/talenta/v3/employees
# 2. POST /v2/talenta/v2/live-attendance/clock-in

CLIENT_ID="${TALENTA_CLIENT_ID:-YOUR_CLIENT_ID}"
CLIENT_SECRET="${TALENTA_CLIENT_SECRET:-YOUR_CLIENT_SECRET}"
BASE_URL="${TALENTA_BASE_URL:-https://sandbox-api.mekari.com}"

generate_and_send() {
    local method="$1"
    local path_with_query="$2"
    local payload="$3"

    # 1. Format date as RFC 1123 / UTC (e.g. Thu, 15 Oct 2026 06:15:00 GMT)
    local date_string
    date_string=$(LC_ALL=C TZ=GMT date '+%a, %d %b %Y %H:%M:%S GMT')

    # 2. Build Request Line
    local request_line="${method} ${path_with_query} HTTP/1.1"

    # 3. Build Signing Payload
    local signing_string="date: ${date_string}\n${request_line}"

    # 4. Generate HMAC-SHA256 Base64 digest via OpenSSL
    local signature
    signature=$(printf "%b" "$signing_string" | openssl dgst -sha256 -hmac "$CLIENT_SECRET" -binary | openssl base64)

    # 5. Build Authorization Header
    local auth_header="hmac username=\"${CLIENT_ID}\", algorithm=\"hmac-sha256\", headers=\"date request-line\", signature=\"${signature}\""

    echo "=================================================================="
    echo "[REQUEST] ${method} ${BASE_URL}${path_with_query}"
    echo "Authorization: ${auth_header}"
    echo "Date: ${date_string}"

    if [ -n "$payload" ]; then
        echo "Payload: ${payload}"
        curl -s -X "${method}" "${BASE_URL}${path_with_query}" \
            -H "Authorization: ${auth_header}" \
            -H "Date: ${date_string}" \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            -d "${payload}"
    else
        curl -s -X "${method}" "${BASE_URL}${path_with_query}" \
            -H "Authorization: ${auth_header}" \
            -H "Date: ${date_string}" \
            -H "Content-Type: application/json" \
            -H "Accept: application/json"
    fi
    echo -e "\n"
}

echo "Mekari Talenta API Bash / cURL Demonstration"
echo "Base URL: ${BASE_URL}"
echo ""

# Case 1: Fetch Employees
echo "--- Case 1: Get Employees ---"
generate_and_send "GET" "/v2/talenta/v3/employees?limit=3&page=1" ""

# Case 2: Live Attendance Clock-In
# echo "--- Case 2: Attendance Clock In ---"
# generate_and_send "POST" "/v2/talenta/v2/live-attendance/clock-in" '{"latitude":"-6.2088","longitude":"106.8456","notes":"Clock in from Bash","status":"clock-in"}'
