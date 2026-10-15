/**
 * Mekari Talenta API Integration Example (Node.js)
 * 
 * Demonstrates HMAC-SHA256 authentication for Mekari Talenta HRIS:
 * 1. GET /v2/talenta/v3/employees (Employee Directory Sync with query parameters)
 * 2. POST /v2/talenta/v2/live-attendance/clock-in (Attendance Clock-In with JSON body)
 * 3. GET /v2/talenta/v2/time-off (Time Off / Leave Request Sync)
 */

const crypto = require('crypto');

// Configuration - Replace with credentials from Mekari Developer Center (MDC)
const CLIENT_ID = process.env.TALENTA_CLIENT_ID || 'YOUR_CLIENT_ID';
const CLIENT_SECRET = process.env.TALENTA_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const BASE_URL = process.env.TALENTA_BASE_URL || 'https://sandbox-api.mekari.com'; // or https://api.mekari.com

/**
 * Generate HMAC-SHA256 Authentication Headers for Mekari Talenta API
 * 
 * Rules:
 * 1. Date header must be in RFC 1123 / UTC format (e.g. Thu, 15 Oct 2026 06:15:00 GMT).
 * 2. Request line must be: [METHOD] [PATH_WITH_QUERY] HTTP/1.1
 * 3. Signing string: "date: <dateString>\n<requestLine>"
 * 4. Signature: Base64( HMAC-SHA256( signingString, secret ) )
 * 5. Authorization header format:
 *    hmac username="<CLIENT_ID>", algorithm="hmac-sha256", headers="date request-line", signature="<SIGNATURE>"
 * 
 * @param {string} method - HTTP method (GET, POST, PATCH, DELETE)
 * @param {string} pathWithQuery - Path including query params (e.g. /v2/talenta/v3/employees?limit=5)
 * @param {string} clientId - Mekari API Client ID
 * @param {string} clientSecret - Mekari API Client Secret
 * @returns {Object} Request headers map
 */
function generateHmacHeaders(method, pathWithQuery, clientId, clientSecret) {
    const dateString = new Date().toUTCString();
    const requestLine = `${method.toUpperCase()} ${pathWithQuery} HTTP/1.1`;
    const signingString = `date: ${dateString}\n${requestLine}`;

    const signature = crypto
        .createHmac('sha256', clientSecret)
        .update(signingString, 'utf8')
        .digest('base64');

    const authHeader = `hmac username="${clientId}", algorithm="hmac-sha256", headers="date request-line", signature="${signature}"`;

    return {
        'Authorization': authHeader,
        'Date': dateString,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
}

/**
 * Generic HTTP Request Executor using native fetch
 */
async function sendRequest(method, pathWithQuery, payload = null) {
    const fullUrl = `${BASE_URL}${pathWithQuery}`;
    const headers = generateHmacHeaders(method, pathWithQuery, CLIENT_ID, CLIENT_SECRET);

    console.log("==================================================================");
    console.log(`[REQUEST] ${method.toUpperCase()} ${fullUrl}`);
    console.log("Headers:");
    console.log(JSON.stringify(headers, null, 2));

    const options = {
        method: method.toUpperCase(),
        headers: headers
    };

    if (payload && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        options.body = JSON.stringify(payload);
        console.log("Payload Preview:");
        console.log(JSON.stringify(payload, null, 2));
    }

    try {
        const response = await fetch(fullUrl, options);
        const status = response.status;
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }

        if (response.ok) {
            console.log(`\n✅ Success! HTTP Status: ${status}`);
            console.log("Response Data:");
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.error(`\n❌ Error: HTTP Status ${status}`);
            console.error(typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
        }
        return data;
    } catch (err) {
        console.error("\n❌ Network / Client Error:", err.message);
    }
}

/**
 * CASE 1: Query Employees Directory (GET)
 */
async function getEmployees(limit = 5, page = 1) {
    const path = `/v2/talenta/v3/employees?limit=${limit}&page=${page}`;
    console.log(`\n--- Fetching Employees (Page ${page}, Limit ${limit}) ---`);
    return await sendRequest('GET', path);
}

/**
 * CASE 2: Clock-In Live Attendance (POST)
 */
async function clockInAttendance(latitude = -6.2088, longitude = 106.8456, notes = "Office Clock-In via Node.js Integration") {
    const path = '/v2/talenta/v2/live-attendance/clock-in';
    const payload = {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        notes: notes,
        status: "clock-in"
    };

    console.log("\n--- Submitting Live Attendance Clock-In ---");
    return await sendRequest('POST', path, payload);
}

/**
 * CASE 3: Get Time Off / Leave Requests (GET)
 */
async function getTimeOffRequests(startDate = "2026-01-01", endDate = "2026-12-31") {
    const path = `/v2/talenta/v2/time-off?start_date=${startDate}&end_date=${endDate}&page=1&limit=10`;
    console.log(`\n--- Fetching Time Off Requests (${startDate} to ${endDate}) ---`);
    return await sendRequest('GET', path);
}

async function main() {
    console.log("Mekari Talenta API Node.js Demonstration");
    console.log(`Using Base URL: ${BASE_URL}`);

    // 1. Fetch Employees
    await getEmployees(3, 1);

    // 2. Fetch Time Off Requests
    await getTimeOffRequests();

    // 3. Live Attendance Clock-In (Uncomment to test if attendance scope enabled)
    // await clockInAttendance(-6.2088, 106.8456, "Clock-in from integration test");
}

main();
