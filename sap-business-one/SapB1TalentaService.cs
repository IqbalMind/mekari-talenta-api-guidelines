using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Mekari.Talenta.SapBusinessOne
{
    /// <summary>
    /// Service integrating Mekari Talenta HRIS with SAP Business One Service Layer / DI Server.
    /// Supports:
    /// 1. Synchronizing Employees from Talenta to SAP B1 Employee Master Data (OHEM).
    /// 2. Posting Talenta Payroll General Ledger Entries to SAP B1 Journal Entries (OJDT / JDT1).
    /// </summary>
    public class SapB1TalentaService
    {
        private readonly string _talentaClientId;
        private readonly string _talentaClientSecret;
        private readonly string _talentaBaseUrl;
        private readonly string _sapServiceLayerUrl;
        private readonly HttpClient _httpClient;

        public SapB1TalentaService(
            string talentaClientId,
            string talentaClientSecret,
            string? talentaBaseUrl = null,
            string? sapServiceLayerUrl = null,
            HttpClient? httpClient = null)
        {
            _talentaClientId = talentaClientId;
            _talentaClientSecret = talentaClientSecret;
            _talentaBaseUrl = talentaBaseUrl ?? "https://api.mekari.com";
            _sapServiceLayerUrl = sapServiceLayerUrl ?? "https://sapb1-server:50000/b1s/v1";
            _httpClient = httpClient ?? new HttpClient();
        }

        #region Talenta HMAC Generation
        public (string authHeader, string dateString) GenerateTalentaHeaders(string method, string pathWithQuery)
        {
            string dateString = DateTimeOffset.UtcNow.ToString("r");
            string requestLine = $"{method.ToUpperInvariant()} {pathWithQuery} HTTP/1.1";
            string stringToSign = $"date: {dateString}\n{requestLine}";

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_talentaClientSecret));
            byte[] hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(stringToSign));
            string signature = Convert.ToBase64String(hash);

            string authHeader = $"hmac username=\"{_talentaClientId}\", algorithm=\"hmac-sha256\", headers=\"date request-line\", signature=\"{signature}\"";
            return (authHeader, dateString);
        }
        #endregion

        #region Employee Sync (Talenta -> SAP B1 OHEM)
        /// <summary>
        /// Fetches employees from Talenta v3 and maps them to SAP B1 Employee Master Data
        /// </summary>
        public async Task<string> FetchTalentaEmployeesAsync(int limit = 50, int page = 1)
        {
            string pathWithQuery = $"/v2/talenta/v3/employees?limit={limit}&page={page}";
            var (authHeader, dateString) = GenerateTalentaHeaders("GET", pathWithQuery);

            using var request = new HttpRequestMessage(HttpMethod.Get, $"{_talentaBaseUrl}{pathWithQuery}");
            request.Headers.TryAddWithoutValidation("Authorization", authHeader);
            request.Headers.TryAddWithoutValidation("Date", dateString);
            request.Headers.TryAddWithoutValidation("Accept", "application/json");

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        /// <summary>
        /// Maps Talenta Employee JSON to SAP B1 Service Layer EmployeesInfo payload
        /// </summary>
        public object MapToSapB1Employee(string firstName, string lastName, string email, string mobilePhone, string jobTitle)
        {
            return new
            {
                FirstName = firstName,
                LastName = string.IsNullOrEmpty(lastName) ? firstName : lastName,
                eMail = email,
                MobilePhone = mobilePhone,
                JobTitle = jobTitle,
                Active = "tYES"
            };
        }
        #endregion

        #region Payroll GL Sync (Talenta -> SAP B1 OJDT Journal Entries)
        /// <summary>
        /// Maps Talenta Payroll summary to SAP Business One Journal Entry (OJDT / JDT1)
        /// </summary>
        public object MapToSapB1JournalEntry(
            DateTime postingDate,
            string memo,
            string salaryExpenseAccount,
            string taxPayableAccount,
            string bpjsPayableAccount,
            string bankAccount,
            decimal grossSalary,
            decimal pph21Tax,
            decimal bpjsDeductions,
            decimal netSalary)
        {
            return new
            {
                ReferenceDate = postingDate.ToString("yyyy-MM-dd"),
                DueDate = postingDate.ToString("yyyy-MM-dd"),
                TaxDate = postingDate.ToString("yyyy-MM-dd"),
                Memo = memo,
                JournalEntryLines = new List<object>
                {
                    // 1. Debit Gross Salary Expense
                    new
                    {
                        AccountCode = salaryExpenseAccount,
                        Debit = grossSalary,
                        Credit = 0.0m,
                        LineMemo = "Salaries and Wages Expense"
                    },
                    // 2. Credit PPh 21 Withholding Tax Payable
                    new
                    {
                        AccountCode = taxPayableAccount,
                        Debit = 0.0m,
                        Credit = pph21Tax,
                        LineMemo = "PPh 21 Withholding Tax Payable"
                    },
                    // 3. Credit BPJS Payable
                    new
                    {
                        AccountCode = bpjsPayableAccount,
                        Debit = 0.0m,
                        Credit = bpjsDeductions,
                        LineMemo = "BPJS Ketenagakerjaan & Kesehatan Payable"
                    },
                    // 4. Credit Bank (Net Salary to be disbursed)
                    new
                    {
                        AccountCode = bankAccount,
                        Debit = 0.0m,
                        Credit = netSalary,
                        LineMemo = "Net Payroll Bank Disbursement"
                    }
                }
            };
        }
        #endregion
    }
}
