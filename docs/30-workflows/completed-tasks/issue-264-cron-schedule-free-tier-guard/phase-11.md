# Phase 11: 手動テスト

| 項目 | 値 |
| --- | --- |
| 実装区分 | 実装仕様書（本サイクルで guard test 実装済み） |
| visualEvidence | NON_VISUAL |
| evidence 区分 | local focused test evidence captured |
| workflow_state | implemented_local_evidence_captured |

## evidence 状態（本サイクル）

本ワークフローは **実装仕様書の作成**サイクルであり、コード実装（`apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts`）は
本サイクルで行う。したがって Phase 11 の runtime evidence は **focused Vitest PASS** とする。

NON_VISUAL タスクのため screenshot は不要。手動テストの evidence inventory は `outputs/phase-11/` 配下の
spec-only テンプレで satisfy する（下記参照）。

## `outputs/phase-11/` への参照

本フラット phase ファイルは概要のみを示し、evidence 本体は `outputs/phase-11/` 配下に配置済み:

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-11/main.md` | evidence 区分（spec-only / n/a）と本サイクルで present へ昇格する evidence 一覧 |
| `outputs/phase-11/manual-smoke-log.md` | 手動スモーク手順ログ（local focused test PASS） |
| `outputs/phase-11/link-checklist.md` | 参照リンク健全性チェックリスト |

## 本サイクルで実行する手順（user-gated）

| # | 手順 | コマンド / 操作 | 期待 |
| --- | --- | --- | --- |
| 1 | guard test 実行 | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` | TC-1..7（サブケース含む）すべて pass |
| 2 | 負シナリオ: 4 本目 cron | `wrangler.toml` の任意セクション crons に `"*/1 * * * *"` を一時追加 → test 実行 → TC-4（≤3）と TC-1..3（canonical 不一致）が fail → `git checkout -- apps/api/wrangler.toml` で revert | fail を確認後 revert 済 |
| 3 | 負シナリオ: legacy 再混入 | 任意セクション crons に `"0 * * * *"` を一時追加 → test 実行 → TC-5（not contain）が fail → revert | fail を確認後 revert 済 |
| 4 | typecheck / lint | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` | green |
| 5 | 任意 staging cron tail（**任意 / user-gated**） | `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging` | 登録 cron が canonical 3 本で発火することを目視（NON_VISUAL のため必須ではない） |

> 手順 2/3 は `wrangler.toml` を**一時的に汚して即 revert** する破壊的確認のため、実 cron 値は本サイクルでは変更しない（既に canonical）。

## 本サイクルで present へ昇格する evidence（予定）

| 区分 | Path（本サイクルで生成） | 取得コマンド |
| --- | --- | --- |
| test result | `outputs/phase-11/focused-vitest-local.txt` | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` |
| typecheck | `outputs/phase-11/typecheck-local.txt` | `mise exec -- pnpm typecheck` |
| runtime spot-check（任意 / Gate-C） | `outputs/phase-11/staging-cron-tail.txt` | `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging` |

> 無料枠予算は**解析的に確定**しているため、原 issue #264 AC-1/AC-2 の「24h staging 実測」は不要（supersede）。

## DoD（Phase 11）

- implemented_local_evidence_captured のため focused Vitest evidence が present であることを明記。
- 本サイクルで実行する手順（guard test / 負シナリオ / 任意 staging tail = user-gated）を提示。
- `outputs/phase-11/` の main.md / manual-smoke-log.md / link-checklist.md への参照を明記。
