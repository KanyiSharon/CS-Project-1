import { useState, useEffect, useRef } from 'react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const particlesRef = useRef(null);

  const navigate = (path) => {
    console.log(`Navigate to: ${path}`);
    alert(`Would navigate to: ${path}`);
  };

  // Fixed particle effect - no DOM queries, uses ref
  useEffect(() => {
    const createParticles = () => {
      if (!particlesRef.current) return;
      
      // Clear existing particles
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
  }, []); // Empty dependency array

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

      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Login successful:', data);
        
        // Show success message
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
        successMsg.textContent = `Welcome back, ${data.user.firstname}!`;
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
          if (document.body.contains(successMsg)) {
            document.body.removeChild(successMsg);
          }
        }, 3000);
        
        navigate('/welcome');
      } else {
        const errorData = await res.json();
        
        if (res.status === 401) {
          setError('Invalid username or password');
        } else {
          setError(errorData.error || 'Login failed');
        }
      }
    } catch (err) {
      console.error('Network error:', err);
      
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Cannot connect to server. Please check if the backend server is running.');
      } else {
        setError('An unexpected error occurred. Please try again.');
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
      maxWidth: '28rem',
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
    input: {
      width: '92%',
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
      marginBottom: '1.5rem'      
    },
    inputFocus: {
      borderColor: '#39ff14',
      boxShadow: '0 0 20px rgba(57, 255, 20, 0.6)'
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
      cursor: loading ? 'not-allowed' : 'pointer'
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
    signupText: {
      marginTop: '2rem',
      textAlign: 'center',
      color: 'rgba(0, 212, 255, 0.7)',
      fontFamily: 'monospace',
      fontSize: '0.875rem'
    },
    signupLink: {
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

        input::placeholder {
          color: rgba(0, 212, 255, 0.5);
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

            <h1 style={pageStyles.title}>Login</h1>

            <div>
              {error && (
                <div style={pageStyles.errorBox}>
                  <span style={{ fontSize: '1.125rem' }}>⚠️</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{error}</span>
                </div>
              )}
              
              <input
                type="text"
                value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLogin(e);
                  }
                }}
                placeholder="Username"
                required
                disabled={loading}
                style={pageStyles.input}
                onFocus={(e) => {
                  Object.assign(e.target.style, pageStyles.inputFocus);
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(0, 212, 255, 0.3)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              
              <input
                type="password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLogin(e);
                  }
                }}
                placeholder="Password"
                required
                disabled={loading}
                style={pageStyles.input}
                onFocus={(e) => {
                  Object.assign(e.target.style, pageStyles.inputFocus);
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(0, 212, 255, 0.3)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              
              <button 
                type="button"
                onClick={handleLogin}
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
                    <span>Logging In...</span>
                  </div>
                ) : (
                  'Login'
                )}
              </button>
            </div>
            
            <p style={pageStyles.signupText}>
              Don't have an account?{' '}
              <button 
                onClick={() => navigate('/signup')}
                style={pageStyles.signupLink}
                onMouseEnter={(e) => {
                  e.target.style.color = '#00d4ff';
                  e.target.style.textShadow = '0 0 10px #00d4ff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#39ff14';
                  e.target.style.textShadow = 'none';
                }}
              >
                Sign up
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

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}