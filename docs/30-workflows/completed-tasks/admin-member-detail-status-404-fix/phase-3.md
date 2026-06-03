# Phase 3: 設計レビュー

> **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスクID | admin-member-detail-status-404-fix |
| Phase | 3 / 設計レビュー（Gate-A） |
| 分類 | implementation / bugfix / NON_VISUAL |
| implementation_mode | new |
| 依存 Phase | Phase 1-2 |
| 後続 Phase | Phase 4（テスト作成） |

## 目的

Phase 1-2 の設計を 4 条件（価値性 / 実現性 / 整合性 / 運用性）で評価し、Phase 4 へ進めるか判定する。これが設計ゲート（Gate-A）。

## 実行タスク

### 3.1 真の論点

- **現象**: admin 会員管理で詳細・status が 404。
- **主問題（1 文）**: 「一覧（LEFT JOIN）には出るが、詳細・status は `member_status`/`current_response` 行の存在を前提とするため、orphan 会員で 404 になる」非対称性。
- **why now**: staging に orphan 会員（`member_status` 欠落）が実在し、admin が会員を開けない・公開操作できない。
- **why this way**: API を変えず（surface 不変）内部ロジックの耐性化＋データ修復で、UI 無変更のまま全 endpoint を一貫させる。

### 3.2 因果ループ（強化 / バランス）

- **強化ループ（悪化）**: ingest で member_status を作らない経路 → orphan 増加 → admin 操作不能 → 手動修復負荷増。
- **バランスループ（是正）**: ensure 行保証（ingest 予防）+ migration backfill（既存修復）+ builder/route 耐性化（即時可用）→ orphan が UI/監査を壊さない。
- **状態所有権**: member_status 行の生成責務を「consent 抽出経路のみ」から「identity 作成と同期（ingest）＋既定行保証（helper）」へ移し、所有権を明確化。

### 3.3 価値とコスト

| 項目 | 内容 |
|------|------|
| 初回価値 | admin が全会員を開ける / 公開操作できる（中核機能の回復）。staging 実害の即時解消 |
| 最大コスト部品 | migration 0024 の remote apply（ユーザーゲート・Phase 13）。コード変更は小（4 編集 + 1 新規 helper + 1 migration） |
| 将来層との分離 | FK 制約の本格導入・member 作成経路の統一は本タスク外（過剰スコープ）。未タスク化候補として Phase 12 で評価 |

### 3.4 4 条件評価

| 条件 | 評価 | 根拠 |
|------|------|------|
| 価値性 | PASS | admin の詳細閲覧・公開状態管理という中核コストを 0 に下げる。対象は管理者。staging 実害を解消 |
| 実現性 | PASS | `apps/api` 4 編集 + helper + migration。既存関数（getStatus/setPublishState/findMemberById/findCurrentResponse）を再利用し新規実装面は最小。1 サイクルで完了可能（CONST_007） |
| 整合性 | PASS | endpoint surface 不変・不変条件 #5（web→D1 禁止）維持・既存正常パス非回帰。404 境界は「identity 不在のみ」に一貫化。zod は responseId フォールバックで schema 変更不要 |
| 運用性 | PASS | migration は `INSERT OR IGNORE` で冪等・再適用安全。ingest 予防で再発防止。test は D1 config で検証。remote apply / deploy はユーザーゲートで監査可能 |

### 3.5 MINOR 指摘（Phase 4-5 で着手前解消）

| ID | 指摘 | 解消フェーズ |
|----|------|-------------|
| MINOR-1 | `MemberStatusRow` 型の実カラム（`notification_opt_out` 等）と `defaultMemberStatusRow` の充足を確認 | Phase 5 §着手前 |
| MINOR-2 | `extractSummary(null)` が `SummaryZ` を満たす空値を返すか確認（満たさなければ最小値を埋める） | Phase 5 §着手前 |
| MINOR-3 | migration test の慣例（`vitest.d1.config.ts` / 既存 migration spec の有無）を確認し対象 config を確定 | Phase 4 |
| MINOR-4 | `migrations/sequence-exceptions.json` の更新要否確認 | Phase 5 |

### 3.6 ゲート判定

→ **Phase 4 へ進む（Gate-A: passed）**。4 条件すべて PASS。MINOR は着手前解消事項として Phase 4/5 に引き継ぐ。

## 参照資料

- Phase 1（要件定義）/ Phase 2（設計）
- index.md §1 根本原因 / §2 採用方針

## 成果物

- 本ファイル（Phase 3 設計レビュー = Gate-A 証跡）

## 統合テスト連携

- 4 条件 PASS は Phase 4 のテスト設計（status 欠落 / response 欠落 / identity 不在 / ingest / migration）の前提として引き継ぐ。
- MINOR-1〜4 は Phase 4/5 の着手前チェックで消化し、消化を Phase 9/10 で確認する。

## 完了条件

- [x] 真の論点・因果ループ・価値/コストを記述した
- [x] 4 条件（価値性/実現性/整合性/運用性）を評価し全 PASS とした
- [x] MINOR 指摘を Phase 4/5 へ引き継いだ
- [x] Gate-A passed を判定した
