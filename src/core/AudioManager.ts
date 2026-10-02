/**
 * Procedural Web Audio Sound Synthesizer.
 * Generates arcade-quality retro & modern sound effects with 0kb external asset downloads,
 * zero latency, and 100% browser/mobile compatibility.
 */
export class AudioManager {
    public static isMuted: boolean = localStorage.getItem('mini_kingdom_muted') === 'true';
    private static ctx: AudioContext | null = null;
    private static lastPlayed: Record<string, number> = {};

    private static shouldThrottle(key: string, minIntervalMs: number): boolean {
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const prev = this.lastPlayed[key] || 0;
        if (now - prev < minIntervalMs) return true;
        this.lastPlayed[key] = now;
        return false;
    }

    private static getContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    public static toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        localStorage.setItem('mini_kingdom_muted', this.isMuted.toString());
        return this.isMuted;
    }

    /** UI Button Click */
    static playClick() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.04);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
    }

    /** Troop deployed onto the battlefield */
    static playDeploy() {
        if (this.isMuted || this.shouldThrottle('deploy', 60)) return;
        const ctx = this.getContext();
        if (!ctx) return;

        // War drum / summon impact
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.12);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    /** Cannon firing boom */
    static playCannon() {
        if (this.isMuted || this.shouldThrottle('cannon', 110)) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        // Low pitch blast
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.25);

        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.28);

        // Noise punch transient
        this.playNoiseBurst(0.12, 0.35, 400);
    }

    /** Archer tower / archer arrow release */
    static playArrow() {
        if (this.isMuted || this.shouldThrottle('arrow', 75)) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.07);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
    }

    /** Cannonball / boulder / building impact explosion */
    static playExplosion() {
        if (this.isMuted || this.shouldThrottle('explosion', 130)) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        // Sub bass thump
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.35);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);

        // Debris noise
        this.playNoiseBurst(0.3, 0.35, 600);
    }

    /** Mage bolt / God spell / mystical effect */
    static playMagic() {
        if (this.isMuted || this.shouldThrottle('magic', 120)) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const freqs = [587, 880, 1174]; // D5, A5, D6
        freqs.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const delay = idx * 0.04;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + delay);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + delay + 0.2);

            gain.gain.setValueAtTime(0.15, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.25);
        });
    }

    /** Gold coins collect / loot */
    static playCoins() {
        if (this.isMuted || this.shouldThrottle('coins', 120)) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const tones = [1318, 1568, 1975]; // E6, G6, B6
        tones.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + i * 0.055;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.2, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.12);
        });
    }

    /** Building hit / wall crunch */
    static playBuildingHit() {
        if (this.isMuted || this.shouldThrottle('hit', 90)) return;
        this.playNoiseBurst(0.09, 0.22, 500);
    }

    /** Level up / upgrade finished celebratory chime */
    static playLevelUp() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const notes = [349, 440, 523, 698]; // F4, A4, C5, F5
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + i * 0.07;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.25, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.28);
        });
    }

    /** Triumphant 3-star Victory Fanfare */
    static playVictory() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        // Clash-style victory trumpet fanfare (C4, E4, G4, C5, G4, C5)
        const notes = [
            { f: 261.63, t: 0.0, d: 0.14 },
            { f: 329.63, t: 0.14, d: 0.14 },
            { f: 392.00, t: 0.28, d: 0.18 },
            { f: 523.25, t: 0.46, d: 0.55 },
        ];

        notes.forEach(({ f, t, d }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + t;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, start);

            gain.gain.setValueAtTime(0.35, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + d);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + d);
        });
    }

    /** Battle defeat minor chime */
    static playDefeat() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const notes = [
            { f: 329.63, t: 0.0, d: 0.22 }, // E4
            { f: 293.66, t: 0.2, d: 0.22 }, // D4
            { f: 261.63, t: 0.4, d: 0.22 }, // C4
            { f: 220.00, t: 0.6, d: 0.55 }, // A3
        ];

        notes.forEach(({ f, t, d }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + t;

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, start);

            gain.gain.setValueAtTime(0.2, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + d);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + d);
        });
    }

    /** Helper: noise burst with lowpass filter */
    private static playNoiseBurst(duration: number, volume: number, cutoffHz: number) {
        const ctx = this.getContext();
        if (!ctx) return;

        const bufferSize = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(cutoffHz, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(ctx.currentTime);
        noise.stop(ctx.currentTime + duration);
    }
}
