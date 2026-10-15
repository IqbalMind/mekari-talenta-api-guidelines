# Mekari Talenta API - Oracle Fusion Cloud Integration

Patterns and utilities for integrating **Oracle Fusion Cloud (ERP Financials & HCM)** with **Mekari Talenta Data API** via **Oracle Integration Cloud (OIC)**.

---

## 📁 Files Included

| File | Description |
|---|---|
| [`oic_talenta_hmac_generator.js`](./oic_talenta_hmac_generator.js) | JavaScript action library for Oracle Integration Cloud (OIC) to compute HMAC-SHA256 headers before REST Adapter invocation. |

---

## 🏗️ Architecture in Oracle Integration Cloud (OIC)

```
[ Oracle Fusion Cloud ]
  (HCM / General Ledger)
           │
           ▼
[ Oracle Integration Cloud (OIC) ]
   ├─ 1. JavaScript Function: oic_talenta_hmac_generator.js
   ├─ 2. REST Adapter: Set Authorization & Date headers
   └─ 3. Transform & Map Payloads
           │
           ▼ (HTTPS + HMAC-SHA256)
[ Mekari Talenta Data API ]
   (https://api.mekari.com)
```

---

## ⚙️ Configuration in OIC

1. In OIC navigation, go to **Design > Libraries** and click **Import**.
2. Upload `oic_talenta_hmac_generator.js` and name it `TalentaHmacLibrary`.
3. In your integration orchestration:
   - Call `generateTalentaHeaders(clientId, clientSecret, method, pathWithQuery)`.
   - In the REST Adapter Request Header mapping:
     - Map returned `Authorization` to HTTP Header `Authorization`.
     - Map returned `Date` to HTTP Header `Date`.
     - Map `Content-Type` and `Accept` to `application/json`.
4. Invoke Mekari Talenta endpoint (`https://api.mekari.com`).
