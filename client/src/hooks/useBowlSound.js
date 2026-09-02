import { useRef, useCallback } from 'react';

/**
 * Each sadhana gets a unique synthesized sound profile using Web Audio API.
 * No external files — everything is generated in the browser.
 *
 * Second tap plays the same sound but slightly higher pitched (+semitone).
 * Reset (count → 0) plays a soft low whisper.
 */

// ─── Helper: create a gain envelope ──────────────────────────────────────────
function envelope(gainNode, ctx, { vol, attack = 0.008, decay, sustain = 0, release }) {
  const t = ctx.currentTime;
  gainNode.gain.setValueAtTime(0, t);
  gainNode.gain.linearRampToValueAtTime(vol, t + attack);
  if (sustain > 0) {
    gainNode.gain.linearRampToValueAtTime(vol * 0.6, t + attack + decay);
    gainNode.gain.linearRampToValueAtTime(0.001, t + attack + decay + release);
  } else {
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + attack + decay);
  }
}

function osc(ctx, type, freq, gainNode) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, ctx.currentTime);
  o.connect(gainNode);
  gainNode.connect(ctx.destination);
  return o;
}

function startStop(o, ctx, duration) {
  o.start(ctx.currentTime);
  o.stop(ctx.currentTime + duration);
}

// ─── Individual sound designers ───────────────────────────────────────────────

/** 🌌 Shoonya Meditation — deep spacious drone, emptiness, void */
function playShoonyaSound(ctx, count) {
  const freq = count === 2 ? 185 : 174; // liberation frequency
  const dur = 4;

  // Fundamental — boosted volume
  const g1 = ctx.createGain();
  envelope(g1, ctx, { vol: 0.55, attack: 0.05, decay: dur });
  const o1 = osc(ctx, 'sine', freq, g1);
  startStop(o1, ctx, dur);

  // 2nd harmonic at 2× — essential for laptop speakers (they can't hear 174Hz)
  const g2 = ctx.createGain();
  envelope(g2, ctx, { vol: 0.3, attack: 0.05, decay: dur * 0.85 });
  const o2 = osc(ctx, 'sine', freq * 2, g2);
  startStop(o2, ctx, dur * 0.85);

  // 3rd harmonic — adds body and depth
  const g3 = ctx.createGain();
  envelope(g3, ctx, { vol: 0.12, attack: 0.06, decay: dur * 0.6 });
  const o3 = osc(ctx, 'sine', freq * 3, g3);
  startStop(o3, ctx, dur * 0.6);

  // Slow vibrato on fundamental
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.4;
  lfoGain.gain.value = 1.5;
  lfo.connect(lfoGain);
  lfoGain.connect(o1.frequency);
  lfo.start(ctx.currentTime);
  lfo.stop(ctx.currentTime + dur);
}

/** 👁️ Shambhavi Mahamudra — crystal clear focused bell, third eye */
function playShambhaviSound(ctx, count) {
  const freq = count === 2 ? 904 : 852; // third eye / intuition
  const dur = 3;

  const g1 = ctx.createGain();
  envelope(g1, ctx, { vol: 0.4, attack: 0.003, decay: dur });
  const o1 = osc(ctx, 'sine', freq, g1);
  startStop(o1, ctx, dur);

  // Pure high harmonic (crystal overtone)
  const g2 = ctx.createGain();
  envelope(g2, ctx, { vol: 0.12, attack: 0.003, decay: dur * 0.5 });
  const o2 = osc(ctx, 'sine', freq * 3.01, g2);
  startStop(o2, ctx, dur * 0.5);

  // Gentle click transient (mallet on crystal)
  const g3 = ctx.createGain();
  envelope(g3, ctx, { vol: 0.2, attack: 0.001, decay: 0.04 });
  const o3 = osc(ctx, 'triangle', freq * 1.5, g3);
  startStop(o3, ctx, 0.04);
}

/** ⚡ Shakti Chalana Kriya — rising energy arpeggio, 3 ascending sparks */
function playShaktiSound(ctx, count) {
  const base = count === 2 ? 330 : 294; // D4 or E4
  const semitone = Math.pow(2, 1 / 12);
  // Three quick rising notes: root, major third, fifth
  const freqs = [base, base * Math.pow(semitone, 4), base * Math.pow(semitone, 7)];
  const delays = [0, 0.11, 0.22];

  freqs.forEach((freq, i) => {
    const later = ctx.currentTime + delays[i];
    const gNode = ctx.createGain();
    gNode.gain.setValueAtTime(0, later);
    gNode.gain.linearRampToValueAtTime(0.35 - i * 0.05, later + 0.005);
    gNode.gain.exponentialRampToValueAtTime(0.001, later + 1.2 - i * 0.1);
    gNode.connect(ctx.destination);

    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(freq, later);
    // Add slight pitch bend up (energy rising)
    o.frequency.linearRampToValueAtTime(freq * 1.03, later + 0.15);
    o.connect(gNode);
    o.start(later);
    o.stop(later + 1.4);
  });
}

/** ☀️ Surya Kriya — warm radiant shimmer, 528Hz love/sun frequency */
function playSuryaSound(ctx, count) {
  const freq = count === 2 ? 560 : 528; // solfeggio MI
  const dur = 3.5;

  // Warm fundamental
  const g1 = ctx.createGain();
  envelope(g1, ctx, { vol: 0.38, attack: 0.015, decay: dur });
  const o1 = osc(ctx, 'sine', freq, g1);
  startStop(o1, ctx, dur);

  // Warm second harmonic
  const g2 = ctx.createGain();
  envelope(g2, ctx, { vol: 0.14, attack: 0.015, decay: dur * 0.7 });
  const o2 = osc(ctx, 'sine', freq * 2, g2);
  startStop(o2, ctx, dur * 0.7);

  // Golden shimmer (5th partial)
  const g3 = ctx.createGain();
  envelope(g3, ctx, { vol: 0.06, attack: 0.02, decay: dur * 0.4 });
  const o3 = osc(ctx, 'sine', freq * 4.98, g3);
  startStop(o3, ctx, dur * 0.4);

  // Slow warm chorus (slightly detuned twin)
  const g4 = ctx.createGain();
  envelope(g4, ctx, { vol: 0.12, attack: 0.02, decay: dur * 0.9 });
  const o4 = osc(ctx, 'sine', freq * 1.005, g4); // 0.5% detune → chorus
  startStop(o4, ctx, dur * 0.9);
}

/** 🧘 Yogasanas — grounded steady singing bowl, root chakra 396Hz */
function playYogasanasSound(ctx, count) {
  const freq = count === 2 ? 420 : 396; // root chakra
  const dur = 2.8;

  const g1 = ctx.createGain();
  envelope(g1, ctx, { vol: 0.42, attack: 0.01, decay: dur });
  const o1 = osc(ctx, 'sine', freq, g1);
  startStop(o1, ctx, dur);

  // Tibetan bowl inharmonic partial (×2.74)
  const g2 = ctx.createGain();
  envelope(g2, ctx, { vol: 0.16, attack: 0.01, decay: dur * 0.6 });
  const o2 = osc(ctx, 'sine', freq * 2.74, g2);
  startStop(o2, ctx, dur * 0.6);

  // Soft mallet noise
  const bufSize = Math.floor(ctx.sampleRate * 0.04);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 6);
  }
  const noise = ctx.createBufferSource();
  const noiseGain = ctx.createGain();
  noise.buffer = buf;
  noiseGain.gain.setValueAtTime(0.15, ctx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
  noise.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(ctx.currentTime);
}

/** 💪 Angamardana — strong percussive strike, kick drum energy */
function playAngamardanaSound(ctx, count) {
  const startFreq = count === 2 ? 380 : 320;  // higher start so pitch-drop is audible
  const endFreq   = count === 2 ? 90  : 80;   // settles into body thump
  const dur = 1.4;

  // Body — pitch-dropping sine (classic kick drum technique)
  const g1 = ctx.createGain();
  envelope(g1, ctx, { vol: 0.7, attack: 0.003, decay: dur });
  const o1 = ctx.createOscillator();
  o1.type = 'sine';
  o1.frequency.setValueAtTime(startFreq, ctx.currentTime);
  o1.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + 0.12);
  o1.connect(g1);
  g1.connect(ctx.destination);
  startStop(o1, ctx, dur);

  // Punch harmonic — audible click layer at mid frequency
  const g2 = ctx.createGain();
  envelope(g2, ctx, { vol: 0.35, attack: 0.002, decay: 0.18 });
  const o2 = osc(ctx, 'triangle', startFreq * 0.9, g2);
  startStop(o2, ctx, 0.18);

  // Impact noise — bandpass centred higher so laptop speakers reproduce it
  const bufSize = Math.floor(ctx.sampleRate * 0.06);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 3);
  }
  const noise = ctx.createBufferSource();
  const nf = ctx.createBiquadFilter();
  const ng = ctx.createGain();
  noise.buffer = buf;
  nf.type = 'bandpass';
  nf.frequency.value = 500;   // raised from 300 — laptop speakers handle this
  nf.Q.value = 0.8;
  ng.gain.setValueAtTime(0.45, ctx.currentTime);
  ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  noise.connect(nf);
  nf.connect(ng);
  ng.connect(ctx.destination);
  noise.start(ctx.currentTime);
}

/** 🌿 Sukha Kriya — soft wind chime, airy, crown/bliss frequency 963Hz */
function playSukhaSound(ctx, count) {
  const freq = count === 2 ? 1020 : 963; // crown chakra
  const dur = 3.2;

  // Soft airy sine (very gentle attack)
  const g1 = ctx.createGain();
  envelope(g1, ctx, { vol: 0.28, attack: 0.06, decay: dur });
  const o1 = osc(ctx, 'sine', freq, g1);
  startStop(o1, ctx, dur);

  // Airy breathy noise (wind texture)
  const bufSize = Math.floor(ctx.sampleRate * 0.5);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  const nf = ctx.createBiquadFilter();
  const ng = ctx.createGain();
  noise.buffer = buf;
  nf.type = 'bandpass';
  nf.frequency.value = freq * 0.8;
  nf.Q.value = 3;
  ng.gain.setValueAtTime(0, ctx.currentTime);
  ng.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.08);
  ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur * 0.7);
  noise.connect(nf);
  nf.connect(ng);
  ng.connect(ctx.destination);
  noise.start(ctx.currentTime);

  // Delicate high chime shimmer
  const g2 = ctx.createGain();
  envelope(g2, ctx, { vol: 0.10, attack: 0.04, decay: dur * 0.5 });
  const o2 = osc(ctx, 'sine', freq * 2.003, g2);
  startStop(o2, ctx, dur * 0.5);
}

/** Soft universal reset sound (count → 0) — gentle low sigh */
function playResetSound(ctx) {
  const g1 = ctx.createGain();
  envelope(g1, ctx, { vol: 0.15, attack: 0.02, decay: 1.2 });
  const o1 = osc(ctx, 'sine', 220, g1);
  startStop(o1, ctx, 1.2);
}

/** 🪷 Samyama Sadhana — deep inward lotus tone, warm absorption */
function playSamyamaSound(ctx, count) {
  const freq = count === 2 ? 288 : 272; // deep D — between earth and void
  const dur = 4.5;

  // Warm rounded fundamental
  const g1 = ctx.createGain();
  envelope(g1, ctx, { vol: 0.5, attack: 0.08, decay: dur });
  const o1 = osc(ctx, 'sine', freq, g1);
  startStop(o1, ctx, dur);

  // Soft 5th harmonic (adds lotus-like warmth)
  const g2 = ctx.createGain();
  envelope(g2, ctx, { vol: 0.2, attack: 0.1, decay: dur * 0.75 });
  const o2 = osc(ctx, 'sine', freq * 1.5, g2);
  startStop(o2, ctx, dur * 0.75);

  // Very slow gentle LFO (0.25Hz — like one breath per 4s)
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.25;
  lfoGain.gain.value = 2;
  lfo.connect(lfoGain);
  lfoGain.connect(o1.frequency);
  lfo.start(ctx.currentTime);
  lfo.stop(ctx.currentTime + dur);
}

/** 🌬️ Breath Watching — gentle rhythmic pulse, like an observed breath */
function playBreathWatchingSound(ctx, count) {
  const freq = count === 2 ? 480 : 440; // concert A, familiar and centring
  const dur = 3.5;

  // Soft sine — rises like an inhale, falls like exhale
  const g1 = ctx.createGain();
  const t = ctx.currentTime;
  g1.gain.setValueAtTime(0, t);
  g1.gain.linearRampToValueAtTime(0.35, t + 0.6);   // inhale
  g1.gain.linearRampToValueAtTime(0.15, t + 1.4);   // top of breath
  g1.gain.linearRampToValueAtTime(0.28, t + 2.2);   // exhale peak
  g1.gain.exponentialRampToValueAtTime(0.001, t + dur); // fade
  const o1 = ctx.createOscillator();
  o1.type = 'sine';
  o1.frequency.setValueAtTime(freq, t);
  o1.frequency.linearRampToValueAtTime(freq * 1.04, t + 0.6);  // rise with inhale
  o1.frequency.linearRampToValueAtTime(freq, t + 2.2);          // settle on exhale
  o1.connect(g1);
  g1.connect(ctx.destination);
  o1.start(t);
  o1.stop(t + dur);
}

/** 🌟 Surya Shakti — brighter and more energetic than Surya Kriya */
function playSuryaShaktiSound(ctx, count) {
  const freq = count === 2 ? 660 : 622; // high E / Eb — bright solar
  const dur = 2.8;

  // Bright main tone
  const g1 = ctx.createGain();
  envelope(g1, ctx, { vol: 0.4, attack: 0.01, decay: dur });
  const o1 = osc(ctx, 'sine', freq, g1);
  startStop(o1, ctx, dur);

  // Energetic 2nd harmonic
  const g2 = ctx.createGain();
  envelope(g2, ctx, { vol: 0.2, attack: 0.01, decay: dur * 0.6 });
  const o2 = osc(ctx, 'sine', freq * 2, g2);
  startStop(o2, ctx, dur * 0.6);

  // Shimmer layer (triangle for brightness)
  const g3 = ctx.createGain();
  envelope(g3, ctx, { vol: 0.1, attack: 0.005, decay: dur * 0.35 });
  const o3 = osc(ctx, 'triangle', freq * 3.01, g3);
  startStop(o3, ctx, dur * 0.35);

  // Quick bright click (solar flare transient)
  const g4 = ctx.createGain();
  envelope(g4, ctx, { vol: 0.25, attack: 0.002, decay: 0.06 });
  const o4 = osc(ctx, 'sawtooth', freq * 0.5, g4);
  startStop(o4, ctx, 0.06);
}

/** 💨 Bhastrika Kriya — rapid energising burst, like forceful breath */
function playBhastrikaSound(ctx, count) {
  const base = count === 2 ? 370 : 330; // E4 — energetic
  // Three rapid fire upward pulses (bhastrika = bellows breath)
  const delays = [0, 0.07, 0.14];

  delays.forEach((d, i) => {
    const t = ctx.currentTime + d;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.45 - i * 0.05, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    g.connect(ctx.destination);

    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(base * (1 + i * 0.08), t); // step up each burst
    o.connect(g);
    o.start(t);
    o.stop(t + 0.6);
  });

  // Short sharp noise punch on first hit
  const bufSize = Math.floor(ctx.sampleRate * 0.04);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 5);
  }
  const noise = ctx.createBufferSource();
  const nf = ctx.createBiquadFilter();
  const ng = ctx.createGain();
  noise.buffer = buf;
  nf.type = 'bandpass';
  nf.frequency.value = 800;
  nf.Q.value = 1;
  ng.gain.setValueAtTime(0.3, ctx.currentTime);
  ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
  noise.connect(nf);
  nf.connect(ng);
  ng.connect(ctx.destination);
  noise.start(ctx.currentTime);
}

// ─── Sound map ────────────────────────────────────────────────────────────────
const SOUND_MAP = {
  'Shoonya Meditation':   playShoonyaSound,
  'Shambhavi Mahamudra':  playShambhaviSound,
  'Shakti Chalana Kriya': playShaktiSound,
  'Surya Kriya':          playSuryaSound,
  'Yogasanas':            playYogasanasSound,
  'Angamardana':          playAngamardanaSound,
  'Sukha Kriya':          playSukhaSound,
  'Samyama Sadhana':      playSamyamaSound,
  'Breath Watching':      playBreathWatchingSound,
  'Surya Shakti':         playSuryaShaktiSound,
  'Bhastrika Kriya':      playBhastrikaSound,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useSadhanaSound() {
  const audioCtxRef = useRef(null);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  /**
   * @param {string} practiceName  — e.g. 'Shoonya Meditation'
   * @param {number} newCount      — 0, 1, or 2 (the count AFTER the tap)
   */
  const play = useCallback((practiceName, newCount) => {
    try {
      const ctx = getCtx();
      if (newCount === 0) {
        playResetSound(ctx);
      } else {
        const fn = SOUND_MAP[practiceName];
        if (fn) fn(ctx, newCount);
      }
    } catch (e) {
      // Silently ignore — audio not supported or blocked
    }
  }, [getCtx]);

  return play;
}
