# FitGym — Modern Gym Management System 🏋️‍♂️

FitGym is a role-based gym management web application built with **React**, **Vite**, and **Supabase**. It provides tailored portals for **Gym Administrators**, **Personal Trainers**, and **Members (Trainees)**, backed by PostgreSQL with Row-Level Security (RLS).

---

## 🌟 Features

### 👑 Admin Portal (`/admin/*`)
- **Dashboard & Key Metrics**: Real-time stats on active members, trainers, revenue, and attendance.
- **Member & Trainer Management**: Onboard, view, edit, and activate/deactivate members and trainers.
- **Memberships & Invoicing**: Track subscription plans, expirations, and payment statuses (`paid`, `pending`, `failed`).
- **Attendance & Analytics**: Track gym-wide check-in patterns and financial revenue charts powered by Recharts.
- **Broadcast Notifications**: Post gym announcements and member alerts.

### 🏋️ Personal Trainer Portal (`/trainer/*`)
- **Assigned Trainees**: View detailed member profiles and fitness goals.
- **Workout Plan Builder**: Create and assign structured routines (exercises, sets, reps, target weights, notes).
- **Daily Attendance**: Mark trainee attendance logs.
- **Progress Tracking**: Monitor body measurements, check-in weights, and milestone logs.

### 🏃 Member (Trainee) Portal (`/trainee/*`)
- **Member Dashboard**: Quick overview of active plan, assigned trainer, and upcoming workouts.
- **Personalized Workouts**: Step-by-step breakdown of assigned workout routines.
- **Progress & Weight Tracker**: Visualize body weight history over time.
- **Membership & Payments**: Check subscription validity and payment history.
- **Profile Customization**: Update contact details and avatar.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, React Router v7 (`react-router-dom`), Recharts
- **Backend & Database**: Supabase (PostgreSQL, GoTrue Auth, Row-Level Security, Storage)
- **Styling**: Modular Pure CSS

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- A [Supabase](https://supabase.com/) project

### 2. Installation
```bash
git clone https://github.com/Anurag-git22/FitGym.git
cd FitGym
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and fill in your Supabase project credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Database Setup
1. In your Supabase Dashboard, open the **SQL Editor**.
2. Run [`supabase/schema.sql`](supabase/schema.sql) to create all tables, indexes, triggers, and Row-Level Security policies.
3. Seed the initial data and accounts using the seed script:
   ```bash
   # Windows PowerShell:
   $env:SERVICE_ROLE_KEY="your-supabase-service-role-key"
   node scripts/check-and-seed.js
   ```

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Default Demo Accounts

| Role | Email | Password | Landing Page |
| :--- | :--- | :--- | :--- |
| **👑 Admin** | `admin@fitgym.net` | `Admin@123` | `/admin/dashboard` |
| **🏋️ Trainer** | `trainer1@fitgym.net` | `Trainer@123` | `/trainer/dashboard` |
| **🏋️ Trainer 2** | `trainer2@fitgym.net` | `Trainer@123` | `/trainer/dashboard` |
| **🏃 Member** | `trainee1@fitgym.net` | `Trainee@123` | `/trainee/dashboard` |
| **🏃 Member (2–6)** | `trainee2@fitgym.net` … `trainee6@fitgym.net` | `Trainee@123` | `/trainee/dashboard` |

---

## 📜 License
MIT License. Feel free to use and modify for personal or commercial projects.
