# ut-03-sheets-api-auth-setup - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-03 |
| タスク名 | Sheets API 認証方式設定 |
| ディレクトリ | docs/30-workflows/ut-03-sheets-api-auth-setup |
| Wave | 1 |
| 実行種別 | parallel（UT-01 と並列着手可能） |
| 作成日 | 2026-04-29 |
| 担当 | unassigned |
| 状態 | completed（Phase 1-12 + Sheets auth 実装完了 / Phase 13 pending） |
| タスク種別 | implementation / external_integration_auth |
| visualEvidence | NON_VISUAL |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| GitHub Issue | #52 (CLOSED — クローズのまま仕様書化) |

## 目的

Google Sheets API v4 への接続認証方式（Service Account JSON key vs OAuth 2.0）を選定し、Cloudflare Workers Edge Runtime 上で動作する認証フローを `packages/integrations/google` 内に閉じて構築する。Web Crypto API による JWT 署名と TTL 1h トークンキャッシュを `getSheetsAccessToken()` として公開し、UT-09（Cron 同期）/ UT-21（admin endpoint）の認証基盤を一元化する。

## スコープ

### 含む

- Service Account JSON key vs OAuth 2.0 比較評価
- Web Crypto API による JWT 署名フローの設計
- `packages/integrations/google/src/sheets/auth.ts` 認証モジュール仕様
- `GOOGLE_SERVICE_ACCOUNT_JSON` の Cloudflare Secrets / 1Password / `.dev.vars` 配置
- Service Account メールへの Sheets 共有手順 runbook 化
- 疎通確認スクリプト（Phase 11 manual smoke）

### 含まない

- 同期ロジック実装（UT-09）
- エンドユーザー OAuth ログイン（別タスク）
- Google Drive API 権限設定（01c-parallel-google-workspace-bootstrap）
- D1 スキーマ設計（UT-04）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | docs/30-workflows/completed-tasks/01c-parallel-google-workspace-bootstrap | Service Account 発行が完了していること |
| 上流 | docs/30-workflows/completed-tasks/02-serial-monorepo-runtime-foundation | `packages/integrations` の責務境界が確定していること |
| 上流 | UT-01（Sheets→D1 同期方式定義） | 必要な Sheets API スコープが確定していること |
| 下流 | UT-09（Sheets→D1 Cron 同期ジョブ実装）| 認証 client `getSheetsAccessToken()` を再利用 |
| 下流 | UT-21（sheets-d1-sync-endpoint-and-audit）| 同上 |
| 下流 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract | Sheets 接続認証が確立していることを前提 |
| 連携 | docs/30-workflows/completed-tasks/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync | CI/CD 環境への secret 配置 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-03-sheets-api-auth-setup.md | 原典スペック |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md | `packages/integrations` 責務境界 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare Secrets 配置方針 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | `.dev.vars` 管理 |
| 参考 | https://developers.google.com/identity/protocols/oauth2/service-account | Service Account JWT フロー |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | Web Crypto API |
| 参考 | https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get | Sheets API v4 |

## 受入条件 (AC)

- AC-1: Service Account JSON key vs OAuth 2.0 比較評価表（outputs/phase-02/main.md）
- AC-2: Web Crypto API による JWT 署名 → access_token → TTL 1h キャッシュフロー設計
- AC-3: シークレット配置マトリクス（Cloudflare Secrets / `.dev.vars` / 1Password / `.gitignore`）
- AC-4: SA メール Sheets 共有手順の runbook 化
- AC-5: `packages/integrations/google/src/sheets/auth.ts` モジュール構成（公開 API / 内部関数 / 依存）
- AC-6: Sheets API v4 疎通確認 placeholder（Phase 5 / Phase 11）
- AC-7: Node API 非依存（`google-auth-library` 不採用理由を Phase 3 に記録）
- AC-8: `JSON.parse` 失敗時のエラーハンドリング方針
- AC-9: 不変条件 #5（D1 不接触）遵守
- AC-10: dev / staging / production 3 環境すべての secret 配置経路

## 着手タイミング

- 着手前提: 01c-parallel-google-workspace-bootstrap 完了
- UT-01 と並列 OK
- 下流 UT-09 / UT-21 のブロッカー

## Phase 一覧

| Phase | 名称 | file | 状態 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed |
| 2 | 設計 | phase-02.md | completed |
| 3 | 設計レビュー | phase-03.md | completed |
| 4 | テスト戦略 | phase-04.md | completed |
| 5 | 実装ランブック | phase-05.md | completed |
| 6 | 異常系検証 | phase-06.md | completed |
| 7 | AC マトリクス | phase-07.md | completed |
| 8 | DRY 化 | phase-08.md | completed |
| 9 | 品質保証 | phase-09.md | completed |
| 10 | 最終レビュー | phase-10.md | completed |
| 11 | 手動 smoke (NON_VISUAL) | phase-11.md | completed |
| 12 | ドキュメント更新 | phase-12.md | completed |
| 13 | PR 作成 | phase-13.md | pending |

## 苦戦箇所（原典より継承）

1. Service Account JSON key vs OAuth 2.0 の選定迷い → Phase 2/3
2. Cloudflare Workers での JWT / token refresh の Node API 非互換 → Phase 2 (Web Crypto)
3. シークレット環境別管理と local 開発 → Phase 5 runbook + secret-hygiene
4. SA メール共有忘れ 403 PERMISSION_DENIED → Phase 5 ステップ 3 + Phase 11 manual smoke
