# Phase 7 成果物: カバレッジレポート (coverage-report.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 |
| Phase | 7 / 13 |
| 作成日 | 2026-04-27 |
| 種別 | spec_created / docs-only |

## 1. 局所検証スコープ宣言（[Feedback BEFORE-QUIT-002]）

本タスクの検証は以下に限定する。**全ファイル一律のチェックではない**。

### 検証対象（IN-SCOPE）

- `apps/api/wrangler.toml` の R2 関連セクション（追記予定差分）
- 新規 R2 バケット 2 個（`ubm-hyogo-r2-prod` / `ubm-hyogo-r2-staging`）
- 新規 / 拡張 API Token（`ubm-hyogo-r2-token`）
- 新規 CORS 設定 JSON（staging / production）
- 新規ドキュメント: `outputs/phase-01/` 〜 `outputs/phase-13/`

### 検証対象外（OUT-OF-SCOPE）

- `apps/web/wrangler.toml`（不変条件 5：R2 設定が混入していないことのみ確認）
- 既存 D1 バインディング
- 既存 KV / Secrets
- `apps/api/src/` 配下のコード（実装は別タスク）
- 他の workflow ドキュメント
- node_modules / lock files

## 2. AC 充足状態の最終判定

| AC | 充足状態 | 補足 |
| --- | --- | --- |
| AC-1 | PASS | バケット命名 / 作成 runbook 完了 |
| AC-2 | PASS | wrangler.toml diff / DRY 化済 |
| AC-3 | PASS | 採用案D / Rotation 手順済 |
| AC-4 | PASS（spec として） | 実機 smoke は将来再生 |
| AC-5 | PASS（MINOR） | UT-16 完了後の origin 差し替え必要 |
| AC-6 | PASS（MINOR） | UT-17 未着手のため月次手動 |
| AC-7 | PASS | binding-name-registry.md 正本化 |
| AC-8 | PASS | プライベート方針 / UT-16 申し送り |

## 3. 未カバー項目の分類と補完計画

| 分類 | 該当項目 | 補完先 |
| --- | --- | --- |
| 上流タスク未完了由来 | なし | - |
| docs-only スコープ外（実装委譲） | 実バケット作成 / 実 Token 発行 / 実 CORS 適用 / 実 smoke test | future-file-upload-implementation Phase 5 再生 |
| 未着手連携タスク | UT-16 完了後の AllowedOrigins 差し替え / UT-17 通知実装 | UT-16 / UT-17 タスク |
| Phase 内補完 | なし（Phase 8-10 で品質固め完了予定） | - |

## 4. 補完テスト計画

| 補完項目 | 補完先 | 期限 | 前提条件 |
| --- | --- | --- | --- |
| AllowedOrigins 実値差し替え | UT-16 完了後 / Phase 12 implementation-guide 手順 | UT-16 完了時 | UT-16 で本番ドメイン確定 |
| 無料枠通知自動化 | UT-17 内で実装 | UT-17 完了時 | UT-17 起票 |
| 実機 smoke test (PUT/GET/CORS) | future-file-upload-implementation Phase 5 / 11 再生 | 実装着手時 | Cloudflare アカウント アクセス確保 |
| Pre-commit hook (apps/web R2 混入検出) | unassigned-task-detection.md に登録 | 別タスク起票後 | スクリプト整備 |

## 5. AC × FC 対応の整合確認

`coverage-matrix.md` セクション 2 に同期済み。FC-01〜FC-06 が AC-2/3/5/6/7 + 不変条件 5 + 運用性をカバーしている。

## 6. Phase 10 GO/NO-GO 判定への申し送り

- BLOCKER: 0 件
- MAJOR: 0 件
- MINOR: 4 件
  - M-1: AllowedOrigins 暫定値（Phase 12 申し送り済）
  - M-2: UT-17 未着手（Phase 12 申し送り済）
  - M-3: Pre-commit hook 未整備（Phase 12 unassigned-task-detection.md 登録予定）
  - M-4: 実機 smoke 未実施（spec_created の境界として許容）
- AC 全件充足見込み: PASS

→ **Phase 10 で PASS 判定可能な見込み**

## 7. 整合性確認

| 整合観点 | 確認結果 |
| --- | --- |
| coverage-matrix.md 証跡パスの実在 | Phase 1-6 の outputs を全て本タスクで作成済（Phase 8-10 は本Phase以降で作成） |
| AC × FC 対応 | 全 AC に少なくとも 1 つの FC または手順定義が紐付け |
| 局所検証スコープ宣言 | 本書セクション 1 で明示 |
| TBD 残存 | なし |

## 8. 完了条件チェック

- [x] AC-1〜AC-8 の全行に検証項目・担当 Phase・証跡パス・充足状態（coverage-matrix.md）
- [x] 未カバー項目の補完計画
- [x] 局所検証スコープ宣言
- [x] AC × FC 対応の確認
- [x] Phase 10 GO/NO-GO 判定で参照可能な状態
