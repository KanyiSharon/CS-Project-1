import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    username: '',
    password: '',
    email: '',
    specify: 'Driver'
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear specific error when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.firstname.trim()) newErrors.firstname = 'First name is required';
    if (!form.lastname.trim()) newErrors.lastname = 'Last name is required';
    if (!form.username.trim()) newErrors.username = 'Username is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    if (!form.password.trim()) newErrors.password = 'Password is required';
    if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email && !emailRegex.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkUsernameExists = async (username) => {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/check-username/${username}`);
      const data = await res.json();
      return data.exists;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  const checkEmailExists = async (email) => {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/check-email/${email}`);
      const data = await res.json();
      return data.exists;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting signup with data:', form);

      // Check if username already exists
      const usernameExists = await checkUsernameExists(form.username);
      if (usernameExists) {
        setErrors({ username: 'Username already exists' });
        setLoading(false);
        return;
      }

      // Check if email already exists
      const emailExists = await checkEmailExists(form.email);
      if (emailExists) {
        setErrors({ email: 'Email already exists' });
        setLoading(false);
        return;
      }

      // Create user using the correct endpoint
      const res = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);

      if (res.ok) {
        const data = await res.json();
        console.log('Signup successful:', data);
        alert('Signup successful! Please log in.');
        navigate('/login');
      } else {
        // Handle HTTP errors
        const errorData = await res.json();
        console.error('Signup failed:', errorData);
        
        // Handle specific error cases
        if (errorData.error === 'Username or email already exists') {
          setErrors({ general: 'Username or email already exists' });
        } else {
          setErrors({ general: errorData.error || `Signup failed with status: ${res.status}` });
        }
      }
    } catch (error) {
      console.error('Network or fetch error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setErrors({ general: 'Cannot connect to server. Please check if the backend server is running on port 5000.' });
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="auth-box">
        <h1>Sign Up</h1>
        <form onSubmit={handleSubmit}>
          {errors.general && (
            <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
              {errors.general}
            </div>
          )}
          
          <div>
            <input
              name="firstname"
              value={form.firstname}
              onChange={handleChange}
              placeholder="First Name"
              required
              disabled={loading}
              style={{ borderColor: errors.firstname ? 'red' : '' }}
            />
            {errors.firstname && <span style={{ color: 'red', fontSize: '12px' }}>{errors.firstname}</span>}
          </div>

          <div>
            <input
              name="lastname"
              value={form.lastname}
              onChange={handleChange}
              placeholder="Last Name"
              required
              disabled={loading}
              style={{ borderColor: errors.lastname ? 'red' : '' }}
            />
            {errors.lastname && <span style={{ color: 'red', fontSize: '12px' }}>{errors.lastname}</span>}
          </div>

          <div>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Username"
              required
              disabled={loading}
              style={{ borderColor: errors.username ? 'red' : '' }}
            />
            {errors.username && <span style={{ color: 'red', fontSize: '12px' }}>{errors.username}</span>}
          </div>

          <div>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              required
              disabled={loading}
              style={{ borderColor: errors.email ? 'red' : '' }}
            />
            {errors.email && <span style={{ color: 'red', fontSize: '12px' }}>{errors.email}</span>}
          </div>

          <div>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password (min 6 characters)"
              required
              disabled={loading}
              style={{ borderColor: errors.password ? 'red' : '' }}
            />
            {errors.password && <span style={{ color: 'red', fontSize: '12px' }}>{errors.password}</span>}
          </div>

          <div>
            <select
              name="specify"
              value={form.specify}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="Driver">Driver</option>
              <option value="Commuter">Commuter</option>
            </select>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>

        <p>
          Already have an account?{' '}
          <Link to="/login">Log in here</Link>
        </p>
      </div>
    </div>
  );
}