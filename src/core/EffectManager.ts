import confetti from 'canvas-confetti';

export class EffectManager {
    static fireVictoryConfetti() {
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#FFD700', '#FFA500', '#FFFFFF']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#FFD700', '#FFA500', '#FFFFFF']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    }

    static fireCrit() {
        confetti({
            particleCount: 60,
            spread: 360,
            startVelocity: 35,
            origin: { x: 0.5, y: 0.4 },
            colors: ['#FF4757', '#FFA502', '#FFFFFF'],
            shapes: ['star']
        });
    }

    static fireChestLoot() {
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#00FFFF', '#FF00FF']
        });
    }

    static fireHeroUpgrade() {
        confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.3 },
            colors: ['#00FF00', '#FFFFFF', '#FFFF00']
        });
    }
}
