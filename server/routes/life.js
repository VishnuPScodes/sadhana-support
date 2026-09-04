const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const LifeLog = require('../models/LifeLog');

// Helper: Format date as YYYY-MM-DD
function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ─── Score Calculation Logic ──────────────────────────────────────────────────
function calculateLifeScore(answers = {}) {
  let score = 0;

  // 1. Inner Engineering Count (1..5): 10, 20, 30, 40, 50 pts
  const ieCount = Number(answers.innerEngineeringCount) || 1;
  score += Math.min(Math.max(ieCount, 1), 5) * 10;

  // 2. Conscious Eating (Yes/No): Yes -> 20 pts
  if (answers.consciousEating === 'Yes') score += 20;

  // 3. Reacting or Responding: Responding -> 25 pts, Reacting -> 5 pts
  if (answers.reactOrRespond === 'Responding') score += 25;
  else if (answers.reactOrRespond === 'Reacting') score += 5;

  // 4. More Willing (Yes/No): Yes -> 20 pts
  if (answers.moreWilling === 'Yes') score += 20;

  // 5. System Vibrant (Yes/No): Yes -> 20 pts
  if (answers.systemVibrant === 'Yes') score += 20;

  // 6. Vakshudhi Rating (Bad, Okay, Good): Good -> 25 pts, Okay -> 12 pts, Bad -> 0 pts
  if (answers.vakshudhiRating === 'Good') score += 25;
  else if (answers.vakshudhiRating === 'Okay') score += 12;

  return score;
}

// ─── POST /api/life/log ───────────────────────────────────────────────────────
router.post('/log', authMiddleware, async (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers) {
      return res.status(400).json({ message: 'Answers object is required' });
    }

    const todayStr = getTodayString();
    const totalLifeScore = calculateLifeScore(answers);

    // Upsert (create or update) today's life log entry
    const log = await LifeLog.findOneAndUpdate(
      { userId: req.user._id, date: todayStr },
      {
        userId: req.user._id,
        date: todayStr,
        answers,
        totalLifeScore,
      },
      { new: true, upsert: true }
    );

    res.json({
      message: "Life journal entry saved successfully! 🌿",
      log,
      totalLifeScore,
    });
  } catch (err) {
    console.error('Error logging life entry:', err);
    res.status(500).json({ message: 'Server error saving life entry' });
  }
});

// ─── GET /api/life/today ──────────────────────────────────────────────────────
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const todayStr = getTodayString();
    const log = await LifeLog.findOne({ userId: req.user._id, date: todayStr });
    res.json({ log: log || false });
  } catch (err) {
    console.error('Error fetching today life log:', err);
    res.status(500).json({ message: 'Server error checking today life log' });
  }
});

// ─── GET /api/life/history ────────────────────────────────────────────────────
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const daysRequested = Math.min(Math.max(parseInt(req.query.days, 10) || 14, 1), 365);
    const now = new Date();

    // Fetch all logs for this user up to requested days back
    const logs = await LifeLog.find({ userId: req.user._id })
      .sort({ date: 1 })
      .lean();

    const logMap = new Map(logs.map(l => [l.date, l]));

    // Generate complete date sequence
    const history = [];
    for (let i = daysRequested - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const entry = logMap.get(dateStr);
      history.push({
        date: dateStr,
        logged: Boolean(entry),
        totalLifeScore: entry ? entry.totalLifeScore : 0,
        answers: entry ? entry.answers : null,
      });
    }

    // ── Compute Statistics ──
    const allLogsDesc = [...logs].reverse();
    let currentStreak = 0;
    const checkDate = new Date();

    for (let i = 0; i < 365; i++) {
      const year = checkDate.getFullYear();
      const month = String(checkDate.getMonth() + 1).padStart(2, '0');
      const day = String(checkDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      if (logMap.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        // If today not logged yet, check yesterday to keep streak active
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const totalDaysLogged = logs.length;
    const overallLifeScore = logs.reduce((acc, l) => acc + l.totalLifeScore, 0);
    const averageScore = totalDaysLogged > 0 ? Math.round(overallLifeScore / totalDaysLogged) : 0;

    // Breakdown metrics
    let consciousEatingCount = 0;
    let respondingCount = 0;
    let willingCount = 0;
    let vibrantCount = 0;
    let vakshudhiGoodCount = 0;

    logs.forEach(l => {
      if (l.answers?.consciousEating === 'Yes') consciousEatingCount++;
      if (l.answers?.reactOrRespond === 'Responding') respondingCount++;
      if (l.answers?.moreWilling === 'Yes') willingCount++;
      if (l.answers?.systemVibrant === 'Yes') vibrantCount++;
      if (l.answers?.vakshudhiRating === 'Good') vakshudhiGoodCount++;
    });

    res.json({
      history,
      stats: {
        currentStreak,
        totalDaysLogged,
        overallLifeScore,
        averageScore,
        consciousEatingPct: totalDaysLogged > 0 ? Math.round((consciousEatingCount / totalDaysLogged) * 100) : 0,
        respondingPct: totalDaysLogged > 0 ? Math.round((respondingCount / totalDaysLogged) * 100) : 0,
        willingPct: totalDaysLogged > 0 ? Math.round((willingCount / totalDaysLogged) * 100) : 0,
        vibrantPct: totalDaysLogged > 0 ? Math.round((vibrantCount / totalDaysLogged) * 100) : 0,
        vakshudhiGoodPct: totalDaysLogged > 0 ? Math.round((vakshudhiGoodCount / totalDaysLogged) * 100) : 0,
      },
    });
  } catch (err) {
    console.error('Error fetching life history:', err);
    res.status(500).json({ message: 'Server error fetching life history' });
  }
});

module.exports = router;
