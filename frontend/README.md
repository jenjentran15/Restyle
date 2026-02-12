# Frontend Documentation

## Overview

The frontend is built with React 18, featuring a responsive, component-based architecture.

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Header.js
│   │   └── Footer.js
│   ├── pages/
│   │   └── Home.js
│   ├── styles/
│   │   ├── index.css
│   │   ├── App.css
│   │   ├── Header.css
│   │   ├── Footer.css
│   │   └── Home.css
│   ├── App.js
│   └── index.js
└── package.json
```

## Getting Started

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm start
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## Components

### Header
Main navigation component with site logo and menu links.

### Footer
Footer component with copyright and utility links.

### Home Page
Landing page with feature cards and data display section.

## Styling

Uses CSS3 with a mobile-first responsive design. Main color scheme:
- Primary: #667eea
- Secondary: #764ba2
- Dark: #2c3e50

## API Integration

Communicates with backend API at `$REACT_APP_API_URL`

### Example: Fetching Data

```javascript
fetch('/api/health')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

## Deployment

### Vercel

1. Connect repository to Vercel
2. Set `REACT_APP_API_URL` environment variable
3. Deploy automatically on push

## Troubleshooting

**Port 3000 already in use:**
```bash
npm start -- --port 3001
```

**Clear cache:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## Performance Optimization

- Code splitting with React.lazy()
- Image optimization
- CSS minification in production build
- Browser caching headers

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
