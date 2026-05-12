# 2026-05-10 — Issue #621 apps/web test suffix rename close-out sync

## 状態

- task type: `implementation`
- visual evidence: `NON_VISUAL`
- workflow state: `implemented_local_evidence_captured`
- implementation state: `implementation_complete_pending_pr`
- Phase 1-12: completed / Phase 13: `pending_user_approval`

## 同期内容（同一 wave）

| 対象 | 内容 |
| --- | --- |
| `indexes/quick-reference.md` | Issue #621 quick reference セクション追加 |
| `indexes/resource-map.md` | Issue #621 entry 追加 |
| `indexes/topic-map.md` | rename 関連 anchor 追加 |
| `references/task-workflow-active.md` | Issue #621 active workflow entry 追加 |
| `references/lessons-learned-issue-621-apps-web-test-suffix-rename-2026-05.md` | 新規作成（L-I621-001..005、OP-I621-1..3） |
| `references/lessons-learned.md` hub | 上記 lessons への link 追加 |
| `references/*` 配下の `.test.ts` パス参照 | apps/web scope に限定して `.spec.ts` へ更新（packages / apps/api scope は followup-002 で別対応） |
| `SKILL.md` / `SKILL-changelog.md` | v2026.05.10-issue-621 entry 追加 |
| `LOGS/_legacy.md` | 最新ヘッドラインに entry 追加 |

## 実装スコープ実績（Phase 11 evidence）

| 項目 | 値 |
| --- | --- |
| renamed files | 70 (`apps/web/**/*.test.ts(x)` → 5 分類 `.spec.ts(x)`) |
| type-only suffix alignment | 1 (`me-types.test-d.ts` → `me-types.spec-d.ts`) |
| residual `.test.ts(x)` in `apps/web` | 0 |
| ADR | `outputs/phase-12/test-file-suffix-adr-apps-web.md` |
| boundary / stablekey lint script parity | `scripts/lint-boundaries.mjs` / `scripts/lint-stablekey-literal.mjs` 両方で `.spec` 除外を追加済み |
| `verify-design-tokens` path | `apps/web/package.json` で renamed path に更新 |
| CI workflow | `.github/workflows/ci.yml` build label 更新 |

## skill フィードバック routing

- task-specification-creator: rename 系 workflow 用 **live root scan parity gate** を `phase12-checklist-definition.md` #22 に追加
- aiworkflow-requirements: rename 後の references grep gate を本 changelog に正規化、`*.test-d.ts` discovery ルールを ADR 「適用範囲」に明記
- skill-creator / github-issue-manager / automation-30: 改訂不要

## 未タスク

- 本 cycle 内未タスク: 0 件
- scope-out（既存別 issue）: `packages/**/*.test.ts` rename (followup-002), `vitest.config.ts` `.spec` 単独収斂 (followup-003), Storybook / Playwright suffix 統一（必要時に新規 issue）

## commit / push / PR

未実行（Phase 13 user gate）。
