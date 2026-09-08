import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api';

export default function Landing() {
  const [pradakshinaCount, setPradakshinaCount] = useState(0);
  const [guruPujaAttended, setGuruPujaAttended] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingPradakshina, setUpdatingPradakshina] = useState(false);
  const [updatingGuruPuja, setUpdatingGuruPuja] = useState(false);

  // Long press animation state
  const [isPressingPradakshina, setIsPressingPradakshina] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const longPressTimerRef = useRef(null);
  const animFrameRef = useRef(null);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Fetch today's status on mount
  useEffect(() => {
    const fetchToday = async () => {
      try {
        const { data } = await api.get('/sadhana/today');
        if (data.log) {
          setPradakshinaCount(data.log.pradakshinaCount || 0);
          setGuruPujaAttended(!!data.log.guruPujaAttended);
        }
      } catch (err) {
        console.error('Error loading today status:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchToday();
  }, []);

  // Handler to increment Pradakshina count
  const handlePradakshinaIncrement = async () => {
    setPradakshinaCount(prev => prev + 1);
    setUpdatingPradakshina(true);
    try {
      const { data } = await api.post('/sadhana/pradakshina', { incrementBy: 1 });
      if (data.pradakshinaCount !== undefined) {
        setPradakshinaCount(data.pradakshinaCount);
      }
    } catch (err) {
      console.error('Failed to update pradakshina count:', err);
    } finally {
      setUpdatingPradakshina(false);
    }
  };

  // Long press start handler
  const handlePradakshinaPressStart = () => {
    setIsPressingPradakshina(true);
    const startTime = Date.now();
    const duration = 700; // 700ms long press duration

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setPressProgress(progress);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(updateProgress);
      } else {
        // Completed long press!
        handlePradakshinaIncrement();
        setIsPressingPradakshina(false);
        setPressProgress(0);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateProgress);
  };

  // Long press end / cancel handler
  const handlePradakshinaPressEnd = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    // If released before 700ms duration finishes, treat as normal tap/click if progress was very short
    if (isPressingPradakshina && pressProgress < 0.25 && pressProgress > 0) {
      handlePradakshinaIncrement();
    }
    setIsPressingPradakshina(false);
    setPressProgress(0);
  };

  // Handler for Guru Puja click (can be clicked only ONCE)
  const handleGuruPujaClick = async () => {
    if (guruPujaAttended || updatingGuruPuja) return;

    setGuruPujaAttended(true);
    setUpdatingGuruPuja(true);
    try {
      const { data } = await api.post('/sadhana/guru-puja');
      if (data.guruPujaAttended !== undefined) {
        setGuruPujaAttended(data.guruPujaAttended);
      }
    } catch (err) {
      console.error('Failed to record Guru Puja:', err);
      setGuruPujaAttended(false); // revert on error
    } finally {
      setUpdatingGuruPuja(false);
    }
  };

  const circumference = 452; // 2 * PI * 72
  const dashoffset = circumference - pressProgress * circumference;

  return (
    <>
      <Navbar />
      <div className="page" style={{ paddingTop: 90 }}>
        <div className="container-lg animate-in">
          {/* Hero Header */}
          <div className="landing-hero">
            <div className="date-badge">📅 {today}</div>
            <h1 className="page-title" style={{ fontSize: 'clamp(24px, 5vw, 32px)' }}>
              Namaskaram 🙏
            </h1>
            <p className="page-desc" style={{ marginBottom: 28 }}>
              Record your sacred daily rituals and track your spiritual progress
            </p>
          </div>

          {/* Interactive Round Buttons Grid */}
          <div className="landing-grid">
            {/* Pradakshina Card */}
            <div className="round-action-card">
              <div className="round-btn-container">
                {/* SVG Periphery Circling Ring */}
                <svg className="periphery-svg" viewBox="0 0 156 156">
                  <defs>
                    <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="50%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                  <circle className="periphery-bg-circle" cx="78" cy="78" r="72" />
                  <circle
                    className={`periphery-anim-circle ${isPressingPradakshina ? 'active-press' : ''}`}
                    cx="78"
                    cy="78"
                    r="72"
                    style={{
                      strokeDashoffset: isPressingPradakshina ? dashoffset : circumference,
                    }}
                  />
                </svg>

                {/* Round Pradakshina Button */}
                <button
                  className={`round-btn ${isPressingPradakshina ? 'is-pressing' : ''}`}
                  onMouseDown={handlePradakshinaPressStart}
                  onMouseUp={handlePradakshinaPressEnd}
                  onMouseLeave={handlePradakshinaPressEnd}
                  onTouchStart={handlePradakshinaPressStart}
                  onTouchEnd={handlePradakshinaPressEnd}
                  onClick={(e) => {
                    // Prevent duplicate trigger if touch handled long press
                    if (!isPressingPradakshina && pressProgress === 0) {
                      handlePradakshinaIncrement();
                    }
                  }}
                  type="button"
                  aria-label="Pradakshina Counter"
                >
                  <span className="round-btn-icon">☸️</span>
                  <span className="round-btn-title">Pradakshina</span>

                  {/* Badge counter */}
                  {pradakshinaCount > 0 && (
                    <span className="round-btn-count-badge">
                      {pradakshinaCount}
                    </span>
                  )}
                </button>
              </div>

              <h2 style={{ fontSize: 18, fontFamily: 'Cinzel, serif', color: 'var(--text-primary)', marginBottom: 6 }}>
                Pradakshina
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Click or long-press to record each circumambulation
              </p>

              <div style={{ fontSize: 12, color: 'var(--amber-400)', fontWeight: 600 }}>
                {pradakshinaCount === 0
                  ? 'Tap or hold to start count'
                  : `Completed ${pradakshinaCount} pradakshina${pradakshinaCount > 1 ? 's' : ''} today ✨`}
              </div>
            </div>

            {/* Guru Puja Card */}
            <div className="round-action-card">
              <div className="round-btn-container">
                <button
                  className={`round-btn ${guruPujaAttended ? 'attended' : ''}`}
                  onClick={handleGuruPujaClick}
                  disabled={guruPujaAttended || updatingGuruPuja}
                  type="button"
                  aria-label="Guru Puja Attended"
                >
                  <span className="round-btn-icon">🪔</span>
                  <span className="round-btn-title">Guru Puja</span>
                </button>
              </div>

              <h2 style={{ fontSize: 18, fontFamily: 'Cinzel, serif', color: 'var(--text-primary)', marginBottom: 6 }}>
                Guru Puja
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Track daily attendance (can be clicked once per day)
              </p>

              <div className={`attended-status-badge ${guruPujaAttended ? 'active' : 'inactive'}`}>
                {guruPujaAttended ? '✓ Guru Puja Attended' : '○ Not Recorded Today'}
              </div>
            </div>
          </div>

          {/* Navigation Shortcut to Sadhana Tracker */}
          <Link to="/tracker" className="tracker-shortcut-card" id="landing-tracker-shortcut">
            <div className="tracker-shortcut-info">
              <h3>🧘 Today's Sadhana Tracker</h3>
              <p>Log your daily yoga, kriya & meditation sessions</p>
            </div>
            <div className="tracker-shortcut-arrow">
              →
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
