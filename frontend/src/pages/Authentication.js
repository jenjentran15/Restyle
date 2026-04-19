import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Authentication.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000'; //setups url
const INITIAL_STATE = { name: '', email: '', password: '', confirmPassword: '' };

function Authentication() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const validate = () => {
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (!isLogin && formData.password !== formData.confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation_err = validate()
    if (validation_err) return setError(validation_err);

    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',},
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          ...(isLogin ? {} : { name: formData.name }),
        }),
      });
      const data = await response.json();

      if (!response.ok) { setError(data.message || 'Authentication failed'); }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));  
      navigate('/');
    } catch (err) {
      setError('Connection error. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(prev => !prev);
    setFormData(INITIAL_STATE);
    setError('');
  };

  return (
    <div className="auth-wrapper">
      <header className="header">
        <div className="container">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h1 className="logo">Restyle</h1>
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
                  <label htmlFor="name">Username</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    required
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
                  value={formData.email}
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
                  value={formData.password}
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
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
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