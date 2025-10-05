# CompactScore (skeleton)

This repository contains a minimal skeleton for an expense tracker backend (Node.js + Express) and a simple frontend (HTML/CSS/JS). It's designed to be used with a PostgreSQL database hosted on Supabase. The database/schema is not created here — you'll create it separately in Supabase and provide connection values via environment variables.

What this includes:
- Express server with routes for auth, expenses, categories, and budgets
- Supabase client connection wrapper
- JWT-based auth middleware and bcrypt password hashing
- CSV and PDF export endpoints for expenses
- Simple Bootstrap-based frontend to test flows

Required environment variables (.env):
- SUPABASE_URL
- SUPABASE_KEY
- JWT_SECRET (recommended)

To run locally:
1. Copy `.env.example` to `.env` and set your Supabase values.
2. Install dependencies: `npm install`
3. Start: `npm run dev` (requires nodemon) or `npm start`

Database notes (create these tables in Supabase):

users
- user_id (uuid) PRIMARY KEY
- username (text)
- email (text) UNIQUE
- hashed_password (text)
- created_at (timestamp)

categories
- category_id (serial) PRIMARY KEY
- user_id (uuid) NULLABLE
- category_name (text)
- is_default (boolean)

expenses
- expense_id (serial) PRIMARY KEY
- user_id (uuid) REFERENCES users(user_id)
- amount (numeric)
- category_id (int) REFERENCES categories(category_id)
- description (text)
- expense_date (date)
- created_at (timestamp)

budgets
- budget_id (serial) PRIMARY KEY
- user_id (uuid) REFERENCES users(user_id)
- category_id (int) NULLABLE REFERENCES categories(category_id)
- budget_amount (numeric)
- month (int)
- year (int)

Notes:
- Do not create the database from this repo. Create tables in Supabase and set environment variables to connect.
- The provided code assumes certain column names (e.g., `user_id`, `hashed_password`) — ensure your Supabase schema matches or adapt the code.
