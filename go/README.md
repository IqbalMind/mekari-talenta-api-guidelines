# Mekari Talenta API - Go Implementation

Zero-dependency Go implementation of **HMAC-SHA256 authentication** for the **Mekari Talenta Data API**.

---

## 📋 Requirements
- Go 1.20+ (standard library only: `crypto/hmac`, `crypto/sha256`, `net/http`, `encoding/base64`, `time`)

---

## 🚀 Quick Start

1. Set environment variables (or update defaults in [`example.go`](./example.go)):
   ```bash
   export TALENTA_CLIENT_ID="your_client_id"
   export TALENTA_CLIENT_SECRET="your_client_secret"
   export TALENTA_BASE_URL="https://sandbox-api.mekari.com" # or https://api.mekari.com
   ```

2. Run the script:
   ```bash
   go run example.go
   ```

---

## 🔐 HMAC Signing Details

```go
dateString := time.Now().UTC().Format(http.TimeFormat)
requestLine := fmt.Sprintf("%s %s HTTP/1.1", strings.ToUpper(method), pathWithQuery)
signingString := fmt.Sprintf("date: %s\n%s", dateString, requestLine)

mac := hmac.New(sha256.New, []byte(cSecret))
mac.Write([]byte(signingString))
signature := base64.StdEncoding.EncodeToString(mac.Sum(nil))

authHeader := fmt.Sprintf(`hmac username="%s", algorithm="hmac-sha256", headers="date request-line", signature="%s"`, cID, signature)
```
