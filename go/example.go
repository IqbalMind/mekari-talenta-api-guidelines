package main

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

var (
	clientID     = getEnv("TALENTA_CLIENT_ID", "YOUR_CLIENT_ID")
	clientSecret = getEnv("TALENTA_CLIENT_SECRET", "YOUR_CLIENT_SECRET")
	baseURL      = getEnv("TALENTA_BASE_URL", "https://sandbox-api.mekari.com")
)

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

// GenerateHmacHeaders generates standard HMAC-SHA256 headers for Mekari Talenta API
func GenerateHmacHeaders(method, pathWithQuery, cID, cSecret string) map[string]string {
	// 1. UTC Date in RFC 1123 format (e.g. Thu, 15 Oct 2026 06:15:00 GMT)
	dateString := time.Now().UTC().Format(http.TimeFormat)

	// 2. Request line
	requestLine := fmt.Sprintf("%s %s HTTP/1.1", strings.ToUpper(method), pathWithQuery)

	// 3. Signing payload
	signingString := fmt.Sprintf("date: %s\n%s", dateString, requestLine)

	// 4. HMAC-SHA256 Base64 digest
	mac := hmac.New(sha256.New, []byte(cSecret))
	mac.Write([]byte(signingString))
	signature := base64.StdEncoding.EncodeToString(mac.Sum(nil))

	// 5. Authorization header
	authHeader := fmt.Sprintf(`hmac username="%s", algorithm="hmac-sha256", headers="date request-line", signature="%s"`, cID, signature)

	return map[string]string{
		"Authorization": authHeader,
		"Date":          dateString,
		"Content-Type":  "application/json",
		"Accept":        "application/json",
	}
}

func sendRequest(method, pathWithQuery string, payload interface{}) {
	fullURL := baseURL + pathWithQuery
	headers := GenerateHmacHeaders(method, pathWithQuery, clientID, clientSecret)

	fmt.Println("==================================================================")
	fmt.Printf("[REQUEST] %s %s\n", method, fullURL)
	fmt.Println("Headers:")
	for k, v := range headers {
		fmt.Printf("  %s: %s\n", k, v)
	}

	var reqBody io.Reader
	if payload != nil && (method == "POST" || method == "PUT" || method == "PATCH") {
		jsonBytes, _ := json.MarshalIndent(payload, "", "  ")
		fmt.Printf("Payload Preview:\n%s\n", string(jsonBytes))
		reqBody = bytes.NewBuffer(jsonBytes)
	}

	req, err := http.NewRequest(method, fullURL, reqBody)
	if err != nil {
		fmt.Printf("Error creating request: %v\n", err)
		return
	}

	for k, v := range headers {
		req.Header.Set(k, v)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("❌ Request failed: %v\n", err)
		return
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	fmt.Printf("\nHTTP Status: %d\n", resp.StatusCode)
	fmt.Printf("Response Body:\n%s\n", string(bodyBytes))
}

func getEmployees(limit, page int) {
	path := fmt.Sprintf("/v2/talenta/v3/employees?limit=%d&page=%d", limit, page)
	fmt.Printf("\n--- Fetching Employees (Page %d, Limit %d) ---\n", page, limit)
	sendRequest("GET", path, nil)
}

func clockInAttendance(lat, lng float64, note string) {
	path := "/v2/talenta/v2/live-attendance/clock-in"
	payload := map[string]interface{}{
		"latitude":  fmt.Sprintf("%.6f", lat),
		"longitude": fmt.Sprintf("%.6f", lng),
		"notes":     note,
		"status":    "clock-in",
	}
	fmt.Println("\n--- Submitting Live Attendance Clock-In ---")
	sendRequest("POST", path, payload)
}

func main() {
	fmt.Println("Mekari Talenta API Go Demonstration")
	fmt.Printf("Using Base URL: %s\n", baseURL)

	getEmployees(3, 1)
}
