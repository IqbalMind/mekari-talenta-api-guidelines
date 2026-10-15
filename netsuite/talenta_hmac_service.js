/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 * Mekari Talenta API - SuiteScript 2.1 Service Module
 * Handles HMAC-SHA256 authentication and HTTP communication with Mekari Talenta Data API.
 */
define(['N/crypto', 'N/encode', 'N/https'], (crypto, encode, https) => {

    /**
     * Generate RFC 1123 / UTC Date string (e.g. Thu, 15 Oct 2026 06:15:00 GMT)
     */
    function getRfc1123Date() {
        return new Date().toUTCString();
    }

    /**
     * Generate HMAC-SHA256 headers for Mekari Talenta API
     * 
     * @param {Object} options
     * @param {string} options.method - HTTP method ('GET', 'POST', etc.)
     * @param {string} options.pathWithQuery - Endpoint path with query params (e.g. '/v2/talenta/v3/employees?limit=50')
     * @param {string} options.clientId - Mekari Client ID
     * @param {string} options.clientSecret - Mekari Client Secret
     * @returns {Object} Headers object
     */
    function generateHmacHeaders(options) {
        const method = options.method.toUpperCase();
        const pathWithQuery = options.pathWithQuery;
        const clientId = options.clientId;
        const clientSecret = options.clientSecret;

        // 1. Date header in RFC 1123 format
        const dateString = getRfc1123Date();

        // 2. Request Line format: '[METHOD] [PATH_WITH_QUERY] HTTP/1.1'
        const requestLine = `${method} ${pathWithQuery} HTTP/1.1`;

        // 3. Signing payload: 'date: <dateString>\n<requestLine>'
        const signingPayload = `date: ${dateString}\n${requestLine}`;

        // 4. HMAC-SHA256 signature using NetSuite N/crypto
        const hmacKey = crypto.createSecretKey({
            secret: clientSecret,
            encoding: encode.Encoding.UTF_8
        });

        const hmacObj = crypto.createHmac({
            algorithm: crypto.HashAlg.SHA256,
            key: hmacKey
        });

        hmacObj.update({
            input: signingPayload,
            encoding: encode.Encoding.UTF_8
        });

        const signature = hmacObj.digest({
            outputEncoding: encode.Encoding.BASE_64
        });

        // 5. Authorization header
        const authHeader = `hmac username="${clientId}", algorithm="hmac-sha256", headers="date request-line", signature="${signature}"`;

        return {
            'Authorization': authHeader,
            'Date': dateString,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * Send HTTP request to Talenta API
     * 
     * @param {Object} options
     * @param {string} options.baseUrl - e.g. 'https://api.mekari.com'
     * @param {string} options.method - 'GET', 'POST', etc.
     * @param {string} options.pathWithQuery - '/v2/talenta/v3/employees?limit=50'
     * @param {string} options.clientId
     * @param {string} options.clientSecret
     * @param {string} [options.body] - JSON body string
     * @returns {https.ClientResponse}
     */
    function sendRequest(options) {
        const headers = generateHmacHeaders(options);
        const url = `${options.baseUrl}${options.pathWithQuery}`;

        if (options.method.toUpperCase() === 'POST') {
            return https.post({
                url: url,
                headers: headers,
                body: options.body || '{}'
            });
        }

        return https.get({
            url: url,
            headers: headers
        });
    }

    return {
        generateHmacHeaders: generateHmacHeaders,
        sendRequest: sendRequest
    };
});
