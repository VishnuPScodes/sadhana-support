import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Calendar, CircleDashed, Flame, BookOpen } from 'lucide-react';
import api from '../api';

export default function Landing() {
  const [pradakshinaCount, setPradakshinaCount] = useState(0);
  const [guruPujaAttended, setGuruPujaAttended] = useState(false);
  const [loading, setLoading] = useState(true);

  // Long press animation & trigger tracking
  const [isPressingPradakshina, setIsPressingPradakshina] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const hasTriggeredRef = useRef(false);
  const animFrameRef = useRef(null);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Fetch today's status & cumulative pradakshina count on mount
  useEffect(() => {
    const fetchToday = async () => {
      try {
        const { data } = await api.get('/sadhana/today');
        if (data.pradakshinaCount !== undefined) {
          setPradakshinaCount(data.pradakshinaCount);
        }
        if (data.log) {
          setGuruPujaAttended(!!data.log.guruPujaAttended);
        }
      } catch (err) {
        console.error('Error loading landing data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchToday();
  }, []);

  // API call to increment Pradakshina count
  const triggerPradakshinaIncrement = async () => {
    setPradakshinaCount(prev => prev + 1);
    try {
      const { data } = await api.post('/sadhana/pradakshina', { incrementBy: 1 });
      if (data.pradakshinaCount !== undefined) {
        setPradakshinaCount(data.pradakshinaCount);
      }
    } catch (err) {
      console.error('Failed to update pradakshina count:', err);
    }
  };

  // Pointer Down: Start long-press progress
  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsPressingPradakshina(true);
    hasTriggeredRef.current = false;
    const startTime = Date.now();
    const duration = 650; // 650ms long press duration

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setPressProgress(progress);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(updateProgress);
      } else {
        // Completed full long press!
        if (!hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          triggerPradakshinaIncrement(); // Call ONLY ONCE (+1)
        }
        setIsPressingPradakshina(false);
        setPressProgress(0);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateProgress);
  };

  // Pointer Release / Cancel: Stop progress without incrementing if released early
  const handlePointerUp = (e) => {
    if (e) e.preventDefault();
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setIsPressingPradakshina(false);
    setPressProgress(0);
  };

  // Guru Puja click handler (once per day)
  const handleGuruPujaClick = async () => {
    if (guruPujaAttended) return;

    setGuruPujaAttended(true);
    try {
      const { data } = await api.post('/sadhana/guru-puja');
      if (data.guruPujaAttended !== undefined) {
        setGuruPujaAttended(data.guruPujaAttended);
      }
    } catch (err) {
      console.error('Failed to record Guru Puja:', err);
      setGuruPujaAttended(false);
    }
  };

  // SVG Ring calculation: r = 32 -> circumference = 201
  const circumference = 201;
  const dashoffset = circumference - pressProgress * circumference;

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="container-lg animate-in" style={{ maxWidth: 420, padding: '0 4px' }}>
          {/* Header */}
          <div className="landing-hero" style={{ marginBottom: 16 }}>
            <div className="date-badge" style={{ fontSize: 11, padding: '3px 10px', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={12} /> {today}
            </div>
            <h1 className="page-title" style={{ fontSize: 28, marginBottom: 2 }}>
              Namaskaram
            </h1>
            <p className="page-desc" style={{ marginBottom: 14, fontSize: 12 }}>
              Daily rituals & practice journal
            </p>
          </div>

          {/* Same-Row Interactive Buttons Grid */}
          <div className="landing-grid">
            {/* Pradakshina Card */}
            <div className="round-action-card">
              <div className="round-btn-container">
                {/* SVG Ring Animation */}
                <svg className="periphery-svg" viewBox="0 0 74 74">
                  <circle className="periphery-bg-circle" cx="37" cy="37" r="32" />
                  <circle
                    className="periphery-anim-circle"
                    cx="37"
                    cy="37"
                    r="32"
                    style={{
                      strokeDashoffset: isPressingPradakshina ? dashoffset : circumference,
                    }}
                  />
                </svg>

                {/* Round Pradakshina Button (Long Press ONLY) */}
                <button
                  className={`round-btn ${isPressingPradakshina ? 'is-pressing' : ''}`}
                  onPointerDown={handlePointerDown}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  type="button"
                  aria-label="Pradakshina Counter"
                >
                  <span className="round-btn-icon" style={{ display: 'flex' }}><CircleDashed size={24} /></span>
                  <span className="round-btn-title">Hold</span>

                  {/* Badge counter */}
                  {pradakshinaCount > 0 && (
                    <span className="round-btn-count-badge">
                      {pradakshinaCount}
                    </span>
                  )}
                </button>
              </div>

              <h2 className="round-card-title">Pradakshina</h2>
              <p style={{ fontSize: 10, color: 'var(--gold-accent)', fontWeight: 500 }}>
                Hold to record (+1)
              </p>
            </div>

            {/* Guru Puja Card */}
            <div className="round-action-card">
              <div className="round-btn-container">
                <button
                  className={`round-btn ${guruPujaAttended ? 'attended' : ''}`}
                  onClick={handleGuruPujaClick}
                  disabled={guruPujaAttended}
                  type="button"
                  aria-label="Guru Puja Attended"
                >
                  <span className="round-btn-icon" style={{ display: 'flex' }}><Flame size={24} /></span>
                  <span className="round-btn-title">Guru Puja</span>
                </button>
              </div>

              <h2 className="round-card-title">Guru Puja</h2>
              <div className={`attended-status-badge ${guruPujaAttended ? 'active' : 'inactive'}`}>
                {guruPujaAttended ? '✓ Attended' : 'Tap once'}
              </div>
            </div>
          </div>

          {/* Navigation Shortcut to Sadhana Tracker */}
          <Link to="/tracker" className="tracker-shortcut-card" id="landing-tracker-shortcut">
            <div className="tracker-shortcut-info">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><BookOpen size={18} /> Today's Sadhana Tracker</h3>
              <p>Log your daily yoga & kriya sessions</p>
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
