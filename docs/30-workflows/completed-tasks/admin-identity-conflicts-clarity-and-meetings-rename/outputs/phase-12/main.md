# Phase 12 — main（サマリ）

**[実装区分: 実装 / 状態: implemented_local_evidence_captured]**

`admin-identity-conflicts-clarity-and-meetings-rename` の Phase 12 ドキュメント同期サマリ。本タスクは **VISUAL かつ implemented_local_evidence_captured**（実コード反映済み）。strict 7 成果物、実装ファイル、検証結果、aiworkflow-requirements 正本同期を同一サイクルで揃える。

## このタスクで何をするか（4 concern）

1. サイドバー命名整理: `開催日`→`開催・出席管理`、`Identity重複`→`会員の重複確認`。
2. `/admin/identity-conflicts`（会員の重複確認）の UI/UX 直感化（ガイド新設・操作の平易説明）。
3. 専門用語の非エンジニア向け平易化（merge/source/target/email/matched/name/affiliation/canonical/PII/redaction の日本語化、`matchedFields` を glossary 経由で `氏名`/`職業`）。
4. 重複候補 staging seed（5 組 = 10 member）の専用 dataset 新設。

## 不変条件

- API 非変更（routes/repository/services/`packages/shared` 型・レスポンス shape 不変）。日本語化は UI 表現層 adapter で吸収。
- D1 schema 非変更（seed は既存テーブルへ INSERT OR REPLACE のみ・新規 migration なし）。
- 色は `var(--ubm-color-*)` のみ。
- seed は local/staging 限定（production ガード）。

## strict 7 成果物

| # | path | status |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | present（本ファイル） |
| 2 | `outputs/phase-12/implementation-guide.md` | present |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | present |
| 4 | `outputs/phase-12/documentation-changelog.md` | present |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | present |
| 6 | `outputs/phase-12/skill-feedback-report.md` | present |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## 実行した検証コマンド一覧（[shared-context §8](../../shared-context.md)）

| 区分 | コマンド | 実行タイミング |
| --- | --- | --- |
| seed 生成 | `node --import tsx scripts/gen-identity-conflict-seed.mjs` | PASS |
| focused | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/shell/__tests__/shell-config.spec.ts apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx apps/web/src/components/admin/__tests__/IdentityConflictGuide.spec.tsx apps/web/src/features/admin/identity-conflicts/__tests__/identityConflictGlossary.spec.ts apps/api/migrations/seed/__tests__/identity-conflict-seed.contract.spec.ts` | PASS（5 files / 42 tests） |
| tokens | `mise exec -- pnpm verify:tokens` | PASS（91 tracked） |
| typecheck | `mise exec -- pnpm typecheck` | PASS |
| lint | `mise exec -- pnpm lint` | PASS |
| phase12 compliance | `pnpm verify:phase12-compliance` | PASS |
| indexes | `pnpm indexes:rebuild` | PASS |
| seed 適用 smoke | `bash scripts/seed-identity-conflicts.sh --env local --action apply` | 未実行（D1 mutation・user-gated） |
| visual | runtime screenshot 5 枚 | 未実行（user-gated） |

## 次のステップ

- runtime screenshot 5 枚を user approval 後に撮影。
- aiworkflow-requirements への active/index/inventory/changelog 反映は本サイクルで完了。
- commit / push / PR / staging seed 適用は user-gated（Phase 13）。
