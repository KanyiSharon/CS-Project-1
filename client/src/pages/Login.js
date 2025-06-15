import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', { username });

      // Fixed: Changed from /api/login to /api/auth/login
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Removed credentials: 'include' to match the signup component
        body: JSON.stringify({ username, password })
      });

      console.log('Response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('Login successful:', data);
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        
        alert(`Welcome back, ${data.user.firstname}!`);
        navigate('/welcome'); // or change to your desired route
      } else {
        const errorData = await res.json();
        console.error('Login failed:', errorData);
        
        if (res.status === 401) {
          setError('Invalid username or password');
        } else {
          setError(errorData.error || 'Login failed');
        }
      }
    } catch (err) {
      console.error('Network or fetch error:', err);
      
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Cannot connect to server. Please check if the backend server is running.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="auth-box">
        <h1>Login</h1>
        <form onSubmit={handleLogin}>
          {error && (
            <div className="error-message" style={{ color: 'red', marginBottom: '15px' }}>
              {error}
            </div>
          )}
          
          <input
            type="text"
            value={username}
            onChange={e => {
              setUsername(e.target.value);
              if (error) setError(''); // Clear error when user starts typing
            }}
            placeholder="Username"
            required
            disabled={loading}
          />
          
          <input
            type="password"
            value={password}
            onChange={e => {
              setPassword(e.target.value);
              if (error) setError(''); // Clear error when user starts typing
            }}
            placeholder="Password"
            required
            disabled={loading}
          />
          
          <button type="submit" disabled={loading}>
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </form>
        
        <p>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}