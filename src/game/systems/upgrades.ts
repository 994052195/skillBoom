import { GAME_BALANCE } from '../config';
import type { CombatStats, UpgradeDefinition, UpgradeId } from '../types';

export const UPGRADES: readonly UpgradeDefinition[] = [
  { id: 'rapid-fire', name: '连发核心', description: '缩短攻击间隔', maxRank: 5 },
  { id: 'power-shot', name: '强击棱镜', description: '提高每枚投射物伤害', maxRank: 5 },
  { id: 'multishot', name: '分裂回路', description: '增加扇形投射物数量', maxRank: 4 },
  { id: 'swift-projectiles', name: '超导弹道', description: '提高投射物飞行速度', maxRank: 5 },
  { id: 'quickstep', name: '相位步伐', description: '提高移动速度', maxRank: 5 },
  { id: 'vital-core', name: '生命核心', description: '提高生命上限，恢复 25 生命', maxRank: 5 },
  { id: 'piercing-shot', name: '穿透弹', description: '命中后继续飞行，同一敌人只命中一次', maxRank: 3 },
  { id: 'orbit-blades', name: '环绕飞刃', description: '近身环绕攻击，每次造成 15 伤害', maxRank: 3 },
];

export type UpgradeRanks = Partial<Record<UpgradeId, number>>;

function compound(base: number, multiplier: number, rank: number): number {
  for (let index = 0; index < rank; index += 1) base = Math.round(base * multiplier);
  return base;
}

export function statsFor(ranks: UpgradeRanks): CombatStats {
  return {
    moveSpeed: compound(GAME_BALANCE.playerSpeed, 1.12, ranks.quickstep ?? 0),
    attackIntervalMs: compound(GAME_BALANCE.playerAttackIntervalMs, 0.88, ranks['rapid-fire'] ?? 0),
    projectileDamage: GAME_BALANCE.projectileDamage + 10 * (ranks['power-shot'] ?? 0),
    projectileSpeed: compound(GAME_BALANCE.projectileSpeed, 1.16, ranks['swift-projectiles'] ?? 0),
    projectileCount: 1 + (ranks.multishot ?? 0),
    maxHealth: GAME_BALANCE.playerHealth + 25 * (ranks['vital-core'] ?? 0),
    pierceCount: ranks['piercing-shot'] ?? 0,
    bladeCount: ranks['orbit-blades'] ?? 0,
  };
}

export function previewUpgrade(id: UpgradeId, ranks: UpgradeRanks): string {
  const before = statsFor(ranks);
  const after = statsFor({ ...ranks, [id]: (ranks[id] ?? 0) + 1 });
  const fields: Record<UpgradeId, [keyof CombatStats, string, string]> = {
    'rapid-fire': ['attackIntervalMs', '攻击间隔', 'ms'],
    'power-shot': ['projectileDamage', '伤害', ''],
    multishot: ['projectileCount', '投射物', '枚'],
    'swift-projectiles': ['projectileSpeed', '弹速', 'px/s'],
    quickstep: ['moveSpeed', '移速', 'px/s'],
    'vital-core': ['maxHealth', '生命上限', ''],
    'piercing-shot': ['pierceCount', '额外穿透', '个'],
    'orbit-blades': ['bladeCount', '飞刃数量', '把'],
  };
  const [field, label, unit] = fields[id];
  return `${label} ${before[field]} → ${after[field]}${unit}`;
}
