# Mekari Talenta API - Java Implementation

Zero-dependency Java 11+ implementation of **HMAC-SHA256 authentication** for the **Mekari Talenta Data API** using `java.net.http.HttpClient`.

---

## 📋 Requirements
- Java 11 or higher
- Standard Java Runtime (zero external Maven/Gradle libraries required)

---

## 🚀 Quick Start

1. Compile:
   ```bash
   javac Example.java
   ```

2. Run:
   ```bash
   export TALENTA_CLIENT_ID="your_client_id"
   export TALENTA_CLIENT_SECRET="your_client_secret"
   export TALENTA_BASE_URL="https://sandbox-api.mekari.com" # or https://api.mekari.com

   java com.mekari.talenta.example.Example
   ```
   *(Or run directly without package: `java Example.java` in Java 11+)*

---

## 🔐 HMAC Signing Details

```java
String dateString = ZonedDateTime.now(ZoneOffset.UTC).format(DateTimeFormatter.RFC_1123_DATE_TIME);
String requestLine = String.format("%s %s HTTP/1.1", method.toUpperCase(), pathWithQuery);
String signingPayload = String.format("date: %s\n%s", dateString, requestLine);

Mac mac = Mac.getInstance("HmacSHA256");
SecretKeySpec secretKey = new SecretKeySpec(clientSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
mac.init(secretKey);
byte[] rawHmac = mac.doFinal(signingPayload.getBytes(StandardCharsets.UTF_8));
String signature = Base64.getEncoder().encodeToString(rawHmac);

String authHeader = String.format(
    "hmac username=\"%s\", algorithm=\"hmac-sha256\", headers=\"date request-line\", signature=\"%s\"",
    clientId, signature
);
```
