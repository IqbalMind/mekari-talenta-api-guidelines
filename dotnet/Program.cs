using System;
using System.Text.Json;
using System.Threading.Tasks;

namespace Mekari.Talenta
{
    internal class Program
    {
        static async Task Main(string[] args)
        {
            string clientId = Environment.GetEnvironmentVariable("TALENTA_CLIENT_ID") ?? "YOUR_CLIENT_ID";
            string clientSecret = Environment.GetEnvironmentVariable("TALENTA_CLIENT_SECRET") ?? "YOUR_CLIENT_SECRET";
            string baseUrl = Environment.GetEnvironmentVariable("TALENTA_BASE_URL") ?? "https://sandbox-api.mekari.com";

            Console.WriteLine("==================================================================");
            Console.WriteLine("Mekari Talenta API .NET 8.0 Integration");
            Console.WriteLine($"Base URL: {baseUrl}");
            Console.WriteLine("==================================================================");

            var api = new TalentaApi(clientId, clientSecret, baseUrl);

            // 1. Fetch Employees
            Console.WriteLine("\n--- Case 1: Fetch Employees Directory ---");
            string path = "/v2/talenta/v3/employees?limit=3&page=1";
            var headers = api.GenerateHeaders("GET", path);
            Console.WriteLine($"[HMAC Authorization] {headers.Authorization}");
            Console.WriteLine($"[HTTP Date]         {headers.Date}");

            try
            {
                var response = await api.GetEmployeesAsync(limit: 3, page: 1);
                string responseBody = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"\nHTTP Status: {(int)response.StatusCode} {response.StatusCode}");
                Console.WriteLine($"Response:\n{responseBody}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"\n❌ Request Error: {ex.Message}");
            }
        }
    }
}
