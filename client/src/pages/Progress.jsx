import React, { useEffect, useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import Navbar from '../components/Navbar';
import api from '../api';
import { useAuth } from '../context/AuthContext';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement,
  Title, Tooltip, Legend, Filler
);

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

// ─── Date formatters ──────────────────────────────────────────────────────────
function formatDate(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  // For large ranges show only "Jan 15" style, for very large show "Jan" only
  if (days > 90) return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

// ─── Range options ────────────────────────────────────────────────────────────
const RANGE_OPTIONS = [
  { label: '7 days',   value: 7 },
  { label: '14 days',  value: 14 },
  { label: '1 month',  value: 30 },
  { label: '3 months', value: 90 },
  { label: '6 months', value: 180 },
];

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card" style={{ '--stat-color': color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function Progress() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(14);
  const [chartType, setChartType] = useState('bar');

  // Auto-switch to line chart when range > 30 days (bars get too dense)
  useEffect(() => {
    if (days > 30) setChartType('line');
  }, [days]);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/sadhana/history?days=${days}`);
        setHistory(data.history);
        setStats(data.stats);
      } catch (err) {
        setError('Failed to load progress data');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [days]);

  // ─── Chart tick density — skip labels when too many points ───────────────
  const maxTicks = days <= 14 ? days : days <= 30 ? 15 : days <= 90 ? 13 : 12;

  const labels = history.map(h => formatDate(h.date, days));
  const scores = history.map(h => h.totalScore);

  const perfectDayColors = history.map(h =>
    h.isPerfectDay
      ? 'rgba(52, 211, 153, 0.85)'
      : h.practiced
      ? 'rgba(139, 92, 246, 0.75)'
      : 'rgba(255, 255, 255, 0.06)'
  );
  const perfectDayBorders = history.map(h =>
    h.isPerfectDay
      ? 'rgba(52, 211, 153, 1)'
      : h.practiced
      ? 'rgba(167, 139, 250, 1)'
      : 'rgba(255,255,255,0.1)'
  );

  const barData = {
    labels,
    datasets: [{
      label: 'Score',
      data: scores,
      backgroundColor: perfectDayColors,
      borderColor: perfectDayBorders,
      borderWidth: 2,
      borderRadius: days > 30 ? 4 : 8,
      borderSkipped: false,
    }],
  };

  const lineData = {
    labels,
    datasets: [{
      label: 'Score',
      data: scores,
      borderColor: 'rgba(167, 139, 250, 1)',
      backgroundColor: 'rgba(139, 92, 246, 0.08)',
      pointBackgroundColor: perfectDayBorders,
      pointBorderColor: perfectDayBorders,
      // Shrink dots for large datasets
      pointRadius: days > 90 ? 2 : days > 30 ? 3 : 5,
      pointHoverRadius: days > 90 ? 5 : 7,
      borderWidth: 2.5,
      fill: true,
      tension: 0.4,
    }],
  };

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: days > 90 ? 400 : 700 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 12, 30, 0.95)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
        borderWidth: 1,
        titleColor: '#c4b5fd',
        bodyColor: '#a89fc2',
        padding: 12,
        callbacks: {
          title: (items) => {
            const idx = items[0].dataIndex;
            const entry = history[idx];
            return `${labels[idx]}${entry?.isPerfectDay ? '  🏆 Perfect Day' : ''}`;
          },
          label: (item) => ` ${item.raw} pts`,
          afterLabel: (item) => {
            const entry = history[item.dataIndex];
            if (!entry?.practices?.length) return '';
            const done = entry.practices.filter(p => p.count > 0);
            return done.map(p => `  ${PRACTICE_ICONS[p.name] || '•'} ${p.name} (${p.count}×)`).join('\n');
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        border: { color: 'rgba(255,255,255,0.06)' },
        ticks: {
          color: '#6b6280',
          font: { size: days > 90 ? 9 : 11 },
          maxTicksLimit: maxTicks,
          maxRotation: days > 30 ? 45 : 0,
          minRotation: days > 30 ? 45 : 0,
        },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        border: { color: 'rgba(255,255,255,0.06)' },
        ticks: { color: '#6b6280', font: { size: 11 } },
        beginAtZero: true,
      },
    },
  }), [days, history, labels, maxTicks]);

  // ─── Practice breakdown ───────────────────────────────────────────────────
  const practiceBreakdown = useMemo(() => {
    const map = {};
    history.forEach(day => {
      day.practices?.forEach(p => {
        if (p.count > 0) {
          if (!map[p.name]) map[p.name] = { once: 0, twice: 0, total: 0 };
          if (p.count === 1) map[p.name].once++;
          if (p.count === 2) map[p.name].twice++;
          map[p.name].total++;
        }
      });
    });
    return map;
  }, [history]);

  const rangeLabel = RANGE_OPTIONS.find(o => o.value === days)?.label || `${days} days`;

  return (
    <>
      <Navbar />
      <div className="page" style={{ paddingTop: 100, alignItems: 'flex-start' }}>
        <div className="progress-page animate-in">

          {/* Header */}
          <div className="progress-header">
            <h1 className="page-title" style={{ fontSize: 28 }}>Your Progress</h1>
            <p className="page-desc">
              Hi {user?.name?.split(' ')[0] || 'seeker'}, here's your sadhana journey 🌟
            </p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="stats-row animate-in animate-in-delay-1">
              <StatCard icon="🔥" label="Day Streak"     value={stats.currentStreak}     color="var(--amber-400)" />
              <StatCard icon="⭐" label="Total Score"    value={stats.overallScore}       color="var(--purple-400)" />
              <StatCard icon="📅" label="Days Practiced" value={stats.totalDaysPracticed} color="#60a5fa" />
              <StatCard icon="🏆" label="Perfect Days"   value={stats.perfectDays}        color="var(--emerald-400)" />
            </div>
          )}

          {/* Chart card */}
          <div className="glass-card animate-in animate-in-delay-2" style={{ padding: '28px' }}>
            <div className="chart-controls">
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Daily Score
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
                    — {rangeLabel}
                    {history.length > 0 && (
                      <span style={{ marginLeft: 6 }}>
                        · {history.filter(h => h.practiced).length} active days
                      </span>
                    )}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  <span style={{ color: 'var(--purple-400)' }}>■</span> Practice day&nbsp;&nbsp;
                  <span style={{ color: 'var(--emerald-400)' }}>■</span> Perfect day&nbsp;&nbsp;
                  <span style={{ color: 'rgba(255,255,255,0.15)' }}>■</span> No practice
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {/* Chart type toggle — bar disabled for >30 days (too dense) */}
                <div className="chart-toggle">
                  <button
                    className={`chart-toggle-btn ${chartType === 'bar' ? 'active' : ''}`}
                    onClick={() => setChartType('bar')}
                    id="chart-bar-btn"
                    disabled={days > 30}
                    title={days > 30 ? 'Bar chart not available for ranges over 30 days' : ''}
                    style={{ opacity: days > 30 ? 0.4 : 1, cursor: days > 30 ? 'not-allowed' : 'pointer' }}
                  >
                    ▋ Bar
                  </button>
                  <button
                    className={`chart-toggle-btn ${chartType === 'line' ? 'active' : ''}`}
                    onClick={() => setChartType('line')}
                    id="chart-line-btn"
                  >
                    ╱ Line
                  </button>
                </div>

                {/* Range selector */}
                <select
                  className="days-select"
                  value={days}
                  onChange={e => setDays(Number(e.target.value))}
                  id="days-select"
                >
                  {RANGE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Info banner for large ranges */}
            {days > 30 && !loading && (
              <div style={{
                fontSize: 12, color: 'var(--text-muted)',
                background: 'rgba(139,92,246,0.06)',
                border: '1px solid rgba(139,92,246,0.15)',
                borderRadius: 8, padding: '8px 14px',
                marginBottom: 16,
              }}>
                📊 Showing {history.length} days · {history.filter(h => h.practiced).length} days practiced
                · Hover any point for details
              </div>
            )}

            {/* Chart */}
            <div className="chart-container" style={{ height: days > 30 ? 300 : 260 }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                  <div className="spinner" style={{ width: 28, height: 28 }} />
                  <span style={{ color: 'var(--text-muted)' }}>Loading {rangeLabel} of data...</span>
                </div>
              ) : error ? (
                <div className="alert alert-error">{error}</div>
              ) : chartType === 'bar' ? (
                <Bar data={barData} options={chartOptions} />
              ) : (
                <Line data={lineData} options={chartOptions} />
              )}
            </div>
          </div>

          {/* Practice breakdown */}
          {Object.keys(practiceBreakdown).length > 0 && (
            <div className="glass-card animate-in animate-in-delay-3" style={{ padding: '28px' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>
                Practice Breakdown
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
                  {rangeLabel}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Object.entries(practiceBreakdown)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([name, data]) => {
                    const maxPossible = days;
                    const pct = Math.round((data.total / maxPossible) * 100);
                    return (
                      <div key={name} className="breakdown-row">
                        <div className="breakdown-icon">{PRACTICE_ICONS[name] || '🙏'}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                              {name}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {data.once}× once · {data.twice}× twice ·&nbsp;
                              <span style={{ color: 'var(--purple-400)' }}>{pct}% consistency</span>
                            </span>
                          </div>
                          <div className="progress-bar" style={{ height: 5 }}>
                            <div
                              className="progress-fill"
                              style={{ width: `${pct}%`, background: 'var(--gradient-button)' }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && history.every(h => !h.practiced) && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🌱</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                Your journey starts today
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                Complete your first sadhana to see your progress here
              </div>
              <a href="/tracker" className="btn btn-primary"
                style={{ textDecoration: 'none', display: 'inline-flex', width: 'auto', padding: '12px 28px' }}>
                🧘 Start Today's Practice
              </a>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
