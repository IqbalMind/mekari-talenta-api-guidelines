package com.mekari.talenta.example;

/**
 * Mekari Talenta API Integration Example (Java 11+)
 * 
 * Demonstrates HMAC-SHA256 authentication for Mekari Talenta HRIS:
 * 1. GET /v2/talenta/v3/employees (Employee Directory Sync)
 * 2. POST /v2/talenta/v2/live-attendance/clock-in (Attendance Clock-In)
 * 3. GET /v2/talenta/v2/time-off (Time Off / Leave Request Sync)
 * 
 * Uses Java 11+ java.net.http.HttpClient with zero external dependencies.
 */

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

public class Example {

    private static final String CLIENT_ID = System.getenv().getOrDefault("TALENTA_CLIENT_ID", "YOUR_CLIENT_ID");
    private static final String CLIENT_SECRET = System.getenv().getOrDefault("TALENTA_CLIENT_SECRET", "YOUR_CLIENT_SECRET");
    private static final String BASE_URL = System.getenv().getOrDefault("TALENTA_BASE_URL", "https://sandbox-api.mekari.com");

    /**
     * Generate HMAC-SHA256 Authentication Headers for Mekari Talenta API
     */
    public static Map<String, String> generateHmacHeaders(
            String method,
            String pathWithQuery,
            String clientId,
            String clientSecret
    ) throws NoSuchAlgorithmException, InvalidKeyException {

        // 1. Date header in RFC 1123 / UTC format
        String dateString = ZonedDateTime.now(ZoneOffset.UTC).format(DateTimeFormatter.RFC_1123_DATE_TIME);

        // 2. Request Line: [METHOD] [PATH_WITH_QUERY] HTTP/1.1
        String requestLine = String.format("%s %s HTTP/1.1", method.toUpperCase(), pathWithQuery);

        // 3. Signing payload: "date: <dateString>\n<requestLine>"
        String signingPayload = String.format("date: %s\n%s", dateString, requestLine);

        // 4. HMAC-SHA256 signature
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(clientSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKey);
        byte[] rawHmac = mac.doFinal(signingPayload.getBytes(StandardCharsets.UTF_8));
        String signature = Base64.getEncoder().encodeToString(rawHmac);

        // 5. Build Authorization Header
        String authHeader = String.format(
                "hmac username=\"%s\", algorithm=\"hmac-sha256\", headers=\"date request-line\", signature=\"%s\"",
                clientId, signature
        );

        Map<String, String> headers = new HashMap<>();
        headers.put("Authorization", authHeader);
        headers.put("Date", dateString);
        headers.put("Content-Type", "application/json");
        headers.put("Accept", "application/json");

        return headers;
    }

    /**
     * Send HTTP Request using java.net.http.HttpClient
     */
    public static String sendRequest(String method, String pathWithQuery, String jsonBody) {
        String fullUrl = BASE_URL + pathWithQuery;

        try {
            Map<String, String> headers = generateHmacHeaders(method, pathWithQuery, CLIENT_ID, CLIENT_SECRET);

            System.out.println("==================================================================");
            System.out.printf("[REQUEST] %s %s\n", method, fullUrl);
            System.out.println("Headers:");
            headers.forEach((k, v) -> System.out.printf("  %s: %s\n", k, v));

            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(fullUrl))
                    .timeout(Duration.ofSeconds(15));

            headers.forEach(builder::header);

            if (jsonBody != null && (method.equalsIgnoreCase("POST") || method.equalsIgnoreCase("PUT") || method.equalsIgnoreCase("PATCH"))) {
                System.out.println("Payload:\n" + jsonBody);
                builder.method(method.toUpperCase(), HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8));
            } else {
                builder.method(method.toUpperCase(), HttpRequest.BodyPublishers.noBody());
            }

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = client.send(builder.build(), HttpResponse.BodyHandlers.ofString());

            System.out.printf("\nHTTP Status: %d\n", response.statusCode());
            System.out.println("Response Body:\n" + response.body());
            return response.body();

        } catch (IOException | InterruptedException e) {
            System.err.println("❌ Request error: " + e.getMessage());
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            System.err.println("❌ Cryptographic signing error: " + e.getMessage());
        }
        return null;
    }

    /**
     * Case 1: Fetch Employees
     */
    public static void getEmployees(int limit, int page) {
        String path = String.format("/v2/talenta/v3/employees?limit=%d&page=%d", limit, page);
        System.out.printf("\n--- Fetching Employees (Page %d, Limit %d) ---\n", page, limit);
        sendRequest("GET", path, null);
    }

    /**
     * Case 2: Live Attendance Clock-In
     */
    public static void clockInAttendance(double lat, double lng, String note) {
        String path = "/v2/talenta/v2/live-attendance/clock-in";
        String payload = String.format(
                "{\"latitude\":\"%.6f\",\"longitude\":\"%.6f\",\"notes\":\"%s\",\"status\":\"clock-in\"}",
                lat, lng, note
        );
        System.out.println("\n--- Submitting Live Attendance Clock-In ---");
        sendRequest("POST", path, payload);
    }

    public static void main(String[] args) {
        System.out.println("Mekari Talenta API Java Demonstration");
        System.out.printf("Using Base URL: %s\n", BASE_URL);

        getEmployees(3, 1);
    }
}
