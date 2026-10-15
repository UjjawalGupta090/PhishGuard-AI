# PhishGuard AI: REST API Specification

The PhishGuard AI backend provides a comprehensive RESTful JSON API supporting message evaluation, privacy-safe history tracking, and full user lifecycle management.

---

## 1. Global Conventions & Standards

- **Base URL:**
  - Local API Server: `http://localhost:5001/api`
  - Vite Dev Proxy: `http://localhost:5173/api`
  - Render Cloud / Unified Production: `https://your-service.onrender.com/api` (or `/api` relative same-origin)
- **Content-Type:** `application/json`
- **Security Headers Enforced:**
  - `X-Requested-With: XMLHttpRequest` (Mandatory on state-changing requests: `POST`, `PUT`, `PATCH`, `DELETE`)
  - `X-Session-Id`: Random UUID string identifying anonymous browser sessions for Guest Mode
- **Authentication:**
  - Managed via secure `httpOnly`, `sameSite: 'lax'` cookies: `access_token` (15m expiration) and `refresh_token` (7d expiration).
  - Also accepts standard HTTP header: `Authorization: Bearer <access_token>`.

### Error Response Format
All errors return consistent JSON conforming to the `ApiErrorResponse` schema:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid credentials.",
    "details": null
  }
}
```

---

## 2. Analysis Endpoints

### `POST /api/analyze`
Submits an email, SMS alert, or chat thread for hybrid phishing and social engineering evaluation.

- **Rate Limit:** 20 requests / minute / IP
- **Headers:** `X-Requested-With: XMLHttpRequest`, `X-Session-Id: <uuid>`
- **Request Body:**
  ```json
  {
    "text": "URGENT: Your SBI bank account has been suspended due to pending KYC. Visit http://sbi-kyc-update.com/verify to prevent permanent deactivation.",
    "redact": true
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "id": "67123abcdef8901234567890",
    "riskLevel": "high",
    "finalScore": 96,
    "scoreBreakdown": {
      "ruleScore": 95,
      "llmScore": 98,
      "finalScore": 96,
      "floorApplied": null,
      "weights": [0.65, 0.85, 0.75, 0.8]
    },
    "indicators": [
      {
        "id": "ind-0",
        "category": "urgency",
        "severity": "high",
        "weight": 0.65,
        "start": 0,
        "end": 6,
        "matchedText": "URGENT",
        "reason": "Artificial urgency designed to bypass critical thinking.",
        "source": "rule"
      },
      {
        "id": "ind-1",
        "category": "smishing_india",
        "severity": "high",
        "weight": 0.8,
        "start": 14,
        "end": 67,
        "matchedText": "Your SBI bank account has been suspended due to pending KYC",
        "reason": "Common Indian smishing vector impersonating State Bank of India KYC.",
        "source": "rule"
      },
      {
        "id": "ind-2",
        "category": "link_risk",
        "severity": "high",
        "weight": 0.75,
        "start": 74,
        "end": 108,
        "matchedText": "http://sbi-kyc-update.com/verify",
        "reason": "Non-TLS HTTP link impersonating bank brand.",
        "source": "rule"
      }
    ],
    "explanation": {
      "summary": "This message is a fraudulent banking smishing attack impersonating SBI to harvest credentials.",
      "attackerGoal": "Steal online banking login credentials, net banking passwords, and OTP tokens.",
      "reasoning": [
        "Uses high-pressure fear tactics threatening immediate account suspension.",
        "Links to an unverified non-TLS HTTP domain ('sbi-kyc-update.com') instead of official banking portals.",
        "Banks in India never ask customers to update KYC via third-party SMS links."
      ],
      "confidence": "high"
    },
    "recommendations": {
      "doNow": [
        "Do not click the link or provide any personal details.",
        "Check your official bank account status by logging in directly at onlinesbi.sbi."
      ],
      "dontDo": [
        "Never share OTPs, net banking passwords, or UPI PINs.",
        "Do not call back the phone number or reply to the SMS."
      ],
      "reportTo": [
        "Report to the National Cyber Crime Reporting Portal at cybercrime.gov.in.",
        "Dial the National Cyber Financial Fraud helpline at 1930."
      ]
    },
    "channelGuess": "sms",
    "aiAvailable": true,
    "seenBefore": false,
    "createdAt": "2026-10-15T05:00:00.000Z",
    "redactedPreview": "URGENT: Your SBI bank account has been suspended due to pending KYC..."
  }
  ```

---

## 3. History Endpoints

### `GET /api/history`
Returns paginated past analysis records belonging to the active user (if authenticated) or the current browser session ID (if guest).

- **Query Parameters:**
  - `page` (integer, default: `1`)
  - `limit` (integer, default: `20`, max: `50`)
- **Response (200 OK):**
  ```json
  {
    "records": [
      {
        "id": "67123abcdef8901234567890",
        "createdAt": "2026-10-15T05:00:00.000Z",
        "riskLevel": "high",
        "finalScore": 96,
        "indicatorSummary": [
          { "category": "urgency", "severity": "high", "count": 1 },
          { "category": "smishing_india", "severity": "high", "count": 1 },
          { "category": "link_risk", "severity": "high", "count": 1 }
        ],
        "redactedPreview": "URGENT: Your SBI bank account has been suspended due to pending KYC...",
        "explanationSummary": "This message is a fraudulent banking smishing attack impersonating SBI...",
        "aiAvailable": true,
        "channelGuess": "sms"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
  ```

### `GET /api/history/:id`
Retrieves a single historical record by MongoDB ObjectId. Requires matching session/user ownership.

### `DELETE /api/history/:id`
Deletes a specific analysis record from the user's or guest's history.

- **Headers:** `X-Requested-With: XMLHttpRequest`
- **Response (200 OK):**
  ```json
  { "success": true }
  ```

### `DELETE /api/history`
Clears all analysis records in the current session or user account.

- **Headers:** `X-Requested-With: XMLHttpRequest`
- **Response (200 OK):**
  ```json
  { "deletedCount": 5 }
  ```

---

## 4. Authentication & Profile Endpoints

### `POST /api/auth/signup`
Creates a new account, auto-migrates existing guest session history, and sets auth cookies.

- **Rate Limit:** 5 requests / minute / IP
- **Headers:** `X-Requested-With: XMLHttpRequest`, `X-Session-Id: <uuid>`
- **Request Body:**
  ```json
  {
    "email": "analyst@security.org",
    "password": "CorrectHorseBatteryStaple123"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "user": {
      "id": "6719999abcdef01234567890",
      "email": "analyst@security.org",
      "createdAt": "2026-10-15T05:10:00.000Z"
    }
  }
  ```

### `POST /api/auth/login`
Authenticates a user, auto-migrates guest session records, and sets auth cookies.

- **Rate Limit:** 5 requests / minute / IP
- **Request Body:**
  ```json
  {
    "email": "analyst@security.org",
    "password": "CorrectHorseBatteryStaple123"
  }
  ```
- **Response (200 OK):** Returns `{ "user": { ... } }` and sets `access_token` + `refresh_token` cookies.

### `POST /api/auth/logout`
Clears `access_token` and `refresh_token` cookies.

### `POST /api/auth/refresh`
Verifies the `refresh_token` cookie and issues a fresh `access_token`.

### `GET /api/auth/me`
Returns profile metadata of the currently authenticated user. Returns 401 if unauthenticated.

### `DELETE /api/auth/me`
**GDPR Right to Be Forgotten:** Permanently purges user account and deletes all associated analysis records in MongoDB.

- **Headers:** `X-Requested-With: XMLHttpRequest`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Account and associated history deleted permanently."
  }
  ```

---

## 5. System Health

### `GET /api/health`
Returns system status, database connection state, and uptime.

- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-15T05:20:00.000Z",
    "uptime": 3600.25,
    "database": "connected",
    "llmConfigured": true
  }
  ```
