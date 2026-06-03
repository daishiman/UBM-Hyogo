# Phase 11: 手動テスト（NON_VISUAL）

> **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）。

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 11（手動テスト） |
| visualEvidence | **NON_VISUAL** |
| タスク種別 | apps/api bugfix（データ整合性 / API contract 耐性化 + migration backfill） |
| 証跡の主ソース | 自動テスト（builder degraded / member-status route / ingest / status repo / migration の各 spec） |
| staging 実機確認 | authenticated admin session 必須 → **ユーザーゲート**（本 workflow では実行しない） |
| スクリーンショット | **作成しない**（`screenshots/.gitkeep` も作らない。下記 §11.2 理由） |

## NON_VISUAL 宣言

本タスクは **NON_VISUAL** である。

- **非視覚的理由**: 変更は `apps/api`（repository / builder / route / job）と D1 migration に閉じ、`apps/web` を 1 byte も変更しない（AC-8）。UI は 200 を受信すれば既存コンポーネントがそのまま会員詳細を描画するため、本修正による「新しい見た目」は存在しない。検証対象は HTTP レスポンスのステータス・本文 shape・DB 行の存在という非視覚的事実である。
- **代替証跡**: (1) 自動テスト（unit / route / D1 config）の PASS、(2) staging での authenticated admin による挙動確認（200 受信・公開トグル成功）。後者は admin session を要するためユーザーゲート。

## 目的

NON_VISUAL bugfix の正しさを、視覚的証跡ではなく自動テスト群と（ユーザーゲートの）staging 実機確認手順で担保する。本 workflow は local source-level evidence 取得済みで、staging 実機確認のみ user-gated。

## 実行タスク（証跡の構造）

### 11.1 自動テスト証跡（主ソース）

| spec | 検証 AC | 観点 | Status |
|------|---------|------|--------|
| `builder.repository.spec`（status 欠落 / response 欠落 fixture） | AC-1 / AC-2 | 詳細が null でなく 200 view・degraded（summary 空値 / sections []）・`responseId` フォールバック | present |
| `member-status.route.spec`（status 欠落 → PATCH / unknown id） | AC-3 / AC-4 | status 欠落で PATCH 成功・行生成・反映 / identity 不在で 404 | present |
| `status.repository.spec`（`ensureMemberStatusRow`） | AC-1/3/5 基盤 | 冪等（再実行で重複なし）・既定値生成 | present |
| `sync-forms-responses.spec`（ingest） | AC-5 | 新規 identity で member_status 既定行が必ず存在 | present |
| `0024_backfill_member_status.spec`（migration / D1 config） | AC-6 | orphan 全件補完・再適用冪等 | present |
| 既存 spec 群（正常会員） | AC-7 | 詳細 / status / 一覧の非回帰 | present |

> 件数・spec パスの実行記録（PASS/FAIL 件数）は `outputs/phase-11/manual-test-result.md` に集約済み。

### 11.2 スクリーンショットを作らない理由（Feedback 4 / WEEKGRD-03）

- `apps/web` 無変更のため UI の視覚的差分が存在せず、スクリーンショットは「修正前後で同一画面」を撮るだけで証跡価値が無い。
- staging で意味のある画面（admin 会員詳細・公開トグル）を撮るには authenticated admin session が必要で、これはユーザーゲート。本 wave では取得しない。
- よって `outputs/phase-11/screenshots/` ディレクトリも `.gitkeep` も作らない（空ディレクトリの強制は validate の missing-evidence を誘発するため避ける）。証跡は自動テストと `manual-test-result.md` の文書記録に一本化する。

### 11.3 staging 実機確認手順（ユーザーゲート）

1. 修正済み `apps/api` を staging へ deploy（`bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` 相当・ユーザー承認後）。
2. migration 0024 を staging D1 へ apply（`bash scripts/cf.sh d1 migrations apply ...`・ユーザー承認後）。
3. authenticated admin で `https://ubm-hyogo-web-staging.daishimanju.workers.dev` の admin 会員管理を開く。
4. **確認 A（AC-1/2/4）**: これまで「読み込み失敗: HTTP 404」だった会員（orphan）を開く → 会員詳細が 200 で表示される。response 欠落会員は summary 空でもパネルが開く。存在しない id では 404 のまま。
5. **確認 B（AC-3）**: 会員詳細の公開トグル（または一覧の一括公開復帰）を操作 → PATCH が成功し公開状態が反映される。
6. **確認 C（AC-7）**: 正常会員（従来 200）の詳細・公開操作が従来どおり動くこと（非回帰）。

> 上記 1-6 はすべてユーザーゲート。本 wave では実行せず手順固定のみ。実行結果は Phase 13 close-out で追記する。

## 参照資料

- Phase 9（検証コマンド）/ Phase 10（AC 充足判定）
- index.md §3 AC-1〜AC-8
- `outputs/phase-11/manual-test-result.md`（証跡記録の正本）

## 成果物

- 本ファイル（Phase 11 手動テスト・NON_VISUAL 宣言）
- `outputs/phase-11/manual-test-result.md`（NON_VISUAL 証跡記録）

## 統合テスト連携

- §11.1 の自動テスト群が AC-1〜AC-7 の主証跡。実行記録は `manual-test-result.md` に集約し、Phase 10 の AC 判定と整合させる。
- §11.3 の staging 確認は自動テストを補完する end-to-end 証跡。ユーザーゲートのため source-level PASS と環境ブロッカーを `manual-test-result.md` で別カテゴリ記録する（WEEKGRD-01）。

## 完了条件

- [x] NON_VISUAL を宣言し非視覚的理由・代替証跡を明記した
- [x] 証跡の主ソース（自動テスト spec 一覧・件数方針）を列挙した
- [x] スクリーンショットを作らない理由を記録し `screenshots/.gitkeep` を作らないと明記した
- [x] staging 実機確認手順（ユーザーゲート）を固定した
- [x] `outputs/phase-11/manual-test-result.md` を作成した
