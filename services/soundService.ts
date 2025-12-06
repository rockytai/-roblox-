class SoundService {
  private ctx: AudioContext | null = null;

  public init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, startTime = 0) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(this.ctx.currentTime + startTime);
    osc.stop(this.ctx.currentTime + startTime + duration);
  }

  public play(effect: 'click' | 'attack' | 'hit' | 'win') {
    this.init();
    switch (effect) {
      case 'click': 
        this.playTone(1200, 'sine', 0.1); 
        break;
      case 'attack': 
        this.playTone(600, 'sawtooth', 0.1); 
        break;
      case 'hit': 
        this.playTone(150, 'square', 0.2); 
        break;
      case 'win': 
        this.playTone(523, 'triangle', 0.1, 0); 
        this.playTone(659, 'triangle', 0.1, 0.1);
        this.playTone(784, 'triangle', 0.2, 0.2);
        break;
    }
  }
}

export const soundService = new SoundService();