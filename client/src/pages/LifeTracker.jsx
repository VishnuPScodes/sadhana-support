import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const QUESTIONS = [
  {
    key: 'innerEngineeringCount',
    num: 1,
    title: 'Inner Engineering Crash Course',
    question: 'How many times a day am I doing the Inner Engineering crash course?',
    icon: '🧘‍♂️',
    options: [
      { label: '1 time', value: 1 },
      { label: '2 times', value: 2 },
      { label: '3 times', value: 3 },
      { label: '4 times', value: 4 },
      { label: '5 times', value: 5 },
    ],
  },
  {
    key: 'consciousEating',
    num: 2,
    title: 'Conscious Eating',
    question: 'Am I eating more consciously?',
    icon: '🍏',
    options: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
    ],
  },
  {
    key: 'reactOrRespond',
    num: 3,
    title: 'Reacting vs Responding',
    question: 'Am I reacting or responding consciously?',
    icon: '🌊',
    options: [
      { label: 'Responding', value: 'Responding' },
      { label: 'Reacting', value: 'Reacting' },
    ],
  },
  {
    key: 'moreWilling',
    num: 4,
    title: 'Willingness of Being',
    question: 'Am I becoming more willing?',
    icon: '🤝',
    options: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
    ],
  },
  {
    key: 'systemVibrant',
    num: 5,
    title: 'System Vibrancy',
    question: 'Is my system more vibrant than before?',
    icon: '⚡',
    options: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
    ],
  },
  {
    key: 'vakshudhiRating',
    num: 6,
    title: 'Vakshudhi (Speech Purity)',
    question: 'How well am I in Vakshudhi?',
    icon: '🗣️',
    options: [
      { label: 'Good', value: 'Good' },
      { label: 'Okay', value: 'Okay' },
      { label: 'Bad', value: 'Bad' },
    ],
  },
];

export default function LifeTracker() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState({
    innerEngineeringCount: null,
    consciousEating: null,
    reactOrRespond: null,
    moreWilling: null,
    systemVibrant: null,
    vakshudhiRating: null,
  });

  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [todayLog, setTodayLog] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  useEffect(() => {
    const checkTodayLog = async () => {
      try {
        const { data } = await api.get('/life/today');
        if (data.log) {
          setTodayLog(data.log);
          if (data.log.answers) {
            setAnswers(data.log.answers);
          }
        }
      } catch (err) {
        // fail open
      } finally {
        setChecking(false);
      }
    };
    checkTodayLog();
  }, []);

  const handleSelectOption = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    const unanswered = QUESTIONS.some(q => answers[q.key] === null || answers[q.key] === undefined);
    if (unanswered) {
      setError('Please select an answer for all questions before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/life/log', { answers });
      setTodayLog(data.log);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <>
        <Navbar />
        <div className="page" style={{ paddingTop: 96 }}>
          <div className="container-lg">
            <div className="glass-card" style={{ textAlign: 'center', padding: 60 }}>
              <div className="spinner" style={{ width: 36, height: 36, margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-muted)' }}>Checking today's life journal status...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // If already submitted and not currently editing
  if (todayLog && !isEditing) {
    return (
      <>
        <Navbar />
        <div className="page" style={{ paddingTop: 96 }}>
          <div className="container-lg animate-in">
            <div className="glass-card" style={{ textAlign: 'center' }}>
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
                🌿
              </div>

              <h1 className="page-title" style={{ color: 'var(--emerald-400)', marginBottom: 6 }}>
                Today's Life Journal Logged!
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 }}>
                You've recorded your conscious living reflections for today.
              </p>

              {/* Summary of answers */}
              <div style={{ textAlign: 'left', marginBottom: 28 }}>
                <div style={{
                  fontSize: 11, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
                }}>
                  Your Responses Today
                </div>
                <div className="life-summary-list">
                  <div className="summary-item">
                    <span>🧘‍♂️ Inner Engineering</span>
                    <span className="summary-item-count count-2">{todayLog.answers?.innerEngineeringCount}× done</span>
                  </div>
                  <div className="summary-item">
                    <span>🍏 Conscious Eating</span>
                    <span className={`summary-item-count ${todayLog.answers?.consciousEating === 'Yes' ? 'count-2' : 'count-1'}`}>
                      {todayLog.answers?.consciousEating}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span>🌊 Reacting / Responding</span>
                    <span className={`summary-item-count ${todayLog.answers?.reactOrRespond === 'Responding' ? 'count-2' : 'count-1'}`}>
                      {todayLog.answers?.reactOrRespond}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span>🤝 Willingness</span>
                    <span className={`summary-item-count ${todayLog.answers?.moreWilling === 'Yes' ? 'count-2' : 'count-1'}`}>
                      {todayLog.answers?.moreWilling}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span>⚡ System Vibrancy</span>
                    <span className={`summary-item-count ${todayLog.answers?.systemVibrant === 'Yes' ? 'count-2' : 'count-1'}`}>
                      {todayLog.answers?.systemVibrant}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span>🗣️ Vakshudhi</span>
                    <span className={`summary-item-count ${todayLog.answers?.vakshudhiRating === 'Good' ? 'count-2' : 'count-1'}`}>
                      {todayLog.answers?.vakshudhiRating}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsEditing(true)}
                  style={{ flex: 1 }}
                >
                  ✏️ Edit Responses
                </button>
                <Link
                  to="/life-metrics"
                  className="btn btn-primary"
                  style={{ flex: 1.5, textDecoration: 'none' }}
                >
                  📊 Life Metrics →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page" style={{ paddingTop: 96 }}>
        <div className="container-lg animate-in">
          <div className="glass-card">
            {/* Header */}
            <div className="tracker-header">
              <div className="date-badge">🌱 {today}</div>
              <h1 className="page-title">Daily Life Journal</h1>
              <p className="page-desc">
                Evaluate your day-to-day conscious living and willingness
              </p>
            </div>

            {/* Questions List */}
            <div className="life-questions-grid">
              {QUESTIONS.map((q) => (
                <div key={q.key} className="life-question-card">
                  <div className="question-header">
                    <span className="question-icon">{q.icon}</span>
                    <div className="question-text-box">
                      <span className="question-tag">Question {q.num} · {q.title}</span>
                      <h3 className="question-title">{q.question}</h3>
                    </div>
                  </div>

                  <div className="question-options-row">
                    {q.options.map((opt) => {
                      const isSelected = answers[q.key] === opt.value;
                      return (
                        <button
                          key={String(opt.value)}
                          type="button"
                          className={`life-opt-btn ${isSelected ? 'active' : ''}`}
                          onClick={() => handleSelectOption(q.key, opt.value)}
                        >
                          <span className="opt-label">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginTop: 20 }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
              {isEditing && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsEditing(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                id="submit-life-journal-btn"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={submitting}
                style={{ flex: 2 }}
              >
                {submitting ? <span className="spinner" /> : "✨ Log Today's Life Journal"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

