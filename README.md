# CodeLensAI — AI-Powered Code Reviewer

## ⚡ Quick Start (3 steps)

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Create your `.env` file
Copy the example file and add your **OpenRouter** API key:
```bash
cp .env.example .env
```
Then open `.env` and replace `your_openrouter_api_key_here` with your real key.
Get a key at: [https://openrouter.ai/keys](https://openrouter.ai/keys)

### Step 3 — Run the app
```bash
npm run dev
```

That's it! Open **http://localhost:5173** in your browser.

---

## 📧 How email verification works locally

You do NOT need to set up any email service for local development. 

When you sign up, the server will print a line like this in the terminal:
```
📧 Preview URL: https://ethereal.email/message/ABC123...
```
Open that URL in your browser to see the email and click the verification link inside it.

---

## 🗂️ Project Architecture

CodeLensAI uses a modern **Unified Backend** approach with node.js:

```
CodeLensAI/
├── src/                    ← React Frontend (Vite + TypeScript)
│   ├── lib/api.ts          ← API client
│   ├── context/AuthContext.tsx
│   └── pages/              ← Dashboard, Review, Analytics, etc.
├── server/                 ← Express Backend (Node.js)
│   ├── index.js            ← Server entry point
│   ├── db/database.js      ← SQLite setup (Auto-created)
│   ├── routes/             ← Auth & OpenRouter AI routes
│   ├── services/           ← OpenRouter & Email services
│   └── middleware/         ← JWT Authentication
├── data/                   ← SQLite database (Auto-created, gitignored)
├── .env.example            ← Environment template
└── package.json            ← Unified scripts & dependencies
```

---

## 🔧 .env Reference

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | ✅ Yes | Get at openrouter.ai |
| `CLIENT_URL` | No | Default: `http://localhost:5173` |
| `PORT` | No | Backend Port (Default: 5000) |
| `SMTP_HOST` | No | Only for real email sending |
| `JWT_SECRET` | No | Secret string for auth sessions |

---

## 🚀 Available Scripts

| Command | What it does |
|---|---|
| `npm install` | Install all dependencies (Frontend + Backend) |
| `npm run dev` | Start both client and server together |
| `npm run dev:client` | Start only the frontend (port 5173) |
| `npm run dev:server` | Start only the backend (port 5000) |
| `npm run build` | Build frontend for production |
