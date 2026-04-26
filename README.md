# 📚 LuminaLib — E-Library Management System

A full-stack E-Library Management System that enables user authentication, seamless eBook browsing, and efficient remote borrowing workflows.

---

## 🗂️ Project Structure

```
E-library-System/
├── backend/
│   ├── package.json        # Backend dependencies & scripts
│   ├── server.js           # Express API server
│   ├── library.sqlite      # SQLite database
│   └── node_modules/
├── frontend/
│   ├── package.json        # Frontend dependencies & scripts
│   ├── src/                # React source files
│   ├── public/             # Static assets
│   └── ...
├── README.md               # Project documentation (this file)
└── .gitignore              # Git ignore rules
```

---

## ✨ Features

- 🔐 **User Authentication** — Secure login & registration for members and admins
- 📖 **eBook Browsing** — Search, filter, and preview digital books
- 🔄 **Remote Borrowing** — Borrow and return books with one click
- 🌐 **World Catalog Integration** — Auto-import titles from external catalogs
- 🛠️ **Admin Panel** — Manage users, books, and borrowing records

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm v9+

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Run the Application

**Start the backend server:**
```bash
cd backend
npm start
```
> The API will run at `http://localhost:5000`

**Start the frontend dev server:**
```bash
cd frontend
npm run dev
```
> The app will be available at `http://localhost:5173`

---

## 🛠️ Tech Stack

| Layer     | Technology                  |
|-----------|-----------------------------|
| Frontend  | React, Vite, CSS            |
| Backend   | Node.js, Express.js         |
| Database  | SQLite (`better-sqlite3`)   |
| Auth      | JWT (JSON Web Tokens)       |

---

## 📄 License

This project is for educational purposes.
