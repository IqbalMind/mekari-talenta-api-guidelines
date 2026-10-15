# Mekari Talenta API - Oracle NetSuite Integration

Production-ready **SuiteScript 2.1** modules for integrating Oracle NetSuite with **Mekari Talenta Data API** via **HMAC-SHA256 authentication**.

---

## 📁 Files Included

| File | Script Type | Description |
|---|---|---|
| [`talenta_hmac_service.js`](./talenta_hmac_service.js) | Library Module | Handles RFC 1123 date generation, request-line parsing, HMAC-SHA256 computation (`N/crypto`), and HTTPS dispatch (`N/https`). |
| [`talenta_employee_sync_mr.js`](./talenta_employee_sync_mr.js) | Map/Reduce Script | Scheduled batch script that pulls active employees from Talenta v3 and upserts NetSuite Employee records. |

---

## 🔐 How HMAC Works in SuiteScript 2.1

NetSuite provides native cryptographic hashing via `N/crypto`:

```javascript
// 1. Build signing payload
const signingPayload = `date: ${dateString}\n${requestLine}`;

// 2. Compute HMAC using SecretKey
const hmacKey = crypto.createSecretKey({
    secret: clientSecret,
    encoding: encode.Encoding.UTF_8
});

const hmacObj = crypto.createHmac({
    algorithm: crypto.HashAlg.SHA256,
    key: hmacKey
});

hmacObj.update({
    input: signingPayload,
    encoding: encode.Encoding.UTF_8
});

const signature = hmacObj.digest({
    outputEncoding: encode.Encoding.BASE_64
});

const authHeader = `hmac username="${clientId}", algorithm="hmac-sha256", headers="date request-line", signature="${signature}"`;
```

---

## 🛠️ Deployment Steps

1. Upload `talenta_hmac_service.js` and `talenta_employee_sync_mr.js` to NetSuite **File Cabinet** (`SuiteScripts/MekariTalenta/`).
2. Navigate to **Customization > Scripting > Scripts > New**.
3. Select `talenta_employee_sync_mr.js` as a **Map/Reduce Script**.
4. Configure script deployment with your desired schedule (e.g. Daily at midnight).
5. Add script parameters or company preferences for `TALENTA_CLIENT_ID` and `TALENTA_CLIENT_SECRET`.
