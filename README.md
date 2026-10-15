# Mekari Talenta API Guidelines & Enterprise Implementations

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Authentication: HMAC-SHA256](https://img.shields.io/badge/Auth-HMAC--SHA256-blue.svg)](#-hmac-authentication-specification)
[![Product: Mekari Talenta](https://img.shields.io/badge/Product-Mekari%20Talenta-orange.svg)](https://talenta.co)
[![API Version: v2 & v3](https://img.shields.io/badge/API-v2%20%26%20v3-brightgreen.svg)](#-core-endpoints-overview)
[![Enterprise Ready](https://img.shields.io/badge/Enterprise-NetSuite%20%7C%20SAP%20B1%20%7C%20Oracle%20Fusion-purple.svg)](#-available-implementations)

This repository provides production-ready, verified integration guidelines, code examples, and enterprise ERP connectors for the **Mekari Talenta Data API (v2 & v3)** using **HMAC-SHA256 authentication**.

Mekari Talenta is Indonesia's leading cloud-based HRIS, Payroll, Attendance, and Employee Management platform. This repository demonstrates how to integrate Talenta with external systems, internal microservices, biometric devices, and enterprise ERP systems like Oracle NetSuite, SAP Business One, and Oracle Fusion Cloud.

---

## 📖 Table of Contents
1. [Developer Portals & Base URLs](#-developer-portals--base-urls)
2. [How to Generate Credentials (MDC)](#-how-to-generate-credentials-in-mekari-developer-center-mdc)
3. [HMAC Authentication Specification](#-hmac-authentication-specification)
4. [Core Endpoints Overview](#-core-endpoints-overview)
5. [Permission Scopes Reference](#-permission-scopes-reference)
6. [Available Implementations](#-available-implementations)
7. [Postman Collection Guide](#-postman-collection-guide)
8. [Troubleshooting & Common Errors](#-troubleshooting--common-errors)
9. [Official References](#-official-references)
10. [License](#-license)

---

## 🌐 Developer Portals & Base URLs

Mekari provides isolated environments for testing and production:

| Environment | Developer Center (MDC) | API Gateway Base URL | Web Portal |
|---|---|---|---|
| **Sandbox (Testing)** | [sandbox-developers.mekari.com](https://sandbox-developers.mekari.com) | `https://sandbox-api.mekari.com` | [sandbox-hr.talenta.co](https://sandbox-hr.talenta.co) |
| **Production (Live)** | [developers.mekari.com](https://developers.mekari.com) | `https://api.mekari.com` | [talenta.co](https://talenta.co) |

> 📌 **Note on Endpoint Versioning**:  
> Most modern endpoints use `/v2/talenta/v3/...` (e.g., `/v2/talenta/v3/employees`). Certain modules continue under `/v2/talenta/v2/...` (e.g., `/v2/talenta/v2/live-attendance/clock-in`, `/v2/talenta/v2/time-off`). Both versions share identical HMAC signing rules.

---

## 🔑 How to Generate Credentials in Mekari Developer Center (MDC)

1. Log in to [MDC Sandbox](https://sandbox-developers.mekari.com) or [MDC Production](https://developers.mekari.com).
2. Go to **Applications** > click **Create Application**.
3. Fill in your **Application Name** and select the product **Mekari Talenta**.
4. Check the necessary **Scopes** required for your integration (e.g. Employee, Attendance, Payroll, Time Off).
5. Save the application and go to **Application Details > Credentials**.
6. Copy your **Client ID** (`hmac_username`) and **Client Secret** (`hmac_secret`).
7. ⚠️ *Keep your Client Secret secure — it is only displayed once upon generation.*

---

## 🔐 HMAC Authentication Specification

Mekari Talenta API requires cryptographic **HMAC-SHA256 request signing** for every HTTP transaction.

```http
GET /v2/talenta/v3/employees?limit=10&page=1 HTTP/1.1
Host: api.mekari.com
Date: Thu, 15 Oct 2026 06:15:00 GMT
Authorization: hmac username="<CLIENT_ID>", algorithm="hmac-sha256", headers="date request-line", signature="<SIGNATURE>"
Content-Type: application/json
Accept: application/json
```

### 1. Date Header (RFC 1123 / UTC)
The `Date` header must be in GMT/UTC formatted according to RFC 1123:
```
Thu, 15 Oct 2026 06:15:00 GMT
```
*Your server's clock must be synchronized with NTP. Clock drift exceeding 5 minutes will result in `401 Unauthorized`.*

### 2. Request Line Construction
The request line must follow:
```
[METHOD] [PATH_WITH_QUERY] HTTP/1.1
```
*Examples:*
- `GET /v2/talenta/v3/employees?limit=10&page=1 HTTP/1.1`
- `POST /v2/talenta/v2/live-attendance/clock-in HTTP/1.1`
- `GET /v2/talenta/v2/time-off?start_date=2026-01-01&end_date=2026-12-31 HTTP/1.1`

> ⚠️ **Important**: If the URL contains query parameters, the query parameters **must** be included in the request-line signing string.

### 3. Signing String Construction
Combine the Date header and request line separated by a single newline (`\n`):
```text
date: Thu, 15 Oct 2026 06:15:00 GMT
GET /v2/talenta/v3/employees?limit=10&page=1 HTTP/1.1
```

### 4. Compute HMAC-SHA256 Signature
Compute the HMAC-SHA256 digest of the signing string using your `hmac_secret` (Client Secret) and Base64-encode it:
```text
signature = Base64( HMAC-SHA256( signingString, clientSecret ) )
```

### 5. Authorization Header Format
Combine into the standard header:
```text
hmac username="<CLIENT_ID>", algorithm="hmac-sha256", headers="date request-line", signature="<SIGNATURE>"
```

---

## ⚡ Core Endpoints Overview

| Category | Method | Path | Description |
|---|---|---|---|
| **Employee Directory** | `GET` | `/v2/talenta/v3/employees` | Get paginated list of employees with approval line & job data |
| **Employee Profile** | `GET` | `/v2/talenta/v3/employees/:userId` | Get full employee profile including custom fields |
| **Create Employee** | `POST` | `/v2/talenta/v3/employees` | Onboard a new employee into Talenta |
| **Live Attendance** | `POST` | `/v2/talenta/v2/live-attendance/clock-in` | Record clock-in with GPS coordinates & notes |
| **Live Attendance** | `POST` | `/v2/talenta/v2/live-attendance/clock-out` | Record clock-out with GPS coordinates & notes |
| **Daily Attendance** | `GET` | `/v2/talenta/v2/attendance` | Query daily attendance logs for payroll calculation |
| **Payroll Reports** | `GET` | `/v2/talenta/v3/payroll` | Fetch finalized payroll run data & components |
| **General Ledger** | `GET` | `/v2/talenta/v3/general-ledger` | Fetch payroll journal vouchers for ERP GL sync |
| **SAP B1 ERP** | `GET` | `/v2/talenta/v2/erp/entries/business-one` | Pre-formatted SAP Business One ERP entries |
| **Time Off** | `GET` | `/v2/talenta/v2/time-off` | Query leave requests and approval status |
| **Submit Leave** | `POST` | `/v2/talenta/v2/time-off` | Submit a new time-off / leave application |
| **Shift Roster** | `GET` | `/v2/talenta/v2/shift/:userId/list` | Retrieve work shift schedule for an employee |
| **Overtime** | `POST` | `/v2/talenta/v2/overtime` | Submit an overtime request |

---

## 🛡️ Permission Scopes Reference

When configuring your application in the Mekari Developer Center (MDC), ensure the following scopes are enabled:

| Scope | Description | Typical Use Case |
|---|---|---|
| `employee:read` | Read employee master data | Syncing employees to ERP / Active Directory |
| `employee:write` | Create / update employee profiles | Onboarding from ATS / external HR systems |
| `attendance:read` | Read attendance and clock-in logs | Calculating worked hours in payroll |
| `attendance:write` | Post clock-in / clock-out | Biometric turnstile & RFID punch integration |
| `timeoff:read` | Query time off requests & balances | Leave balance visibility on internal intranet |
| `timeoff:write` | Create leave requests & approvals | Internal approval workflow automation |
| `payroll:read` | Read payroll calculations & payslips | Financial accounting & journal vouchers |
| `overtime:read` / `write` | Query and submit overtime claims | Shift and factory scheduling |

---

## 💻 Available Implementations

Explore ready-to-run examples and enterprise integrations in their respective folders:

| Directory | Language / Platform | Description | Zero External Deps? |
|---|---|---|:---:|
| [`postman/`](./postman) | Postman | Full collection (43 folders) with automated pre-request HMAC script | ✅ |
| [`nodejs/`](./nodejs) | Node.js (>= 18) | Native `crypto` and `fetch` implementation | ✅ |
| [`python/`](./python) | Python (3.8+) | Built-in `urllib.request`, `hmac`, `hashlib` | ✅ |
| [`php/`](./php) | PHP (7.4+, 8.x) | Native `curl` and `hash_hmac` | ✅ |
| [`go/`](./go) | Go (1.20+) | Native `crypto/hmac`, `crypto/sha256`, `net/http` | ✅ |
| [`bash/`](./bash) | Bash / cURL | Shell script using `openssl` and `curl` | ✅ |
| [`java/`](./java) | Java (11+) | Native `java.net.http.HttpClient` with zero external libs | ✅ |
| [`dotnet/`](./dotnet) | .NET 8.0 (C#) | Modern C# client with `HMACSHA256` and `HttpClient` | ✅ |
| [`netsuite/`](./netsuite) | Oracle NetSuite | SuiteScript 2.1 module & Map/Reduce Employee sync script | ✅ |
| [`sap-business-one/`](./sap-business-one) | SAP Business One | C# Service Layer connector for Employee Master & GL Journal Entries | ✅ |
| [`oracle-fusion/`](./oracle-fusion) | Oracle Fusion Cloud | Oracle Integration Cloud (OIC) HMAC JavaScript library | ✅ |

---

## 📮 Postman Collection Guide

1. Open Postman and import [`postman/Mekari_Talenta_API.postman_collection.json`](./postman/Mekari_Talenta_API.postman_collection.json).
2. Import [`postman/Mekari_Talenta_Environment.postman_environment.json`](./postman/Mekari_Talenta_Environment.postman_environment.json).
3. Set your `hmac_username` (`TALENTA_CLIENT_ID`) and `hmac_secret` (`TALENTA_CLIENT_SECRET`).
4. Select any endpoint (e.g. `Employee v3 > Get List of Employees`) and click **Send**. The collection-level pre-request script computes the signature automatically.

---

## ❓ Troubleshooting & Common Errors

### 1. `401 Unauthorized` / Invalid Signature
- **Cause**: The signing string does not match what the server computes.
- **Check**:
  - Did you include query parameters in the request line? (e.g. `GET /v2/talenta/v3/employees?limit=5 HTTP/1.1`).
  - Is the `Date` header in exact RFC 1123 GMT format?
  - Does the signing string use a single `\n` without trailing spaces?

### 2. `401 Unauthorized` / Clock Skew
- **Cause**: Your local server clock differs by more than 5 minutes from NTP UTC.
- **Resolution**: Synchronize system time using `ntpdate` or system clock settings.

### 3. `403 Forbidden` / Insufficient Scopes
- **Cause**: The application in MDC was not granted the scope for the requested endpoint.
- **Resolution**: Edit the application in [MDC](https://developers.mekari.com), enable the required scope, and save.

---

## 📚 Official References

- **Mekari Talenta Official Postman Docs**: [Talenta Data API Documenter](https://documenter.getpostman.com/view/12246328/UVR5qp6v#e3f57c9b-05f8-4314-9c63-a88f907492f9)
- **Mekari Developer Center (Production)**: [developers.mekari.com](https://developers.mekari.com)
- **Mekari Developer Center (Sandbox)**: [sandbox-developers.mekari.com](https://sandbox-developers.mekari.com)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
