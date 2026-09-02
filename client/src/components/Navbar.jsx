import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <span className="navbar-brand">🔱 Sadhana Tracker</span>

      {/* Desktop nav links */}
      <div className="navbar-links">
        <Link
          to="/tracker"
          className={`nav-link ${isActive('/tracker') ? 'nav-link-active' : ''}`}
          id="nav-tracker"
        >
          🧘 Today
        </Link>
        <Link
          to="/progress"
          className={`nav-link ${isActive('/progress') ? 'nav-link-active' : ''}`}
          id="nav-progress"
        >
          📈 Progress
        </Link>
      </div>

      <div className="navbar-user">
        <div className="navbar-avatar" title={user.name}>{initials}</div>
        <button className="btn-logout" onClick={handleLogout} id="navbar-logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
}
