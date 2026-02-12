# Wardrobe Capsule Optimizer

A smart wardrobe management system that helps users understand and optimize how their clothing items work together as a system. Input your clothing inventory, analyze outfit compatibility, and get personalized capsule wardrobe recommendations to reduce decision fatigue and maximize outfit variety.

## 🌟 Features

- **Clothing Inventory Management**: Add and manage your clothing items with details like category, color, formality, and season
- **Outfit Compatibility Analysis**: Model outfit combinations using defined constraints to identify valid outfit pairings
- **Item Utilization Tracking**: See how often each clothing item contributes to valid outfits
- **Capsule Wardrobe Recommendations**: Get AI-powered suggestions for a minimal wardrobe that maximizes outfit variety
- **Data-Driven Insights**: Make intentional wardrobe decisions based on compatibility analysis and utilization metrics
- **Production Ready**: Configured for deployment on Vercel
- **Version Control**: GitHub integration with contributing guidelines
- **Environment Management**: Comprehensive .env configuration

## 🛠️ Technology Stack

### Frontend
- React 18
- React Router v6
- Axios for HTTP requests
- CSS3 for styling

### Backend
- Node.js
- Express.js
- PostgreSQL
- CORS enabled

### Python Engine
- PyTorch for ML capabilities
- OpenAI API for intelligent insights
- Flask for API endpoints

### Deployment & DevOps
- Vercel for hosting
- GitHub for source control
- Environment-based configuration

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Python 3.8+
- PostgreSQL 12+
- Git

## 🚀 Quick Start

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

### 5. Setup Python Environment

```bash
cd ../python-engine
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

## 🏃 Running the Application

### Terminal 1 - Frontend (Port 3000)
```bash
cd frontend
npm start
```

### Terminal 2 - Backend (Port 5000)
```bash
cd backend
npm run dev
```

### Terminal 3 - Python Engine (Port 5001)
```bash
cd python-engine
python app.py
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
project-website/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── vercel.json
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── vercel.json
├── python-engine/
│   ├── engine.py
│   ├── app.py
│   ├── requirements.txt
│   └── .env.example
├── .github/
│   ├── CONTRIBUTING.md
│   └── README.md
├── .env.example
├── .gitignore
└── README.md
```

## 🔌 API Endpoints

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

## 📝 Environment Variables

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

## 🗄️ Database Setup

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

## 🚀 Deployment

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

## 🤝 Contributing

Please see [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines on how to contribute to this project.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

For issues, questions, or suggestions, please open an issue on GitHub.

## 🔗 Useful Links

- [React Documentation](https://react.dev)
- [Node.js Documentation](https://nodejs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [PyTorch Documentation](https://pytorch.org/docs)
- [Vercel Documentation](https://vercel.com/docs)

---

**Created**: February 2026
**Updated**: February 12, 2026
