import type { TroopId } from '../core/GameState';

export const TROOP_ICONS: Record<TroopId, string> = {
  infantry: '🗡️',
  archers: '🏹',
  cavalry: '🐴',
  mages: '🧙',
  catapults: '💣',
  healers: '💚',
};

export const AVATAR_IMAGES: Record<string, string> = {
  warrior: '/assets/heroes/warrior.jpg',
  mage: '/assets/heroes/mage.jpg',
  archer: '/assets/heroes/archer.jpg',
  paladin: '/assets/heroes/paladin.jpg',
  rogue: '/assets/heroes/rogue.jpg',
  druid: '/assets/heroes/druid.jpg',
};
