# Phase 1: 要件定義 — AdminFetchError typed class 導入

**[実装区分: 実装仕様書]**

## P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | **No** — `grep -rn "AdminFetchError" apps/` = 0 件 | 通常の新規実装 Phase とする（`implementation_mode: "new"`） |
| upstream（dev/main）にマージ済み | **No** — `server-fetch.ts:530` は untyped `throw new Error(...)` のまま | 未マージとして扱う |
| 前提タスク（親 workflow Task B）が完了済み | **Yes** — `admin-audit-prototype-alignment` は completed-tasks へ移動済み。`/admin/audit` 404 は root mount で恒久解決済み | 依存解消済み。本タスクは observability 後続改善として独立実装可 |

> `implementation_mode = "new"`。Phase 4 は通常の TDD（RED → GREEN）。

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景
親 workflow `admin-audit-prototype-alignment` Task B §B.4.1 で「将来の 404 mount regression 切り分け強化として `AdminFetchError extends Error` の追加を推奨」とされた後続改善（Issue #991）。現状の `apps/web/src/lib/admin/server-fetch.ts` は失敗時に untyped `Error` を throw しており、呼び出し側で `status` を得るには message の正規表現 parse が必要。

### 1.2 現状コードの事実（2026-05-30 調査・正本）
- `apps/web/src/lib/admin/server-fetch.ts:509-530`（error path）:
  - line 512: `const text = await res.text();`（body を **1 回だけ** read）
  - line 513: `bodySnippet = " body=" + text.slice(0, 256)`
  - line 517-529: 非 production かつ 404 のとき `console.warn("[admin/server-fetch] 404", {...})`
  - line 530: `throw new Error(\`admin api ${path} failed: ${res.status}${bodySnippet}\`)`
- `apps/web/src/lib/server-fetch/safe-fetch.ts`:
  - `STATUS_FROM_MESSAGE = /\bfailed:?\b.*\b(\d{3})\b/`
  - `normalizeError`: message を正規表現で parse し `${codePrefix}_${match[1]}`（例 `ADMIN_FETCH_404`）/ 非マッチ時 `${codePrefix}_FAILED` を返す
- `apps/web/src/lib/admin/safe-server-fetch.ts`: `result.error.code === "ADMIN_FETCH_404"` のとき `logger.warn({ event: "admin_fetch_404", ... })`
- `AdminFetchError` は **全コードベースに不在**（`grep -rn "AdminFetchError" apps/` = 0 件）

### 1.3 問題点
1. 404 / 500 / network error の区別が message string parse に依存しており fragile
2. observability tooling に渡せる構造化 metadata（status / path / body snippet）が無い
3. 将来 mount regression 再発時、前回（Task B）と同等の手作業 grep / staging tail が必要

### 1.4 放置した場合の影響
- error boundary の表示分岐拡張時に message parse コードが各所に散らばる
- admin route の mount regression 再発時の切り分けコストが下がらない

## 2. 何を達成するか（What）

### 2.1 目的
admin API 呼び出し失敗を `AdminFetchError extends Error` として throw し、`status` / `path` / `responseBodySnippet`（≤500 文字）を構造化フィールドで提供する。共通正規化レイヤーは構造化 `status` を優先利用する。

### 2.2 受入基準（AC）— 現状コード最適化版
- [ ] AC-1: `AdminFetchError` が `server-fetch.ts` から `export` されている
- [ ] AC-2: `AdminFetchError extends Error`（`instanceof Error` も true）
- [ ] AC-3: `Error.message` が現状と **byte-identical**（`admin api ${path} failed: ${status}${bodySnippet}`、` body=` suffix は raw text の 256 文字切り、body 不在時は suffix なし）
- [ ] AC-4: `responseBodySnippet` が `≤500` 文字に切られる（message の 256 とは独立スライス、body 不在時は `null`）
- [ ] AC-5: `status`（number）/ `path`（string）フィールドが正しく設定される
- [ ] AC-6: `isAdminFetchError(e)` type guard が `instanceof` または `e.name === "AdminFetchError"` で true（Cloudflare Workers cross-module bundling 対策）
- [ ] AC-7: `safe-fetch.ts` が構造化 `status` フィールド（数値）を優先し、未提供時は既存正規表現 fallback を維持（`ADMIN_FETCH_404` 等が不変）
- [ ] AC-8: 既存 regression spec 群が全 green、`pnpm typecheck` / `pnpm lint` green

> **AC-3 が Issue 記述（body なし）と異なる根拠**: `server-fetch.binding.spec.ts:89` = `"admin api /admin/dashboard failed: 404 body=error code: 1042"`、同 :101 = `` `admin api /admin/dashboard failed: 500 body=${"x".repeat(256)}` `` が現状の正本 assertion。Issue の「body なし format 維持」を採用すると **既存テストが fail** する。よって「既存 = 現状の実 message（body= 込み）」と再定義し、byte-identical 維持を AC とする。

## 3. 既存コードの命名規則（FB-01 / FB-SDK-07-4 準拠）

| 観点 | 既存パターン | 本タスクの採用 |
| --- | --- | --- |
| ファイル名 | kebab-case（`server-fetch.ts`, `safe-fetch.ts`, `safe-server-fetch.ts`） | 新規 test = `admin-fetch-error.spec.ts`（kebab + `.spec.ts`、不変条件#8 準拠） |
| クラス名 | PascalCase（`AdminMemberListViewZ` 等の型は `Z` suffix だが error class は無 suffix） | `AdminFetchError`（PascalCase + `Error` suffix） |
| type guard | 既存に `isXxx` 形式の guard あり（`apps/web/src/lib/` 配下） | `isAdminFetchError`（`is` prefix camelCase） |
| エラー message | `\`admin api ${path} failed: ${status}\`` を多数テストが期待 | byte-identical 維持 |

## 4. タスク分類

- **NON_VISUAL**: error class 追加 + 共通正規化強化 + 純関数 unit test。UI レイアウト/描画変更なし。
- Phase 11 スクリーンショット不要（`screenshots/.gitkeep` は作成しない）。代替証跡 = focused Vitest 結果（`manual-test-result.md`）。

## 5. targeted test ファイルリスト（FB-UI-02-2 / メモリ制約対策）

全件 `pnpm test` は避け、以下のみ targeted run する（`artifacts.json#metadata.verify_commands` 参照）:
- 新規: `apps/web/src/lib/admin/__tests__/admin-fetch-error.spec.ts`
- regression: `server-fetch.binding.spec.ts`, `safe-server-fetch.spec.ts`, `safe-server-fetch-404-vs-401.spec.ts`, `server-fetch.env.spec.ts`, `lib/server-fetch/__tests__/safe-fetch.spec.ts`

## 6. carry-over 確認

直近コミット（`git log --oneline -5`）= public-header / login-redirect 系。本タスクの admin server-fetch 領域とは無関係。carry-over 差分なし。

## 完了条件（Phase 1）
- [x] P50 チェック完了（`implementation_mode = new`）
- [x] AC を現状コードに最適化して固定（AC-1〜8）
- [x] 命名規則を記録（kebab-case ファイル / PascalCase class / `is` prefix guard）
- [x] NON_VISUAL 分類を確定
- [x] targeted test リストを事前列挙
