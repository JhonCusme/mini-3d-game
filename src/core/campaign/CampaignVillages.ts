import type { VillageSnapshot, LayoutBuilding } from '../pvp/PvpTypes';
import type { TroopCounts, KingdomType } from '../GameState';
import { emptyTroops } from '../GameState';

export interface CampaignMissionInfo {
  index: number;
  name: string;
  subtitle: string;
  description: string;
  isBoss: boolean;
  rewardCoins: number;
  rewardExp: number;
  unlockedTroopId?: 'archers' | 'cavalry' | 'mages' | 'catapults' | 'healers';
}

export const CAMPAIGN_MISSIONS: CampaignMissionInfo[] = [
  {
    index: 0,
    name: 'Campamento Bandido',
    subtitle: 'Nivel 1 · El Despertar',
    description: 'Un campamento rebelde rudimentario. Aprende los fundamentos del combate desplegando a tus Guerreros.',
    isBoss: false,
    rewardCoins: 250,
    rewardExp: 50,
  },
  {
    index: 1,
    name: 'Puesto Fronterizo',
    subtitle: 'Nivel 2 · Ataque a Distancia',
    description: 'Una torre de arqueras defiende este puesto sobre empalizadas de madera. ¡Conquístalo para desbloquear Arqueras!',
    isBoss: false,
    rewardCoins: 500,
    rewardExp: 100,
    unlockedTroopId: 'archers',
  },
  {
    index: 2,
    name: 'Fortín del Río',
    subtitle: 'Nivel 3 · Muros de Piedra',
    description: 'Los defensores han levantado murallas de piedra labrada. Combina guerreros y arqueras para asediarlo.',
    isBoss: false,
    rewardCoins: 800,
    rewardExp: 160,
  },
  {
    index: 3,
    name: 'Bastión de los Asaltantes',
    subtitle: 'Nivel 4 · Carga Rápida',
    description: 'Cañones dobles custodian el botín. ¡Véncelos para reclutar a la veloz Caballería en tu ejército!',
    isBoss: false,
    rewardCoins: 1200,
    rewardExp: 240,
    unlockedTroopId: 'cavalry',
  },
  {
    index: 4,
    name: 'Fortaleza del Señor de la Guerra',
    subtitle: 'Nivel 5 · JEFE 1: Rey Ogro',
    description: 'Un castillo con almenas defensivas, doble cañón y arqueros de élite. Lleva a tu Héroe a la vanguardia.',
    isBoss: true,
    rewardCoins: 2500,
    rewardExp: 500,
  },
  {
    index: 5,
    name: 'Atalaya de Ceniza',
    subtitle: 'Nivel 6 · Poder Arcano',
    description: 'El enemigo utiliza defensas reforzadas con energía mágica. ¡Véncelos para desbloquear a los Magos!',
    isBoss: false,
    rewardCoins: 2200,
    rewardExp: 400,
    unlockedTroopId: 'mages',
  },
  {
    index: 6,
    name: 'Baluarte de Hierro',
    subtitle: 'Nivel 7 · Doble Compartimento',
    description: 'Muros compartimentados que obligan a tus tropas a abrirse paso entre fuegos cruzados.',
    isBoss: false,
    rewardCoins: 2800,
    rewardExp: 500,
  },
  {
    index: 7,
    name: 'Plaza Fuerte de Granito',
    subtitle: 'Nivel 8 · Asedio Pesado',
    description: 'Murallas de castillo medieval macizas. ¡Conquístala para desbloquear las destructoras Catapultas!',
    isBoss: false,
    rewardCoins: 3500,
    rewardExp: 650,
    unlockedTroopId: 'catapults',
  },
  {
    index: 8,
    name: 'Laberinto de Sombras',
    subtitle: 'Nivel 9 · Embudo Defensivo',
    description: 'Un trazado diseñado para atrapar y pulverizar a los invasores. Requiere un despliegue táctico cuidadoso.',
    isBoss: false,
    rewardCoins: 4200,
    rewardExp: 800,
  },
  {
    index: 9,
    name: 'Ciudadela del Dragón Oscuro',
    subtitle: 'Nivel 10 · JEFE 2: Fortaleza Mítica',
    description: 'Bastión imperial protegido por obsidiana y oro. ¡Al conquistarla desbloquearás a las sagradas Sanadoras!',
    isBoss: true,
    rewardCoins: 6000,
    rewardExp: 1200,
    unlockedTroopId: 'healers',
  },
  {
    index: 10,
    name: 'Paso Glacial',
    subtitle: 'Nivel 11 · Tierras Heladas',
    description: 'Territorio cubierto de escarcha donde los defensores cuentan con armaduras gélidas.',
    isBoss: false,
    rewardCoins: 5000,
    rewardExp: 900,
  },
  {
    index: 11,
    name: 'Fortaleza del Trueno',
    subtitle: 'Nivel 12 · Defensas de Élite',
    description: 'Múltiples torres de arqueras imperiales que acribillan a las tropas desde las alturas.',
    isBoss: false,
    rewardCoins: 6000,
    rewardExp: 1100,
  },
  {
    index: 12,
    name: 'Bastión Dorado',
    subtitle: 'Nivel 13 · Cámaras del Tesoro',
    description: 'Un enorme botín protegido por murallas de obsidiana y un anillo impenetrable.',
    isBoss: false,
    rewardCoins: 7500,
    rewardExp: 1300,
  },
  {
    index: 13,
    name: 'Ciudadela de las Runas',
    subtitle: 'Nivel 14 · Asedio Maestro',
    description: 'Defensas legendarias que castigan cualquier error. El Héroe y las tropas de alto nivel son indispensables.',
    isBoss: false,
    rewardCoins: 9000,
    rewardExp: 1500,
  },
  {
    index: 14,
    name: 'Corte del Rey Tirano',
    subtitle: 'Nivel 15 · JEFE 3: Gran Emperador',
    description: 'La máxima fortificación del reino enemigo. Solo los comandantes más preparados podrán reclamar la corona.',
    isBoss: true,
    rewardCoins: 15000,
    rewardExp: 2500,
  },
  {
    index: 15,
    name: 'Valle de las Sombras',
    subtitle: 'Nivel 16 · Emboscada Nocturna',
    description: 'Defensas con fuegos cruzados y torres camufladas. Mantén la formación con guerreros y arqueras coordinados.',
    isBoss: false,
    rewardCoins: 18000,
    rewardExp: 2800,
  },
  {
    index: 16,
    name: 'Muralla Carmesí',
    subtitle: 'Nivel 17 · Doble Anillo Defensivo',
    description: 'Muros de piedra ígnea y cañones triples de alto calibre. Las catapultas son cruciales para abrir brechas.',
    isBoss: false,
    rewardCoins: 21000,
    rewardExp: 3200,
  },
  {
    index: 17,
    name: 'Fortaleza Celestial',
    subtitle: 'Nivel 18 · Asedio en las Cumbres',
    description: 'Una plaza fuerte protegida por torres de arqueros imperiales y magos que bombardean desde las alturas.',
    isBoss: false,
    rewardCoins: 25000,
    rewardExp: 3800,
  },
  {
    index: 18,
    name: 'Puerta del Abismo',
    subtitle: 'Nivel 19 · Antesala de la Gran Guerra',
    description: 'La vanguardia de la guardia imperial. Murallas reforzadas con obsidiana y una guarnición de élite inquebrantable.',
    isBoss: false,
    rewardCoins: 30000,
    rewardExp: 4500,
  },
  {
    index: 19,
    name: 'El Trono del Tirano Inmortal',
    subtitle: 'Nivel 20 · JEFE FINAL: Señor Supremo',
    description: 'La máxima fortificación de todo el continente. El Rey Dragón defiende su santuario con cañones supremos y la guardia imperial completa. ¡Conquístalo para consagrar tu reinado y ascender en prestigio!',
    isBoss: true,
    rewardCoins: 45000,
    rewardExp: 6000,
  },
];

/** Creates a predetermined layout for a given campaign territory index. */
function buildCampaignLayout(index: number): LayoutBuilding[] {
  const layout: LayoutBuilding[] = [];
  const thLvl = Math.max(1, Math.min(10, Math.floor(index / 2) + 1));
  const wallLvl = Math.max(1, Math.min(10, Math.floor(index / 1.6) + 1));
  const defLvl = Math.max(1, Math.min(10, Math.floor(index / 2) + 1));

  // 1. Central Townhall
  layout.push({ type: 'townhall', level: thLvl, x: -1, z: -1 });

  // 2. Gold mines and storages
  layout.push({ type: 'goldmine', level: defLvl, x: -5, z: 2 });
  if (index >= 2) layout.push({ type: 'goldmine', level: defLvl, x: 4, z: 2 });
  if (index >= 8) layout.push({ type: 'goldstorage', level: defLvl, x: -2, z: 3 });
  if (index >= 12) layout.push({ type: 'foodstorage', level: defLvl, x: 2, z: -3 });

  // 3. Defenses according to difficulty
  if (index === 0) {
    // T1: 1 basic cannon, light timber fence
    layout.push({ type: 'cannon', level: 1, x: 2, z: -2 });
    // Light partial fence
    for (let x = -3; x <= 3; x += 2) layout.push({ type: 'wall', level: 1, x, z: 2 });
    return layout;
  }

  if (index === 1) {
    // T2: 1 Archer Tower + 1 Cannon, rectangular wooden palisade
    layout.push({ type: 'archertower', level: 1, x: -4, z: -2 });
    layout.push({ type: 'cannon', level: 1, x: 3, z: -2 });
    for (let x = -4; x <= 4; x++) {
      layout.push({ type: 'wall', level: 1, x, z: -4 });
      layout.push({ type: 'wall', level: 1, x, z: 4 });
    }
    for (let z = -3; z <= 3; z++) {
      layout.push({ type: 'wall', level: 1, x: -4, z });
      layout.push({ type: 'wall', level: 1, x: 4, z });
    }
    return layout;
  }

  // T3+: Standard fortified bases with enclosed walls and tactical defense placements
  layout.push({ type: 'cannon', level: defLvl, x: -4, z: -3 });
  layout.push({ type: 'archertower', level: defLvl, x: 3, z: -3 });

  if (index >= 3) {
    layout.push({ type: 'cannon', level: Math.max(1, defLvl - 1), x: 3, z: 3 });
  }
  if (index >= 4) {
    layout.push({ type: 'archertower', level: Math.max(1, defLvl - 1), x: -4, z: 3 });
    layout.push({ type: 'barracks', level: defLvl, x: 0, z: -5 });
  }
  if (index >= 10) {
    layout.push({ type: 'cannon', level: Math.max(1, defLvl - 1), x: 0, z: 4 });
  }
  if (index >= 13) {
    layout.push({ type: 'archertower', level: Math.max(1, defLvl - 1), x: 0, z: -4 });
  }

  // Fortress Wall Ring around Townhall & Defenses
  const r = index >= 4 ? 5 : 4;
  for (let x = -r; x <= r; x++) {
    layout.push({ type: 'wall', level: wallLvl, x, z: -r });
    layout.push({ type: 'wall', level: wallLvl, x, z: r });
  }
  for (let z = -r + 1; z <= r - 1; z++) {
    layout.push({ type: 'wall', level: wallLvl, x: -r, z });
    layout.push({ type: 'wall', level: wallLvl, x: r, z });
  }

  // Boss & High-tier territories: Inner citadel wall ring
  if (index === 4 || index === 9 || index >= 14) {
    for (let x = -2; x <= 2; x++) {
      layout.push({ type: 'wall', level: wallLvl + 1, x, z: -2 });
      layout.push({ type: 'wall', level: wallLvl + 1, x, z: 2 });
    }
  }

  // Final Boss (territory 20): outer barrier horns
  if (index === 19) {
    for (let x = -7; x <= 7; x += 2) {
      layout.push({ type: 'wall', level: wallLvl, x, z: -7 });
      layout.push({ type: 'wall', level: wallLvl, x, z: 7 });
    }
  }

  return layout;
}

/** Builds the full predetermined campaign VillageSnapshot for a given territory index. */
export function createCampaignVillage(index: number): VillageSnapshot {
  const mission = CAMPAIGN_MISSIONS[index] || {
    index,
    name: `Territorio ${index + 1}`,
    subtitle: `Campaña Militar ${index + 1}`,
    description: 'Campamento enemigo fortificado.',
    isBoss: (index + 1) % 5 === 0,
    rewardCoins: 500 * (index + 1),
    rewardExp: 100 * (index + 1),
  };

  const kingdom: KingdomType = index % 3 === 0 ? 'emerald' : index % 3 === 1 ? 'golden' : 'frost';
  const layout = buildCampaignLayout(index);

  const garrison: TroopCounts = emptyTroops();
  garrison.infantry = 3 + index * 2;
  if (index >= 1) garrison.archers = 2 + index;
  if (index >= 3) garrison.cavalry = 1 + Math.floor(index / 2);
  if (index >= 5) garrison.mages = 1 + Math.floor(index / 3);
  if (index >= 7) garrison.catapults = 1 + Math.floor((index - 6) / 2);
  if (index >= 9) garrison.healers = 1 + Math.floor((index - 8) / 2);

  return {
    playerId: `campaign_t_${index}`,
    name: mission.name,
    avatar: mission.isBoss ? 'warrior' : 'rogue',
    kingdom,
    level: index + 1,
    heroLevel: Math.max(1, Math.floor(index / 2)),
    trophies: 0,
    garrison,
    defenseGod: index >= 4 ? (index % 2 === 0 ? 'morvath' : 'tharok') : null,
    defenseGodLevel: Math.max(1, Math.floor(index / 3)),
    wallsLevel: Math.max(1, Math.floor(index / 1.6)),
    armorLevel: Math.floor(index / 2),
    attackLevel: Math.floor(index / 2),
    lootableCoins: mission.rewardCoins,
    shieldUntil: 0,
    updatedAt: Date.now(),
    isBot: true,
    isSystemVillage: true,
    layout,
  };
}
