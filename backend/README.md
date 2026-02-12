# Backend Documentation

## Overview

The backend is built with Node.js and Express.js, providing RESTful API endpoints with PostgreSQL database integration.

## Project Structure

```
backend/
├── config/
│   └── database.js
├── middleware/
├── routes/
├── server.js
├── package.json
├── vercel.json
└── .env.example
```

## Getting Started

### Installation

```bash
cd backend
npm install
```

### Development

```bash
npm run dev
```

The server will start at `http://localhost:5000`

### Production

```bash
npm start
```

## Environment Variables

Create `.env` file:

```env
PORT=5000
NODE_ENV=development
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=project_db
CORS_ORIGIN=http://localhost:3000
```

## API Endpoints

### Health Check
```
GET /api/health
Response: { status: "OK", message: "Backend is running", timestamp: "..." }
```

### Get Data
```
GET /api/data
Response: { data: [...] }
```

### Create Data
```
POST /api/data
Body: { name: "...", description: "..." }
Response: { id: 4, name: "...", description: "...", created: "..." }
```

## Database Configuration

PostgreSQL connection pool is configured in `config/database.js`.

### Connection Parameters
- User: `DB_USER`
- Password: `DB_PASSWORD`
- Host: `DB_HOST`
- Port: `DB_PORT`
- Database: `DB_NAME`

### Setting Up Database

```bash
# Create database
psql -U postgres -c "CREATE DATABASE project_db;"

# Connect and run setup (if migrations exist)
psql -U postgres -d project_db -f setup.sql
```

## Middleware

- CORS: Enabled for frontend origin
- JSON: Automatic request body parsing
- Error Handling: Global error middleware

## Error Handling

All errors return JSON with status code:
```javascript
{ error: "Error message" }
```

## Deployment

### Vercel

The `vercel.json` file configures:
- Build process
- Serverless functions
- Environment variables
- Route rules

Deploy with:
```bash
vercel deploy
```

## Troubleshooting

**Port 5000 in use:**
```bash
lsof -ti:5000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5000   # Windows
```

**Database connection error:**
- Check `.env` credentials
- Ensure PostgreSQL is running
- Verify database exists

**CORS errors:**
- Check `CORS_ORIGIN` matches frontend URL
- Verify backend port configuration

## Dependencies

- `express`: Web framework
- `cors`: Cross-origin requests
- `dotenv`: Environment variables
- `pg`: PostgreSQL client
- `axios`: HTTP client
- `nodemon`: Development auto-reload

## Best Practices

- Use environment variables for sensitive data
- Implement proper error handling
- Add request validation
- Use connection pooling for database
- Monitor error logs
- Add request logging middleware
