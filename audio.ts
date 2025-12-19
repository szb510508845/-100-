




let audioCtx: AudioContext | null = null;
let isMusicEnabled = true;
let isSfxEnabled = true;
let musicTimer: number | null = null;
let nextNoteTime = 0.0;
let beatCount = 0;

// Initialize Audio Context (must be called on user interaction)
export const initAudio = () => {
  if (!audioCtx) {
    const CtxClass = (window.AudioContext || (window as any).webkitAudioContext);
    if (CtxClass) {
      audioCtx = new CtxClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const setMusicEnabled = (enabled: boolean) => {
  isMusicEnabled = enabled;
  if (!isMusicEnabled) stopMusic();
  else startMusic();
};

export const setSfxEnabled = (enabled: boolean) => {
  isSfxEnabled = enabled;
};

// --- Sound Effects ---

export const playJumpSound = () => {
  if (!audioCtx || !isSfxEnabled) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  // Slide up for jump
  osc.type = 'square';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.15);
  
  gain.gain.setValueAtTime(0.05, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  
  osc.start(t);
  osc.stop(t + 0.15);
};

export const playWhooshSound = () => {
  if (!audioCtx || !isSfxEnabled) return;
  const t = audioCtx.currentTime;
  
  // Noise buffer for wind/whoosh
  const bufferSize = audioCtx.sampleRate * 0.2; // 0.2 seconds
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(400, t);
  filter.frequency.linearRampToValueAtTime(100, t + 0.2);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.05, t);
  gain.gain.linearRampToValueAtTime(0.001, t + 0.2);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  
  noise.start(t);
};

export const playLandSound = () => {
  if (!audioCtx || !isSfxEnabled) return;
  const t = audioCtx.currentTime;
  
  // Crisp "Tak" sound - higher pitch, shorter duration, triangle wave
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.type = 'triangle'; 
  osc.frequency.setValueAtTime(500, t); 
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.08);
  
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  
  osc.start(t);
  osc.stop(t + 0.08);
};

export const playFailSound = () => {
    if (!audioCtx || !isSfxEnabled) return;
    const t = audioCtx.currentTime;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
  
    // Sad slide down
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 1.0);
  
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 1.0);
  
    osc.start(t);
    osc.stop(t + 1.0);
};

export const playWinSound = () => {
    if (!audioCtx || !isSfxEnabled) return;
    const t = audioCtx.currentTime;
    
    // High pitched arpeggio / cheer simulation
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C Major Arp
    
    freqs.forEach((f, i) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        
        osc.type = 'square';
        osc.frequency.value = f;
        
        const startTime = t + (i * 0.1);
        gain.gain.setValueAtTime(0.05, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
        
        osc.start(startTime);
        osc.stop(startTime + 0.3);
    });
};

// --- Robotic Sound Effect (Chirp) ---
const playRobotTone = () => {
  if (!audioCtx || !isSfxEnabled) return;
  const t = audioCtx.currentTime;
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  // Robotic "Chirp" - Sawtooth wave for buzzier sound
  osc.type = 'sawtooth';
  
  // Frequency sweep: Up then Down (like a servo motor or R2D2)
  osc.frequency.setValueAtTime(800, t);
  osc.frequency.exponentialRampToValueAtTime(1600, t + 0.05);
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.15);
  
  gain.gain.setValueAtTime(0.08, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  
  osc.start(t);
  osc.stop(t + 0.15);
};

// --- Character Voice Synthesis ---
export const playSkinVoice = (text: string, skinId: string) => {
  if (!isSfxEnabled || !window.speechSynthesis) return;

  // Play mechanical sound first to set the mood
  playRobotTone();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN'; // Set language to Chinese

  // Try to find a good Chinese voice if available
  // Google voices often sound more synthetic/clean which fits robots
  const voices = window.speechSynthesis.getVoices();
  const cnVoice = voices.find(v => v.lang.includes('zh-CN') && (v.name.includes('Google') || v.name.includes('Microsoft')));
  if (cnVoice) utterance.voice = cnVoice;

  // Customize personality based on skin ID
  switch (skinId) {
    case 'classic':
      // WALL-E Style: High pitch, slightly slower, deliberate
      utterance.pitch = 1.6; 
      utterance.rate = 0.85; 
      break;
    case 'superman':
      // Heroic: Standard pitch, strong
      utterance.pitch = 0.9;
      utterance.rate = 1.0;
      utterance.volume = 1.0;
      break;
    case 'prime':
      // Leader: Deep voice, slower, authoritative
      utterance.pitch = 0.6;
      utterance.rate = 0.75;
      break;
    case 'bumblebee':
      // Bee: Energetic, high pitch, fast
      utterance.pitch = 1.4;
      utterance.rate = 1.3;
      break;
    default:
      utterance.pitch = 1.0;
      utterance.rate = 1.0;
  }

  // Cancel any currently speaking text to avoid overlap
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

// --- Music Sequencer ---

const TEMPO = 145; // Fast, challenging tempo
const SECONDS_PER_BEAT = 60.0 / TEMPO;
const SCHEDULE_AHEAD_TIME = 0.1;
const LOOKAHEAD = 25.0;

const playKick = (time: number) => {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
  gain.gain.setValueAtTime(0.2, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
  
  osc.start(time);
  osc.stop(time + 0.5);
};

const playBass = (freq: number, time: number, dur: number) => {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);
  
  // Plucky envelope
  gain.gain.setValueAtTime(0.08, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  
  osc.start(time);
  osc.stop(time + dur);
};

const scheduler = () => {
  if (!audioCtx) return;
  while (nextNoteTime < audioCtx.currentTime + SCHEDULE_AHEAD_TIME) {
    scheduleNote(beatCount, nextNoteTime);
    nextNoteTime += SECONDS_PER_BEAT / 4; // 16th notes resolution
    beatCount++;
  }
  musicTimer = window.setTimeout(scheduler, LOOKAHEAD);
};

const scheduleNote = (beatNumber: number, time: number) => {
  if (!isMusicEnabled) return;
  
  const step = beatNumber % 16; // 1 bar loop (16 sixteenth notes)
  
  // Pattern: Driving Industrial/Techno
  // Kick: 0, 4, 8, 12 (Quarter notes)
  if (step % 4 === 0) {
    playKick(time);
  }
  
  // Bassline: E2 (82.41 Hz) base, changing to G2 (98 Hz) and A2 (110 Hz)
  const bassDur = SECONDS_PER_BEAT / 2;
  
  // Off-beat drive
  if (step === 2 || step === 6 || step === 10 || step === 14) {
     playBass(82.41, time, bassDur); 
  }
  
  // Syncopated hits
  if (step === 3 || step === 11) {
     // Occasional higher note for tension
     playBass(98.00, time, bassDur/2); 
  }
  if (step === 15) {
     playBass(110.00, time, bassDur/2);
  }
};

export const startMusic = () => {
  initAudio();
  if (!isMusicEnabled) return;
  if (musicTimer) return; // already playing
  if (!audioCtx) return;
  
  beatCount = 0;
  nextNoteTime = audioCtx.currentTime + 0.1;
  scheduler();
};

export const stopMusic = () => {
  if (musicTimer) {
    window.clearTimeout(musicTimer);
    musicTimer = null;
  }
};
