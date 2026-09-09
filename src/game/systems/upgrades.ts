import { GAME_BALANCE, STEEL_TEMPEST_BALANCE } from '../config';
import type { CombatStats, UpgradeDefinition, UpgradeId } from '../types';

export const UPGRADES: readonly UpgradeDefinition[] = [
  { id: 'rapid-fire', name: '连发核心', description: '缩短攻击间隔', maxRank: 5 },
  { id: 'power-shot', name: '强击棱镜', description: '提高每次普攻基础伤害', maxRank: 5 },
  { id: 'multishot', name: '分裂回路', description: '增加扇形投射物数量', maxRank: 4 },
  { id: 'swift-projectiles', name: '超导弹道', description: '提高投射物飞行速度', maxRank: 5 },
  { id: 'quickstep', name: '相位步伐', description: '提高移动速度', maxRank: 5 },
  { id: 'vital-core', name: '生命核心', description: '提高生命上限，恢复 25 生命', maxRank: 5 },
  { id: 'piercing-shot', name: '穿透弹', description: '命中后继续飞行，同一敌人只命中一次', maxRank: 3 },
  { id: 'orbit-blades', name: '环绕飞刃', description: '近身环绕攻击，每次造成 15 伤害', maxRank: 3 },
  { id: 'steel-tempest', name: '斩钢闪', description: '切换普攻，每三次释放旋风', maxRank: 1 },
  { id: 'tempest-range', name: '风暴半径', description: '提高斩钢闪距离', maxRank: 4, requires: 'steel-tempest' },
  { id: 'tempest-force', name: '风暴锋压', description: '斩钢闪与旋风额外伤害', maxRank: 5, requires: 'steel-tempest' },
  { id: 'tornado-pierce', name: '旋风贯穿', description: '旋风可命中更多敌人', maxRank: 3, requires: 'steel-tempest' },
  { id: 'gale-lift', name: '升空气流', description: '延长旋风击飞时间', maxRank: 3, requires: 'steel-tempest' },
];

export type UpgradeRanks = Partial<Record<UpgradeId, number>>;

function compound(base: number, multiplier: number, rank: number): number {
  for (let index = 0; index < rank; index += 1) base = Math.round(base * multiplier);
  return base;
}

export function isEligibleUpgrade(definition: UpgradeDefinition, ranks: UpgradeRanks): boolean {
  return definition.requires === undefined || (ranks[definition.requires] ?? 0) > 0;
}

export function statsFor(ranks: UpgradeRanks): CombatStats {
  const tornadoPierceCount = STEEL_TEMPEST_BALANCE.tornadoPierceCount
    + (ranks['tornado-pierce'] ?? 0)
    + (ranks['piercing-shot'] ?? 0);

  return {
    primaryAttack: (ranks['steel-tempest'] ?? 0) > 0 ? 'steel-tempest' : 'projectile',
    moveSpeed: compound(GAME_BALANCE.playerSpeed, 1.12, ranks.quickstep ?? 0),
    attackIntervalMs: compound(GAME_BALANCE.playerAttackIntervalMs, 0.88, ranks['rapid-fire'] ?? 0),
    projectileDamage: GAME_BALANCE.projectileDamage + 10 * (ranks['power-shot'] ?? 0),
    projectileSpeed: compound(GAME_BALANCE.projectileSpeed, 1.16, ranks['swift-projectiles'] ?? 0),
    projectileCount: 1 + (ranks.multishot ?? 0),
    maxHealth: GAME_BALANCE.playerHealth + 25 * (ranks['vital-core'] ?? 0),
    pierceCount: ranks['piercing-shot'] ?? 0,
    bladeCount: ranks['orbit-blades'] ?? 0,
    slashLength: STEEL_TEMPEST_BALANCE.slashLength + 60 * (ranks['tempest-range'] ?? 0),
    steelTempestBonusDamage: 10 * (ranks['tempest-force'] ?? 0),
    tornadoPierceCount,
    airborneDurationMs: STEEL_TEMPEST_BALANCE.airborneDurationMs + 150 * (ranks['gale-lift'] ?? 0),
  };
}

export function previewUpgrade(id: UpgradeId, ranks: UpgradeRanks): string {
  const before = statsFor(ranks);
  const after = statsFor({ ...ranks, [id]: (ranks[id] ?? 0) + 1 });
  if (id === 'steel-tempest') {
    return '普攻 → 斩钢闪';
  }

  const fields: Record<UpgradeId, [keyof CombatStats, string, string]> = {
    'rapid-fire': ['attackIntervalMs', '攻击间隔', 'ms'],
    'power-shot': ['projectileDamage', '普攻伤害', ''],
    multishot: ['projectileCount', '投射物', '枚'],
    'swift-projectiles': ['projectileSpeed', '弹速', 'px/s'],
    quickstep: ['moveSpeed', '移速', 'px/s'],
    'vital-core': ['maxHealth', '生命上限', ''],
    'piercing-shot': ['pierceCount', '额外穿透', '个'],
    'orbit-blades': ['bladeCount', '飞刃数量', '把'],
    'steel-tempest': ['primaryAttack', '普攻形态', ''],
    'tempest-range': ['slashLength', '斩击距离', 'px'],
    'tempest-force': ['steelTempestBonusDamage', '风暴加伤', ''],
    'tornado-pierce': ['tornadoPierceCount', '旋风目标', '个'],
    'gale-lift': ['airborneDurationMs', '击飞停滞', 'ms'],
  };
  const [field, label, unit] = fields[id];
  return `${label} ${before[field]} → ${after[field]}${unit}`;
}
