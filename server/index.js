// Load .env in local dev (on Render/Netlify env vars are injected directly)
try {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
} catch (_) {}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const sadhanaRoutes = require('./routes/sadhana');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// ─── CORS ─────────────────────────────────────────────────────────────────────
// In production the frontend is served by this same Express server,
// so CORS is only needed in development. CORS_ORIGIN lets you whitelist
// a separate frontend URL (e.g. a Vercel preview) if needed.
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.CORS_ORIGIN,        // set in deployment env vars if needed
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/sadhana', sadhanaRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// ─── Serve React build in production ─────────────────────────────────────────
if (isProduction) {
  const clientBuild = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuild));
  // Catch-all: send index.html for all non-API routes (React Router handles them)
  app.use((req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

// ─── MongoDB + Start ──────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    tls: true,
    tlsAllowInvalidCertificates: false,
  })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
