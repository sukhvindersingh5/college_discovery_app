# 🎓 CollegeQuest — College Discovery Platform

> Discover, compare, and shortlist the best colleges in India — powered by an AI Chatbot, real placement data, and a beautiful dark UI.

**Live Demo** → [college-discovery-app-ztey.vercel.app](https://college-discovery-app-ztey.vercel.app/)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **Smart Search & Filter** | Filter by state, institute type, course, and max fees |
| 📊 **Side-by-Side Comparison** | Compare up to 3 colleges on NIRF rank, placements, fees, and rating |
| 🤖 **AI Chatbot** | LangChain RAG-powered chatbot for personalised college advice |
| 🔖 **Save & Shortlist** | Authenticated users can bookmark favourite colleges |
| 🔐 **JWT Authentication** | Secure register/login with bcrypt password hashing |
| ☁️ **Cloud Database** | Supabase (PostgreSQL) with automatic LocalDB JSON fallback |
| 📱 **Fully Responsive** | Premium dark-mode UI across desktop, tablet, and mobile |

---

## 🛠️ Tech Stack

### Frontend
| Tech | Purpose |
|---|---|
| **Next.js 15** (App Router) | React framework |
| **TypeScript** | Type safety |
| **Vanilla CSS** | Styling with custom dark theme |
| **Vercel** | Deployment |

### Backend
| Tech | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **TypeScript** | Type safety |
| **Supabase (PostgreSQL)** | Cloud database |
| **LangChain + OpenAI** | AI Chatbot (RAG pipeline) |
| **JWT + bcryptjs** | Authentication |
| **Render** | Deployment |

---

## 📁 Project Structure

```
college_discovery/
├── backend/
│   └── src/
│       ├── controllers/        # colleges, auth, saved, ai
│       ├── middleware/         # JWT auth middleware
│       ├── models/             # Mongoose schemas (College, User, SavedCollege)
│       ├── routes/             # Express API routes
│       ├── seed/               # JSON seed data + seeding scripts
│       ├── services/           # LangChain RAG chain service
│       ├── db.ts               # Supabase adapter (with LocalDB fallback)
│       └── server.ts           # Express app entry point
│
└── frontend/
    ├── app/
    │   ├── colleges/           # Discovery & search page
    │   ├── colleges/[id]/      # College detail page
    │   ├── compare/            # Side-by-side comparison tool
    │   ├── login/              # Login page
    │   ├── register/           # Register page
    │   └── saved/              # User's saved colleges
    ├── components/
    │   ├── AIChatButton.tsx    # Floating AI chat button
    │   ├── AIChatModal.tsx     # AI chatbot panel (black theme)
    │   ├── Navbar.tsx          # Navigation bar
    │   └── CollegeCard.tsx     # College card component
    └── lib/
        └── api.ts              # API client wrapper
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- Supabase project (or the built-in LocalDB fallback will be used automatically)
- OpenAI API key (for the AI chatbot)

### 1 — Clone the repo

```bash
git clone https://github.com/sukhvindersingh5/college_discovery_app.git
cd college_discovery_app
```

### 2 — Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_phrase
OPENAI_API_KEY=your_openai_api_key
PORT=5000
NODE_ENV=development
```

Start the backend:

```bash
npm run dev
```

> ℹ️ If Supabase is unreachable, the backend **automatically falls back** to a local JSON database seeded with all 58 colleges — no configuration needed.

### 3 — Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

### 4 — Run both together (from root)

```bash
npm install
npm run dev
```

Opens at **http://localhost:3000**

---

## 🤖 AI Chatbot

The chatbot uses **LangChain + OpenAI** with a RAG (Retrieval Augmented Generation) pipeline:

1. User sends a question
2. Backend retrieves relevant colleges from the database using semantic search
3. OpenAI generates a contextual answer grounded in real college data
4. College chips with links are shown alongside the response

**Example questions:**
- *"Which is better for CSE — IIT Bombay or BITS Pilani?"*
- *"Top MBA colleges in Delhi under ₹5 Lakhs fees"*
- *"Compare placements at IIM Ahmedabad vs IIM Bangalore"*

> Requires a valid `OPENAI_API_KEY` in your `.env`

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/colleges` | List colleges (with search, filter, pagination) |
| `GET` | `/api/colleges/:id` | Get college by ID |
| `GET` | `/api/colleges/filters` | Get filter options |
| `GET` | `/api/colleges/compare?ids=1,2,3` | Compare colleges |
| `POST` | `/api/auth/register` | Register user |
| `POST` | `/api/auth/login` | Login user |
| `GET` | `/api/auth/me` | Get current user |
| `GET` | `/api/saved` | Get saved colleges |
| `POST` | `/api/saved/:id` | Save a college |
| `DELETE` | `/api/saved/:id` | Unsave a college |
| `POST` | `/api/ai/chat` | Send AI chat message |
| `GET` | `/api/ai/suggestions` | Get suggested questions |

---

## 🚀 Deployment

### Backend → Render

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/server.js` |

**Environment variables** to add in Render dashboard:
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
OPENAI_API_KEY
NODE_ENV=production
PORT=5000
```

### Frontend → Vercel

Connect the repo to Vercel and set:
```
NEXT_PUBLIC_API_URL=https://your-render-backend-url.onrender.com
```

---

## 📸 Screenshots

> **Home Page** — Browse and filter colleges  
> **Compare Tool** — Side-by-side college comparison  
> **AI Chatbot** — Black-theme chat panel with RAG responses  
> **College Detail** — Full profile with placements, fees & more  

---

## 📄 License

MIT © [Sukhvinder Singh](https://github.com/sukhvindersingh5)
