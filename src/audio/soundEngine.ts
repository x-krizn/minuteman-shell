import { SoundEngine } from '../types';

class RetroSoundEngine implements SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted: boolean = false;
  private volume: number = 0.5;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain && !this.muted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public playTone(
    freq: number,
    type: OscillatorType = 'square',
    duration: number = 0.08,
    vol: number = 0.25,
    glideToFreq?: number
  ) {
    try {
      this.initCtx();
      if (!this.ctx || !this.masterGain || this.muted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(freq, now);

      if (glideToFreq !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(10, glideToFreq), now + duration);
      }

      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch {
      // Audio autoplay policy or device restrictions
    }
  }

  public menuMove() {
    this.playTone(740, 'square', 0.03, 0.12);
  }

  public menuSelect() {
    this.playTone(520, 'square', 0.06, 0.18, 880);
  }

  public menuBack() {
    this.playTone(420, 'triangle', 0.08, 0.15, 220);
  }

  public beep(pitch: number = 440) {
    this.playTone(pitch, 'square', 0.05, 0.2);
  }

  public laser() {
    this.playTone(980, 'square', 0.09, 0.2, 120);
  }

  public jump() {
    this.playTone(150, 'triangle', 0.14, 0.25, 520);
  }

  public hit() {
    try {
      this.initCtx();
      if (!this.ctx || !this.masterGain || this.muted) return;

      // Synthesize 8-bit noise burst for crunch
      const bufferSize = this.ctx.sampleRate * 0.1;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.1);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      whiteNoise.start();
    } catch {
      this.playTone(180, 'sawtooth', 0.1, 0.25, 40);
    }
  }

  public coin() {
    this.playTone(987, 'square', 0.06, 0.2);
    setTimeout(() => {
      this.playTone(1318, 'square', 0.12, 0.22);
    }, 60);
  }

  public powerup() {
    const notes = [330, 440, 554, 659];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'square', 0.07, 0.2);
      }, idx * 60);
    });
  }
}

export const soundEngine: SoundEngine = new RetroSoundEngine();
