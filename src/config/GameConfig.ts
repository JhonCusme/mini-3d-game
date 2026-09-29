export const GameConfig = {
    // Economy
    startingCoins: 100,
    startingGems: 10,
    maxEnergy: 50,
    energyCostPerBattle: 10,
    energyRegenRate: 1,
    energyRegenTickMs: 60000,
    coinsPerTick: 1, // base generation
    tickRateMs: 1000, // 1 second

    // Hero config
    heroPowerMultiplierPerLevel: 0.1, // +10% power per level
    heroBaseUpgradeCostGems: 10,

    // Upgrades
    upgrades: {
        economy: {
            id: 'economy',
            name: 'Gold Mine',
            description: 'Increases automatic coin generation.',
            baseCost: 50,
            costMultiplier: 1.5,
            effectBase: 1,
            effectMultiplier: 1.2
        },
        troopCapacity: {
            id: 'troopCapacity',
            name: 'Barracks',
            description: 'Increases the maximum number of troops you can train.',
            baseCost: 100,
            costMultiplier: 1.6,
            effectBase: 10,
            effectMultiplier: 1.5
        },
        attackPower: {
            id: 'attackPower',
            name: 'Blacksmith',
            description: 'Increases the base attack power of all troops.',
            baseCost: 150,
            costMultiplier: 1.8,
            effectBase: 5,
            effectMultiplier: 1.3
        },
        troopHealth: {
            id: 'troopHealth',
            name: 'Armor Reserve',
            description: 'Increases the survival rate of troops in battle.',
            baseCost: 200,
            costMultiplier: 1.7,
            effectBase: 2,
            effectMultiplier: 1.2
        },
        critRate: {
            id: 'critRate',
            name: 'Training Grounds',
            description: 'Increases the chance of dealing double damage in battles.',
            baseCost: 300,
            costMultiplier: 2.0,
            effectBase: 1, // 1% per level
            effectMultiplier: 1.0
        }
    },

    // Troops
    troops: {
        infantry: { id: 'infantry', name: 'Infantry', cost: 10, power: 1, hp: 10 },
        archers: { id: 'archers', name: 'Archers', cost: 20, power: 3, hp: 5 },
        cavalry: { id: 'cavalry', name: 'Cavalry', cost: 50, power: 5, hp: 20 },
        mages: { id: 'mages', name: 'Mages', cost: 100, power: 15, hp: 5 },
        catapults: { id: 'catapults', name: 'Catapults', cost: 250, power: 40, hp: 30 },
        healers: { id: 'healers', name: 'Healers', cost: 150, power: 2, hp: 15 }
    },

    // Quests
    quests: [
        { id: 'q_upgrade_1', title: 'Mejora tu economía', description: 'Compra 5 niveles de Mina de Oro', target: 5, rewardCoins: 100, rewardGems: 5, type: 'upgrade_economy' },
        { id: 'q_troops_1', title: 'Ejército de 50', description: 'Entrena un total de 50 tropas', target: 50, rewardCoins: 200, rewardGems: 10, type: 'total_troops' },
        { id: 'q_territory_1', title: 'Conquistador', description: 'Conquista 3 territorios', target: 3, rewardCoins: 500, rewardGems: 15, type: 'territories_won' },
        { id: 'q_chest_1', title: 'Cazatesoros', description: 'Abre 3 cofres', target: 3, rewardCoins: 300, rewardGems: 5, type: 'open_chests' }
    ],

    // Territories
    territories: Array.from({ length: 20 }, (_, i) => {
        const isBoss = (i + 1) % 5 === 0;
        let bossTrait: 'magic_shield' | 'dragon_fire' | 'thick_armor' | undefined;
        
        if (isBoss) {
            if (i === 4) bossTrait = 'thick_armor';
            else if (i === 9) bossTrait = 'magic_shield';
            else if (i === 14) bossTrait = 'dragon_fire';
            else if (i === 19) bossTrait = 'dragon_fire'; // Final boss
        }

        return {
            id: `t_${i}`,
            level: i + 1,
            name: isBoss ? `Boss Territory ${i + 1}` : `Territory ${i + 1}`,
            enemyPower: 10 * Math.pow(1.5, i),
            energyCost: isBoss ? 3 : 1,
            rewardCoins: 100 * (i + 1),
            rewardExp: 50 * (i + 1),
            isBoss,
            bossTrait
        };
    })
};
