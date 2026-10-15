<?php
/**
 * Mekari Talenta API Integration Example (PHP)
 * 
 * Demonstrates HMAC-SHA256 authentication for Mekari Talenta HRIS:
 * 1. GET /v2/talenta/v3/employees (Employee Directory Sync)
 * 2. POST /v2/talenta/v2/live-attendance/clock-in (Attendance Clock-In)
 * 3. GET /v2/talenta/v2/time-off (Time Off / Leave Request Sync)
 */

$clientId = getenv('TALENTA_CLIENT_ID') ?: 'YOUR_CLIENT_ID';
$clientSecret = getenv('TALENTA_CLIENT_SECRET') ?: 'YOUR_CLIENT_SECRET';
$baseUrl = getenv('TALENTA_BASE_URL') ?: 'https://sandbox-api.mekari.com';

/**
 * Generate HMAC-SHA256 Authentication Headers
 * 
 * @param string $method HTTP method (GET, POST, etc.)
 * @param string $pathWithQuery Path including query params
 * @param string $clientId Mekari Client ID
 * @param string $clientSecret Mekari Client Secret
 * @return array Header strings array
 */
function generateHmacHeaders($method, $pathWithQuery, $clientId, $clientSecret) {
    // 1. UTC Date in RFC 1123 format (e.g. Thu, 15 Oct 2026 06:15:00 GMT)
    $dateString = gmdate('D, d M Y H:i:s T');

    // 2. Request line
    $requestLine = strtoupper($method) . ' ' . $pathWithQuery . ' HTTP/1.1';

    // 3. Signing payload
    $signingString = "date: {$dateString}\n{$requestLine}";

    // 4. HMAC-SHA256 base64 digest
    $rawHash = hash_hmac('sha256', $signingString, $clientSecret, true);
    $signature = base64_encode($rawHash);

    // 5. Authorization header
    $authHeader = "hmac username=\"{$clientId}\", algorithm=\"hmac-sha256\", headers=\"date request-line\", signature=\"{$signature}\"";

    return [
        "Authorization: {$authHeader}",
        "Date: {$dateString}",
        "Content-Type: application/json",
        "Accept: application/json"
    ];
}

/**
 * Generic cURL request sender
 */
function sendRequest($method, $pathWithQuery, $payload = null) {
    global $baseUrl, $clientId, $clientSecret;

    $url = $baseUrl . $pathWithQuery;
    $headers = generateHmacHeaders($method, $pathWithQuery, $clientId, $clientSecret);

    echo "==================================================================\n";
    echo "[REQUEST] {$method} {$url}\n";
    echo "Headers:\n" . json_encode($headers, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    if (strtoupper($method) === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($payload !== null) {
            $jsonBody = json_encode($payload);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonBody);
            echo "Payload Preview:\n" . json_encode($payload, JSON_PRETTY_PRINT) . "\n";
        }
    } elseif (strtoupper($method) !== 'GET') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, strtoupper($method));
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    if (PHP_VERSION_ID < 80500) {
        curl_close($ch);
    }

    if ($curlError) {
        echo "\n❌ cURL Error: {$curlError}\n";
        return null;
    }

    echo "\nHTTP Status: {$httpCode}\n";
    echo "Response:\n{$response}\n";
    return json_decode($response, true);
}

// Case 1: Fetch Employees
function getEmployees($limit = 3, $page = 1) {
    $path = "/v2/talenta/v3/employees?limit={$limit}&page={$page}";
    echo "\n--- Fetching Employees (Page {$page}, Limit {$limit}) ---\n";
    return sendRequest('GET', $path);
}

// Case 2: Live Attendance Clock-In
function clockInAttendance($lat = -6.2088, $lng = 106.8456, $note = "Clock-in from PHP integration") {
    $path = "/v2/talenta/v2/live-attendance/clock-in";
    $payload = [
        "latitude" => (string)$lat,
        "longitude" => (string)$lng,
        "notes" => $note,
        "status" => "clock-in"
    ];
    echo "\n--- Submitting Live Attendance Clock-In ---\n";
    return sendRequest('POST', $path, $payload);
}

// Execution
echo "Mekari Talenta API PHP Demonstration\n";
echo "Using Base URL: {$baseUrl}\n";

getEmployees(3, 1);
?>
