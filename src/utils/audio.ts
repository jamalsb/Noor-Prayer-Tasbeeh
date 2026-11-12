/**
 * Web Audio API synthesizer for tactile sounds (wooden bead click, lap completion chime)
 * Purely synthesized, 0 external network requests, works 100% offline.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Produces a soft, satisfying wooden bead click for each tasbeeh tap
 */
export function playBeadClickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Natural wood/bead frequency profile
    osc.type = 'sine';
    const startTime = ctx.currentTime;
    
    // Quick pitch drop simulates wood collision
    osc.frequency.setValueAtTime(880, startTime);
    osc.frequency.exponentialRampToValueAtTime(220, startTime + 0.035);

    // Snappy envelope
    gain.gain.setValueAtTime(0.35, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.045);
  } catch (e) {
    console.debug('Audio click failed', e);
  }
}

/**
 * Plays a resonant, celestial harmonic chime when a target/lap is achieved (e.g. 33, 99)
 */
export function playCompletionChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const frequencies = [528, 660, 792, 1056]; // Solfeggio / harmonic chime

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      const noteStart = now + idx * 0.08;
      const noteEnd = noteStart + 0.9;

      gain.gain.setValueAtTime(0.2, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteStart);
      osc.stop(noteEnd);
    });
  } catch (e) {
    console.debug('Chime failed', e);
  }
}

/**
 * Plays gentle Adhan reminder preview tone
 */
export function playAdhanTone() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [
      { freq: 440, dur: 0.6 },
      { freq: 523.25, dur: 0.6 },
      { freq: 587.33, dur: 0.8 },
      { freq: 523.25, dur: 0.5 },
      { freq: 440, dur: 1.2 },
    ];

    let current = ctx.currentTime;
    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, current);

      gain.gain.setValueAtTime(0.25, current);
      gain.gain.exponentialRampToValueAtTime(0.001, current + n.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(current);
      osc.stop(current + n.dur);
      current += n.dur * 0.85;
    });
  } catch (e) {
    console.debug('Tone failed', e);
  }
}

/**
 * Triggers haptic vibration with fallback
 */
export function triggerHaptic(duration = 25) {
  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
    try {
      navigator.vibrate(duration);
    } catch (e) {
      console.debug('Vibrate failed', e);
    }
  }
}
