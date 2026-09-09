# Task 4 Report

## Implemented

- Added `steel-tempest`, `tempest-range`, `tempest-force`, `tornado-pierce`, and `gale-lift` upgrade IDs, ranks, eligibility gating, stats, and concise Chinese previews.
- Added random reward filtering by `requires` and max rank; `斩钢闪` unlocks its dedicated reward pool.
- Wired `GameScene` primary pattern switching through `stats.primaryAttack`, preserving Steel Tempest stacks on ordinary stat upgrades.
- Suppressed airborne enemy movement and contact damage; clears statuses before enemy destruction and on game over, shutdown, and attack replacement.
- Fixed airborne visuals with Graphics command-buffer lift/rotation and guarded redraw after Phaser shutdown destroys Graphics.
- Updated tornado rendering to animated asymmetric cyan/white/yellow wind strokes while retaining collision radius.
- Updated HUD primary slot label/icon for `斩钢闪` and README product copy.
- Updated unit coverage for reward gating, Steel Tempest stats/previews, total max ranks, and Graphics mock methods.

## Verification

- `npm test`: PASS, 10 files / 40 tests.
- `npm run build`: PASS; Vite emitted the existing large chunk warning.

## Notes

- Browser QA and separate visual harness are controller-owned. `tests/browser/logic.js` was touched earlier in this task but is not required for the production/unit verification recorded here.
