# PhishGuard AI 🛡️

> **Enterprise-Grade AI Phishing & Social Engineering Awareness Platform**  
> Evaluates suspicious emails, SMS messages, and chat threads by identifying threat indicators, explaining risks via LLM semantics, and delivering immediate, actionable safety recommendations.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-cyan.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple.svg)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Tests-44%20Passing-brightgreen.svg)]()
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)]()

---

## 📚 Complete Project Documentation

All in-depth technical documentation has been organized into the [`Documentation/`](./Documentation/) directory:

- 🏗️ **[Architecture & Security Specification](./Documentation/ARCHITECTURE.md):** System architecture diagram, sequence diagram, probabilistic Noisy-OR scoring formula, PII redaction pipeline, and threat model.
- ⏱️ **[3-Minute Hackathon Demo Script](./Documentation/DEMO_SCRIPT.md):** Minute-by-minute judging presentation flow, screen actions, spoken script, and judge Q&A cheat sheet.
- 📋 **[Requirements & Differentiators Audit](./Documentation/REQUIREMENTS_CHECKLIST.md):** Verbatim audit against all 6 required problem statement features and competitive differentiators.
- 🔌 **[REST API Specification](./Documentation/API_SPECIFICATION.md):** Endpoints, schemas, request/response JSON payloads, and error codes.
- 🚀 **[Setup & Execution Guide](./Documentation/SETUP_GUIDE.md):** Prerequisites, step-by-step local setup, Docker Compose instructions, and troubleshooting.
- ☁️ **[Render & MongoDB Atlas Cloud Deployment Guide](./Documentation/DEPLOYMENT_RENDER_ATLAS.md):** Complete guide for deploying to Render, connecting MongoDB Atlas, and setting the Gemini API key.

---

## ⚡ Key Highlights & Features

1. **Deterministic + LLM Hybrid Engine:** Fuses 25+ pattern rules across 11 categories with Google Gemini flash semantics using a probabilistic Noisy-OR model and safety floors.
2. **Zero-Leakage Privacy Architecture:** Automatically redacts credit cards (Luhn-validated), Indian PAN, Aadhaar, phones (+91), OTPs, and URL query tracking parameters before any text leaves the server.
3. **Dedicated Indian Smishing Detection:** Purpose-built detection for high-prevalence Indian scams (SBI/HDFC KYC freeze, electricity disconnection threats, e-Challan APK links, and UPI collect requests).
4. **Zero-Friction Guest Mode with Auto-Migration:** Instantly test without signing up. If an account is created later, guest analyses automatically migrate to the new profile.
5. **GDPR / DPDP Right to Be Forgotten:** Single-click permanent deletion of user account and all associated message history in MongoDB.
6. **High-Availability Fallback:** 15-second hard timeout race on LLM calls; automatically degrades to deterministic rules if the LLM is slow or offline.
7. **Actionable Recommendations:** Delivers categorized **Do Now**, **Don't Do**, and **Report To** advice (including cybercrime.gov.in and helpline 1930) plus a one-click **"Copy Safe Warning"** generator.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
*(Optionally add your `GEMINI_API_KEY` in `.env` to enable AI explanations; deterministic rules work out of the box).*

### 3. Start Database & Servers
```bash
# Start MongoDB via Docker
docker-compose up -d mongodb

# Start backend & frontend concurrently
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## 🧪 Automated Testing
Run the 44-test automated suite across all layers:
```bash
npm run test
```
