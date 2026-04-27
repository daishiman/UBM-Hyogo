# Unassigned Task Detection — UT-12

## 概要

本タスク（UT-12 / docs-only / `spec_created`）の範囲外でハンドオフが必要な作業を検出した。検出件数 **5 件**。0 件ではない旨を明記する。

配置先: `docs/30-workflows/unassigned-task/`（[P38 再発防止] / Phase 12 ガイドに準拠）

## 検出項目テーブル

| # | 検出項目 | 種別 | 推奨対応 | 割り当て先 | 起点となる成果物 |
| --- | --- | --- | --- | --- | --- |
| 1 | R2 バケット実作成 + `apps/api/wrangler.toml` への `[[r2_buckets]]` バインディング反映 | 実作業 | Phase 5 `r2-setup-runbook.md` の手順に従い、staging → production の順に実施。Phase 8 `dry-applied-diff.md` を `wrangler.toml` に適用 | `future-file-upload-implementation` | `outputs/phase-05/r2-setup-runbook.md` / `outputs/phase-08/dry-applied-diff.md` |
| 2 | CORS `AllowedOrigins` の正式値への更新 | 実作業 | UT-16（custom-domain）完了後、本番ドメイン確定値で `cors-production.json` を生成し `wrangler r2 bucket cors put` を再適用 | UT-16 完了後の運用タスク | `outputs/phase-02/cors-policy-design.md` / `outputs/phase-12/implementation-guide.md` §2-2 |
| 3 | R2 無料枠通知経路の確定（Storage / Class A operations / Class B operations メトリクス） | 設計 + 実作業 | UT-17（Cloudflare Analytics アラート設定）で R2 メトリクスをアラート対象に追加。閾値・通知チャネル（Slack / Email 等）を UT-17 側で確定 | UT-17 | `outputs/phase-12/implementation-guide.md` §2-6 |
| 4 | Presigned URL 発行ロジック（`apps/api` のアプリケーション層実装） | 実装 | `apps/api` 内で AWS SDK 互換 Presigned URL or Workers binding 経由のシグネチャ発行 API を実装。クライアント直アップロード経路の検証は Phase 11 smoke 手順を再利用 | `future-file-upload-implementation` | `outputs/phase-02/r2-architecture-design.md`（採用案 F: プライベート + Presigned URL） |
| 5 | `apps/web` への R2 binding / direct access 混入検出 guard | 自動検証 | `apps/web/wrangler.toml` と `apps/web/**` に `r2_buckets` / `R2_BUCKET` / R2 direct access が混入しないことを pre-commit または CI grep で検出 | `UT-R2-APP-WEB-BINDING-GUARD-001` ([#98](https://github.com/daishiman/UBM-Hyogo/issues/98)) | `outputs/phase-10/review-decision.md` M-3 / `outputs/phase-07/coverage-report.md` |

## 配置先への参照

各項目は `docs/30-workflows/unassigned-task/` 配下にエントリ化される（または既存ファイルに追記される）想定で、以下の参照経路を持つ:

- `docs/30-workflows/unassigned-task/<task-id>.md` → 本ファイル `outputs/phase-12/unassigned-task-detection.md` を上流参照として記録
- `docs/30-workflows/unassigned-task/index.md` → 検出件数（5 件）を集計

## 検出方針の根拠

- **0 件報告は禁止**（[P38 再発防止]）。本タスクは docs-only であっても下流実装・関連タスクへの引き継ぎ事項が必ず存在する。
- 検出は AC-1〜AC-8 / Phase 10 MINOR 申し送り / Phase 12 implementation-guide §2-6 を突合して抽出した。
