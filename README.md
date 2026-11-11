# Vector Trans — Logistics Website Demo

[![CI](https://github.com/Alexg7707/vector-trans/actions/workflows/ci.yml/badge.svg)](https://github.com/Alexg7707/vector-trans/actions/workflows/ci.yml)

A responsive logistics website with a Node.js serverless API and Telegram Bot API integration. Built as a personal learning project to practice connecting a browser form, server-side validation, external services, and deployment.

**[Live demo](https://vector-trans.vercel.app)** · **[Документация на русском](docs/README.ru.md)**

The demo interface is in Russian. The company name and services are a fictional concept; this repository is not a commercial client case.

## What it demonstrates

- Responsive HTML/CSS interface with accessible form labels and status messages.
- JavaScript form submission, loading states, and preserved input when delivery fails.
- Server-side checks for required fields, field lengths, phone numbers, valid dates, and consent.
- A Node.js endpoint that calls Telegram and reports success only after the API confirms delivery.
- Server-only environment variables for credentials, same-origin checks, a honeypot field, and security headers.
- Automated handler tests with mocked Telegram responses and a dependency-free static build.

## Stack

HTML · CSS · JavaScript · Node.js 22+ · Telegram Bot API · Vercel

There are no third-party runtime dependencies.

## Run locally

Use Node.js 22 or newer:

```sh
npm test
npm run build
npm run dev
```

Open **http://127.0.0.1:3000**. The local server serves the site and `/api/request`.

Delivery requires `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in the server environment. Without them, the endpoint returns **503**, rather than reporting a successful submission.

For local delivery testing, copy `.env.example` to `.env`, set the values privately, and start with:

```sh
node --env-file=.env dev.mjs
```

Keep credentials out of source files, commits, browser code, and command history. The Git ignore rules exclude local environment files and Vercel configuration.

## Request flow

```text
Browser form
  → POST /api/request
  → validate fields, consent, and request origin
  → Telegram sendMessage using server environment variables
  → confirmed success or an explicit delivery error
```

The handler forwards the submitted fields and a generated request ID. It does not store submissions in a database.

## Repository guide

| File | Purpose |
| --- | --- |
| `index.html`, `style.css`, `app.js` | Responsive interface and form behavior |
| `request.js` | Validation, message formatting, and delivery handler |
| `api/request.js` | Vercel function entry point |
| `request.test.js` | Automated validation and mocked delivery checks |
| `dev.mjs` | Local preview server |
| `build.mjs` | Copies public assets into `public/` |
| `vercel.json` | Build, function, and response-header configuration |

## Checks and deployment

GitHub Actions runs tests and the build on pushes and pull requests, using Node.js 22 and 24. The tests cover validation failures, payload formatting, provider confirmation and rejection, missing server configuration, the honeypot, and cross-origin rejection. No real Telegram messages are sent by the test suite.

For Vercel, import the repository with:

- Framework preset: **Other**
- Build command: **`npm run build`**
- Output directory: **`public`**
- Server function: **`api/request.js`**

Set the two Telegram variables in Vercel's server environment, then deploy. The recipient must first start the bot or add it to the destination chat. Verify a real delivery separately from unit tests.

## Current limits

This is a focused portfolio demo. It has no database or distributed rate limiting. A timeout can leave delivery uncertain, and a manual retry can create a duplicate. Commercial use would also require real operator details and an appropriate data-handling policy. Automated tests do not prove end-to-end Telegram delivery.

## Author

[Aleksandr Gvindiaev](https://github.com/Alexg7707) · [LinkedIn](https://www.linkedin.com/in/aleksandr-gvindiaev-021341420/)
