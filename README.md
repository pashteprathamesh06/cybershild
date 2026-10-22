# 🛡️ CyberShield AI — Intelligent Scam & Phishing Detection Platform

A full-stack web application that uses AI (Groq / Llama) to detect phishing links, scam messages, and fraudulent screenshots — with a learning center, an educational scam simulator, scan history, and an admin dashboard.

Built for educational purposes (final-year project / viva demonstration ready).

---

## ✨ Features

- **Authentication** — JWT + bcrypt, role-based access (user/admin), protected routes
- **URL Analyzer** — HTTPS check, punycode/homograph detection, shortener detection, keyword analysis, AI classification
- **Message Analyzer** — Email/SMS/WhatsApp/Telegram/Instagram/Facebook scam detection (phishing, OTP, UPI, banking, job, investment, delivery, reward scams)
- **Screenshot Analyzer** — OCR (Tesseract.js) text extraction → AI threat analysis
- **Fake vs Genuine Comparison** — Side-by-side AI comparison of two messages
- **AI Scam Simulator** — Educational scenarios with scored feedback
- **Learning Center** — 10 modules covering major scam categories and safe practices
- **Scan History** — Search, filter, sort, delete
- **Admin Dashboard** — Users, scans, statistics, charts, learning content management
- **Security** — Helmet, CORS, rate limiting, input validation, secure file upload validation

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript, Chart.js |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT + bcrypt |
| AI | Groq API (Llama 3.3 70B) |
| OCR | Tesseract.js |
| Deployment | Render + MongoDB Atlas |

---

## 📁 Folder Structure

```
cybershield-ai/
├── backend/
│   ├── config/          # MongoDB connection
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth, error handling, file upload
│   ├── models/          # Mongoose schemas (User, Scan, LearningContent, SimulatorQuestion)
│   ├── routes/          # Express routers
│   ├── services/        # Groq AI, URL heuristics, OCR
│   ├── utils/           # Prompts, validators, seed script
│   ├── uploads/         # Temporary screenshot storage (auto-cleared)
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── css/style.css
│   ├── js/               # api.js, main.js, + one file per page
│   ├── index.html         # Landing page
│   ├── login.html / register.html
│   ├── dashboard.html
│   ├── url-analyzer.html / message-analyzer.html / screenshot-analyzer.html
│   ├── compare.html
│   ├── simulator.html
│   ├── learning.html
│   ├── history.html
│   └── admin.html
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Local Setup

### 1. Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster (free tier is fine)
- A Groq API key ([console.groq.com](https://console.groq.com))

### 2. Clone & install

```bash
git clone <your-repo-url>
cd cybershield-ai/backend
npm install
```

### 3. Configure environment variables

Copy `.env.example` (in the project root) into `backend/.env` and fill in your values:

```bash
cp ../.env.example .env
```

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/cybershield
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=30d
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
GROQ_MODEL=llama-3.3-70b-versatile
CLIENT_URL=http://localhost:5000
ADMIN_EMAIL=admin@cybershield.ai
ADMIN_PASSWORD=ChangeMe123!
```

### 4. Seed the database (admin user + learning content + simulator scenarios)

```bash
npm run seed
```

### 5. Run the server

```bash
npm run dev     # with nodemon
# or
npm start
```

The backend serves the frontend as static files, so open:

```
http://localhost:5000
```

Log in with the admin credentials from your `.env` to access the Admin Panel, or register a new account as a regular user.

---

## 🔌 API Routes

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Log in |
| GET | `/api/auth/me` | Private | Get current user |
| POST | `/api/auth/logout` | Private | Logout |
| POST | `/api/analyze/url` | Private | Analyze a URL |
| POST | `/api/analyze/message` | Private | Analyze a message |
| POST | `/api/analyze/screenshot` | Private | Analyze a screenshot (multipart, field: `screenshot`) |
| POST | `/api/compare/messages` | Private | Compare two messages |
| GET | `/api/scans` | Private | List scans (search/filter/sort/paginate) |
| GET | `/api/scans/dashboard/summary` | Private | Dashboard stats + charts |
| GET | `/api/scans/:id` | Private | Get a single scan |
| DELETE | `/api/scans/:id` | Private | Delete a scan |
| GET | `/api/simulator` | Private | Get simulator scenarios |
| POST | `/api/simulator/:id/answer` | Private | Submit a guess |
| GET | `/api/learning` | Private | List learning modules |
| GET | `/api/learning/:id` | Private | Get a single module |
| GET | `/api/admin/dashboard` | Admin | Platform-wide statistics |
| GET | `/api/admin/users` | Admin | List users |
| PATCH | `/api/admin/users/:id` | Admin | Update role / active status |
| GET | `/api/admin/scans` | Admin | List all scans |
| POST/PATCH/DELETE | `/api/admin/learning` | Admin | Manage learning content |

All responses follow `{ success: boolean, ...data }` or `{ success: false, message: string }` on error.

---

## 🧠 Groq AI Integration

Reusable prompt templates live in `backend/utils/prompts.js`:
- `URL_ANALYSIS_PROMPT`
- `MESSAGE_ANALYSIS_PROMPT`
- `COMPARISON_PROMPT`
- `SIMULATOR_EVALUATION_PROMPT`

Every prompt forces a strict JSON schema response. `backend/utils/validators.js` sanitizes and validates the AI's JSON before it's ever stored or returned to the client — unexpected fields are dropped, scores are clamped 0–100, and malformed responses raise a clear error instead of silently corrupting data.

---

## ☁️ Deployment

### GitHub
```bash
git init
git add .
git commit -m "Initial commit: CyberShield AI"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

### MongoDB Atlas
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user and allow network access from `0.0.0.0/0` (or Render's IPs)
3. Copy the connection string into `MONGO_URI`

### Render
1. Create a new **Web Service** on [render.com](https://render.com), connect your GitHub repo
2. **Root Directory:** `backend`
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. Add all environment variables from `.env.example` in the Render dashboard
6. Deploy — Render will build and serve both the API and the static frontend from the same service

After deploying, run the seed script once via Render's shell (or a one-off job):
```bash
npm run seed
```

---

## 🔒 Security Notes

- Passwords hashed with bcrypt (12 salt rounds)
- JWT-based auth with configurable expiry
- Helmet for secure HTTP headers
- CORS restricted via `CLIENT_URL`
- Rate limiting on general API, auth endpoints, and AI analysis endpoints
- Server-side input validation on all write endpoints (`express-validator`)
- File upload validation: type allowlist (PNG/JPG/JPEG/WEBP) and 8MB size limit
- Uploaded screenshots are deleted from disk immediately after OCR processing
- AI responses are schema-validated before being persisted or returned

---

## ⚠️ Disclaimer

CyberShield AI is an educational tool. Risk scores and classifications are generated by heuristics and an AI model, and may be imperfect — they are meant to assist judgment, not replace it. Always exercise caution with unfamiliar links, messages, and requests for personal information.
