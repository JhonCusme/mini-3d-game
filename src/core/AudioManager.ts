export class AudioManager {
    public static isMuted: boolean = localStorage.getItem('mini_kingdom_muted') === 'true';

    public static toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        localStorage.setItem('mini_kingdom_muted', this.isMuted.toString());
        return this.isMuted;
    }

    static playClick() {
        if (this.isMuted) return;
        const clickB64 = "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhCAAAAHy/AAAA/w==";
        const audio = new Audio(clickB64);
        audio.volume = 0.2;
        audio.play().catch(() => {});
    }

    static playCoins() {
        if (this.isMuted) return;
        const clickB64 = "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhCAAAAHy/AAAA/w==";
        const audio = new Audio(clickB64);
        audio.volume = 0.3;
        audio.play().catch(() => {});
    }

    static playVictory() {
        if (this.isMuted) return;
        const winB64 = "data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhIAAAAHy/P0BAf0A/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pw==";
        const audio = new Audio(winB64);
        audio.volume = 0.4;
        audio.play().catch(() => {});
    }
}
