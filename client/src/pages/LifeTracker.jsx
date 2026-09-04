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

// ─── Character-by-Character Handwriting Typewriter Component ──────────────────
function HandwritingText({ text, speed = 65, onComplete }) {
  const [displayedLength, setDisplayedLength] = useState(0);

  useEffect(() => {
    setDisplayedLength(0);
    let index = 0;

    const timer = setInterval(() => {
      index++;
      setDisplayedLength(index);
      if (index >= text.length) {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  const visibleText = text.slice(0, displayedLength);
  const isWriting = displayedLength < text.length;

  return (
    <h3
      className="question-title"
      style={{ fontSize: 'clamp(15px, 4vw, 18px)', minHeight: 44, cursor: 'pointer' }}
      onClick={() => {
        setDisplayedLength(text.length);
        if (onComplete) onComplete();
      }}
      title="Tap to finish writing instantly"
    >
      <span className="handwriting-text">{visibleText}</span>
      {isWriting && <span className="writing-cursor">|</span>}
    </h3>
  );
}

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

  const [currentStep, setCurrentStep] = useState(0); // 0..5 = questions, 6 = summary
  const [slideDirection, setSlideDirection] = useState('next'); // 'next' or 'prev'
  const [showOptions, setShowOptions] = useState(false); // Controls option buttons appearance
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [todayLog, setTodayLog] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  // ─── Touch / Drag Swipe Gesture State ─────────────────────────────────────
  const [touchStart, setTouchStart] = useState(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

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

  // Reset showOptions when step changes
  useEffect(() => {
    setShowOptions(false);
  }, [currentStep]);

  const goNext = () => {
    if (currentStep < 6) {
      setSlideDirection('next');
      setCurrentStep(prev => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setSlideDirection('prev');
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (step) => {
    if (step > currentStep) setSlideDirection('next');
    else if (step < currentStep) setSlideDirection('prev');
    setCurrentStep(step);
  };

  const handleSelectOption = (key, value, stepIdx) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    setError('');

    // Advance to next card from right to center after 200ms
    setTimeout(() => {
      setSlideDirection('next');
      if (stepIdx < QUESTIONS.length - 1) {
        setCurrentStep(stepIdx + 1);
      } else {
        setCurrentStep(6);
      }
    }, 200);
  };

  // ─── Swipe Gesture Handlers ────────────────────────────────────────────────
  const handleTouchStart = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setTouchStart(clientX);
    setTouchDeltaX(0);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (touchStart === null || !isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const delta = clientX - touchStart;
    setTouchDeltaX(delta);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 60; // minimum px swipe to trigger slide
    if (touchDeltaX < -threshold && currentStep < 6) {
      // Swiped Left -> Go Next (card slides from right)
      goNext();
    } else if (touchDeltaX > threshold && currentStep > 0) {
      // Swiped Right -> Go Prev (card slides from left)
      goPrev();
    }

    setTouchStart(null);
    setTouchDeltaX(0);
  };

  const handleSubmit = async () => {
    const unanswered = QUESTIONS.some(q => answers[q.key] === null || answers[q.key] === undefined);
    if (unanswered) {
      setError('Please answer all questions before submitting.');
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
                  onClick={() => {
                    setIsEditing(true);
                    goToStep(0);
                  }}
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

  const currentQ = currentStep < 6 ? QUESTIONS[currentStep] : null;
  const progressPct = Math.round((Math.min(currentStep, 6) / 6) * 100);

  return (
    <>
      <Navbar />
      <div className="page" style={{ paddingTop: 96 }}>
        <div className="container-lg animate-in" style={{ maxWidth: 640 }}>
          <div className="glass-card" style={{ overflow: 'hidden', position: 'relative' }}>

            {/* Tracker Header */}
            <div className="tracker-header" style={{ marginBottom: 16 }}>
              <div className="date-badge">🌱 {today}</div>
              <h1 className="page-title">Daily Life Journal</h1>
              <p className="page-desc">
                Evaluate your day-to-day conscious living and willingness
              </p>
            </div>

            {/* Step Progress Bar */}
            <div className="wizard-progress-header">
              <div className="wizard-step-info">
                <span className="wizard-step-badge">
                  {currentStep < 6 ? `Question ${currentStep + 1} of 6` : 'Ready to Submit ✨'}
                </span>
                <span style={{ fontSize: 12 }}>
                  👈 Swipe left / right 👉
                </span>
              </div>
              <div className="wizard-bar-track">
                <div className="wizard-bar-fill" style={{ width: `${progressPct}%` }} />
              </div>

              {/* Step indicator dots */}
              <div className="wizard-steps-dots">
                {QUESTIONS.map((q, idx) => {
                  const isDone = answers[q.key] !== null;
                  const isActive = currentStep === idx;
                  return (
                    <button
                      key={q.key}
                      type="button"
                      className={`wizard-step-dot ${isActive ? 'active' : isDone ? 'completed' : ''}`}
                      onClick={() => goToStep(idx)}
                      title={`Go to Question ${idx + 1}`}
                    >
                      {isDone ? '✓' : idx + 1}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className={`wizard-step-dot ${currentStep === 6 ? 'active' : ''}`}
                  onClick={() => goToStep(6)}
                  title="Final Review & Submit"
                >
                  ✨
                </button>
              </div>
            </div>

            {/* ─── HANDWRITING SINGLE QUESTION CARD (Steps 0..5) ─────────────────── */}
            {currentStep < 6 && currentQ && (
              <div
                key={`step-${currentStep}`}
                className={`life-question-card ${slideDirection === 'prev' ? 'slide-enter-prev' : 'slide-enter-next'}`}
                style={{
                  margin: 0,
                  position: 'relative',
                  transform: isDragging ? `translateX(${touchDeltaX}px) rotate(${touchDeltaX * 0.04}deg)` : undefined,
                  transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
                  opacity: isDragging ? Math.max(0.4, 1 - Math.abs(touchDeltaX) / 300) : 1,
                  cursor: isDragging ? 'grabbing' : 'grab',
                  touchAction: 'pan-y',
                  userSelect: 'none',
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseMove={handleTouchMove}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
              >
                {/* Swipe Direction Hint Overlay */}
                {isDragging && Math.abs(touchDeltaX) > 25 && (
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    right: touchDeltaX < 0 ? 16 : 'auto',
                    left: touchDeltaX > 0 ? 16 : 'auto',
                    background: touchDeltaX < 0 ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid var(--purple-400)',
                    borderRadius: 100,
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'white',
                    pointerEvents: 'none',
                    animation: 'fadeInUp 0.15s ease',
                  }}>
                    {touchDeltaX < 0 ? 'Next →' : '← Previous'}
                  </div>
                )}

                <div className="question-header">
                  <span className="question-icon" style={{ fontSize: 36 }}>{currentQ.icon}</span>
                  <div className="question-text-box">
                    <span className="question-tag">Question {currentQ.num} · {currentQ.title}</span>
                    <HandwritingText
                      key={`hw-${currentStep}`}
                      text={currentQ.question}
                      speed={65}
                      onComplete={() => setShowOptions(true)}
                    />
                  </div>
                </div>

                <div
                  className={`question-options-row ${showOptions ? 'options-fade-in' : ''}`}
                  style={{
                    marginTop: 20,
                    opacity: showOptions ? 1 : 0,
                    pointerEvents: showOptions ? 'auto' : 'none',
                    transition: 'opacity 0.3s ease',
                  }}
                >
                  {currentQ.options.map((opt) => {
                    const isSelected = answers[currentQ.key] === opt.value;
                    return (
                      <button
                        key={String(opt.value)}
                        type="button"
                        className={`life-opt-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          setShowOptions(true);
                          handleSelectOption(currentQ.key, opt.value, currentStep);
                        }}
                        style={{ padding: '14px 16px' }}
                      >
                        <span className="opt-label">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── FINAL REVIEW & SUBMIT CARD (Step 6) ─────────────────── */}
            {currentStep === 6 && (
              <div
                className={`life-question-card ${slideDirection === 'prev' ? 'slide-enter-prev' : 'slide-enter-next'}`}
                style={{
                  margin: 0,
                  textAlign: 'left',
                  transform: isDragging ? `translateX(${touchDeltaX}px) rotate(${touchDeltaX * 0.04}deg)` : undefined,
                  transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  touchAction: 'pan-y',
                  userSelect: 'none',
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseMove={handleTouchMove}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
              >
                <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--purple-400)', marginBottom: 6 }}>
                  Review Your Daily Journal
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                  Double-check your conscious living reflections before saving for today.
                </p>

                <div className="life-summary-list" style={{ marginBottom: 24 }}>
                  <div className="summary-item" onClick={() => goToStep(0)} style={{ cursor: 'pointer' }}>
                    <span>🧘‍♂️ Inner Engineering</span>
                    <span className="summary-item-count count-2">
                      {answers.innerEngineeringCount ? `${answers.innerEngineeringCount}× done` : 'Not selected'}
                    </span>
                  </div>
                  <div className="summary-item" onClick={() => goToStep(1)} style={{ cursor: 'pointer' }}>
                    <span>🍏 Conscious Eating</span>
                    <span className={`summary-item-count ${answers.consciousEating === 'Yes' ? 'count-2' : 'count-1'}`}>
                      {answers.consciousEating || 'Not selected'}
                    </span>
                  </div>
                  <div className="summary-item" onClick={() => goToStep(2)} style={{ cursor: 'pointer' }}>
                    <span>🌊 Reacting / Responding</span>
                    <span className={`summary-item-count ${answers.reactOrRespond === 'Responding' ? 'count-2' : 'count-1'}`}>
                      {answers.reactOrRespond || 'Not selected'}
                    </span>
                  </div>
                  <div className="summary-item" onClick={() => goToStep(3)} style={{ cursor: 'pointer' }}>
                    <span>🤝 Willingness</span>
                    <span className={`summary-item-count ${answers.moreWilling === 'Yes' ? 'count-2' : 'count-1'}`}>
                      {answers.moreWilling || 'Not selected'}
                    </span>
                  </div>
                  <div className="summary-item" onClick={() => goToStep(4)} style={{ cursor: 'pointer' }}>
                    <span>⚡ System Vibrancy</span>
                    <span className={`summary-item-count ${answers.systemVibrant === 'Yes' ? 'count-2' : 'count-1'}`}>
                      {answers.systemVibrant || 'Not selected'}
                    </span>
                  </div>
                  <div className="summary-item" onClick={() => goToStep(5)} style={{ cursor: 'pointer' }}>
                    <span>🗣️ Vakshudhi</span>
                    <span className={`summary-item-count ${answers.vakshudhiRating === 'Good' ? 'count-2' : 'count-1'}`}>
                      {answers.vakshudhiRating || 'Not selected'}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="alert alert-error" style={{ marginBottom: 20 }}>
                    ⚠️ {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => goToStep(0)}
                    style={{ flex: 1 }}
                  >
                    ✏️ Edit Answers
                  </button>
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
            )}

          </div>
        </div>
      </div>
    </>
  );
}
