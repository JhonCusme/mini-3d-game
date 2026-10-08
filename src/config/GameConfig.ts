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
        },
        walls: {
            id: 'walls',
            name: 'Murallas',
            description: 'Protegen tu aldea de los ataques de otros jugadores.',
            baseCost: 250,
            costMultiplier: 1.7,
            effectBase: 60, // wall HP per level
            effectMultiplier: 1.0
        }
    },

    // Gods: unlocked with gems, equipped for attack and/or defense in PvP
    gods: {
        tharok: {
            id: 'tharok', name: 'Tharok', title: 'Dios del Trueno', icon: '⚡', color: '#4fc3ff',
            description: 'Lanza un rayo al inicio de la batalla y aumenta el ataque.',
            unlockGems: 50, unlockTerritory: 3,
            attackBonusBase: 0.15, attackBonusPerLevel: 0.05,
            lightningBase: 40, lightningPerLevel: 25,
        },
        aurelia: {
            id: 'aurelia', name: 'Aurelia', title: 'Diosa del Sol', icon: '☀️', color: '#ffc93c',
            description: 'Sana a tus tropas: reduce las bajas en cada ronda.',
            unlockGems: 80, unlockTerritory: 5,
            healBase: 0.15, healPerLevel: 0.04,
        },
        morvath: {
            id: 'morvath', name: 'Morvath', title: 'Señor de la Tierra', icon: '⛰️', color: '#b0895a',
            description: 'Refuerza murallas y la resistencia de la guarnición. Ideal para defender.',
            unlockGems: 100, unlockTerritory: 7,
            wallBonusBase: 0.3, wallBonusPerLevel: 0.1,
            hpBonusBase: 0.1, hpBonusPerLevel: 0.03,
        },
        nyx: {
            id: 'nyx', name: 'Nyx', title: 'Diosa de la Noche', icon: '🌙', color: '#b48cff',
            description: 'Golpes críticos en las sombras: más probabilidad de doble daño.',
            unlockGems: 150, unlockTerritory: 10,
            critBase: 0.1, critPerLevel: 0.03,
        },
    },
    godMaxLevel: 10,
    godLevelUpBaseGems: 20,
    godLevelUpMultiplier: 1.6,

    // Online PvP
    pvp: {
        energyCost: 3,
        maxRounds: 6,
        lootPercent: 0.2,        // share of defender coins stolen on victory
        lootCapPerLevel: 500,    // loot cap = defender level * this
        trophiesWin: 25,
        trophiesLoss: 15,
        trophiesDefenseWin: 10,
        startingTrophies: 100,
        shieldMs: 30 * 60 * 1000, // protection after being attacked
    },

    // Troops
    troops: {
        infantry: { id: 'infantry', name: 'Bárbaro', cost: 10, power: 1, hp: 10, unlockTerritory: 0, unlockBarracksLevel: 1 },
        archers: { id: 'archers', name: 'Arquera', cost: 20, power: 3, hp: 5, unlockTerritory: 1, unlockBarracksLevel: 2 },
        knight: { id: 'knight', name: 'Caballero', cost: 35, power: 4, hp: 18, unlockTerritory: 2, unlockBarracksLevel: 2 },
        cavalry: { id: 'cavalry', name: 'Jinete', cost: 60, power: 6, hp: 22, unlockTerritory: 3, unlockBarracksLevel: 3 },
        mages: { id: 'mages', name: 'Bruja', cost: 100, power: 15, hp: 5, unlockTerritory: 5, unlockBarracksLevel: 4 },
        catapults: { id: 'catapults', name: 'Catapulta', cost: 250, power: 40, hp: 30, unlockTerritory: 7, unlockBarracksLevel: 5 },
        healers: { id: 'healers', name: 'Curandera', cost: 150, power: 2, hp: 15, unlockTerritory: 9, unlockBarracksLevel: 6 },
        skeletons: { id: 'skeletons', name: 'Esqueletos', cost: 5, power: 2, hp: 6, unlockTerritory: 0, unlockBarracksLevel: 1 }
    },

    // Quests
    quests: [
        { id: 'q_upgrade_1', title: 'Mejora tu economía', description: 'Compra 5 niveles de Mina de Oro', target: 5, rewardCoins: 100, rewardGems: 5, type: 'upgrade_economy' },
        { id: 'q_troops_1', title: 'Ejército de 50', description: 'Entrena un total de 50 tropas', target: 50, rewardCoins: 200, rewardGems: 10, type: 'total_troops' },
        { id: 'q_territory_1', title: 'Conquistador', description: 'Conquista 3 territorios', target: 3, rewardCoins: 500, rewardGems: 15, type: 'territories_won' },
        { id: 'q_chest_1', title: 'Cazatesoros', description: 'Abre 3 cofres', target: 3, rewardCoins: 300, rewardGems: 5, type: 'open_chests' },
        { id: 'q_battles_1', title: 'Veterano', description: 'Gana 10 batallas', target: 10, rewardCoins: 600, rewardGems: 10, type: 'battles_won' },
        { id: 'q_attack_1', title: 'Forja de guerra', description: 'Sube la Herrería al nivel 5', target: 5, rewardCoins: 400, rewardGems: 8, type: 'upgrade_attack' },
        { id: 'q_crit_1', title: 'Golpe certero', description: 'Sube la Arena al nivel 3', target: 3, rewardCoins: 500, rewardGems: 10, type: 'upgrade_crit' },
        { id: 'q_hero_1', title: 'Héroe legendario', description: 'Lleva a tu héroe al nivel 5', target: 5, rewardCoins: 800, rewardGems: 20, type: 'hero_level' },
        { id: 'q_territory_2', title: 'Señor de la guerra', description: 'Conquista 10 territorios', target: 10, rewardCoins: 2000, rewardGems: 30, type: 'territories_won' }
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
