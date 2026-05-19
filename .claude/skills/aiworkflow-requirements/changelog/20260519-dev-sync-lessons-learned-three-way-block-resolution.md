# dev sync — lessons-learned 3-way block conflict 自律解消記録 (2026-05-19)

`feat/issue-762-cf-oidc-staging-proof-prod-cutover-spec` に `origin/dev` を取り込んだ際、`lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` で HEAD/base/dev の 3-way conflict が発生し、`pnpm sync:resolve` の unhandled リストに残った。

## 発生 conflict
- `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md`
  - HEAD 側: L-DEVSYNC-016（actionlint glob 収束）/ L-DEVSYNC-017（version table 両側 row 保持）を追加
  - dev 側: L-DEVSYNC-018（新規 task root/outputs artifacts.json に `metadata.gates` を生成時付与）を追加
  - base (`d271420f`): いずれも未追加
- `pnpm sync:resolve` は `lessons-learned/*` を union driver 対象外として WARN で残置

## 解消経路
1. `git merge dev --no-edit` → 上記 1 ファイルで CONFLICT（3-way diff block）
2. L-DEVSYNC-012「追記型 conflict は両側採用」ルールを適用し、HEAD ブロック（L-DEVSYNC-016/017）と dev ブロック（L-DEVSYNC-018）を連結して全 lesson を保持
3. base マーカー（`||||||| d271420f`）と境界マーカー（`<<<<<<<` / `=======` / `>>>>>>> dev`）を除去
4. `pnpm indexes:rebuild` で `indexes/topic-map.md` / `indexes/keywords.json` を再生成
5. `git add -A` → `git commit -m "merge: sync feat/issue-762-... with dev"`

## 再確認した不変
- `pnpm sync:resolve` の `WARN unhandled conflict` は **lessons-learned/*** および同種の「セクション単位 append-only」ファイルで発生し続ける（resolver の対象を広げると semantic 競合を機械的に上書きするリスクがあるため意図的に外している）。
- 解消方針は L-DEVSYNC-012 で確立済み: **両ブロックを順序保持で連結 → 境界 3 行（`<<<<<<<` / `|||||||` / `=======` / `>>>>>>>`）の物理除去**。
- 連結後は `pnpm indexes:rebuild` で派生 JSON / topic-map を再生成し、`verify-indexes-up-to-date` 相当の drift を残さない。

## 適用先
- このスキル: 既存 L-DEVSYNC-012 で十分カバーされており、追加 lesson は不要。本 changelog は適用例として残す。
- `task-specification-creator` skill: 同パターンが `task-specification-creator/lessons-learned/dev-sync-merge-conflict-resolution.md` でも発生し得るため、並列 changelog を追加（参照: `20260519-dev-sync-lessons-learned-three-way-block-resolution.md`）。
