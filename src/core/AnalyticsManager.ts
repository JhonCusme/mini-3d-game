export class AnalyticsManager {
    private static logEvent(eventName: string, params: Record<string, any> = {}) {
        // Here we mock the Firebase Analytics or custom telemetry call
        // E.g., FirebaseAnalytics.logEvent({ name: eventName, params })
        console.log(`[ANALYTICS] Event: ${eventName}`, params);
    }

    static trackFirstOpen() {
        this.logEvent('first_open');
    }

    static trackSessionStart() {
        this.logEvent('session_start', { timestamp: Date.now() });
    }

    static trackSessionEnd(durationSeconds: number) {
        this.logEvent('session_end', { duration: durationSeconds });
    }

    static trackTutorialComplete() {
        this.logEvent('tutorial_complete');
    }

    static trackBattle(type: 'start' | 'win' | 'loss', territoryId: string, playerPower: number, enemyPower: number) {
        this.logEvent(`battle_${type}`, { territory: territoryId, playerPower, enemyPower });
    }

    static trackTerritoryUnlocked(territoryId: string) {
        this.logEvent('territory_unlocked', { territory: territoryId });
    }

    static trackUpgradePurchase(upgradeId: string, level: number) {
        this.logEvent('upgrade_purchase', { upgrade: upgradeId, level });
    }

    static trackAd(type: 'started' | 'completed', rewardType: string) {
        this.logEvent(`rewarded_ad_${type}`, { reward: rewardType });
    }

    static trackIAP(type: 'started' | 'completed', packageId: string) {
        this.logEvent(`iap_${type}`, { package: packageId });
    }

    static trackDailyRewardClaimed() {
        this.logEvent('daily_reward_claimed');
    }
}
