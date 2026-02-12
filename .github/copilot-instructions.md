# Project Website Setup Instructions

## Project Overview

This is a full-stack web application featuring:
- **Frontend**: React with HTML/CSS
- **Backend**: Node.js + Express + PostgreSQL
- **Analysis Engine**: Python with PyTorch & OpenAI API
- **Deployment**: Vercel + GitHub

## Setup Status

✅ Project structure created
✅ Frontend initialized (React)
✅ Backend initialized (Node.js)
✅ Python engine initialized
✅ Environment files configured
✅ Documentation complete

## Installation Instructions

### Prerequisites
- Node.js 18+
- Python 3.8+
- PostgreSQL 12+
- Git

### Step 1: Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 2: Install Backend Dependencies

```bash
cd ../backend
npm install
```

### Step 3: Setup Python Environment

```bash
cd ../python-engine
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### Step 4: Configure Environment Variables

Copy environment templates:
```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
cp python-engine/.env.example python-engine/.env
```

Edit each `.env` file with your actual values.

## Running the Application

Open three terminals and run:

**Terminal 1 - Frontend (Port 3000):**
```bash
cd frontend
npm start
```

**Terminal 2 - Backend (Port 5000):**
```bash
cd backend
npm run dev
```

**Terminal 3 - Python Engine (Port 5001):**
```bash
cd python-engine
python app.py
```

Access the application at `http://localhost:3000`

## Project Structure

```
project-website/
├── frontend/              # React application
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/              # Node.js API server
│   ├── config/
│   ├── routes/
│   └── server.js
├── python-engine/        # Python analysis engine
│   ├── engine.py
│   ├── app.py
│   └── requirements.txt
├── .github/              # GitHub configuration
├── .env.example
├── .gitignore
└── README.md
```

## Key Technologies

| Component | Technology | Version |
|-----------|-----------|---------|
| Frontend | React | 18.2.0 |
| Backend | Express.js | 4.18.2 |
| Database | PostgreSQL | 12+ |
| Python | PyTorch | 2.0.0 |
| Deploy | Vercel | Latest |

## API Endpoints

### Backend (5000)
- `GET /api/health` - Health check
- `GET /api/data` - Get all data
- `POST /api/data` - Create data

### Python Engine (5001)
- `POST /api/analyze` - Data analysis
- `POST /api/insights` - AI insights
- `GET /health` - Engine health

## Database Setup

Create PostgreSQL database:
```bash
psql -U postgres -c "CREATE DATABASE project_db;"
```

## Deployment

### Deploy Frontend to Vercel
```bash
cd frontend
npm run build
vercel deploy
```

### Deploy Backend to Vercel
```bash
cd backend
vercel deploy
```

## Documentation

- [Main README](../README.md)
- [Frontend Docs](../frontend/README.md)
- [Backend Docs](../backend/README.md)
- [Python Engine Docs](../python-engine/README.md)
- [Contributing Guidelines](.github/CONTRIBUTING.md)

## Troubleshooting

**Port conflicts:**
- Frontend: `npm start -- --port 3001`
- Backend: Modify PORT in .env
- Python: Modify PYTHON_ENGINE_PORT in .env

**Database connection error:**
- Check PostgreSQL is running
- Verify .env DB credentials
- Ensure database exists

**Dependencies not installing:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. ✅ Project initialized
2. Configure `.env` files with your settings
3. Create PostgreSQL database
4. Install all dependencies
5. Run the application
6. Push to GitHub
7. Deploy to Vercel

## Support

For issues or questions, refer to the README files in each directory or open an issue on GitHub.

---

**Setup Date**: February 2026
**Last Updated**: February 12, 2026
