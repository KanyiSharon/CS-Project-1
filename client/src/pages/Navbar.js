import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Search, MapPin, Cloud } from 'lucide-react';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/search', label: 'Search', icon: Search },
    { path: '/map', label: 'Map', icon: MapPin },
    { path: '/weather', label: 'Weather', icon: Cloud },
  ];

  return (
    <>
      <style jsx>{`
        @keyframes gridPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        
        @keyframes borderGlow {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
        
        @keyframes iconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .cyber-navbar {
          font-family: 'Courier New', monospace;
          position: static;
          top: auto;
          left: auto;
          transform: none;
          z-index: 50;
          background: rgba(26, 11, 46, 0.4);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 212, 255, 0.4);
          border-radius: 50px;
          padding: 8px;
          box-shadow: 0 10px 40px rgba(0, 212, 255, 0.2);
          margin: 20px 0 0 20px;
          display: inline-block;
        }
        
        .cyber-navbar::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 50px;
          padding: 2px;
          background: linear-gradient(90deg, #00d4ff, #39ff14, #ff1493, #00d4ff);
          background-size: 200% 100%;
          animation: borderGlow 3s linear infinite;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
        }
        
        .cyber-nav-items {
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
          z-index: 2;
        }
        
        .cyber-nav-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 40px;
          color: #00d4ff;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          background: transparent;
        }
        
        .cyber-nav-link::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.2), transparent);
          transition: left 0.5s;
        }
        
        .cyber-nav-link:hover::before {
          left: 100%;
        }
        
        .cyber-nav-link:hover {
          color: #39ff14;
          text-shadow: 0 0 10px #39ff14;
          transform: translateY(-2px);
        }
        
        .cyber-nav-link.active {
          background: linear-gradient(45deg, rgba(0, 212, 255, 0.2), rgba(57, 255, 20, 0.2));
          color: #39ff14;
          text-shadow: 0 0 15px #39ff14;
          box-shadow: 0 0 20px rgba(57, 255, 20, 0.3);
          border: 1px solid rgba(57, 255, 20, 0.5);
        }
        
        .cyber-nav-icon {
          animation: iconPulse 2s ease-in-out infinite;
        }
        
        .mobile-menu-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 50;
          width: 50px;
          height: 50px;
          background: rgba(26, 11, 46, 0.4);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 212, 255, 0.4);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #00d4ff;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .mobile-menu-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 50%;
          padding: 2px;
          background: linear-gradient(90deg, #00d4ff, #39ff14, #ff1493, #00d4ff);
          background-size: 200% 100%;
          animation: borderGlow 3s linear infinite;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
        }
        
        .mobile-menu-btn:hover {
          color: #39ff14;
          text-shadow: 0 0 15px #39ff14;
          transform: scale(1.1);
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
        }
        
        .mobile-menu-btn svg {
          position: relative;
          z-index: 2;
        }
        
        .mobile-overlay {
          position: fixed;
          inset: 0;
          z-index: 40;
          background: rgba(10, 10, 10, 0.8);
          backdrop-filter: blur(10px);
        }
        
        .mobile-menu {
          position: absolute;
          top: 0;
          right: 0;
          height: 100%;
          width: 280px;
          background: linear-gradient(135deg, rgba(26, 11, 46, 0.9) 0%, rgba(10, 10, 10, 0.9) 100%);
          backdrop-filter: blur(20px);
          border-left: 1px solid rgba(0, 212, 255, 0.3);
          box-shadow: -10px 0 40px rgba(0, 212, 255, 0.2);
          animation: slideInFromRight 0.3s ease-out;
        }
        
        .mobile-menu::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px);
          background-size: 30px 30px;
          animation: gridPulse 4s ease-in-out infinite;
          pointer-events: none;
        }
        
        .mobile-nav-items {
          padding: 80px 24px 24px;
          position: relative;
          z-index: 2;
        }
        
        .mobile-nav-link {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 16px 20px;
          margin-bottom: 8px;
          border-radius: 15px;
          color: #00d4ff;
          text-decoration: none;
          font-size: 16px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          border: 1px solid transparent;
        }
        
        .mobile-nav-link::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.2), transparent);
          transition: left 0.5s;
        }
        
        .mobile-nav-link:hover::before {
          left: 100%;
        }
        
        .mobile-nav-link:hover {
          color: #39ff14;
          text-shadow: 0 0 10px #39ff14;
          transform: translateX(10px);
          background: rgba(0, 212, 255, 0.1);
          border-color: rgba(0, 212, 255, 0.3);
        }
        
        .mobile-nav-link.active {
          background: linear-gradient(45deg, rgba(0, 212, 255, 0.2), rgba(57, 255, 20, 0.2));
          color: #39ff14;
          text-shadow: 0 0 15px #39ff14;
          box-shadow: 0 0 20px rgba(57, 255, 20, 0.3);
          border-color: rgba(57, 255, 20, 0.5);
        }
        
        .mobile-nav-icon {
          animation: iconPulse 2s ease-in-out infinite;
        }
        
        .desktop-dropdown {
          position: absolute;
          right: 0;
          top: 70px;
          background: rgba(26, 11, 46, 0.9);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 212, 255, 0.4);
          border-radius: 20px;
          padding: 20px;
          min-width: 200px;
          box-shadow: 0 10px 40px rgba(0, 212, 255, 0.3);
          animation: slideInFromRight 0.3s ease-out;
        }
        
        .desktop-dropdown::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 20px;
          padding: 2px;
          background: linear-gradient(90deg, #00d4ff, #39ff14, #ff1493, #00d4ff);
          background-size: 200% 100%;
          animation: borderGlow 3s linear infinite;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
        }
        
        .desktop-dropdown-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
          z-index: 2;
        }
        
        .desktop-dropdown-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          color: #00d4ff;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          border: 1px solid transparent;
        }
        
        .desktop-dropdown-link::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.2), transparent);
          transition: left 0.5s;
        }
        
        .desktop-dropdown-link:hover::before {
          left: 100%;
        }
        
        .desktop-dropdown-link:hover {
          color: #39ff14;
          text-shadow: 0 0 10px #39ff14;
          background: rgba(0, 212, 255, 0.1);
          border-color: rgba(0, 212, 255, 0.3);
        }
        
        .desktop-dropdown-link.active {
          background: linear-gradient(45deg, rgba(0, 212, 255, 0.2), rgba(57, 255, 20, 0.2));
          color: #39ff14;
          text-shadow: 0 0 15px #39ff14;
          box-shadow: 0 0 20px rgba(57, 255, 20, 0.3);
          border-color: rgba(57, 255, 20, 0.5);
        }
        
        @media (max-width: 768px) {
          .cyber-navbar {
            display: none;
          }
        }
        
        @media (min-width: 769px) {
          .mobile-menu-btn {
            display: none;
          }
        }
      `}</style>

      {/* Desktop Static Navbar */}
      <div className="cyber-navbar">
        <nav className="cyber-nav-items">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`cyber-nav-link ${location.pathname === path ? 'active' : ''}`}
            >
              <Icon size={18} className="cyber-nav-icon" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile Hamburger Menu Button */}
      <button
        onClick={toggleMenu}
        className="mobile-menu-btn md:hidden"
        aria-label="Toggle mobile navigation menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="mobile-overlay md:hidden" onClick={closeMenu}>
          <div 
            className="mobile-menu"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="mobile-nav-items">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={closeMenu}
                  className={`mobile-nav-link ${location.pathname === path ? 'active' : ''}`}
                >
                  <Icon size={20} className="mobile-nav-icon" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {isOpen && (
        <div 
          className="hidden md:block fixed inset-0 z-30" 
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </>
  );
}

export default Navbar;