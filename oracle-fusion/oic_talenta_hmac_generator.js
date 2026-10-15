/**
 * Oracle Integration Cloud (OIC) - JavaScript Action / Library
 * Mekari Talenta API HMAC-SHA256 Header Generator
 *
 * This function can be registered inside Oracle Integration Cloud (OIC) Libraries
 * and executed in an integration flow before invoking the generic REST Adapter
 * connecting to Mekari Talenta Data API.
 */

function generateTalentaHeaders(clientId, clientSecret, method, pathWithQuery) {
    var crypto = require('crypto');

    // 1. Format date as RFC 1123 / UTC (e.g. Thu, 15 Oct 2026 06:15:00 GMT)
    var dateString = new Date().toUTCString();

    // 2. Request Line: '[METHOD] [PATH_WITH_QUERY] HTTP/1.1'
    var requestLine = method.toUpperCase() + ' ' + pathWithQuery + ' HTTP/1.1';

    // 3. Signing String
    var signingPayload = 'date: ' + dateString + '\n' + requestLine;

    // 4. HMAC-SHA256 signature
    var hmac = crypto.createHmac('sha256', clientSecret);
    hmac.update(signingPayload);
    var signature = hmac.digest('base64');

    // 5. Authorization Header
    var authHeader = 'hmac username="' + clientId + '", algorithm="hmac-sha256", headers="date request-line", signature="' + signature + '"';

    return {
        "Authorization": authHeader,
        "Date": dateString,
        "Content-Type": "application/json",
        "Accept": "application/json"
    };
}

module.exports = {
    generateTalentaHeaders: generateTalentaHeaders
};
