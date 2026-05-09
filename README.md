# 🎓 CollegeQuest (College Discovery Platform)

CollegeQuest is a full-stack, responsive web application designed to help students discover, filter, compare, and shortlist top colleges in India. It features a modern user interface, robust searching/filtering capabilities, and a personalized bookmarking system for authenticated users.

---

## 🚀 Key Features

- **Extensive Database**: Real data for 58 top Indian colleges spanning 14 states.
- **Smart Filtering**: Refine college searches by Location (State), Institute Type, Specific Course (B.Tech, MBA, etc.), and Maximum Fees.
- **Side-by-Side Comparison**: Select up to 3 colleges to compare their NIRF Rankings, Placement Packages, Ratings, and Fees side-by-side.
- **Save & Shortlist (Bookmarking)**: Authenticated users can save their favorite colleges to their personal profile.
- **Authentication System**: Secure JWT-based registration and login system.
- **Responsive Design**: Beautiful, premium dark-mode interface that works flawlessly across desktop, tablet, and mobile devices.

---

## 🛠️ Technology Stack

**Frontend**
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS
- **Routing**: Next.js App Router
- **Language**: TypeScript

**Backend**
- **Framework**: Node.js with Express.js
- **Database**: PostgreSQL (hosted on Supabase)
- **Authentication**: JWT (JSON Web Tokens) & bcryptjs for password hashing
- **Language**: TypeScript

---

## 📁 Project Structure

```text
college_discovery/
├── backend/                  # Node.js + Express API server
│   ├── src/
│   │   ├── controllers/      # Route logic (colleges, auth, saved)
│   │   ├── middleware/       # JWT verification middleware
│   │   ├── routes/           # Express API endpoints
│   │   ├── seed/             # Database seeding scripts & raw JSON data
│   │   ├── db.ts             # Supabase client initialization
│   │   └── server.ts         # Main Express app & CORS configuration
│   └── package.json          
│
├── frontend/                 # Next.js Application
│   ├── app/
│   │   ├── colleges/         # Discovery & search interface
│   │   ├── compare/          # Side-by-side comparison tool
│   │   ├── login/            # Authentication logic
│   │   ├── register/         # User registration
│   │   ├── saved/            # User's bookmarked colleges
│   │   ├── globals.css       # Tailwind & custom CSS variables
│   │   └── page.tsx          # Landing page
│   ├── components/           # Reusable UI (Navbar, CollegeCard)
│   ├── lib/                  # Utilities (api wrappers, auth context)
│   └── package.json          
└── README.md
```

---

## ⚙️ Local Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- Supabase Project (PostgreSQL database)

### 2. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   npm install
   ```
2. Create a `.env` file in the `backend` directory:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_jwt_secret_phrase
   ```
3. Run the backend development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   npm install
   ```
2. Create a `.env.local` file in the `frontend` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```

### 4. Database Initialization
To populate the database with the 58 colleges, run the seed script from the backend directory:
```bash
cd backend
npm run seed
```

---



Live Link- https://college-discovery-app-ztey.vercel.app/
