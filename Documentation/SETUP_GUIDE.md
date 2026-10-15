# PhishGuard AI: Setup & Execution Guide

This guide walks you through setting up, configuring, running, and testing PhishGuard AI in your local development environment.

---

## 1. Prerequisites

Ensure your development environment meets the following requirements:
- **Node.js:** Version 22.0.0 or higher (`node -v`)
- **NPM:** Version 10.0.0 or higher (`npm -v`)
- **MongoDB:** A running local or remote MongoDB instance, OR Docker to run the included `docker-compose.yml`.
- **Google Gemini API Key:** (Optional for rule-only mode; required for LLM semantic explanations). Obtainable from [Google AI Studio](https://aistudio.google.com/).

---

## 2. Quick Start (Under 2 Minutes)

### Step 1: Install Dependencies
From the repository root:
```bash
npm install
```
This installs dependencies across the entire monorepo (`server`, `client`, and root workspace).

### Step 2: Configure Environment Variables
Copy the example environment template:
```bash
cp .env.example .env
```

Open `.env` and configure your settings:
```ini
# Server Configuration
PORT=5001
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

# Database (Local MongoDB or MongoDB Atlas Cloud)
# Local: mongodb://localhost:27017/phishguard
# Atlas: mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/phishguard?retryWrites=true&w=majority
MONGODB_URI=mongodb://localhost:27017/phishguard

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-flash-latest

# JWT Secrets (replace with strong random strings for production)
JWT_ACCESS_SECRET=phishguard_super_secret_access_key_change_in_production_32chars
JWT_REFRESH_SECRET=phishguard_super_secret_refresh_key_change_in_production_32chars
```

> **Note:** If `GEMINI_API_KEY` is omitted or invalid, PhishGuard AI automatically activates its deterministic rule engine fallback, maintaining full operational readiness without crashing.

### Step 3: Start MongoDB
If using Docker:
```bash
docker-compose up -d mongodb
```
Or start your locally installed MongoDB service:
```bash
brew services start mongodb-community
# or: mongod --dbpath /path/to/data
```

### Step 4: Run the Development Servers
Start both the backend server and Vite frontend client concurrently:
```bash
npm run dev
```

The services will be available at:
- **Frontend Web UI:** `http://localhost:5173`
- **Backend API:** `http://localhost:5001`
- **API Health Check:** `http://localhost:5001/api/health`

---

## 3. Running Automated Tests

PhishGuard AI includes an automated Vitest test suite covering PII redaction, pattern rules, probabilistic scoring, API integration pipelines, and authentication lifecycles:

```bash
# Run all tests across the repository
npm run test

# Run tests in watch mode
npm run test --workspace=server -- --watch
```

**Test Suites Executed:**
1. `redact.test.ts` (10 tests): Luhn card validation, PAN, Aadhaar, phones, query params, idempotency.
2. `rules.test.ts` (9 tests): Pattern triggers across 11 categories, anchor mismatch, Indian smishing.
3. `scoring.test.ts` (11 tests): Noisy-OR compounding, safety floors, rule/LLM fusion.
4. `analyze.test.ts` (5 tests): Full analysis pipeline, min length validation, history clearing.
5. `auth.test.ts` (9 tests): In-memory MongoDB user signup, login, CSRF, refresh tokens, and GDPR account deletion.

**Total:** 44 passing tests.

---

## 4. Production Build & Execution

To build both workspaces (backend TypeScript compilation + frontend Vite bundle):
```bash
npm run build
```
This compiles the server into `server/dist/` and generates the optimized production bundle in `client/dist/`.

To run the unified production server:
```bash
npm start
```
Express will automatically serve both the React SPA at `/` and the REST API at `/api` on `http://localhost:5001`.

---

## 5. Troubleshooting & FAQ

### Port Conflicts
- If port `5001` is occupied, update `PORT=5002` in `.env` and update the proxy target in `client/vite.config.ts`.
- If port `5173` is occupied, Vite will automatically increment to `5174`.

### Disconnected Database Behavior
- If MongoDB is stopped, the application will continue to perform message analyses in memory. History queries will return an empty list gracefully rather than throwing unhandled server errors.

### Gemini API Rate Limits
- The LLM caller enforces a 15-second hard timeout. If Google Gemini experiences quota delays, the system immediately returns the deterministic rule score with `aiAvailable: false`.
