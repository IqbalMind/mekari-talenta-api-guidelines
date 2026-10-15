# Mekari Talenta API - Node.js Implementation

This directory contains a complete, zero-dependency Node.js example demonstrating **HMAC-SHA256 authentication** for the **Mekari Talenta Data API**.

---

## 📋 Requirements
- **Node.js** >= 18.0.0 (uses built-in `crypto` and native `fetch`)

---

## 🚀 Quick Start

1. Open [`example.js`](./example.js) and configure your credentials or set environment variables:
   ```bash
   export TALENTA_CLIENT_ID="your_client_id"
   export TALENTA_CLIENT_SECRET="your_client_secret"
   export TALENTA_BASE_URL="https://sandbox-api.mekari.com" # or https://api.mekari.com
   ```

2. Run the script:
   ```bash
   node example.js
   ```

---

## 🔐 HMAC Signing Details

1. **Date Header**: RFC 1123 / UTC format:
   ```javascript
   const dateString = new Date().toUTCString();
   ```

2. **Request Line**: Method + Path with Query:
   ```javascript
   const requestLine = `${method.toUpperCase()} ${pathWithQuery} HTTP/1.1`;
   ```

3. **Signature Digest**:
   ```javascript
   const signingString = `date: ${dateString}\n${requestLine}`;
   const signature = crypto
       .createHmac('sha256', clientSecret)
       .update(signingString, 'utf8')
       .digest('base64');
   ```

4. **Authorization Header**:
   ```javascript
   const authHeader = `hmac username="${clientId}", algorithm="hmac-sha256", headers="date request-line", signature="${signature}"`;
   ```
