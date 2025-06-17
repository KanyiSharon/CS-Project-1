import { useState, useEffect, useRef } from 'react';

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
  const particlesRef = useRef(null);

  const navigate = (path) => {
    console.log(`Navigate to: ${path}`);
    alert(`Would navigate to: ${path}`);
  };

  // Particle effect
  useEffect(() => {
    const createParticles = () => {
      if (!particlesRef.current) return;
      
      particlesRef.current.innerHTML = '';
      
      for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
          position: absolute;
          width: 2px;
          height: 2px;
          background: linear-gradient(45deg, #39ff14, #00d4ff);
          border-radius: 50%;
          left: ${Math.random() * 100}%;
          animation: float ${Math.random() * 4 + 4}s linear infinite;
          animation-delay: ${Math.random() * 6}s;
          pointer-events: none;
        `;
        particlesRef.current.appendChild(particle);
      }
    };

    createParticles();
    const interval = setInterval(createParticles, 10000);

    return () => clearInterval(interval);
  }, []);

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
        
        // Show success message with cyber style
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(45deg, rgba(57, 255, 20, 0.2), rgba(0, 212, 255, 0.2));
          border: 1px solid #39ff14;
          color: #39ff14;
          padding: 15px 20px;
          border-radius: 10px;
          font-family: 'Orbitron', monospace;
          font-size: 14px;
          z-index: 1000;
          animation: slideInRight 0.5s ease-out;
        `;
        successMsg.textContent = 'Signup successful! Please log in.';
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
          if (document.body.contains(successMsg)) {
            document.body.removeChild(successMsg);
          }
        }, 3000);
        
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

  const pageStyles = {
    container: {
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0b2e 50%, #0a0a0a 100%)',
      fontFamily: 'Orbitron, monospace'
    },
    grid: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundImage: `
        linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px)
      `,
      backgroundSize: '50px 50px',
      zIndex: -1,
      animation: 'gridPulse 4s ease-in-out infinite'
    },
    mainContent: {
      position: 'relative',
      zIndex: 20,
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    },
    authBox: {
      width: '100%',
      maxWidth: '32rem',
      position: 'relative',
      padding: '2rem',
      borderRadius: '1rem',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 212, 255, 0.3)',
      background: 'rgba(26, 11, 46, 0.4)',
      overflow: 'hidden'
    },
    animatedBorder: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '2px',
      background: 'linear-gradient(90deg, #00d4ff, #39ff14, #ff1493, #00d4ff)',
      backgroundSize: '200% 100%',
      animation: 'borderGlow 3s linear infinite'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: '900',
      marginBottom: '2rem',
      textAlign: 'center',
      background: 'linear-gradient(to right, #00d4ff, #39ff14, #ff1493)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontFamily: 'Orbitron, monospace'
    },
    formContainer: {
      display: 'grid',
      gap: '1.5rem'
    },
    inputContainer: {
      display: 'flex',
      flexDirection: 'column'
    },
    input: {
      width: '100%',
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      background: 'rgba(0, 0, 0, 0.5)',
      border: '2px solid rgba(0, 212, 255, 0.3)',
      color: '#00d4ff',
      fontFamily: 'monospace',
      fontSize: '1rem',
      outline: 'none',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(10px)',
      boxSizing: 'border-box'
    },
    inputError: {
      borderColor: '#ff1493'
    },
    inputFocus: {
      borderColor: '#39ff14',
      boxShadow: '0 0 20px rgba(57, 255, 20, 0.6)'
    },
    select: {
      width: '100%',
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      background: 'rgba(0, 0, 0, 0.5)',
      border: '2px solid rgba(0, 212, 255, 0.3)',
      color: '#00d4ff',
      fontFamily: 'monospace',
      fontSize: '1rem',
      outline: 'none',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(10px)',
      boxSizing: 'border-box',
      cursor: 'pointer'
    },
    errorText: {
      color: '#ff1493',
      fontSize: '0.75rem',
      marginTop: '0.25rem',
      fontFamily: 'monospace'
    },
    button: {
      width: '100%',
      padding: '1rem',
      borderRadius: '0.5rem',
      fontWeight: 'bold',
      color: 'black',
      fontSize: '1.125rem',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      transition: 'all 0.3s ease',
      background: loading 
        ? 'linear-gradient(45deg, #666, #999)' 
        : 'linear-gradient(45deg, #00d4ff, #39ff14)',
      boxShadow: '0 5px 20px rgba(0, 212, 255, 0.4)',
      fontFamily: 'Orbitron, monospace',
      border: 'none',
      cursor: loading ? 'not-allowed' : 'pointer',
      marginTop: '1rem'
    },
    buttonHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(0, 212, 255, 0.4)'
    },
    errorBox: {
      padding: '1rem',
      borderRadius: '0.5rem',
      border: '1px solid rgba(255, 20, 147, 0.5)',
      background: 'rgba(255, 20, 147, 0.1)',
      color: '#ff1493',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      animation: 'shake 0.5s ease-in-out'
    },
    loginText: {
      marginTop: '2rem',
      textAlign: 'center',
      color: 'rgba(0, 212, 255, 0.7)',
      fontFamily: 'monospace',
      fontSize: '0.875rem'
    },
    loginLink: {
      color: '#39ff14',
      textDecoration: 'none',
      fontWeight: 'bold',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      position: 'relative',
      transition: 'all 0.3s ease'
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        
        @keyframes gridPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }

        @keyframes float {
          0% { transform: translateY(100vh) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-10vh) translateX(100px); opacity: 0; }
        }

        @keyframes borderGlow {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        input::placeholder, select option {
          color: rgba(0, 212, 255, 0.5);
        }

        select option {
          background: #1a0b2e;
          color: #00d4ff;
        }
      `}</style>

      <div style={pageStyles.container}>
        <div style={pageStyles.grid} />
        
        <div 
          ref={particlesRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 10
          }}
        />

        <div style={pageStyles.mainContent}>
          <div style={pageStyles.authBox}>
            <div style={pageStyles.animatedBorder} />

            <h1 style={pageStyles.title}>Sign Up</h1>

            <form onSubmit={handleSubmit}>
              {errors.general && (
                <div style={pageStyles.errorBox}>
                  <span style={{ fontSize: '1.125rem' }}>⚠️</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{errors.general}</span>
                </div>
              )}
              
              <div style={pageStyles.formContainer}>
                <div style={pageStyles.inputContainer}>
                  <input
                    name="firstname"
                    value={form.firstname}
                    onChange={handleChange}
                    placeholder="First Name"
                    required
                    disabled={loading}
                    style={{
                      ...pageStyles.input,
                      ...(errors.firstname ? pageStyles.inputError : {})
                    }}
                    onFocus={(e) => {
                      if (!errors.firstname) {
                        Object.assign(e.target.style, pageStyles.inputFocus);
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.firstname) {
                        e.target.style.borderColor = 'rgba(0, 212, 255, 0.3)';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  />
                  {errors.firstname && <span style={pageStyles.errorText}>{errors.firstname}</span>}
                </div>

                <div style={pageStyles.inputContainer}>
                  <input
                    name="lastname"
                    value={form.lastname}
                    onChange={handleChange}
                    placeholder="Last Name"
                    required
                    disabled={loading}
                    style={{
                      ...pageStyles.input,
                      ...(errors.lastname ? pageStyles.inputError : {})
                    }}
                    onFocus={(e) => {
                      if (!errors.lastname) {
                        Object.assign(e.target.style, pageStyles.inputFocus);
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.lastname) {
                        e.target.style.borderColor = 'rgba(0, 212, 255, 0.3)';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  />
                  {errors.lastname && <span style={pageStyles.errorText}>{errors.lastname}</span>}
                </div>

                <div style={pageStyles.inputContainer}>
                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Username"
                    required
                    disabled={loading}
                    style={{
                      ...pageStyles.input,
                      ...(errors.username ? pageStyles.inputError : {})
                    }}
                    onFocus={(e) => {
                      if (!errors.username) {
                        Object.assign(e.target.style, pageStyles.inputFocus);
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.username) {
                        e.target.style.borderColor = 'rgba(0, 212, 255, 0.3)';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  />
                  {errors.username && <span style={pageStyles.errorText}>{errors.username}</span>}
                </div>

                <div style={pageStyles.inputContainer}>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Email"
                    required
                    disabled={loading}
                    style={{
                      ...pageStyles.input,
                      ...(errors.email ? pageStyles.inputError : {})
                    }}
                    onFocus={(e) => {
                      if (!errors.email) {
                        Object.assign(e.target.style, pageStyles.inputFocus);
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.email) {
                        e.target.style.borderColor = 'rgba(0, 212, 255, 0.3)';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  />
                  {errors.email && <span style={pageStyles.errorText}>{errors.email}</span>}
                </div>

                <div style={pageStyles.inputContainer}>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Password (min 6 characters)"
                    required
                    disabled={loading}
                    style={{
                      ...pageStyles.input,
                      ...(errors.password ? pageStyles.inputError : {})
                    }}
                    onFocus={(e) => {
                      if (!errors.password) {
                        Object.assign(e.target.style, pageStyles.inputFocus);
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.password) {
                        e.target.style.borderColor = 'rgba(0, 212, 255, 0.3)';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  />
                  {errors.password && <span style={pageStyles.errorText}>{errors.password}</span>}
                </div>

                <div style={pageStyles.inputContainer}>
                  <select
                    name="specify"
                    value={form.specify}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    style={pageStyles.select}
                    onFocus={(e) => {
                      Object.assign(e.target.style, pageStyles.inputFocus);
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(0, 212, 255, 0.3)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="Driver">Driver</option>
                    <option value="Commuter">Commuter</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  style={pageStyles.button}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      Object.assign(e.target.style, pageStyles.buttonHover);
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 5px 20px rgba(0, 212, 255, 0.4)';
                    }
                  }}
                >
                  {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '1.25rem',
                        height: '1.25rem',
                        border: '2px solid rgba(0, 0, 0, 0.3)',
                        borderTop: '2px solid black',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <span>Signing Up...</span>
                    </div>
                  ) : (
                    'Sign Up'
                  )}
                </button>
              </div>
            </form>

            <p style={pageStyles.loginText}>
              Already have an account?{' '}
              <button 
                onClick={() => navigate('/login')}
                style={pageStyles.loginLink}
                onMouseEnter={(e) => {
                  e.target.style.color = '#00d4ff';
                  e.target.style.textShadow = '0 0 10px #00d4ff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#39ff14';
                  e.target.style.textShadow = 'none';
                }}
              >
                Log in here
              </button>
            </p>

            {/* Decorative circles */}
            <div style={{
              position: 'absolute',
              bottom: '-0.5rem',
              right: '-0.5rem',
              width: '5rem',
              height: '5rem',
              border: '2px solid rgba(0, 212, 255, 0.2)',
              borderRadius: '50%'
            }} />
            <div style={{
              position: 'absolute',
              top: '-0.5rem',
              left: '-0.5rem',
              width: '4rem',
              height: '4rem',
              border: '2px solid rgba(57, 255, 20, 0.2)',
              borderRadius: '50%'
            }} />
          </div>
        </div>
      </div>
    </>
  );
}