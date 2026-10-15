"""
Mekari Talenta API Integration Example (Python)

Demonstrates HMAC-SHA256 authentication for Mekari Talenta HRIS:
1. GET /v2/talenta/v3/employees (Employee Directory Sync)
2. POST /v2/talenta/v2/live-attendance/clock-in (Attendance Clock-In)
3. GET /v2/talenta/v2/time-off (Time Off / Leave Request Sync)
"""

import os
import json
import hmac
import hashlib
import base64
from datetime import datetime, timezone
import urllib.request
import urllib.error

CLIENT_ID = os.environ.get("TALENTA_CLIENT_ID", "YOUR_CLIENT_ID")
CLIENT_SECRET = os.environ.get("TALENTA_CLIENT_SECRET", "YOUR_CLIENT_SECRET")
BASE_URL = os.environ.get("TALENTA_BASE_URL", "https://sandbox-api.mekari.com")


def generate_hmac_headers(method: str, path_with_query: str, client_id: str, client_secret: str) -> dict:
    """
    Generate HMAC-SHA256 Authentication Headers for Mekari Talenta API.
    
    Format:
    Date: <RFC 1123 / UTC>
    Request-Line: <METHOD> <PATH_WITH_QUERY> HTTP/1.1
    Signature: Base64( HMAC-SHA256( "date: <Date>\n<Request-Line>", client_secret ) )
    """
    # 1. Format date as RFC 1123 / UTC (e.g. Thu, 15 Oct 2026 06:15:00 GMT)
    now_utc = datetime.now(timezone.utc)
    date_string = now_utc.strftime("%a, %d %b %Y %H:%M:%S GMT")

    # 2. Build Request Line
    request_line = f"{method.upper()} {path_with_query} HTTP/1.1"

    # 3. Build Signing Payload
    signing_string = f"date: {date_string}\n{request_line}"

    # 4. Compute HMAC-SHA256 Digest
    digest = hmac.new(
        client_secret.encode("utf-8"),
        signing_string.encode("utf-8"),
        hashlib.sha256
    ).digest()

    signature = base64.b64encode(digest).decode("utf-8")

    # 5. Build Authorization Header
    auth_header = (
        f'hmac username="{client_id}", '
        f'algorithm="hmac-sha256", '
        f'headers="date request-line", '
        f'signature="{signature}"'
    )

    return {
        "Authorization": auth_header,
        "Date": date_string,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }


def send_request(method: str, path_with_query: str, payload: dict = None):
    """Generic HTTP Request sender using Python urllib."""
    full_url = f"{BASE_URL}{path_with_query}"
    headers = generate_hmac_headers(method, path_with_query, CLIENT_ID, CLIENT_SECRET)

    print("=" * 66)
    print(f"[REQUEST] {method.upper()} {full_url}")
    print("Headers:")
    print(json.dumps(headers, indent=2))

    data_bytes = None
    if payload and method.upper() in ["POST", "PUT", "PATCH"]:
        data_bytes = json.dumps(payload).encode("utf-8")
        print("Payload Preview:")
        print(json.dumps(payload, indent=2))

    req = urllib.request.Request(full_url, data=data_bytes, headers=headers, method=method.upper())

    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            body = resp.read().decode("utf-8")
            try:
                res_json = json.loads(body)
                print(f"\n✅ Success! HTTP {status}")
                print(json.dumps(res_json, indent=2))
                return res_json
            except Exception:
                print(f"\n✅ Success! HTTP {status}\n{body}")
                return body
    except urllib.error.HTTPError as e:
        status = e.code
        err_body = e.read().decode("utf-8")
        print(f"\n❌ API Error: HTTP {status}")
        try:
            print(json.dumps(json.loads(err_body), indent=2))
        except Exception:
            print(err_body)
    except Exception as e:
        print(f"\n❌ Request failed: {e}")


def get_employees(limit: int = 5, page: int = 1):
    """CASE 1: Get Employee List."""
    path = f"/v2/talenta/v3/employees?limit={limit}&page={page}"
    print(f"\n--- Fetching Employees (Page {page}, Limit {limit}) ---")
    return send_request("GET", path)


def clock_in_attendance(latitude: float = -6.2088, longitude: float = 106.8456, notes: str = "Mobile Clock In via Python"):
    """CASE 2: Post Live Attendance Clock-In."""
    path = "/v2/talenta/v2/live-attendance/clock-in"
    payload = {
        "latitude": str(latitude),
        "longitude": str(longitude),
        "notes": notes,
        "status": "clock-in"
    }
    print("\n--- Submitting Live Attendance Clock-In ---")
    return send_request("POST", path, payload)


def get_time_off_requests(start_date: str = "2026-01-01", end_date: str = "2026-12-31"):
    """CASE 3: Get Time Off / Leave Requests."""
    path = f"/v2/talenta/v2/time-off?start_date={start_date}&end_date={end_date}&page=1&limit=10"
    print(f"\n--- Fetching Time Off Requests ({start_date} to {end_date}) ---")
    return send_request("GET", path)


if __name__ == "__main__":
    print("Mekari Talenta API Python Demonstration")
    print(f"Using Base URL: {BASE_URL}")

    # 1. Fetch Employees
    get_employees(3, 1)

    # 2. Fetch Time Off Requests
    get_time_off_requests()
