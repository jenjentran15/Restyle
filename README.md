# Restyle - Wardrobe Manager

Restyle is a wardrobe management and outfit planning application built with React, Node.js, Express, PostgreSQL, and an optional Python FastAPI clothing prediction service. Users can create an account, manage clothing items, upload clothing images, generate outfit combinations, save outfit ideas, and preview outfits visually.

## Features

- **User Authentication** - Create an account, log in, and access user-specific wardrobe data
- **Wardrobe Inventory** - Add, view, and delete clothing items with category, color, season, formality, and image data
- **Image Upload** - Upload photos for clothing items
- **AI-Assisted Scanning** - Suggest clothing attributes from uploaded images using an optional Python FastAPI prediction service
- **Outfit Generation** - Generate outfit combinations using filters, heuristic scoring, and beam search
- **Saved Outfits** - Save preferred outfit combinations for later use
- **Outfit Preview** - Preview generated outfits visually
- **Manual Entry Fallback** - Add clothing items manually if the scanning service is not running

## Tech Stack

**Frontend:** React 18, React Router, Axios, CSS3  
**Backend:** Node.js, Express, PostgreSQL, Multer, Sharp  
**Authentication:** JSON Web Tokens, bcryptjs  
**Prediction Service:** Python, FastAPI, OpenCV, optional PyTorch/torchvision, optional CLIP  
**3D Preview:** Three.js, React Three Fiber, Drei  

## Prerequisites

Before running the project, install:

- Node.js v18+
- PostgreSQL
- npm or yarn
- Python 3.9+ if using the optional prediction service

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/jenjentran15/Restyle.git
cd Restyle
```

### 2. Create the Database

```bash
psql -U postgres -c "CREATE DATABASE wardrobe_db;"
```

The backend will initialize the required tables when the server starts.

### 3. Configure Environment Variables

Create a `.env` file inside the `backend` folder:

```bash
cd backend
touch .env
```

Add the following values and update them for your local setup:

```env
PORT=5000
NODE_ENV=development
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wardrobe_db
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your_jwt_secret

PREDICT_SERVICE_URL=http://127.0.0.1:8000
PREDICT_SERVICE_TIMEOUT_MS=30000
```

### 4. Install Backend Dependencies

```bash
cd backend
npm install
```

### 5. Install Frontend Dependencies

Open a new terminal from the project root:

```bash
cd frontend
npm install
```

If the outfit preview dependencies are missing, install them:

```bash
npm install three @react-three/fiber @react-three/drei
```

### 6. Optional: Setup the Python Prediction Service

The clothing prediction service is located at `backend/clothing_predict_server.py`.

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # macOS / Linux
# venv\Scripts\activate    # Windows PowerShell

pip install -r requirements.txt
```

Optional CPU PyTorch install:

```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
```

## Running the Application

Run each service in a separate terminal.

### Backend

```bash
cd backend
npm run dev
```

Backend runs at:

```bash
http://localhost:5000
```

### Frontend

```bash
cd frontend
npm start
```

Frontend runs at:

```bash
http://localhost:3000
```

### Optional Prediction Service

```bash
cd backend
source venv/bin/activate
python3 clothing_predict_server.py
```

Prediction service runs at:

```bash
http://127.0.0.1:8000
```

## Testing the Application

1. Open `http://localhost:3000`
2. Create an account or log in
3. Add clothing items manually or upload an image
4. Use the scan feature if the prediction service is running
5. Generate outfit combinations
6. Save preferred outfits
7. Open the outfit preview page

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Create a new user account
- `POST /api/auth/login` - Log in and receive an authentication token

### Clothing Items

- `GET /api/clothing` - Get the logged-in user's clothing items
- `GET /api/clothing/:id` - Get a specific clothing item
- `POST /api/clothing` - Add a new clothing item
- `DELETE /api/clothing/:id` - Delete a clothing item

### Image Upload and Scanning

- `POST /api/upload-clothing` - Upload and save a clothing image
- `POST /api/predict-clothing` - Send an uploaded image to the Python prediction service and return suggested attributes

### Outfit Generation

- `POST /api/outfits/generate` - Generate outfit combinations using wardrobe items, filters, scoring, and beam search

### System

- `GET /api/health` - Health check endpoint

## Database Tables

- `users` - Stores user account information and hashed passwords
- `clothing_items` - Stores user clothing inventory, attributes, and image paths

## Project Structure

## Project Structure

```bash
Restyle/
├── backend/
│   ├── config/
│   ├── clothingPrediction.js
│   ├── clothing_predict_server.py
│   ├── outfitGenerator.js
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   │   ├── models/
│   │   └── index.html
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── content/
│   │   ├── pages/
│   │   ├── styles/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── requirements.txt
├── .gitignore
└── README.md
```

**Created:** February 2026  
**Updated:** May 2026
