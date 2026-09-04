import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const isActive = (path) => location.pathname === path;

  // Extensible list of navigation items for future additions
  const navItems = [
    { path: '/tracker', label: 'Today', icon: '🧘', id: 'nav-tracker' },
    { path: '/select-practices', label: 'Practices', icon: '⚙️', id: 'nav-select-practices' },
    { path: '/progress', label: 'Progress', icon: '📈', id: 'nav-progress' },
  ];

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          {/* Top Left Menu Toggle Icon */}
          <button
            className={`navbar-menu-btn ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Navigation Menu"
            id="navbar-toggle-btn"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
          <span className="navbar-brand">🔱 Sadhana Tracker</span>
        </div>

        {/* Desktop inline nav links */}
        <div className="navbar-links desktop-only">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'nav-link-active' : ''}`}
              id={item.id}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </div>

        <div className="navbar-user desktop-only">
          <div className="navbar-avatar" title={user.name}>{initials}</div>
          <button className="btn-logout" onClick={handleLogout} id="navbar-logout-btn">
            Logout
          </button>
        </div>
      </nav>

      {/* Mobile / Slide-Out Navigation Drawer */}
      {menuOpen && (
        <div className="nav-backdrop" onClick={() => setMenuOpen(false)} />
      )}

      <aside className={`nav-drawer ${menuOpen ? 'open' : ''}`}>
        <div className="nav-drawer-header">
          <div className="nav-drawer-brand">
            <span className="brand-icon-sm">🔱</span>
            <div className="brand-text-sm">
              <strong>Sadhana Tracker</strong>
              <span>Daily Practice Journal</span>
            </div>
          </div>
          <button className="btn-close-drawer" onClick={() => setMenuOpen(false)} aria-label="Close Menu">
            ✕
          </button>
        </div>

        <div className="nav-drawer-user">
          <div className="navbar-avatar lg">{initials}</div>
          <div className="user-details">
            <span className="user-name">{user.name || 'Practitioner'}</span>
            <span className="user-email">{user.email}</span>
          </div>
        </div>

        <div className="nav-drawer-links">
          <span className="drawer-section-title">Navigation</span>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`drawer-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="drawer-link-icon">{item.icon}</span>
              <span className="drawer-link-label">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="nav-drawer-footer">
          <button className="btn-drawer-logout" onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
