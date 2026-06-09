# Phase 9: QA

> **実装区分: 実装仕様書** — implemented_local_runtime_pending 段階の QA 観点（line budget / link / mirror parity / spec 規約 / コード差分）を定義する。

## 9.0 本タスクの QA 前提

- 本タスクは **implemented_local_runtime_pending**。成果物は新規 Playwright spec 5 本（`apps/web/playwright/tests/visual-staging-authenticated/`）。
- Phase 9 時点で **プロダクトコード（`apps/web/src` / `apps/api`）・D1・playwright.config.ts・CI workflow の差分は無い**（AC-5 / AC-6）。
- したがって Phase 9 QA は **仕様書の整合性 QA（doc QA）** と、local/runtime 検証コマンドの **境界定義** に分かれる。staging 実 capture は user-gated。

## 9.1 doc QA / spec 規約 QA（implemented_local_runtime_pending で今やる）

| 観点 | 内容 | 判定 |
| --- | --- | --- |
| line budget | 各 phase ファイルが閾値内（50〜120 行目安）| `wc -l` + 目視 |
| link 整合 | index.md の phase リンクが実ファイルと一致 | リンク先存在確認 |
| test suffix 規約 | 5 spec が `*.spec.ts` のみ（CLAUDE.md 不変条件 #8。`*.test.ts` 禁止）| ファイル名 grep |
| canonical 名一致 | `admin-audit-authenticated.png` / `admin-requests-authenticated.png` / `admin-identity-conflicts-authenticated.png` / `admin-schema-authenticated.png` / `admin-meetings-authenticated.png` が phase-5 / phase-11 / implementation-guide / artifacts `canonical_screenshots` で完全一致 | 文字列 grep 照合 |
| mirror parity | workflow root の `artifacts.json` と `outputs/artifacts.json` が byte 一致 | `diff` / md5 |
| HEX 直書きなし | 5 spec に `#xxxxxx` / `bg-[#...]` 等の色直書きが無い（描画キャプチャのみ）| grep |
| OKLch トークン規約 | spec は描画を撮るだけでトークンを定義しない → **非該当**（UI prototype alignment #2 はソース定義に適用）| スコープ宣言 |
| セレクタ実在 | spec が使う locator が実コードに存在（heading / 安定 selector / read-only ガード testid）| apps/web grep（Phase 2/5 で確認）|
| 不変条件 | `apps/web/src` / `apps/api` / D1 migration / playwright.config.ts / CI 非変更を宣言（AC-5/AC-6）| スコープ宣言 |

### canonical screenshot 名（照合の正本）

| route | screenshot `{arg}` |
| --- | --- |
| audit | `admin-audit-authenticated.png` |
| requests | `admin-requests-authenticated.png` |
| identity-conflicts | `admin-identity-conflicts-authenticated.png` |
| schema | `admin-schema-authenticated.png` |
| meetings | `admin-meetings-authenticated.png` |

## 9.2 AC 充足状況（implemented_local_runtime_pending）

implemented_local_runtime_pending のため、設計完了で確定する AC と、staging 実 capture（user-gated）で初めて確定する AC を分離する。

| AC | 内容 | 段階判定 |
| --- | --- | --- |
| AC-1 | 5 spec 新規追加 | ✅ local 実装済（Phase 5 §5.1 / apps/web/playwright/tests/visual-staging-authenticated）|
| AC-2 | storageState 読込 → route 遷移 → read-only 初期表示を `toHaveScreenshot` | ✅ 設計確定（Phase 5 正本コード）。baseline 生成は user-gated |
| AC-3 | mutation トリガーを一切クリックしない（防御 assertion）| ✅ 構造的に充足（read-only ガード assertion 設計済み）|
| AC-4 | `--list` に 5 spec 列挙（project / CI 認識）| ✅ local 確認済（13 tests in 11 files。新規 5 spec を列挙）|
| AC-5 | 既存 4 spec 無改修（回帰ゼロ）| ✅ 充足見込み（git diff = 新 spec 5 本のみ）|
| AC-6 | `apps/web/src` / `apps/api` / D1 非変更 | ✅ 充足見込み（スコープ宣言）|
| AC-7 | read-only / mutation 副作用境界を画面別に根拠付き記録 | ✅ 充足（Phase 2 §2.3 + spec コメント + ガード assertion）|

## 9.3 検証コマンド

| コマンド | 目的 | 期待 | gate |
| --- | --- | --- | --- |
| `mise exec -- pnpm typecheck` | 5 spec の型整合（Playwright `Page` 型等）| exit 0 | local |
| `mise exec -- pnpm lint` | lint（HEX 直書きなし・spec 命名）| exit 0 | local |
| `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated --list` | project / CI が 5 spec を認識（read-only / 副作用なし）| exit 0（13 tests in 11 files。新規 5 spec を列挙）| local / read-only |
| `mise exec -- pnpm verify:phase12-compliance` | Phase 12 strict 7 / compliance | pass | local |
| `mise exec -- pnpm gate-metadata:validate` | artifacts gate metadata schema | exit 0（OK: 874 WARN: 339 ERROR: 0）| local |
| `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated --update-snapshots` | baseline 初回生成（staging 認証必須）| 5 baseline 生成・mutation 0 | **user-gated** |

> **注意**: staging Playwright（`--update-snapshots`）は secret / baseline 生成を伴うため user-gated。
> typecheck / lint / `--list` は副作用がなく local 検証対象。

## 9.4 削除確認

- **削除ファイルなし**。本タスクは新規 spec 5 本の追加のみ。
- 既存の非認証版 `visual-staging/admin-audit.spec.ts` / `visual-staging/admin-requests.spec.ts`（ガード/empty 状態のみ撮影）は **残置**（非認証ガード描画の担保として価値が残るため削除しない）。
- 既存 4 authenticated spec（profile / dashboard / tags / bulk-tag）も無改修（AC-5）。

## 9.5 リスクと緩和（QA 観点）

| リスク | 緩和 |
| --- | --- |
| staging seed の不足で空 baseline | heading / 安定 selector の visible assert（timeout 付き）が描画未達を明示 fail させる（Phase 5）|
| 誤って mutation を発火し staging D1 を汚す | read-only ガード `toHaveCount(0)`（dialog / modal / toast）+ mutation 非クリックのコードレビュー（Phase 2/5）|
| canonical 名のドリフト | screenshot 名を文字列リテラル直書き + artifacts ledger 照合（Phase 8 §8.2 / §9.1）|
| storageState 出力先ドリフト | 既存 authenticated spec と同一 path 採用（Phase 8 §8.2）|

## 9.6 完了条件（Phase 9）

- [x] doc QA / spec 規約観点（line budget / link / `*.spec.ts` / HEX なし / OKLch 非該当 / canonical / mirror parity / セレクタ実在 / 不変条件）を定義した
- [x] AC-1..AC-7 の充足状況をテーブル化し、user-gated（capture / baseline 系）を pending として分離した
- [x] local 検証コマンド（`--list` / typecheck / lint / phase12 / gate metadata）を実行し、staging Playwright baseline の user-gated 境界を明記した
- [x] 削除ファイルなし（新規追加のみ・非認証版 spec 残置）を明記した
