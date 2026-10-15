# Mekari Talenta API - Bash / cURL Implementation

Zero-dependency shell script demonstrating **HMAC-SHA256 authentication** for the **Mekari Talenta Data API** using `openssl` and `curl`.

---

## 📋 Requirements
- `bash` (4.x or macOS default bash/zsh)
- `curl`
- `openssl`

---

## 🚀 Quick Start

1. Make executable and configure credentials:
   ```bash
   chmod +x example.sh
   export TALENTA_CLIENT_ID="your_client_id"
   export TALENTA_CLIENT_SECRET="your_client_secret"
   export TALENTA_BASE_URL="https://sandbox-api.mekari.com" # or https://api.mekari.com
   ```

2. Run the script:
   ```bash
   ./example.sh
   ```

---

## 🔐 HMAC Signing Details

```bash
date_string=$(LC_ALL=C TZ=GMT date '+%a, %d %b %Y %H:%M:%S GMT')
request_line="${method} ${path_with_query} HTTP/1.1"
signing_string="date: ${date_string}\n${request_line}"

signature=$(printf "%b" "$signing_string" | openssl dgst -sha256 -hmac "$CLIENT_SECRET" -binary | openssl base64)
auth_header="hmac username=\"${CLIENT_ID}\", algorithm=\"hmac-sha256\", headers=\"date request-line\", signature=\"${signature}\""
```
