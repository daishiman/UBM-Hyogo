# Lessons learned — Issue #589 gate metadata structured ledger（2026-05-10）

## Scope

Captures the non-obvious judgement calls and workarounds that surfaced while turning `artifacts.json.metadata.gates[]` into a mechanical contract. Companion to:

- workflow root: `docs/30-workflows/completed-tasks/issue-589-gate-metadata-structured-ledger/`
- SSOT: `.claude/skills/aiworkflow-requirements/references/gate-metadata.md`
- changelog: `.claude/skills/aiworkflow-requirements/changelog/20260510-issue589-gate-metadata-structured-ledger.md`

## L-589-001 — workflow_state vocabulary: `implemented_local_runtime_pending`

| Item | Value |
| --- | --- |
| 苦戦点 | `spec_created` でも `implemented_local` でも実体と乖離した。schema / validator / CI workflow file / Issue #549 backfill / Phase 12 strict 7 outputs が local 完了しているのに、runtime promotion（`required_status_checks` への追加）は user approval ゲートで未実行という中間状態の表現が必要だった。 |
| 採用判断 | `task-specification-creator/references/workflow-state-vocabulary.md` の語彙に従い `implemented_local_runtime_pending / implementation / NON_VISUAL` を採用。`_runtime_pending` サフィックスで「local 実装は完了、runtime promotion のみ user-gated」を明示する。 |
| 適用範囲 | task-workflow-active / quick-reference / resource-map / LOGS / SSOT / changelog すべて同一 wave で同一文字列を使う。drift があれば topic-map から検索可能。 |
| 再利用基準 | 「branch protection / production secret PUT / production deploy のみが user-gated で、local artefact / CI workflow file は完了している」タスクは同じ語彙を使って良い。 |

## L-589-002 — historical compatibility vs. forward enforcement の二重モード

| Item | Value |
| --- | --- |
| 苦戦点 | 既存の `artifacts.json` は `metadata.gates[]` を持たない。一斉に必須化すると過去の completed-tasks がすべて FAIL する。逆に WARN 一律にすると新規 / 変更 PR で必須化の効果が出ない。 |
| 採用判断 | `scripts/gate-metadata/validate.ts` を二重モードで実装した: (a) 引数なしでは `metadata.gates` 不在を WARN/skip → exit 0、(b) `--require-gates-for-changed <changed-artifacts.json...>` を CI workflow が `git diff --name-only origin/${{ github.base_ref }}...HEAD -- '**/artifacts.json'` の結果と共に渡す → 変更パスのみ ERROR 化。 |
| 適用範囲 | `.github/workflows/verify-gate-metadata.yml` の job が PR 差分でのみ厳格モードを有効化する。`pnpm gate-metadata:validate` の素呼び出しは互換モード。 |
| 再利用基準 | 既存資産が大量にある状態で新しい artifact 必須化を進める場合、まず WARN/skip でロールアウトし、`--require-..-for-changed` 系オプションで段階的に必須化する。historical 一括 sweep は別 backlog。 |

## L-589-003 — `approver` の `CODEOWNERS:<group>` 形式

| Item | Value |
| --- | --- |
| 苦戦点 | gate の approver を GitHub username に絞ると、codeowner-bound のゲート（例: `.github/CODEOWNERS` の path-scoped owner グループ）が表現できない。逆に自由文字列にすると spoof 防止ができない。 |
| 採用判断 | `packages/shared/src/gate-metadata/schema.ts` で approver を `^(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\|CODEOWNERS:[A-Za-z0-9._/-]+)$` 系の正規表現で受ける。GitHub username（hyphen 内側のみ）と `CODEOWNERS:<path-or-group>` の二択に限定。 |
| 適用範囲 | Issue #549 backfill の Gate-D 行で `CODEOWNERS:apps/api` 形式を使い、validator が parse する。 |
| 再利用基準 | 「approver を機械検証したいが個人 username に縛りたくない」場合は同じ二択 schema を採用。新たなプリンシパル形式を増やす場合は schema 拡張時に validator + lessons-learned を同期更新する。 |

## Cross-references

- `references/gate-metadata.md` — gate entry / validator contract の正本
- `task-specification-creator/references/phase12-checklist-definition.md` — Phase 12 strict 7 outputs に gate-metadata 検証項目が結線済み
- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/artifacts.json` — `metadata.gates[]` backfill リファレンス実装
