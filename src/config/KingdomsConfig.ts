import type { KingdomType } from '../core/GameState';

export interface KingdomAttribute {
    title: string;
    description: string;
    icon: string;
    highlight: string;
}

export interface KingdomVisualTheme {
    skyColor: string;
    fogColor: string;
    fogNear: number;
    fogFar: number;
    groundColor: string;
    plotColor: string;
    gridColor: string;
    wallColor: string;
    hemisphereSky: string;
    hemisphereGround: string;
    lightIntensity: number;
    lightColor: string;
    weatherType: 'snow' | 'sand' | 'leaves';
    mountainStyle: 'ice' | 'desert' | 'forest';
}

export interface KingdomInfo {
    id: KingdomType;
    name: string;
    subtitle: string;
    icon: string;
    description: string;
    attributes: KingdomAttribute[];
    bonuses: {
        wallHpMultiplier: number;
        defenseHpMultiplier: number;
        enemySlowMultiplier: number;
        goldProductionMultiplier: number;
        goldCapacityMultiplier: number;
        lootBonusMultiplier: number;
        builderSpeedMultiplier: number;
        energyRegenMultiplier: number;
        troopSpeedMultiplier: number;
    };
    visual: KingdomVisualTheme;
}

export const KINGDOMS_CONFIG: Record<KingdomType, KingdomInfo> = {
    frost: {
        id: 'frost',
        name: 'Montaña de Hielo',
        subtitle: 'Fuerza y Resistencia Glacial',
        icon: '🏔️',
        description: 'Un bastión congelado entre imponentes cumbres nevadas y ventiscas eternas.',
        attributes: [
            {
                title: 'Murallas de Hielo Eterno',
                description: 'Tus murallas y defensas tienen mayor durabilidad ante los asaltos.',
                icon: '🛡️',
                highlight: '+25% HP a murallas y defensas'
            },
            {
                title: 'Aura Helada de la Cumbre',
                description: 'El frío extremo desgasta y ralentiza a las tropas enemigas que intenten invadir tu aldea.',
                icon: '❄️',
                highlight: '-15% velocidad a invasores'
            }
        ],
        bonuses: {
            wallHpMultiplier: 1.25,
            defenseHpMultiplier: 1.20,
            enemySlowMultiplier: 0.85,
            goldProductionMultiplier: 1.0,
            goldCapacityMultiplier: 1.0,
            lootBonusMultiplier: 1.0,
            builderSpeedMultiplier: 1.0,
            energyRegenMultiplier: 1.0,
            troopSpeedMultiplier: 1.0,
        },
        visual: {
            skyColor: '#bfe3fa',
            fogColor: '#d6ecfa',
            fogNear: 50,
            fogFar: 115,
            groundColor: '#dceefc',
            plotColor: '#eef7fd',
            gridColor: '#8ec5ed',
            wallColor: '#82b1d0',
            hemisphereSky: '#e8f4fc',
            hemisphereGround: '#88aebb',
            lightIntensity: 1.7,
            lightColor: '#f0f8ff',
            weatherType: 'snow',
            mountainStyle: 'ice',
        }
    },

    golden: {
        id: 'golden',
        name: 'Desierto Dorado',
        subtitle: 'Riqueza y Poder Mercante',
        icon: '🏜️',
        description: 'Un próspero oasis rodeado de interminables dunas doradas, monolitos ancestrales y tesoros.',
        attributes: [
            {
                title: 'Fiebre del Oro',
                description: 'Tus minas de oro extraen riquezas con mayor rapidez y disponen de mayor capacidad.',
                icon: '🪙',
                highlight: '+30% producción y capacidad de oro'
            },
            {
                title: 'Botín del Sultán',
                description: 'Obtienes un botín de oro adicional tras cada victoria en multijugador y campaña.',
                icon: '💰',
                highlight: '+20% oro extra al saquear'
            }
        ],
        bonuses: {
            wallHpMultiplier: 1.0,
            defenseHpMultiplier: 1.0,
            enemySlowMultiplier: 1.0,
            goldProductionMultiplier: 1.30,
            goldCapacityMultiplier: 1.30,
            lootBonusMultiplier: 1.20,
            builderSpeedMultiplier: 1.0,
            energyRegenMultiplier: 1.0,
            troopSpeedMultiplier: 1.0,
        },
        visual: {
            skyColor: '#fedca0',
            fogColor: '#f7d394',
            fogNear: 50,
            fogFar: 110,
            groundColor: '#d9a24c',
            plotColor: '#e8b868',
            gridColor: '#ffd778',
            wallColor: '#b8860b',
            hemisphereSky: '#ffe6b3',
            hemisphereGround: '#8b5a1b',
            lightIntensity: 1.8,
            lightColor: '#fff5db',
            weatherType: 'sand',
            mountainStyle: 'desert',
        }
    },

    emerald: {
        id: 'emerald',
        name: 'Bosque Esmeralda',
        subtitle: 'Bendición de la Naturaleza',
        icon: '🌲',
        description: 'Un santuario viviente de robles colosales, valles fértiles y magia druídica.',
        attributes: [
            {
                title: 'Vigor de los Constructores',
                description: 'La bendición forestal permite a tus artesanos terminar las mejoras en menos tiempo.',
                icon: '⚡',
                highlight: '20% menos tiempo de construcción'
            },
            {
                title: 'Regeneración Vital',
                description: 'Tu energía para combatir se regenera más rápido y tus tropas marchan con mayor agilidad.',
                icon: '🌿',
                highlight: '+30% velocidad de energía y +10% marcha'
            }
        ],
        bonuses: {
            wallHpMultiplier: 1.0,
            defenseHpMultiplier: 1.0,
            enemySlowMultiplier: 1.0,
            goldProductionMultiplier: 1.0,
            goldCapacityMultiplier: 1.0,
            lootBonusMultiplier: 1.0,
            builderSpeedMultiplier: 1.25, // 20% reduction = 1.25x speed
            energyRegenMultiplier: 1.30,
            troopSpeedMultiplier: 1.10,
        },
        visual: {
            skyColor: '#9fd8ff',
            fogColor: '#bce4ff',
            fogNear: 55,
            fogFar: 115,
            groundColor: '#3c7a28',
            plotColor: '#58a83a',
            gridColor: '#ffffff',
            wallColor: '#9a958c',
            hemisphereSky: '#dff2ff',
            hemisphereGround: '#3e632b',
            lightIntensity: 1.6,
            lightColor: '#ffffff',
            weatherType: 'leaves',
            mountainStyle: 'forest',
        }
    }
};

export function getKingdomConfig(id?: KingdomType | null): KingdomInfo {
    if (id && KINGDOMS_CONFIG[id]) return KINGDOMS_CONFIG[id];
    return KINGDOMS_CONFIG.emerald;
}
