import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api';
import { useSadhanaSound } from '../hooks/useBowlSound';

const PRACTICE_ICONS = {
  'Shoonya Meditation':   '🌌',
  'Shambhavi Mahamudra':  '👁️',
  'Shakti Chalana Kriya': '⚡',
  'Surya Kriya':          '☀️',
  'Yogasanas':            '🧘',
  'Angamardana':          '💪',
  'Sukha Kriya':          '🌿',
  'Samyama Sadhana':      '🪷',
  'Breath Watching':      '🌬️',
  'Surya Shakti':         '🌟',
  'Bhastrika Kriya':      '💨',
};

function getStatusLabel(count) {
  if (count === 0) return 'Tap to mark as done';
  if (count === 1) return 'Done once • Tap for second round';
  return 'Completed twice ✓';
}

const SHAKTI = 'Shakti Chalana Kriya';
const KAPALABHATI_OPTIONS = [20, 50, 100, 150, 200];

function KapalabhatiPicker({ value, onChange }) {
  return (
    <div className="kapalabhati-picker">
      <div className="kapalabhati-label">
        <span>💨</span> Kapalabhati rounds
      </div>
      <div className="kapalabhati-options">
        {KAPALABHATI_OPTIONS.map(opt => (
          <button
            key={opt}
            id={`kapalabhati-${opt}`}
            className={`kapalabhati-btn ${value === opt ? 'active' : ''}`}
            onClick={() => onChange(value === opt ? null : opt)}
            type="button"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Already Done View ────────────────────────────────────────────────────────
function AlreadyDone({ log }) {
  const donePractices = log.practices?.filter(p => p.count > 0) || [];

  return (
    <div className="glass-card" style={{ textAlign: 'center' }}>
      {/* Big check */}
      <div style={{
        width: 72, height: 72,
        background: 'rgba(52, 211, 153, 0.12)',
        border: '2px solid rgba(52, 211, 153, 0.4)',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32, margin: '0 auto 20px',
        boxShadow: '0 0 28px rgba(52, 211, 153, 0.2)',
        animation: 'glow-pulse 2s ease-in-out infinite',
      }}>
        ✅
      </div>

      <h1 style={{
        fontFamily: 'Cinzel, serif',
        fontSize: 22,
        fontWeight: 700,
        color: 'var(--emerald-400)',
        marginBottom: 8,
      }}>
        Today's Sadhana Complete!
      </h1>

      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>
        You've already submitted your practice for today.
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
        Come back tomorrow to continue your journey 🌅
      </p>

      {/* Score */}
      {log.totalScore > 0 && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '12px 28px',
          background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(167,139,250,0.1))',
          border: '1.5px solid rgba(251,191,36,0.3)',
          borderRadius: 100,
          marginBottom: 24,
        }}>
          <span style={{ fontSize: 20 }}>⭐</span>
          <span style={{
            fontFamily: 'Cinzel, serif', fontSize: 26, fontWeight: 700,
            color: 'var(--amber-400)',
          }}>
            {log.totalScore}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
            pts earned
          </span>
          {log.isPerfectDay && (
            <span style={{
              marginLeft: 6, fontSize: 12, fontWeight: 600,
              color: 'var(--emerald-400)',
              background: 'rgba(52,211,153,0.1)',
              border: '1px solid rgba(52,211,153,0.3)',
              borderRadius: 100, padding: '2px 10px',
            }}>
              🏆 Perfect Day
            </span>
          )}
        </div>
      )}

      {/* Practice summary */}
      {donePractices.length > 0 && (
        <div style={{ textAlign: 'left', marginBottom: 28 }}>
          <div style={{
            fontSize: 11, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
          }}>
            What you did today
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {donePractices.map(p => (
              <div key={p.name} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px',
                background: 'rgba(52, 211, 153, 0.05)',
                border: '1px solid rgba(52, 211, 153, 0.15)',
                borderRadius: 10, fontSize: 14,
              }}>
                <span>{PRACTICE_ICONS[p.name] || '🙏'}</span>
                <span style={{ flex: 1, color: 'var(--text-primary)' }}>{p.name}</span>
                <span style={{ color: p.count === 2 ? 'var(--emerald-400)' : 'var(--amber-400)', fontWeight: 600, fontSize: 12 }}>
                  {p.count}× done
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        to="/progress"
        className="btn btn-primary"
        style={{ textDecoration: 'none', marginBottom: 12 }}
        id="already-done-progress-btn"
      >
        📈 View Progress
      </Link>
    </div>
  );
}

// ─── Main Tracker ─────────────────────────────────────────────────────────────
export default function Tracker() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [practices, setPractices] = useState(() =>
    (user?.selectedPractices || []).map(name => ({ name, count: 0 }))
  );
  const [kapalabhatiCount, setKapalabhatiCount] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [todayLog, setTodayLog] = useState(null);
  const [checkingToday, setCheckingToday] = useState(true);

  const playSound = useSadhanaSound();

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // ── Sync practices when user.selectedPractices updates ───────────────────
  useEffect(() => {
    if (user?.selectedPractices) {
      setPractices(prev => {
        const prevMap = new Map(prev.map(p => [p.name, p.count]));
        return user.selectedPractices.map(name => ({
          name,
          count: prevMap.get(name) || 0
        }));
      });
    }
  }, [user?.selectedPractices]);

  // ── Check on mount if today is already submitted ──────────────────────────
  useEffect(() => {
    const checkToday = async () => {
      try {
        const { data } = await api.get('/sadhana/today');
        setTodayLog(data.log || false); // false = not done yet, object = done
      } catch {
        setTodayLog(false); // fail open — let them try
      } finally {
        setCheckingToday(false);
      }
    };
    checkToday();
  }, []);

  const tap = useCallback((index, e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    const size = 40;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    card.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);

    setPractices(prev => {
      const updated = [...prev];
      const newCount = (updated[index].count + 1) % 3;
      updated[index] = { ...updated[index], count: newCount };
      // Clear kapalabhati if Shakti is reset to 0
      if (updated[index].name === SHAKTI && newCount === 0) {
        setKapalabhatiCount(null);
      }
      // Play the unique sound for this practice
      playSound(updated[index].name, newCount);
      return updated;
    });
  }, [playSound]);

  const completedCount = practices.filter(p => p.count > 0).length;
  const progressPercent = practices.length > 0
    ? Math.round((completedCount / practices.length) * 100)
    : 0;

  const handleSubmit = async () => {
    const anyDone = practices.some(p => p.count > 0);
    if (!anyDone) return setError('Please mark at least one practice before submitting');

    setSubmitting(true);
    setError('');
    try {
      // Attach kapalabhatiCount to Shakti Chalana Kriya before submitting
      const payload = practices.map(p =>
        p.name === SHAKTI ? { ...p, kapalabhatiCount } : p
      );
      const { data } = await api.post('/sadhana/log', { practices: payload });
      navigate('/congrats', {
        state: {
          practices: payload,
          totalScore: data.totalScore,
          isPerfectDay: data.isPerfectDay,
        },
      });
    } catch (err) {
      // Backend rejected — already submitted
      if (err.response?.status === 409 && err.response?.data?.alreadySubmitted) {
        setTodayLog(err.response.data.log);
      } else {
        setError(err.response?.data?.message || 'Failed to save. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (checkingToday) {
    return (
      <>
        <Navbar />
        <div className="page" style={{ paddingTop: 100 }}>
          <div className="container-lg">
            <div className="glass-card" style={{ textAlign: 'center', padding: 60 }}>
              <div className="spinner" style={{ width: 36, height: 36, margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-muted)' }}>Checking today's status...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── TESTING: already-submitted view temporarily disabled ─────────────────
  // if (todayLog) {
  //   return (
  //     <>
  //       <Navbar />
  //       <div className="page" style={{ paddingTop: 100 }}>
  //         <div className="container-lg animate-in">
  //           <AlreadyDone log={todayLog} />
  //         </div>
  //       </div>
  //     </>
  //   );
  // }
  // ─────────────────────────────────────────────────────────────────────────

  // ── Normal tracker ────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <div className="page" style={{ paddingTop: 100 }}>
        <div className="container-lg animate-in">
          <div className="glass-card">
            {/* Header */}
            <div className="tracker-header">
              <div className="date-badge">📅 {today}</div>
              <h1 className="page-title">Today's Sadhana</h1>
              <p className="page-desc">
                Tap a practice once or twice to record your session
              </p>
            </div>

            {/* Progress */}
            <div className="progress-section">
              <div className="progress-label">
                <span>Progress</span>
                <span style={{ color: 'var(--purple-400)', fontWeight: 600 }}>
                  {completedCount}/{practices.length} practices
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            {/* Practice cards */}
            <div className="tracker-grid">
              {practices.map((practice, index) => (
                <React.Fragment key={practice.name}>
                  <div
                    id={`tracker-card-${index}`}
                    className={`tracker-card ${
                      practice.count === 1 ? 'done-once' : practice.count === 2 ? 'done-twice' : ''
                    }`}
                    onClick={(e) => tap(index, e)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${practice.name}: ${getStatusLabel(practice.count)}`}
                    onKeyDown={(e) => e.key === 'Enter' && tap(index, e)}
                  >
                    <span className="tracker-card-icon">
                      {PRACTICE_ICONS[practice.name] || '🙏'}
                    </span>
                    <div className="tracker-card-info">
                      <div className="tracker-card-name">{practice.name}</div>
                      <div className="tracker-card-status">{getStatusLabel(practice.count)}</div>
                    </div>
                    <div className="tracker-card-dots">
                      <div className="dot" />
                      <div className="dot" />
                    </div>
                  </div>

                  {/* Kapalabhati picker — shown only for Shakti when done */}
                  {practice.name === SHAKTI && practice.count > 0 && (
                    <KapalabhatiPicker
                      value={kapalabhatiCount}
                      onChange={setKapalabhatiCount}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>
            )}

            <button
              id="submit-sadhana-btn"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <span className="spinner" /> : "✨ Submit Today's Sadhana"}
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
              🔁 Tap once for 1 session • Tap again for 2 sessions • Tap again to reset
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
