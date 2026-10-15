# Mekari Talenta API - Python Implementation

Zero-dependency Python implementation of **HMAC-SHA256 authentication** for the **Mekari Talenta Data API**.

---

## 📋 Requirements
- Python 3.8+ (uses standard library modules: `urllib.request`, `hmac`, `hashlib`, `base64`, `json`, `datetime`)

---

## 🚀 Quick Start

1. Set environment variables (or update defaults in [`example.py`](./example.py)):
   ```bash
   export TALENTA_CLIENT_ID="your_client_id"
   export TALENTA_CLIENT_SECRET="your_client_secret"
   export TALENTA_BASE_URL="https://sandbox-api.mekari.com" # or https://api.mekari.com
   ```

2. Run the script:
   ```bash
   python3 example.py
   ```

---

## 🔐 HMAC Signing Details

```python
now_utc = datetime.now(timezone.utc)
date_string = now_utc.strftime("%a, %d %b %Y %H:%M:%S GMT")
request_line = f"{method.upper()} {path_with_query} HTTP/1.1"
signing_string = f"date: {date_string}\n{request_line}"

digest = hmac.new(
    client_secret.encode("utf-8"),
    signing_string.encode("utf-8"),
    hashlib.sha256
).digest()

signature = base64.b64encode(digest).decode("utf-8")
auth_header = f'hmac username="{client_id}", algorithm="hmac-sha256", headers="date request-line", signature="{signature}"'
```
