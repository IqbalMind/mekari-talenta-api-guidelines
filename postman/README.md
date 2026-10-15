# Mekari Talenta Data API - Postman Collection Guide

This folder contains the complete, official Postman collection and environment for integrating with the **Mekari Talenta Data API (v2 and v3)** via **HMAC-SHA256 authentication**.

---

## 📁 Files in This Directory

| File | Description |
|---|---|
| [`Mekari_Talenta_API.postman_collection.json`](./Mekari_Talenta_API.postman_collection.json) | Full API collection (43 folders: Employee, Attendance, Payroll, General Ledger, Time Off, Shift, Overtime, ERP, etc.) |
| [`Mekari_Talenta_Environment.postman_environment.json`](./Mekari_Talenta_Environment.postman_environment.json) | Environment template with base URLs and credential variables |

---

## ⚙️ How HMAC Signing Works in Postman

The collection includes a pre-request script at the **Collection Level** (`event[prerequest]`), which automatically computes the HMAC-SHA256 signature for every request:

```javascript
const Header = require('postman-collection').Header;
const url = require('url');

const hmac_username = pm.environment.get('hmac_username') || pm.collectionVariables.get('hmac_username');
const hmac_secret = pm.environment.get('hmac_secret') || pm.collectionVariables.get('hmac_secret');

const requestUrl = url.parse(request['url']);
// Builds request line including path and query parameters
const requestLine = pm.request.method + ' ' + requestUrl.path + ' HTTP/1.1';
const dateString = new Date().toUTCString();

// Signing payload: date: <RFC 1123>\n<requestLine>
const digest = CryptoJS.HmacSHA256(['date: ' + dateString, requestLine].join('\n'), hmac_secret);
const signature = CryptoJS.enc.Base64.stringify(digest);
const hmac_header = 'hmac username="' + hmac_username + '", algorithm="hmac-sha256", headers="date request-line", signature="' + signature + '"';

pm.request.headers.add(new Header("Authorization: " + hmac_header));
pm.request.headers.add(new Header("Date: " + dateString));
```

---

## 🚀 Quick Start Guide

### 1. Import Collection and Environment
1. Open **Postman**.
2. Click **Import** (top left).
3. Drag and drop both:
   - `Mekari_Talenta_API.postman_collection.json`
   - `Mekari_Talenta_Environment.postman_environment.json`

### 2. Configure Environment Variables
1. Select the imported environment **"Mekari Talenta API - Production / Sandbox"** in the top-right environment selector.
2. Edit the environment variables:
   - `base_url`: `https://api.mekari.com` (or `https://sandbox-api.mekari.com`)
   - `host_tda_v3`: `https://api.mekari.com/v2/talenta/v3` (or `https://sandbox-api.mekari.com/v2/talenta/v3`)
   - `hmac_username`: Your Mekari API Client ID from [MDC](https://developers.mekari.com)
   - `hmac_secret`: Your Mekari API Client Secret from [MDC](https://developers.mekari.com)
3. Click **Save**.

### 3. Send Your First Request
1. Expand folder **Employee v3** > select **Get List of Employees**.
2. URL: `{{base_url}}/v2/talenta/v3/employees`
3. Click **Send**.
4. You should receive `200 OK` with the list of employee records.

---

## 🛠️ Common Endpoints to Explore

1. **Employee Management**:
   - `GET {{base_url}}/v2/talenta/v3/employees` – Retrieve paginated employee master data.
   - `GET {{base_url}}/v2/talenta/v3/employees/:userId` – Retrieve specific employee profile.
2. **Attendance Integration**:
   - `POST {{base_url}}/v2/talenta/v2/live-attendance/clock-in` – Post clock-in entry with coordinates and notes.
   - `POST {{base_url}}/v2/talenta/v2/live-attendance/clock-out` – Post clock-out entry.
3. **Payroll & General Ledger (ERP Sync)**:
   - `GET {{base_url}}/v2/talenta/v3/payroll` – Download payroll summary.
   - `GET {{base_url}}/v2/talenta/v2/erp/entries/business-one` – SAP Business One ERP entries.
4. **Time Off (Leave)**:
   - `GET {{base_url}}/v2/talenta/v2/time-off` – Query leave requests by status or date range.
   - `POST {{base_url}}/v2/talenta/v2/time-off` – Submit new leave request.
