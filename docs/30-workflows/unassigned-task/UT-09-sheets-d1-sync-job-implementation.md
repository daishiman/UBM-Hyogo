# UT-09: Sheets→D1 同期ジョブ実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-09 |
| タスク名 | Sheets→D1 同期ジョブ実装 |
| 優先度 | HIGH |
| 推奨Wave | Wave 1 |
| 状態 | unassigned |
| 作成日 | 2026-04-23 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |

## 目的

UT-01 で設計した Google Sheets→Cloudflare D1 の同期アーキテクチャに基づき、Cloudflare Workers Cron Triggers を用いた定期同期ジョブを実装・デプロイし、アプリケーションが常に最新のバンドマンデータを参照できる状態を確立する。

## スコープ

### 含む
- Cloudflare Workers Cron Triggers による定期同期ジョブの実装（`apps/api` 内）
- Google Sheets API v4 からのデータ取得処理（UT-03 の認証方式を利用）
- 取得データの D1 スキーマへのマッピング・upsert 処理（UT-04 のスキーマに準拠）
- 差分同期の実装（全件上書きか差分比較かは UT-01 の設計判断に従う）
- Cron Trigger のスケジュール設定（wrangler.toml への記述）
- 同期ジョブの実行ログの D1 への記録
- D1 write/read contention 対策（`SQLITE_BUSY` retry/backoff、write queue serialization、短い transaction、batch-size 制限）
- 手動トリガーエンドポイント（`/admin/sync` 等）の実装（デバッグ用）
- dev / main 環境別の Cron スケジュール設定

### 含まない
- 同期アーキテクチャの設計判断（UT-01 で完了済みのため再設計しない）
- Google Sheets API の認証方式選定（UT-03 で完了済み）
- D1 スキーマの新規設計（UT-04 で完了済み）
- エラーハンドリング標準化の方針策定（UT-10 で別途定義）
- 通知機能（UT-07）との連携

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-01（Sheets→D1 同期方式定義） | 同期アーキテクチャ（push/pull/cron 等の方式・タイミング・エラー方針）の設計ドキュメントが完成していること |
| 上流 | UT-03（Sheets API 認証方式設定） | Google Sheets API への認証フローが実装済みで、Secret が 1Password Environments に登録されていること |
| 上流 | UT-04（D1 データスキーマ設計） | D1 のテーブル定義・マイグレーションファイルが確定・適用済みであること |
| 下流 | UT-07（通知基盤設計と導入） | 同期ジョブの完了/失敗を通知基盤へ連携する場合の上流になる |
| 下流 | UT-08（モニタリング/アラート設計） | 同期ジョブの失敗を監視対象メトリクスに含めるため |
| 下流 | UT-10（エラーハンドリング標準化） | UT-09 実装後にリトライ・ロールバック方針を UT-10 でフォーマライズするため |

## UT-08 設計ハンドオフ

UT-08 監視・アラート設計は、Sheets→D1 同期失敗を主要な監視対象として扱う。UT-09 実装時は、Cron 間隔・エラー分類・成功/失敗ログ形式を UT-08-IMPL の `cron.sync.*` イベントと整合させる。

| 項目 | UT-08 側の現在地 |
| --- | --- |
| WAE イベント | `cron.sync.start` / `cron.sync.end` |
| 失敗ルール | 24h 1 件で WARNING、連続 2 回で CRITICAL |
| 未起動検知 | 最終成功から 26h 超過で WARNING |
| 参照 | `docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/failure-detection-rules.md` |

## 着手タイミング

> **着手前提**: UT-01（同期方式定義）・UT-03（Sheets API 認証）・UT-04（D1 スキーマ設計）の3つが全て完了してから着手すること。UT-06（本番デプロイ）完了後にステージング/本番での動作確認が可能になる。

| 条件 | 理由 |
| --- | --- |
| UT-01 完了 | 同期方式（push/pull/cron）と冪等性設計が確定していないと実装が迷走する |
| UT-03 完了 | Sheets API 認証フローが実装されていないとジョブが Sheets にアクセスできない |
| UT-04 完了 | D1 スキーマが確定していないと INSERT/UPSERT 先が定まらない |

## 苦戦箇所・知見

**Cloudflare Workers Cron Triggers の local 開発難易度**
`wrangler dev` では Cron Triggers がデフォルトで起動しない。`wrangler dev --test-scheduled` フラグを使うか、`/__scheduled` エンドポイントへ手動リクエストを送る必要がある。CI テストでも同様に、Cron のロジックを通常のエクスポート関数として単体テスト可能な設計にしておくこと。

**Google Sheets API の行数上限・ページネーション**
Sheets API は1回のリクエストで返せる行数に上限（デフォルト約 1000 行）があり、大量データの場合はページネーションが必要。バンドマン数が少ない初期は問題ないが、`nextPageToken` を使った繰り返し取得を最初から実装しておかないと後で改修コストが高くなる。

**D1 の batch write パフォーマンス**
D1 への書き込みは1件ずつ `INSERT` を発行すると遅延が大きい。`db.batch()` を使ってトランザクション単位でまとめ書きすることでパフォーマンスを改善する。ただし batch のサイズが大きすぎると Workers のメモリ制限（128MB）に抵触するため、1バッチあたりの上限件数（例: 100件）を設定すること。

**D1 journal_mode=WAL を前提にしない競合対策**
UT-02 の close-out で、Cloudflare D1 の永続 `PRAGMA journal_mode=WAL` は official compatible PRAGMA として確認できるまで production mutation しない方針に固定した。UT-09 は WAL 設定済み前提ではなく、`SQLITE_BUSY` retry/backoff、同期ジョブの queue serialization、短い transaction、batch-size 制限、staging load/contention test を実装要件として扱う。

**同期の冪等性保証**
Cron が二重実行した場合や途中で失敗して再実行した場合に、データが重複・欠損しないよう upsert（INSERT OR REPLACE / ON CONFLICT DO UPDATE）を必ず使うこと。また同期ジョブ開始時に D1 の同期ロックフラグをセットし、二重実行を防ぐ排他制御を検討すること。

**Service Account JSON の安全な管理**
Google Sheets API の Service Account JSON は複数フィールドを含む JSON ファイルであり、Cloudflare Workers の Secret へ文字列として登録する際にエスケープが必要。`JSON.stringify` でシリアライズして登録し、Workers 内で `JSON.parse` して使う方法を標準化すること。1Password Environments に登録する際もこの形式を文書化しておく。

## 実行概要

- `apps/api/src/jobs/sync-sheets-to-d1.ts`（仮）に同期ジョブのメイン処理を実装し、`ScheduledController` の `scheduled` ハンドラに登録する
- UT-03 の認証実装を利用して Google Sheets API v4 からデータを取得し、UT-04 のスキーマにマッピングする型変換関数を作成する
- D1 への upsert は `db.batch()` を使い、100件単位でチャンク分割して書き込む
- D1 書き込みは queue serialization で直列化し、`SQLITE_BUSY` 発生時は指数 backoff 付き retry を行う
- `wrangler.toml` の `[triggers]` セクションに Cron スケジュール（例: `"0 */6 * * *"`）を追記し、dev / main 環境で異なる間隔を設定する
- `/admin/sync` エンドポイントを `apps/api` に追加し、開発者が手動で同期をトリガーできるようにする（認証必須）

## 完了条件

- [ ] Cron Trigger による同期ジョブが dev 環境で定期実行されることを確認している
- [ ] Google Sheets から取得したデータが D1 に正しくマッピング・格納されることを確認している
- [ ] 同一データを2回同期しても重複が発生しない（冪等性）ことをテストで確認している
- [ ] 1000件超のデータに対してページネーションが機能することを確認している（またはデータ件数上限の合意がある）
- [ ] `/admin/sync` エンドポイントが認証付きで動作することを確認している
- [ ] 同期ジョブの実行ログ（開始・終了・件数・エラー）が D1 に記録されることを確認している
- [ ] `SQLITE_BUSY` retry/backoff、write queue serialization、短い transaction、batch-size 制限が実装・テストされている
- [ ] staging load/contention test で、WAL 非前提でも同期ジョブと API 読み取りが破綻しないことを確認している
- [ ] Service Account JSON が Secret 経由で注入され、コードにハードコードされていない
- [ ] `wrangler.toml` に dev / main 環境別の Cron スケジュールが設定されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | UT-01 の成果物（同期アーキテクチャ設計書） | 同期方式・タイミング・エラー方針の確認 |
| 必須 | UT-03 の成果物（Sheets API 認証実装） | 認証フローの再利用 |
| 必須 | UT-04 の成果物（D1 スキーマ・マイグレーションファイル） | テーブル定義・upsert 対象の確認 |
| 参考 | doc/00-serial-architecture-and-scope-baseline/outputs/phase-12/unassigned-task-detection.md | UT-09 の原典記録 |
| 参考 | https://developers.cloudflare.com/workers/configuration/cron-triggers/ | Cloudflare Workers Cron Triggers 公式ドキュメント |
| 参考 | https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get | Sheets API v4 データ取得リファレンス |
