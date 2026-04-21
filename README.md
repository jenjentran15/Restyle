# Restyle - Wardrobe Manager

A simple, clean wardrobe management application built with React and Node.js. Manage your clothing inventory, analyze outfit compatibility, and get capsule wardrobe recommendations.

## Features

- **Wardrobe Inventory** - Track clothing items by category, color, and season
- **Outfit Analysis** - See how items work together
- **AI Outfit Generation** - Use beam search to create outfit combinations
- **Capsule Recommendations** - Get suggestions for a minimal wardrobe
- **Image Upload** - Add photos of your clothing items

## Tech Stack

**Frontend:** React 18, React Router, Axios, CSS3  
**Backend:** Node.js, Express, PostgreSQL, Sharp (image processing)

## Quick Start

### 1. Setup Database
The app includes sample data for testing. When you start the backend, it will automatically create tables and insert sample clothing items.

### 2. Start the Application

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

### 3. Test the Outfit Generator
- Go to the Inventory page
- You'll see 10 sample clothing items
- Click "Generate Outfits" to see AI-generated combinations

## Prerequisites

- Node.js v14+
- PostgreSQL
- npm or yarn

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/project-website.git
cd project-website
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration values.

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 4. Install Backend Dependencies

```bash
cd ../backend
npm install
```

### 5. Setup Python Environment (prediction service)

The clothing prediction service is a FastAPI app located at `backend/clothing_predict_server.py`.

```bash
# from the repo root
cd backend
# optional: create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate   # macOS / Linux
# venv\Scripts\activate   # Windows (PowerShell)

pip install -r requirements.txt

# Optional: install CPU PyTorch for ImageNet model (no GPU/triton required)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Start the predictor (FastAPI on port 8000)
python3 clothing_predict_server.py
```

## Running the Application (local)

Run each block in its own terminal.

### Terminal 1 — Frontend (Port 3000)
```bash
cd frontend
npm install
npm start
```

### Terminal 2 — Backend Node API (Port 5000)
```bash
cd backend
npm install
npm run dev
# server.js listens on PORT (default 5000)
```

### Terminal 3 — Python predictor (FastAPI, Port 8000)
```bash
cd backend
source venv/bin/activate   # if you created one earlier
python3 clothing_predict_server.py
```

The frontend is available at `http://localhost:3000` and the backend API at `http://localhost:5000`.
The prediction service runs at `http://127.0.0.1:8000/predict-clothing` by default.

Quick health/debug endpoints:

```bash
# Node backend health
curl http://localhost:5000/api/health

# Python predictor debug/status
curl http://127.0.0.1:8000/debug/status
```

Troubleshooting notes:
- If CLIP fails to import with a Triton error (`No module named 'triton.backends'`), uninstall Triton in your Python environment:

```bash
pip3 uninstall triton -y
```

- If you only need basic ML without CLIP, installing CPU PyTorch (above) gives ImageNet-based predictions without GPU/triton complexities.

## API Endpoints

### Backend (Node.js)

**Clothing Items:**
- `GET /api/clothing` - Get all clothing items
- `POST /api/clothing` - Add new clothing item
- `GET /api/clothing/:id` - Get specific item details
- `DELETE /api/clothing/:id` - Remove clothing item

**Outfit Analysis:**
- `POST /api/analyze/compatibility` - Get outfit compatibility analysis
- `GET /api/analyze/utilization` - Get item utilization metrics

**Capsule Wardrobe:**
- `POST /api/capsule/recommendations` - Get capsule wardrobe suggestions
- `GET /api/capsule/:id` - Get generated capsule details

**System:**
- `GET /api/health` - Health check endpoint

## Environment Variables

Create a `.env` file in the root directory:

```env
# Frontend
REACT_APP_API_URL=http://localhost:5000

# Backend
PORT=5000
NODE_ENV=development
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wardrobe_db
CORS_ORIGIN=http://localhost:3000

# Python Engine
OPENAI_API_KEY=your_openai_api_key
PYTHON_ENGINE_PORT=5001
PYTORCH_MODEL_PATH=./models
```

## Database Setup

### PostgreSQL

1. Create a new database:
```bash
psql -U postgres -c "CREATE DATABASE wardrobe_db;"
```

2. Update `.env` with your PostgreSQL credentials

3. The backend will initialize the required tables on first run

### Database Tables
- `clothing_items` - Stores user clothing inventory
- `outfit_compatibility` - Stores outfit combination rules
- `capsule_recommendations` - Stores generated capsule wardrobes
- `user_preferences` - Stores user constraints and preferences

## Deployment

### Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
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

## Contributing

Please see [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

## Useful Links

- [React Documentation](https://react.dev)
- [Node.js Documentation](https://nodejs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [PyTorch Documentation](https://pytorch.org/docs)
- [Vercel Documentation](https://vercel.com/docs)

---

**Created**: February 2026
**Updated**: February 12, 2026
