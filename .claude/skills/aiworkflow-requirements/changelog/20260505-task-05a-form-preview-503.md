# 2026-05-05 task-05a-form-preview-503-001

`task-05a-form-preview-503-001` を `implemented-local-runtime-evidence-blocked / implementation / NON_VISUAL / Phase 12 strict 7 files present / Phase 11 runtime evidence blocked / Phase 13 blocked_until_user_approval` として同期。

## 影響範囲

- workflow root: `docs/30-workflows/task-05a-form-preview-503-001/`
- endpoint: staging `GET /public/form-preview`
- root cause path: `getLatestVersion()` null → `logWarn({ code:"UBM-5500" })` → `ApiError({ code:"UBM-5500" })` → HTTP 503
- D1 contract: `schema_versions(form_id, revision_id, state='active', synced_at)` / `schema_questions(revision_id)`
- NON_VISUAL evidence: `outputs/phase-11/main.md`, `manual-smoke-log.md`, `link-checklist.md`, `manual-test-result.md`
- Issue: GitHub Issue #388（CLOSED 維持、`Refs #388` のみ）

## 変更ファイル

### implementation (apps/api)

| path | 内容 |
| --- | --- |
| `apps/api/src/use-cases/public/get-form-preview.ts` | `getLatestVersion()` null 経路に `logWarn({ code:"UBM-5500", message, context:{ where, formId, usedFallback } })` を throw 直前に追加 |
| `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts` | TC-RED-01 / RED-02-A / RED-02-B / FAIL-01 / FAIL-02 / COV-01 を追加（`logWarn` mock + bindLog assert） |
| `apps/api/src/routes/public/index.test.ts` | TC-RED-03 を追加（schema_versions 欠落で 503 / `Cache-Control: public, max-age=60` リーク防止） |
| `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts` | `bindLog?: Array<{ sql; bindings }>` opt-in を `MockStmt.bind` に追加（既存呼び出しに非破壊） |

### skill artifacts

| path | 内容 |
| --- | --- |
| `references/workflow-task-05a-form-preview-503-001-artifact-inventory.md` | 成果物台帳（Phase 12 strict 7 files / artifacts.json / unassigned 昇格メモ / branch 実装変更 4 ファイル） |
| `references/lessons-learned-05a-form-preview-503-2026-05.md` | L-05A-FP503-001〜008（D1 drift / NON_VISUAL / AC single source / runtime gate / `logWarn` 単一 emit / helper bindLog / 二段テスト / runtime evidence procedure） |
| `references/lessons-learned.md` | 子 lessons-learned へのリンク登録 |
| `references/task-workflow-active.md` | task-05a-form-preview-503-001 を active として登録 |
| `indexes/resource-map.md` | task-05a-form-preview-503 行を current canonical set に追加 |
| `indexes/quick-reference.md` | 503 / UBM-5500 / runtime evidence / Phase 12 strict outputs クイック参照 |
| `indexes/topic-map.md` | inventory + lessons-learned のセクション登録 |
| `indexes/keywords.json` | UBM-5500 / form-preview / 503 / schema_versions / logWarn / runtime-evidence / user-approval-gate / bindLog の検索エントリ |

## 同期境界

- staging D1 write / deploy / production verification / commit / push / PR / Issue state change は user 明示承認後のみ。
- 2026-05-05 review curl 結果（staging 503 / production 503）は root cause 仮説の支持証拠であって PASS 証跡ではない。
- `pnpm indexes:rebuild` の実行は Agent 4 検証フェーズに委ねる。本ログ時点では人手記述のみ。
