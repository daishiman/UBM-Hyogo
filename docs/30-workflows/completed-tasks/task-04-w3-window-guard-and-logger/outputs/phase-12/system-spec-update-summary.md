> 関連 source: docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md
> 実装区分: 実装仕様書
> 生成 phase: phase-12

# System Spec Update Summary

## Step 1-A: タスク記録

`artifacts.json`、`index.md`、Phase 1〜13、Phase 11 main、Phase 12 strict 7 outputs を同一 workflow package 内で同期した。

## Step 1-B: 実装状況

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |
| implementation_status | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |

`apps/web` 実コード反映と Phase 11 local PASS 5 evidence は取得済み。Sentry dashboard smoke / staging runtime logger evidence は Phase 13 / G4 user approval 境界に残す。

## Step 1-C: 関連タスク

| 関連 | 状態 |
| --- | --- |
| task-03 | upstream gate。`captureException` / `captureMessage` を提供 |
| task-05 | downstream。`logger.error()` を利用 |
| task-09..17 | downstream。window 直参照修正の本格消化先 |

## Step 2: システム仕様更新

判定: `UPDATED`

`apps/web/src/lib/is-browser.ts` / `logger.ts` の実コード、ESLint gate、Phase 11 evidence を反映済みとして system spec index に同期した。主な同期先は `docs/00-getting-started-manual/specs/09-ui-ux.md`、`.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`、`.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`。

### 同期先 spec 別 詳細（phase-12.md §2 準拠）

#### `docs/00-getting-started-manual/specs/09-ui-ux.md`

- **該当章**: §2.4.1 `app/error.tsx` 直下の Task-04 runtime guard / logger contract 段落、および同段落への ESLint allow-list 正本化追記。
- **追記内容**:
  - production code は `apps/web/src/lib/is-browser.ts`（`isBrowser()`, `whenBrowser()`, `browserHistory()`, `browserDocument()`）経由で browser-only globals を扱う旨を契約として固定。
  - エラー報告は `apps/web/src/lib/logger.ts` 経由とし、`logger.error({ event, error, digest })` の呼び出し契約・JSON 一行出力・redaction・task-03 `captureException` / `captureMessage` ブリッジを正本化。
  - ESLint `no-restricted-globals` の allow-list 正本 4 経路（`apps/web/src/lib/is-browser.ts` / `apps/web/src/instrumentation-client.ts` / `apps/web/src/lib/sentry/**` / `apps/web/src/**/__tests__/**`）を明記し、それ以外で `window` / `document` / `history` / `navigator` 直接参照を禁止。
- **追記不要根拠**: 該当章は今回追記済みのため不要根拠は適用外。
- **後続 spec 改訂の予約**: task-05（error boundary integration）、task-11..17（per-screen migration）で `whenBrowser()` 採用が増えた段階で、09-ui-ux.md §2 の各 route 行に runtime guard 利用箇所を補強する余地を残す。改訂自体は本タスクスコープ外。

#### `docs/00-getting-started-manual/specs/00-overview.md`

- **該当章**: 全体概要（runtime / observability の高位記述）。
- **追記内容**: なし（今回 wave で edit せず）。
- **追記不要根拠**: 00-overview.md は runtime tagging / logger / window guard の高位概念を既にカバーしており、`is-browser.ts` / `logger.ts` の具体契約・ESLint allow-list は 09-ui-ux.md（UI/UX Contract §2.4.1）と `lessons-learned` / `task-workflow-active` への参照で十分追跡できる。詳細を 00-overview.md に重複記載すると、§2 link 先 index と矛盾し正本主義が壊れるため意図的に no-op。
- **後続 spec 改訂の予約**: observability 章を別途 split する場合（例: 将来の `specs/observability.md` 新設）に runtime tag policy / redaction policy をそこへ集約する案を保留する。新規 spec 作成は本タスクスコープ外。

## artifacts parity

`outputs/artifacts.json` は本ワークフローでは作成されておらず、root `artifacts.json` が唯一正本である。parity check は root のみで実施し PASS とする。
