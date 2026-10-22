// Web Audio API Synthesizer for Werewolf Soundboard & SFX
let audioCtx = null;

const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
};

// 1. Tiếng Sói Hú (Wolf Howl)
export const playWolfHowl = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = "sawtooth";
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(450, now);

  // Pitch sweep simulating howling wolf (starts low, rises, peaks, slides down)
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(480, now + 1.2);
  osc.frequency.exponentialRampToValueAtTime(380, now + 2.4);
  osc.frequency.exponentialRampToValueAtTime(180, now + 3.8);

  // Gain envelope
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.8);
  gain.gain.setValueAtTime(0.25, now + 2.2);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 4.1);
};

// 2. Tiếng Chuông Tử Thần / Nhà Thờ Đêm (Ominous Church Bell)
export const playChurchBell = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Fundamental & overtones
  const freqs = [110, 220, 330, 440, 587];
  const decay = 3.5;

  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = idx === 0 ? "sine" : "triangle";
    osc.frequency.setValueAtTime(freq, now);

    const amp = 0.3 / (idx + 1);
    gain.gain.setValueAtTime(amp, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + decay);
  });
};

// 3. Tiếng Chuông Buổi Sáng / Gà Gáy (Morning Chime)
export const playMorningChime = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

  notes.forEach((freq, index) => {
    const noteTime = now + index * 0.22;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, noteTime);

    gain.gain.setValueAtTime(0.001, noteTime);
    gain.gain.linearRampToValueAtTime(0.2, noteTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteTime);
    osc.stop(noteTime + 1.3);
  });
};

// 4. Tiếng Lật Thẻ Bài (Card Flip Swoosh)
export const playCardFlip = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const bufferSize = ctx.sampleRate * 0.08;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1200, now);
  filter.frequency.exponentialRampToValueAtTime(400, now + 0.08);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(now);
};

// 5. Tiếng Hết Giờ Thảo Luận (Timer Expired Buzzer / Alarm)
export const playTimerAlarm = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = now + i * 0.25;

    osc.type = "square";
    osc.frequency.setValueAtTime(880, t);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.setValueAtTime(0.15, t + 0.12);
    gain.gain.setValueAtTime(0.001, t + 0.13);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.15);
  }
};

// 6. Tiếng Trừ Khử / Bị Loại (Ominous Death Tone)
export const playDeathSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(32, now + 1.4);

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 1.6);
};

// 7. Tiếng Hồi Sinh / Cứu Sống (Celestial Harp Chime)
export const playReviveSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [440, 554.37, 659.25, 880, 1108.73];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + idx * 0.1);

    gain.gain.setValueAtTime(0.001, now + idx * 0.1);
    gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.1 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 1.0);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.1);
    osc.stop(now + idx * 0.1 + 1.1);
  });
};

