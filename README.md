# Restyle - Wardrobe Manager

A simple, clean wardrobe management application built with React and Node.js. Manage your clothing inventory, generate outfit combinations, and preview your looks.

## Features

- **Wardrobe Inventory** - Track clothing items by category, color, formality, and season
- **AI Outfit Generation** - Use beam search to create outfit combinations
- **Outfit Preview** - Visual fitting room for generated outfits
- **Image Upload** - Add photos of your clothing items

## Tech Stack

**Frontend:** React 18, React Router, Axios, CSS3  
**Backend:** Node.js, Express, PostgreSQL, Sharp (image processing)

## Prerequisites

- Node.js v14+
- PostgreSQL
- npm

---

## Running in WSL (Windows Subsystem for Linux)

If you are on Windows and using WSL (e.g. Ubuntu on WSL2), follow these steps:

### 1. Install Prerequisites in WSL

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (via nvm - recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo service postgresql start
```

### 2. Set Up the PostgreSQL Database

```bash
# Create the database (run as postgres user)
sudo -u postgres psql -c "CREATE DATABASE wardrobe_db;"

# (Optional) Set a password for the postgres user
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your_password';"
```

### 3. Clone the Repository

```bash
git clone https://github.com/jenjentran15/Restyle.git
cd Restyle
```

### 4. Configure Environment Variables

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in your PostgreSQL credentials and a JWT secret:

```env
PORT=5000
NODE_ENV=development
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wardrobe_db
JWT_SECRET=some_long_random_secret_string
CORS_ORIGIN=http://localhost:3000
```

### 5. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (open a new terminal tab)
cd frontend
npm install
```

### 6. Start the Application

Open **two terminal windows** (or WSL tabs):

**Terminal 1 – Backend (port 5000):**
```bash
cd backend
npm run dev
```

**Terminal 2 – Frontend (port 3000):**
```bash
cd frontend
npm start
```

The app will open at **http://localhost:3000** in your browser.

> **Tip:** If your browser is on Windows and WSL2 is running the servers, `localhost` should work automatically. If not, find your WSL IP with `hostname -I` and use that instead.

---

## Quick Start (macOS / Linux)

### 1. Clone the Repository

```bash
git clone https://github.com/jenjentran15/Restyle.git
cd Restyle
```

### 2. Setup Environment Variables

```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials and JWT secret
```

### 3. Install Dependencies & Start

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm start
```

The application will be available at `http://localhost:3000`

---

## 📁 Project Structure

```
Restyle/
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/   # Header, Footer
│       ├── pages/        # Home, Wardrobe, OutfitGenerator, OutfitPreview, Authentication
│       ├── styles/
│       ├── App.js
│       └── index.js
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── public/
│   │   └── uploads/      # Uploaded clothing images
│   ├── outfitGenerator.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

---

## 🔌 API Endpoints

### Auth
- `POST /api/auth/signup` – Create a new account
- `POST /api/auth/login`  – Log in and receive a JWT token

### Clothing Items *(requires Authorization header)*
- `GET    /api/clothing`       – Get all your clothing items
- `POST   /api/clothing`       – Add a new item (JSON)
- `GET    /api/clothing/:id`   – Get a specific item
- `DELETE /api/clothing/:id`   – Delete an item
- `POST   /api/upload-clothing` – Add item with an image upload

### Outfit Generation *(requires Authorization header)*
- `POST /api/outfits/generate` – Generate outfit combinations

### System
- `GET /api/health` – Health check

---

## 🗄️ Database Tables

- `users` – Stores user accounts
- `clothing_items` – Stores user clothing inventory

---

## 🚀 Deployment

### Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables in the Vercel dashboard
3. Deploy frontend and backend separately

**Frontend:**
```bash
cd frontend
npm run build
vercel deploy
```

**Backend:**
```bash
cd backend
vercel deploy
```

---

## 🤝 Contributing

Please open an issue or pull request for any bugs or improvements.

## 📄 License

This project is licensed under the MIT License.

---

**Created**: February 2026  
**Updated**: March 2026

