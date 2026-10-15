# Deploying PhishGuard AI on Render with MongoDB Atlas & Gemini API

This guide provides step-by-step instructions for:
1. **Configuring the Google Gemini API Key** (where to put it locally vs in Render).
2. **Setting up MongoDB Atlas (Cloud)** and transferring existing local data.
3. **Deploying to Render** as a unified full-stack web service.

---

## 🔑 1. Where to Put the Gemini API Key?

> **Rule:** Never commit API keys to Git! Use environment variables.

### A. For Local Development:
Put it in your `.env` file at the root of the project:
```ini
GEMINI_API_KEY=AIzaSyYourSecretKeyFromGoogleStudio
GEMINI_MODEL=gemini-flash-latest
```

### B. For Render Deployment:
In Render, environment variables are managed securely through the Render Dashboard:
1. Go to your Render Dashboard at [dashboard.render.com](https://dashboard.render.com).
2. Click on your **PhishGuard Web Service**.
3. Select the **"Environment"** tab on the left menu.
4. Click **"Add Environment Variable"**:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** `AIzaSy...` (your key from [Google AI Studio](https://aistudio.google.com/))
5. Click **"Save Changes"**. Render will automatically redeploy with the key encrypted in memory.

---

## 🍃 2. Setting Up MongoDB Atlas & Transferring Data

### Step 1: Create a Free MongoDB Atlas Database
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and sign in or create a free account.
2. Click **"Create a Deployment"** and select the **M0 Free Shared Tier** (AWS or Google Cloud, region closest to your users).
3. Under **Security Quickstart**:
   - Create a Database User: e.g., Username: `phishguard_admin`, Password: *(generate a strong password and save it)*.
   - Click **"Create Database User"**.
4. Under **Where would you like to connect from?**:
   - Choose **"Cloud Environment"** or select **"Allow Access from Anywhere"** (`0.0.0.0/0`).
   - *(Note: Render services have dynamic IP addresses, so `0.0.0.0/0` is required for Render to connect).*
5. Click **"Finish and Close"**.

### Step 2: Copy the Connection String
1. On your Atlas cluster dashboard, click **"Connect"**.
2. Select **"Drivers"** (Node.js).
3. Copy the connection string. It will look like this:
   ```
   mongodb+srv://phishguard_admin:<db_password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<db_password>` with your actual password, and specify the database name `phishguard` before the `?`:
   ```
   mongodb+srv://phishguard_admin:MySuperPassword123@cluster0.abcde.mongodb.net/phishguard?retryWrites=true&w=majority
   ```

### Step 3: Transferring Existing Local Data to Atlas (Optional)
If you have analysis records in your local MongoDB that you wish to transfer to Atlas, you can use MongoDB's standard backup tools:

```bash
# 1. Export local database to a dump folder:
mongodump --uri="mongodb://localhost:27017/phishing_awareness" --out=./mongo_backup

# 2. Restore into your MongoDB Atlas cloud cluster:
mongorestore --uri="mongodb+srv://phishguard_admin:MySuperPassword123@cluster0.abcde.mongodb.net/phishguard" ./mongo_backup/phishing_awareness
```

---

## 🚀 3. Deploying to Render (2 Methods)

The repository is configured as a unified monorepo: in production, Express automatically serves the built React frontend from `client/dist`, so you only need **one single Render Web Service** (no dual services, zero CORS friction).

### Method A: 1-Click Render Blueprint (Recommended)
We have included a `render.yaml` blueprint in the repository:
1. Push your code to your GitHub/GitLab repository.
2. In the Render Dashboard, click **"New +"** -> **"Blueprint"**.
3. Select your repository.
4. Render will read `render.yaml` and prompt you for the 2 secret keys:
   - `MONGODB_URI`: paste your MongoDB Atlas connection string.
   - `GEMINI_API_KEY`: paste your Gemini API key.
5. Click **"Apply"**. Render will build both workspaces and launch your full-stack site!

---

### Method B: Manual Web Service Setup
If you prefer creating the service manually:
1. In Render Dashboard, click **"New +"** -> **"Web Service"**.
2. Connect your Git repository.
3. Configure the settings:
   - **Name:** `phishguard-ai` (or your preferred name)
   - **Region:** Any region (e.g., Oregon or Frankfurt)
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm install && npm run build
     ```
   - **Start Command:**
     ```bash
     npm start
     ```
   - **Instance Type:** `Free`

4. Scroll down to **"Environment Variables"** and add:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production static serving and optimizations |
   | `PORT` | `10000` | Render's standard port |
   | `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
   | `GEMINI_API_KEY` | `AIzaSy...` | Your Google Gemini API Key |
   | `GEMINI_MODEL` | `gemini-flash-latest` | Fast, high-accuracy flash model (default: `gemini-flash-latest`) |
   | `JWT_ACCESS_SECRET` | *(random 32+ char string)* | Key for signing short-lived access tokens |
   | `JWT_REFRESH_SECRET` | *(random 32+ char string)* | Key for signing refresh tokens |
   | `CORS_ORIGIN` | `*` | In unified single-service mode, requests are same-origin |

5. Click **"Create Web Service"**.

---

## ✅ 4. Verifying Your Live Deployment

Once Render finishes the build (usually takes ~90 seconds):
1. **Visit your Render URL:** `https://your-service-name.onrender.com`
   - The React UI should load immediately with the dark-mode PhishGuard interface.
2. **Check API Health & Database Status:**
   - Visit: `https://your-service-name.onrender.com/api/health`
   - You should see:
     ```json
     {
       "status": "ok",
       "database": "connected",
       "llmConfigured": true
     }
     ```
   - If `database: "connected"`, your MongoDB Atlas connection is working!
   - If `llmConfigured: true`, your Gemini API key is active!
3. **Run a Test Analysis:**
   - Paste a sample or select a one-click demo card and click **"Analyze Message"**.
   - Verify the Risk Gauge, AI Explanation, and History drawer work end-to-end on your live Render deployment.

---

## 🛠️ 5. Deployment Troubleshooting & Tips

### MongoDB Atlas "ServerSelectionTimeoutError"
- **Cause:** Render dynos use dynamic IP ranges. If MongoDB Atlas has not whitelisted all IPs, the connection will time out.
- **Fix:** In your MongoDB Atlas Dashboard, go to **Network Access** > **IP Access List** > Click **"Add IP Address"** > Click **"Allow Access From Anywhere"** (`0.0.0.0/0`) > Confirm.

### Render Free-Tier Cold Starts (~50 seconds)
- On Render's Free tier, services spin down after 15 minutes of inactivity.
- The first inbound request may take ~45–50 seconds to boot the container. Once awake, response times drop to sub-second.
- **Tip for Demo:** Open `https://your-service.onrender.com/api/health` 2 minutes before presenting to pre-warm the instance.

### Pre-Deployment Local Sanity Check
You can test the exact Render production build locally before pushing to Git:
```bash
# 1. Clean build of both server & client
npm run build

# 2. Start unified production server
NODE_ENV=production npm start
```
Then visit `http://localhost:5001` in your browser. Both the React frontend and API will run from the single Express process.

