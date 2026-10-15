# Mekari Talenta API - SAP Business One Integration

Production-ready integration architecture for synchronizing **Mekari Talenta Data API** with **SAP Business One (B1)** via **Service Layer (REST)** or **DI Server**.

---

## 📁 Files Included

| File | Type | Description |
|---|---|---|
| [`SapB1TalentaService.cs`](./SapB1TalentaService.cs) | C# Service | Implements HMAC authentication with Talenta and maps data to SAP B1 Service Layer entities (`EmployeesInfo` and `JournalEntries`). |

---

## 🔄 Integration Workflows

### 1. Employee Master Data Sync (Talenta -> SAP B1 `OHEM`)
Syncs active employee roster from Talenta (`GET /v2/talenta/v3/employees`) to SAP B1 Service Layer:
- **Endpoint in SAP B1**: `POST /b1s/v1/EmployeesInfo`
- **Field Mappings**:
  - `first_name`, `last_name` -> `FirstName`, `LastName`
  - `email` -> `eMail`
  - `mobile_phone` -> `MobilePhone`
  - `job_position` -> `JobTitle`

### 2. Payroll Journal Voucher Sync (Talenta -> SAP B1 `OJDT / JDT1`)
After monthly payroll finalization in Talenta, the payroll summary is exported to SAP B1 General Ledger:
- **Endpoint in SAP B1**: `POST /b1s/v1/JournalEntries`
- **Balanced Double-Entry Accounting**:
  - **Debit**: Salaries & Wages Expense (`grossSalary`)
  - **Credit**: PPh 21 Withholding Tax Payable (`pph21Tax`)
  - **Credit**: BPJS Payable (`bpjsDeductions`)
  - **Credit**: Payroll Bank Clearing Account (`netSalary`)
