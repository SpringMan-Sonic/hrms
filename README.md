# HRMS Lite

A lightweight, production-ready Human Resource Management System built with React, Node.js, Express, and MongoDB.

---

## Live Links

| | URL |
|---|---|
| Frontend | https://hrms-lite.vercel.app |
| Backend API | https://hrms-backend.onrender.com |
| Health Check | https://hrms-backend.onrender.com/api/health |

---

## Project Overview

HRMS  is a web-based HR tool that allows an admin to manage employee records and track daily attendance. It is designed as a clean, functional internal HR tool focused on essential operations.

Core features:
- Add, view, search, and delete employees
- Mark daily attendance as Present or Absent
- Filter attendance records by date and employee
- Dashboard with live summary stats and department breakdown
- Present day count per employee
- Full server-side validation and error handling

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, TanStack React Query, React Router v7 |
| Backend | Node.js, Express 4 |
| Database | MongoDB with Mongoose |
| Deployment | Vercel (Frontend), Render (Backend) |

---

## Running Locally

### Prerequisites

- Node.js version 18 or higher
- A MongoDB database (local or MongoDB Atlas)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/hrms.git
cd hrms
```

### 2. Set up the backend

```bash
cd backend
ni .env
```

Open .env and fill in your values:

```
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/hrms
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

Then install and start:

```bash
npm install
npm run dev
```

The API will run on http://localhost:5000

### 3. Set up the frontend

```bash
cd frontend
ni .env
```

The .env file should contain:

```
VITE_API_URL=http://localhost:5000/api
```

Then install and start:

```bash
npm install
npm run dev
```

The app will run on http://localhost:5173

---

## API Reference

### Employees

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/employees | List all employees with present day count |
| POST | /api/employees | Create a new employee |
| GET | /api/employees/:id | Get employee by ID |
| DELETE | /api/employees/:id | Delete employee and their attendance records |
| GET | /api/employees/stats/summary | Dashboard summary stats |

### Attendance

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/attendance | List records, optional query params: date, employeeId |
| POST | /api/attendance | Mark attendance, upserts if record exists for that date |
| GET | /api/attendance/employee/:id | Get all records for one employee |
| DELETE | /api/attendance/:id | Delete a record |

### Validation Rules

- employeeId: required, unique
- email: required, valid format, unique
- fullName: required, minimum 2 characters
- department: must be one of Engineering, Marketing, Sales, HR, Finance, Operations, Design, Legal, Product
- status: must be Present or Absent
- date: must be in YYYY-MM-DD format

---

## Project Structure

```
hrms/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── render.yaml
│   └── src/
│       ├── controllers/
│       │   ├── employeeController.js
│       │   └── attendanceController.js
│       ├── middleware/
│       │   ├── validate.js
│       │   └── errorHandler.js
│       ├── models/
│       │   ├── Employee.js
│       │   └── Attendance.js
│       └── routes/
│           ├── employees.js
│           └── attendance.js
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── vercel.json
    ├── package.json
    ├── .env.example
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api/
        │   └── index.js
        ├── components/
        │   ├── Layout.jsx
        │   ├── Sidebar.jsx
        │   └── ui.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── Employees.jsx
            └── Attendance.jsx
```

---

## Deployment

### Backend on Render

1. Create a new Web Service on render.com
2. Connect your GitHub repository
3. Set Root Directory to backend
4. Set Build Command to npm install
5. Set Start Command to node server.js
6. Add environment variables: MONGO_URI, NODE_ENV, FRONTEND_URL
7. Deploy

### Frontend on Vercel

1. Create a new project on vercel.com
2. Connect your GitHub repository
3. Set Root Directory to frontend
4. Add environment variable: VITE_API_URL pointing to your Render backend URL
5. Deploy

---

## Assumptions and Limitations

- Single admin user with no authentication required, as per the assignment scope
- Departments are  custom featured
- Attendance dates are stored as YYYY-MM-DD strings
- Marking attendance for the same employee on the same date updates the existing record rather than creating a duplicate
- No pagination is implemented, all records load at once

