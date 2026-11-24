// Web Audio Synthesizer & Beat Generator for live ambient reactivity

class WebAudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private isPlaying = false;
  private timerId: number | null = null;
  private startTime = 0;
  private pauseTime = 0;
  private tempo = 120; // BPM

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(64);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  public getBassEnergy(): number {
    const data = this.getFrequencyData();
    if (data.length === 0) return 0;
    // Average lowest 6 bins (sub & low-bass)
    let sum = 0;
    for (let i = 0; i < 6; i++) {
      sum += data[i] || 0;
    }
    return sum / (6 * 255);
  }

  public startBeat(onTick?: (time: number) => void) {
    this.init();
    if (!this.ctx || !this.analyser) return;

    this.isPlaying = true;
    this.startTime = this.ctx.currentTime - this.pauseTime;

    const scheduleBeats = () => {
      if (!this.isPlaying || !this.ctx || !this.analyser) return;

      const currentTime = this.ctx.currentTime - this.startTime;
      if (onTick) onTick(currentTime);

      // Play continuous rhythmic synth pads & bass kicks
      const beatInterval = 60 / this.tempo;
      const step = Math.floor(currentTime / beatInterval) % 16;

      // On kick beat (0, 4, 8, 12)
      if (Math.abs(currentTime % (beatInterval * 2)) < 0.05) {
        this.playKick();
      }

      // Snare / clap on (4, 12)
      if (Math.abs((currentTime - beatInterval) % (beatInterval * 2)) < 0.05) {
        this.playHiHat();
      }

      // Soft harmonic chords
      if (step === 0 || step === 8) {
        this.playChord(step === 0 ? 220 : 164.81); // A3 or E3
      }

      this.timerId = window.requestAnimationFrame(scheduleBeats);
    };

    scheduleBeats();
  }

  public pause() {
    this.isPlaying = false;
    if (this.timerId) {
      window.cancelAnimationFrame(this.timerId);
      this.timerId = null;
    }
    if (this.ctx) {
      this.pauseTime = this.ctx.currentTime - this.startTime;
    }
  }

  public reset() {
    this.pause();
    this.pauseTime = 0;
  }

  private playKick() {
    if (!this.ctx || !this.analyser) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.analyser);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  private playHiHat() {
    if (!this.ctx || !this.analyser) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(8000, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.analyser);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  private playChord(freq: number) {
    if (!this.ctx || !this.analyser) return;
    [freq, freq * 1.25, freq * 1.5].forEach((f) => {
      if (!this.ctx || !this.analyser) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.8);

      osc.connect(gain);
      gain.connect(this.analyser);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 1.8);
    });
  }
}

export const audioEngine = new WebAudioEngine();
