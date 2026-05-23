[実装区分: 実装仕様書]

# System spec update summary

## Step 1: 実ファイル更新

| ファイル | 更新内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | § Schema Alias Resolution Contract に **Static guard** セクション追加。`scripts/lint-stable-key-update.mjs` の検出パターン / 例外 / CI gate / pre-commit / 詳細仕様 path を記載 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | current workflow root / implemented files / origin unassigned consumed trace を登録 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | direct update guard の即時参照行を current workflow へ更新 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | `implemented_local_runtime_pending` active workflow として登録 |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-300-direct-stable-key-update-guard-artifact-inventory.md` | artifact inventory 新規作成 |
| `.claude/skills/aiworkflow-requirements/changelog/20260515-issue-300-direct-stable-key-update-guard.md` | changelog 新規作成 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | 最新更新ヘッドラインに追記 |

## Step 2: 判定

- `database-implementation-core.md` への追記が必要（Step 2 「N/A」ではない）
- completed-tasks への移動は Phase 13 PR merge 後に行う
- specs/ 個別 path 更新なし（reference 更新のみ）

## canonical / mirror policy

- canonical: `.claude/skills/aiworkflow-requirements/`
- mirror: `.agents/skills/aiworkflow-requirements/`
- 確認: `diff -qr .claude/skills/aiworkflow-requirements .agents/skills/aiworkflow-requirements 2>/dev/null || echo "mirror absent (N/A)"`

## artifacts 同期

- `artifacts.json` Phase status / outputs list: 4 点同期（root / outputs / index.md / phase-*.md）
- `outputs/artifacts.json` は root `artifacts.json` の full mirror

## Phase 11 evidence

- NON_VISUAL local evidence: typecheck / lint / focused test / build-direct / grep-gate + `manual-smoke-log.md` + `link-checklist.md`
- `pnpm build` wrapper は 1Password authorization timeout のため `build.log` に境界記録し、wrapper-free `pnpm -r build` を `build-direct.log` に保存

## 状態語彙

`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（local 実装 + CI runtime pending）
