# ドキュメント変更ログ

> SSOT: [`../../shared-context.md`](../../shared-context.md) を正本とする。
> 本 wave で実コード差分・focused tests・typecheck・lint・global skill sync を実施済み。commit / push / PR は user-gated。
> workflow-local 同期と global skill sync を別ブロックで記録（BEFORE-QUIT-003）。

## workflow-local 同期

| Step | 結果 |
|------|------|
| Phase 1-13 root | `implemented_local_evidence_captured` へ更新（実コード差分・検証完了） |
| artifacts parity | `artifacts.json` / `outputs/artifacts.json` を `implemented_local_evidence_captured` で同一状態に維持 |
| Phase 11 | NON_VISUAL 宣言 + 自動テスト結果（SP-01〜SP-12 + api/web 回帰 + typecheck + lint）を `manual-test-result.md` に記録 |
| Phase 12 | strict 7 成果物を実装済み状態へ同期 |
| Phase 13 | commit / push / PR を `pending_user_approval` で記録 |

## Step 別の結果（全 Step 個別明記・「該当なし」も記録）

| Step | 内容 | 本タスクの結果 |
|------|------|----------------|
| Step 1-A | 完了タスク記録 | 該当あり: workflow root + aiworkflow ledger へ実装済みとして記録 |
| Step 1-B | 実装状況テーブル | 該当あり: `implemented_local_evidence_captured`（新規3/編集3ファイル・検証結果を記録） |
| Step 1-C | 関連タスク | 該当あり: admin/search 非接触・web ページングは別タスク・D1/API/Form 不変を記録 |
| Step 2 | グローバル公開契約変更 | **該当なし（N/A）**: API endpoint / D1 schema / Google Form / 認証境界の変更なし。cross-package subpath 追加のみ（ledger 記録対象） |

## code 同期（実装済み）

| ファイル | 変更 |
|----------|------|
| `packages/shared/src/public-search/search-query-primitives.ts` | 新規: 値集合 tuple / 派生型 / zod enum / 制限値 / 正規化純関数 / enum-like 正規化 |
| `packages/shared/src/public-search/index.ts` | 新規: barrel re-export |
| `packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts` | 新規: SP-01〜SP-12 |
| `packages/shared/package.json` | 編集: `exports` に `"./public-search"` 追加 |
| `apps/api/src/_shared/search-query-parser.ts` | 編集: 値集合・制限値・正規化を shared import へ置換（`SortZ`/`DensityZ` は re-export で後方互換維持・I/O 不変） |
| `apps/web/src/lib/url/members-search.ts` | 編集: 値集合・制限値・正規化を shared import へ置換（`parseSearchParams`/`toApiQuery`/`MEMBERS_SEARCH_LIMITS` 不変） |

## global skill sync（実反映済み）

| 対象 | 結果 |
|------|------|
| aiworkflow task ledger | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` へエントリ追加 |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-222-search-query-parser-shared-artifact-inventory.md` を追加 |
| quick reference | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` へ追加 |
| resource map | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` へ追加 |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260610-issue-222-search-query-parser-shared.md` を追加 |
| discovery indexes 再生成 | 手書き index を同一 wave 更新。追加の生成物 drift は最終 `git diff` で確認 |
| task-spec skill feedback | `skill-feedback-report.md` で 3 観点固定フォーマットへ整理し promotion/no-op routing を記録 |

## verify（実行済み）

- `mise exec -- pnpm exec vitest run packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts`（1 file / 12 tests PASS）
- `mise exec -- pnpm exec vitest run apps/api/src/_shared/__tests__/search-query-parser.spec.ts apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts`（2 files / 30 tests PASS）
- `mise exec -- pnpm exec vitest run apps/web/src/lib/url/__tests__/members-search.spec.ts`（1 file / 11 tests PASS）
- `mise exec -- pnpm --filter @ubm-hyogo/shared typecheck` / `--filter @ubm-hyogo/api typecheck` / `--filter @ubm-hyogo/web typecheck`（全 PASS）
- `mise exec -- pnpm lint`（PASS）
