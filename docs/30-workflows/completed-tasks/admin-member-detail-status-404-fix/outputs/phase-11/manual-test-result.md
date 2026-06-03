# 手動テスト結果（NON_VISUAL 証跡記録）

> **[実装区分: 実装仕様書]** — 本 workflow は **implemented_local_evidence_captured**。
> local 自動テスト・typecheck・lint・apps/web diff 0 は PASS。staging admin 実機確認のみ user-gated。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスクID | admin-member-detail-status-404-fix |
| タスク種別 | apps/api bugfix（データ整合性 / API contract 耐性化 + D1 migration backfill） |
| visualEvidence | NON_VISUAL |
| 証跡の主ソース | 自動テスト（unit / route / D1 config の各 spec） |
| スクリーンショット | 作成しない（`apps/web` 無変更で視覚差分なし・staging admin はユーザーゲート） |
| スクショ非作成理由 | UI 無変更のため修正前後が同一画面で証跡価値なし（Feedback 4 / WEEKGRD-03）。`screenshots/.gitkeep` も作らない |
| workflow_state | implemented_local_evidence_captured |
| 実行環境 | local / `mise exec -- pnpm` / 2026-06-02 |

## 1. 自動テスト結果サマリー

| spec | config | 対象 AC | PASS | FAIL | SKIP | Status |
|------|--------|---------|------|------|------|--------|
| `builder.repository.spec`（status 欠落 / response 欠落） | `vitest.d1.config.ts` | AC-1 / AC-2 / AC-7 | 33 | 0 | 0 | present |
| `member-status.contract.spec`（status 欠落 PATCH / unknown id） | `vitest.d1.config.ts` | AC-3 / AC-4 | 5 | 0 | 0 | present |
| `status.repository.spec`（`ensureMemberStatusRow` 冪等・既定値） | `vitest.d1.config.ts` | AC-1/3/5 基盤 | 8 | 0 | 0 | present |
| `sync-forms-responses.contract.spec`（ingest 予防） | `vitest.d1.config.ts` | AC-5 / AC-7 | 20 | 0 | 0 | present |
| `0024_backfill_member_status.spec`（migration backfill 冪等） | `vitest.d1.config.ts` | AC-6 | 1 | 0 | 0 | present |
| focused total | `vitest.d1.config.ts` | AC-1〜AC-7 | 67 | 0 | 0 | present |

## 2. source-level PASS と環境ブロッカー（別カテゴリ記録・WEEKGRD-01）

| カテゴリ | 内容 | 現状 |
|---------|------|------|
| source-level PASS | typecheck / lint / 上記 vitest 群が PASS。AC-8 `apps/web` diff 0 も確認 | present |
| 環境ブロッカー | staging 実機確認（admin 会員詳細を開く・公開トグル）は authenticated admin session を要するためユーザーゲート。CI / ローカルでは再現不可 | ブロッカー = admin 認証セッション。ユーザー実施待ち |

> source-level（自動テスト）の PASS と、環境制約による staging 確認の保留を混同せず別カテゴリで記録する。自動テストが全 PASS であれば実装の正しさは source-level で確定し、staging 確認はリリース前の最終 end-to-end 確認として別途行う。

## 3. AC ↔ 証跡の対応

| AC | 主証跡 | 補助証跡（staging・ユーザーゲート） |
|----|--------|--------------------------------------|
| AC-1（status 欠落でも detail 200） | `builder.repository.spec` | 確認 A（orphan 会員を開く → 200） |
| AC-2（response 欠落でも劣化 200） | `builder.repository.spec` | 確認 A（summary 空でもパネル表示） |
| AC-3（status 欠落でも PATCH 成功） | `member-status.route.spec` / `status.repository.spec` | 確認 B（公開トグル成功） |
| AC-4（identity 不在は 404） | `member-status.route.spec`（unknown id） | 確認 A（存在しない id で 404 維持） |
| AC-5（ingest 予防） | `sync-forms-responses.spec` | — |
| AC-6（migration 冪等 backfill） | `0024_backfill_member_status.spec` | apply 後 orphan 0 を D1 で確認 |
| AC-7（非回帰） | 既存 spec 群全 PASS | 確認 C（正常会員 従来どおり） |
| AC-8（apps/web diff 0） | `git diff --name-only dev...HEAD \| grep '^apps/web/'`（Phase 9 §9.3） | — |

## 4. 仕様判断根拠

- **なぜ NON_VISUAL か**: 修正は `apps/api` + D1 migration に閉じ `apps/web` 無変更。UI は 200 受信で既存描画されるだけで、新しい見た目は生まれない。視覚証跡より HTTP ステータス・本文 shape・DB 行存在の自動検証が適切。
- **なぜスクショを作らないか**: UI 無変更で修正前後が同一画面のため証跡価値がない。意味ある staging 画面は admin 認証が必要でユーザーゲート。よって空の `screenshots/` も `.gitkeep` も作らない（validate の missing-evidence を誘発しないため）。
- **なぜ staging は pending か**: local source-level evidence は PASS。staging 確認は authenticated admin session と remote D1 apply / deploy を要するため、Phase 13 user-gated として残す。

## 5. Phase 13 close-out での更新手順（メモ）

1. staging deploy / remote D1 migration apply をユーザー承認後に実行。
2. authenticated admin session で会員詳細 200 / 公開トグル成功を確認。
3. 結果を Phase 13 close-out wave で追記。
