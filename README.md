# 💰 CPAY — Private Money Lender Loan Management System

A production-ready MERN stack application to replace the paper notebook for managing customers, loans, monthly interest collection, principal payments, and payment history.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local) running on port 27017
- Two terminal windows

### Step 1 — Start the Backend

```bash
cd E:\CPAY\backend

# First time only: create the admin account
npm run seed

# Optional: load sample data (5 customers with payment history)
npm run sample

# Start backend server (http://localhost:5000)
npm run dev
```

### Step 2 — Start the Frontend

```bash
cd E:\CPAY\frontend

# Start frontend (http://localhost:5173)
npm run dev
```

### Step 3 — Login

Open **http://localhost:5173** in your browser.

| Field    | Value              |
|----------|--------------------|
| Email    | admin@cpay.com     |
| Password | Admin@123          |

> ⚠️ **Change the password after first login in production!**

---

## 🏗️ Project Structure

```
E:\CPAY\
├── backend\                    # Express.js API
│   ├── config\                 # DB connection, constants
│   ├── controllers\            # Business logic (auth, customer, loan, payment, dashboard, export, public)
│   ├── helpers\                # responseHelper, dateHelper
│   ├── middleware\             # auth, error, rate limiter, sanitize, audit logger
│   ├── models\                 # Admin, Customer, Loan, Payment, AuditLog
│   ├── routes\                 # 7 route groups
│   ├── scripts\                # seedAdmin.js, sampleData.js
│   ├── services\               # interestService, tokenService, pdfService, backupService
│   ├── utils\                  # logger (Winston), asyncHandler
│   ├── validators\             # Joi schemas
│   ├── .env                    # Local dev environment variables
│   ├── .env.example            # Template for environment setup
│   └── server.js               # Entry point
│
└── frontend\                   # React + Vite + Tailwind
    └── src\
        ├── api\                # Axios API layer (auth, customer, loan, payment, dashboard)
        ├── components\         # Reusable UI components
        │   ├── layout\         # Layout, Sidebar, Header
        │   ├── ui\             # Button, Card, Modal, Badge, Input, Table, Spinner, ConfirmDialog
        │   ├── dashboard\      # StatCard, RecentPayments, DueList, PendingList
        │   ├── customers\      # CustomerCard, CustomerForm, CustomerSearch
        │   └── payments\       # PaymentForm, PaymentTable
        ├── context\            # AuthContext, ThemeContext
        ├── hooks\              # useAuth, useCustomers, useToast
        ├── pages\              # All admin + public pages
        └── utils\              # formatters (₹, dates), validators
```

---

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| JWT Auth | httpOnly cookie (not localStorage — XSS-safe) |
| Password Hashing | bcryptjs (12 salt rounds) |
| Rate Limiting | 10 login attempts / 15 min; 100 API requests / 15 min |
| NoSQL Injection | express-mongo-sanitize |
| XSS Protection | xss-clean |
| Secure Headers | helmet |
| CORS | Whitelist-only (FRONTEND_URL) |
| Input Validation | Joi (backend) + custom validators (frontend) |
| Soft Delete | Customers are never hard-deleted |
| Audit Logs | All admin actions logged with IP, TTL 1 year |
| ID Protection | MongoDB `_id` never exposed — UUID token used as public ID |
| IDOR Prevention | Customer token auth on public routes |

---

## 📊 Admin Features

| Feature | Description |
|---------|-------------|
| Dashboard | Stats, pending alerts, due today/this week, recent payments, charts |
| Add Customer | Create customer + loan in one transaction |
| Customer Profile | Full details, loan info, payment history |
| Record Payment | Auto-calculates new principal, saves history |
| Close Loan | Mark loan as closed |
| Soft Delete / Restore | Safe customer deletion |
| Export PDF | Customer ledger as PDF |
| Export CSV | Payment history as CSV |
| Secure Link | Generate/regenerate customer read-only link |
| WhatsApp Share | Share customer link via WhatsApp |
| Backup / Restore | Full database JSON backup |
| Dark Mode | Toggle between dark/light themes |

---

## 👤 Customer Public View

Every customer gets a unique, unguessable link:

```
http://localhost:5173/customer/9eebd1e9-d2cb-47aa-aef7-xxxxxxxxxxxx
```

This page (no login required) shows:
- Current payment status (Paid / Pending)
- Remaining principal
- Monthly interest due
- Next due date
- Payment history (read-only)

Customers **cannot** see each other's data.  
Admin can **regenerate** the link to invalidate the old one.

---

## 💡 Interest Calculation

Interest is always calculated automatically:

```
Monthly Interest = Remaining Principal × Interest Rate (%) / 100

Example:
  Principal:        ₹1,00,000
  Rate:             2%
  Monthly Interest: ₹2,000

  Customer pays ₹20,000 principal →
  New Principal:    ₹80,000
  Next Interest:    ₹1,600
```

No manual calculations ever needed.

---

## 🌐 API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Admin login |
| POST | `/api/auth/logout` | Admin logout |
| GET | `/api/auth/me` | Get current admin |

### Customers
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/customers` | List all customers (search supported) |
| GET | `/api/customers/deleted` | Soft-deleted customers |
| GET | `/api/customers/:id` | Single customer with loan |
| POST | `/api/customers` | Create customer + loan |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Soft delete |
| PATCH | `/api/customers/:id/restore` | Restore deleted |
| POST | `/api/customers/:id/regenerate-token` | New secure link |

### Loans
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/loans/customer/:customerId` | Get loan for customer |
| PUT | `/api/loans/:id` | Update loan terms |
| PATCH | `/api/loans/:id/close` | Close loan |

### Payments
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/payments/loan/:loanId` | Payment history |
| POST | `/api/payments` | Record payment |

### Dashboard
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/dashboard/stats` | Summary statistics |
| GET | `/api/dashboard/due-today` | Customers due today |
| GET | `/api/dashboard/due-this-week` | Due in 7 days |
| GET | `/api/dashboard/pending` | Overdue payments |
| GET | `/api/dashboard/recent-payments` | Last 10 payments |

### Export
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/export/customer/:id/pdf` | PDF ledger |
| GET | `/api/export/customer/:id/csv` | CSV export |
| GET | `/api/export/backup` | Full DB backup JSON |
| POST | `/api/export/restore` | Restore from backup |

### Public (No Auth)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/public/customer/:token` | Customer read-only view |

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cpay
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@cpay.com
ADMIN_PASSWORD_HASH=           # bcrypt hash of admin password
COOKIE_SECRET=your_cookie_secret
CUSTOMER_TOKEN_SECRET=your_token_secret
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Generating a password hash:
```bash
node -e "const b=require('bcryptjs'); b.hash('YourPassword123',12).then(h=>console.log(h))"
```

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS v3 |
| Routing | React Router DOM v6 |
| HTTP Client | Axios |
| Charts | Recharts |
| PDF | jsPDF + jsPDF-autotable (client) / PDFKit (server) |
| Backend | Node.js, Express.js v5 |
| Database | MongoDB, Mongoose v9 |
| Auth | JWT, bcryptjs, httpOnly cookies |
| Validation | Joi (backend), custom (frontend) |
| Security | Helmet, CORS, rate-limit, mongo-sanitize, xss-clean |
| Logging | Winston, Morgan |
| Dev Tools | Nodemon |

---

## 🏭 Production Deployment

1. Set `NODE_ENV=production` in backend `.env`
2. Set `FRONTEND_URL` to your actual domain
3. Generate strong random values for all secrets
4. Run `npm run seed` on first deploy to create admin
5. Use a reverse proxy (nginx) for HTTPS
6. For MongoDB Atlas: replace `MONGODB_URI` with Atlas connection string

---

## 📝 Scripts

```bash
# Backend
npm run dev      # Start with nodemon (development)
npm start        # Start without nodemon (production)
npm run seed     # Create admin user
npm run sample   # Load 5 sample customers + payments

# Frontend
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## 📄 License

Private — for personal/business use only.

---

*Built with ❤️ for simple, fast, reliable loan management.*
