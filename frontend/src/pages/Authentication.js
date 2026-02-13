import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Authentication.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Authentication() {
  const navigate = useNavigate();
  const [accData, setAccData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
    email: ''
  });
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setAccData({...accData, [e.target.name]: e.target.value});
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!isLogin && accData.password !== accData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (accData.password.length < 6) {
      setError('Password must contain at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: accData.email,
          password: accData.password,
          name: accData.name
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        navigate('/');
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setAccData({
      email: '',
      password: '',
      confirmPassword: '',
      name: ''
    });
  };

  return (
    <div className="auth-wrapper">
      <header className="header">
        <div className="container">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h1 className="logo">👔 Restyle</h1>
          </Link>
        </div>
      </header>
      
      <div className="auth-page">
        <div className="container">
          <div className="auth-container">
            <div className="auth-card">
              <div className="auth-form-header">
                <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p>{isLogin ? 'Sign in to access your wardrobe' : 'Start optimizing your wardrobe today'}</p>
              </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && <div className="error-message">{error}</div>}

              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={accData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    required={!isLogin}
                    disabled={loading}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={accData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={accData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={accData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required={!isLogin}
                    disabled={loading}
                  />
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={toggleMode} 
                  className="toggle-link"
                  disabled={loading}
                  type="button"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
    </div>
  );
}

export default Authentication;