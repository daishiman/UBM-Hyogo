# Phase 9: リリース戦略

[実装区分: 実装仕様書]

## 1. ブランチ・PR
- 作業ブランチ: `fix/runtime-smoke-admin-members-500`（本タスクで作成済）
- base: `dev`
- production 反映は `dev → main` の通常リリースサイクルに乗せる（本 PR では `dev` のみ）

## 2. 段階
1. PR open → backend-ci all green を待つ
2. staging で smoke 1 回手動再実行（Phase 8）
3. merge to dev
4. 次回 `dev → main` PR で production 反映（本タスクではここまで含めない）

## 3. rollback
- 影響範囲は `apps/api`（Workers）のみ
```bash
bash scripts/cf.sh rollback <PREV_VERSION_ID> --config apps/api/wrangler.toml --env staging
```
- D1 migration を apply した場合は逆方向 migration を別 PR で用意（破壊的 migration は本タスクでは原則行わない）

## 4. Phase 9 DoD
- リリース順序とロールバック手順が文書化
- production 影響は別 PR と明記
