# ut-09-sheets-to-d1-cron-sync-job - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-09 |
| タスク名 | Sheets→D1 同期ジョブ実装 |
| ディレクトリ | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job |
| Wave | 1 |
| 実行種別 | parallel（独立着手可能、UT-01/03/04 完了後） |
| 作成日 | 2026-04-27 |
| 担当 | unassigned |
| 状態 | completed |
| タスク種別 | implemented / application_implementation（Cloudflare Workers Cron Triggers + D1 mutation の実装） |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| GitHub Issue | #11 (CLOSED) |

## 目的

UT-01 で設計した Google Sheets→Cloudflare D1 の同期アーキテクチャに基づき、Cloudflare Workers Cron Triggers を用いた定期同期ジョブを `apps/api` 内に実装・デプロイし、アプリケーションが常に最新のバンドマンデータを参照できる状態を確立する。WAL 非前提で `SQLITE_BUSY` retry/backoff・queue serialization・短い transaction・batch-size 制限を含む、堅牢な同期パイプラインを構築する。

## スコープ

### 含む

- Cloudflare Workers Cron Triggers による定期同期ジョブの実装（`apps/api` 内）
- Google Sheets API v4 からのデータ取得処理（UT-03 の認証方式を再利用）
- 取得データの D1 スキーマへのマッピング・upsert 処理（UT-04 のスキーマに準拠）
- 差分同期の実装（全件上書きか差分比較かは UT-01 の設計判断に従う）
- Cron Trigger のスケジュール設定（`wrangler.toml` への記述）
- 同期ジョブの実行ログの D1 への記録
- D1 write/read contention 対策（`SQLITE_BUSY` retry/backoff、write queue serialization、短い transaction、batch-size 制限）
- 手動トリガーエンドポイント（`/admin/sync` 等）の実装（デバッグ用、認証必須）
- dev / main 環境別の Cron スケジュール設定
- 1000行超データ対応（Sheets API `spreadsheets.values.get` の `ValueRange` を前提に、固定 A1 range 分割または全range取得後の chunk 処理で実装）
- 二重実行防止のための同期ロックフラグ排他制御

### 含まない

- 同期アーキテクチャの設計判断（UT-01 で完了済みのため再設計しない）
- Google Sheets API の認証方式選定（UT-03 で完了済み）
- D1 スキーマの新規設計（UT-04 で完了済み）
- エラーハンドリング標準化の方針策定（UT-10 で別途定義）
- 通知機能（UT-07）との連携実装
- モニタリング/アラートのダッシュボード設計（UT-08 で別途定義）
- 本番環境での E2E 動作確認（UT-26 staging-deploy-smoke で確認）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-01（Sheets→D1 同期方式定義） | 同期アーキテクチャ（push/pull/cron 等の方式・タイミング・エラー方針）の設計ドキュメントが完成していること |
| 上流 | UT-03（Sheets API 認証方式設定） | Google Sheets API への認証フローが実装済みで、Secret が 1Password Environments に登録されていること |
| 上流 | UT-04（D1 データスキーマ設計） | D1 のテーブル定義・マイグレーションファイルが確定・適用済みであること |
| 上流 | UT-02（D1 WAL mode 設定可否確認） | WAL 非対応時の runtime mitigation 設計を本タスクの実装要件として継承する |
| 下流 | UT-07（通知基盤設計と導入） | 同期ジョブの完了/失敗を通知基盤へ連携する場合の上流になる |
| 下流 | UT-08（モニタリング/アラート設計） | 同期ジョブの失敗を監視対象メトリクスに含めるため |
| 下流 | UT-10（エラーハンドリング標準化） | UT-09 実装後にリトライ・ロールバック方針を UT-10 でフォーマライズするため |
| 並列 | UT-21（sheets-d1-sync-endpoint-and-audit-implementation） | `/admin/sync` エンドポイントの監査ログ実装は UT-21 でも扱うため、API 契約を整合させる |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | apps/api 境界・data flow 確認 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cron Triggers / wrangler.toml 設定方針 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | D1 スキーマ・upsert 規約 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | `/admin/sync` 命名規約・認可境界 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Service Account JSON 取り扱い・Cloudflare Secrets |
| 必須 | docs/30-workflows/unassigned-task/UT-09-sheets-d1-sync-job-implementation.md | 原典 unassigned-task スペック |
| 必須 | docs/30-workflows/completed-tasks/ut-02-d1-wal-mode/index.md | WAL 非前提方針の継承元 |
| 参考 | https://developers.cloudflare.com/workers/configuration/cron-triggers/ | Cron Triggers 公式ドキュメント |
| 参考 | https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get | Sheets API v4 リファレンス |

## 受入条件 (AC)

- AC-1: Cron Trigger による同期ジョブが dev 環境で定期実行されることを確認している
- AC-2: Google Sheets から取得したデータが D1 に正しくマッピング・格納されることを確認している
- AC-3: 同一データを2回同期しても重複が発生しない（冪等性）ことをテストで確認している
- AC-4: 1000件超のデータに対して、固定 A1 range 分割または全range取得後の chunk 処理が機能することを確認している（または初期データ件数上限の合意がある）
- AC-5: `/admin/sync` エンドポイントが認証付きで動作することを確認している
- AC-6: 同期ジョブの実行ログ（開始・終了・件数・エラー）が D1 に記録されることを確認している
- AC-7: `SQLITE_BUSY` retry/backoff、write queue serialization、短い transaction、batch-size 制限が実装・テストされている
- AC-8: staging load/contention test で、WAL 非前提でも同期ジョブと API 読み取りが破綻しないことを確認している
- AC-9: Service Account JSON が Cloudflare Secrets 経由で注入され、コードにハードコードされていない
- AC-10: `wrangler.toml` に dev / main 環境別の Cron スケジュールが設定されている
- AC-11: 4条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS である

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/sync-job-design.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | completed | outputs/phase-04/test-strategy.md |
| 5 | 実装ランブック | phase-05.md | completed | outputs/phase-05/implementation-runbook.md |
| 6 | 異常系検証 | phase-06.md | completed | outputs/phase-06/failure-cases.md |
| 7 | AC マトリクス | phase-07.md | completed | outputs/phase-07/ac-matrix.md |
| 8 | DRY 化 | phase-08.md | completed | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/go-no-go.md |
| 11 | 手動 smoke test | phase-11.md | completed | outputs/phase-11/manual-smoke-log.md |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/implementation-guide.md |
| 13 | PR作成 | phase-13.md | approval_required | outputs/phase-13/main.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（4条件評価含む） |
| 設計 | outputs/phase-02/sync-job-design.md | 同期ジョブ全体構成・モジュール設計・Mermaid 図 |
| 設計 | outputs/phase-02/d1-contention-mitigation.md | D1 競合対策（retry/backoff、queue serialization） |
| レビュー | outputs/phase-03/main.md | 代替案3種以上 + PASS/MINOR/MAJOR 判定 |
| テスト | outputs/phase-04/test-strategy.md | unit / contract / E2E / authorization 設計 |
| 実装 | outputs/phase-05/implementation-runbook.md | ファイル一覧・擬似コード・runbook |
| 異常系 | outputs/phase-06/failure-cases.md | 401/403/404/422/5xx/sync 失敗シナリオ |
| AC | outputs/phase-07/ac-matrix.md | AC × 検証 × 実装 のトレーサビリティマトリクス |
| QA | outputs/phase-09/free-tier-estimation.md | Cloudflare Workers / D1 / Google API 無料枠見積もり |
| ゲート | outputs/phase-10/go-no-go.md | GO/NO-GO 判定・blocker 一覧 |
| 証跡 | outputs/phase-11/manual-smoke-log.md | wrangler dev --test-scheduled 実行ログ等 |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生向け） + Part 2（技術者向け） |
| ガイド | outputs/phase-12/system-spec-update-summary.md | 仕様書同期サマリー |
| ガイド | outputs/phase-12/documentation-changelog.md | ドキュメント更新履歴 |
| ガイド | outputs/phase-12/unassigned-task-detection.md | 未タスク検出レポート（0件でも出力） |
| ガイド | outputs/phase-12/skill-feedback-report.md | スキルフィードバック |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare Workers | apps/api ランタイム / Cron Triggers | 無料枠（1日100,000 requests） |
| Cloudflare D1 | DB（同期先・ログ記録） | 無料枠（5GB / 25M reads / 50K writes） |
| Cloudflare Secrets | Service Account JSON 格納 | 無料 |
| Google Sheets API v4 | 同期元データ取得 | 無料（300 req/min/project） |
| wrangler CLI | Cron 開発・デプロイ | 無料 |
| GitHub Actions | CI / デプロイ | 無料枠 |

## Secrets 一覧（このタスクで導入・参照）

| Secret 名 | 用途 | 注入経路 | 1Password Vault |
| --- | --- | --- | --- |
| `GOOGLE_SHEETS_SA_JSON` | Service Account JSON 文字列（`JSON.stringify` 済み） | Cloudflare Secret → Workers env | UBM-Hyogo / dev / main |
| `SHEETS_SPREADSHEET_ID` | 同期元シート ID | Cloudflare Variable | UBM-Hyogo / dev / main |
| `SYNC_ADMIN_TOKEN` | `/admin/sync` 認証トークン | Cloudflare Secret | UBM-Hyogo / dev / main |

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #1 | 実フォームの schema をコードに固定しすぎない | Sheets→D1 マッピングは UT-04 スキーマ層に閉じ、ハードコードしない |
| #4 | Google Form schema 外のデータは admin-managed data として分離 | Sheets 由来の admin-managed data を D1 の専用テーブルに格納 |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | 同期ジョブは `apps/api` 内のみ。`apps/web` から直接アクセスしない |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致する
- AC-1〜AC-11 が Phase 7 / 10 で完全トレースされる
- 4条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- Phase 12 の same-wave sync ルール（LOGS.md 2ファイル / SKILL.md 2ファイル / topic-map）が破られていない
- Phase 13 はユーザー承認なしでは実行しない

## 苦戦箇所・知見

**1. Cloudflare Workers Cron Triggers の local 開発難易度**
`wrangler dev` では Cron Triggers がデフォルトで起動しない。`wrangler dev --test-scheduled` フラグまたは `/__scheduled` エンドポイントへの手動 POST を使う。CI でも、Cron ロジックを通常関数として export し単体テスト可能な設計にする。

**2. Google Sheets API の大容量行対応**
`spreadsheets.values.get` は成功時に `ValueRange` を返し、`nextPageToken` を返さない。1000行超を扱う場合は固定 A1 range 分割、または全range取得後に Workers 内で 100 行単位へ chunk して D1 に書き込むこと。

**3. D1 batch write のメモリ制限**
`db.batch()` 利用は必須だが、Workers の128MB メモリ制限に注意。1バッチ100件を上限として固定。

**4. WAL 非前提の競合対策**
UT-02 で WAL 永続設定は条件付き選択肢に再定義された。本タスクは WAL に依存せず、`SQLITE_BUSY` retry/backoff、write queue serialization、短い transaction、batch-size 制限を実装要件とする。staging load/contention test で破綻しないことを確認する。

**5. 冪等性の保証**
upsert（`INSERT ... ON CONFLICT DO UPDATE`）必須。同期開始時に D1 のロックフラグをセットし二重実行を防ぐ。

**6. Service Account JSON の Secret 化**
`JSON.stringify` 済み文字列として登録し、Workers 内で `JSON.parse`。1Password Environments での保存形式も同じく文書化する。

## 関連リンク

- 上位 README: ../README.md
- 共通テンプレ: ../_templates/phase-template-app.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/11
- 原典 unassigned-task: ../../unassigned-task/UT-09-sheets-d1-sync-job-implementation.md
