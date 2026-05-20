# dev sync — lessons-learned 3-way block conflict 自律解消記録 (2026-05-19)

`feat/issue-762-cf-oidc-staging-proof-prod-cutover-spec` への `dev` 取り込み中、`aiworkflow-requirements` skill の lessons-learned で発生した 3-way block conflict を `task-specification-creator` skill 配下でも同一方針で扱うため並列記録する。

## 適用ルール
- 並走追記による section-level conflict は **両ブロックを順序保持で連結** する（L-DEVSYNC-012 と一致）。
- `pnpm sync:resolve` の WARN unhandled に `task-specification-creator/lessons-learned/*` が出た場合も同じ手順:
  1. HEAD ブロックと dev ブロックを順番に保持
  2. 境界マーカー 3 行（`<<<<<<<` / `|||||||` / `=======` / `>>>>>>>`）を物理除去
  3. `pnpm indexes:rebuild` で派生 index を更新
  4. `git add` → merge commit
- 機械的に union するのは危険な「同一 ID への両側上書き」型衝突に限り manual 解消とする（今回は該当なし）。

## 派生影響
- Phase 12 テンプレート: artifacts.json `metadata.gates` 不変条件（aiworkflow-requirements L-DEVSYNC-018）は task-specification-creator の Phase 12 でも spec_created 段階で gates 配列を必ず生成する正本ルールとして引き続き有効。
- Phase 11 evidence existence validator（issue-730 系）も本 sync で dev 由来 changelog を取り込み済み。

## 参照
- 並列 changelog: `.claude/skills/aiworkflow-requirements/changelog/20260519-dev-sync-lessons-learned-three-way-block-resolution.md`
- 基底ルール: `lessons-learned/dev-sync-merge-conflict-resolution.md` の L-DEVSYNC-012
