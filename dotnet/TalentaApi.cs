using System;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Mekari.Talenta
{
    public class TalentaApi
    {
        private readonly string _clientId;
        private readonly string _clientSecret;
        private readonly string _baseUrl;
        private readonly HttpClient _httpClient;

        public record HmacHeadersResult(
            string Authorization,
            string Date
        );

        public TalentaApi(string clientId, string clientSecret, string? baseUrl = null, HttpClient? httpClient = null)
        {
            _clientId = clientId ?? throw new ArgumentNullException(nameof(clientId));
            _clientSecret = clientSecret ?? throw new ArgumentNullException(nameof(clientSecret));
            _baseUrl = baseUrl ?? "https://sandbox-api.mekari.com";
            _httpClient = httpClient ?? new HttpClient();
        }

        /// <summary>
        /// Generates RFC 1123 Date and HMAC-SHA256 Authorization header for Talenta API.
        /// </summary>
        public HmacHeadersResult GenerateHeaders(string method, string pathWithQuery)
        {
            // 1. RFC 1123 UTC Date (e.g. Thu, 15 Oct 2026 06:15:00 GMT)
            string dateString = DateTimeOffset.UtcNow.ToString("r");

            // 2. Request Line format: '[METHOD] [PATH_WITH_QUERY] HTTP/1.1'
            string requestLine = $"{method.ToUpperInvariant()} {pathWithQuery} HTTP/1.1";

            // 3. Signing payload: 'date: <dateString>\n<requestLine>'
            string stringToSign = $"date: {dateString}\n{requestLine}";

            // 4. HMAC-SHA256 Base64 signature
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_clientSecret));
            byte[] hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(stringToSign));
            string signature = Convert.ToBase64String(hash);

            // 5. Authorization header
            string authHeader = $"hmac username=\"{_clientId}\", algorithm=\"hmac-sha256\", headers=\"date request-line\", signature=\"{signature}\"";

            return new HmacHeadersResult(authHeader, dateString);
        }

        /// <summary>
        /// Generic HTTP sender with Talenta HMAC headers
        /// </summary>
        public async Task<HttpResponseMessage> SendRequestAsync(string method, string pathWithQuery, string? jsonPayload = null)
        {
            string fullUrl = $"{_baseUrl}{pathWithQuery}";
            var headers = GenerateHeaders(method, pathWithQuery);

            using var request = new HttpRequestMessage(new HttpMethod(method.ToUpperInvariant()), fullUrl);

            request.Headers.TryAddWithoutValidation("Authorization", headers.Authorization);
            request.Headers.TryAddWithoutValidation("Date", headers.Date);
            request.Headers.TryAddWithoutValidation("Accept", "application/json");

            if (!string.IsNullOrEmpty(jsonPayload) && (method.Equals("POST", StringComparison.OrdinalIgnoreCase) || method.Equals("PUT", StringComparison.OrdinalIgnoreCase) || method.Equals("PATCH", StringComparison.OrdinalIgnoreCase)))
            {
                request.Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
            }

            return await _httpClient.SendAsync(request);
        }

        /// <summary>
        /// Fetch Employees Directory (GET)
        /// </summary>
        public async Task<HttpResponseMessage> GetEmployeesAsync(int limit = 5, int page = 1)
        {
            string pathWithQuery = $"/v2/talenta/v3/employees?limit={limit}&page={page}";
            return await SendRequestAsync("GET", pathWithQuery);
        }

        /// <summary>
        /// Post Live Attendance Clock-In (POST)
        /// </summary>
        public async Task<HttpResponseMessage> ClockInAttendanceAsync(double latitude, double longitude, string note = "C# Clock-In")
        {
            string path = "/v2/talenta/v2/live-attendance/clock-in";
            string payload = $"{{\"latitude\":\"{latitude:F6}\",\"longitude\":\"{longitude:F6}\",\"notes\":\"{note}\",\"status\":\"clock-in\"}}";
            return await SendRequestAsync("POST", path, payload);
        }
    }
}
