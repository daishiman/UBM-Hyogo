# Phase 12 出力: unassigned-task-detection.md
# 未タスク候補検出リスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | architecture-and-scope-baseline |
| Phase | 12 / 13 (ドキュメント更新) |
| 作成日 | 2026-04-23 |
| 状態 | completed |

---

## 未タスク候補一覧

本タスク (`architecture-and-scope-baseline`) の実施過程で検出した未タスク候補を記録する。これらは本タスクのスコープ外として除外されたが、将来のタスクとして実施が必要な項目である。

| # | タスク名 (仮) | 内容 | 優先度 | 推奨 Wave | 対応する OOS/MINOR | ブロック解消後に開始可 |
| --- | --- | --- | --- | --- | --- | --- |
| UT-01 | Sheets→D1 同期方式定義 | Google Sheets から Cloudflare D1 へのデータ同期アーキテクチャを設計する (push/pull/webhook/cron 等の方式選定・タイミング・エラーハンドリング) | HIGH | Wave 1 | OOS-01 / G-01 | 02-serial-monorepo-runtime-foundation 完了後 |
| UT-02 | D1 WAL mode 設定 | wrangler.toml に Cloudflare D1 の WAL (Write-Ahead Logging) mode を設定し、読み書き競合を最小化する | MEDIUM | Wave 1 | OOS-03 / G-03 | 02-serial-monorepo-runtime-foundation の一部として実施 |
| UT-03 | Sheets API 認証方式設定 | Google Sheets API v4 への接続認証方式 (Service Account JSON key / OAuth 2.0) を選定し、認証フローを実装する | HIGH | Wave 1 | OOS-02 / G-02 | UT-01 と合わせて実施 |
| UT-04 | D1 データスキーマ設計 | Cloudflare D1 の初期スキーマ (テーブル定義 / インデックス / 制約) を設計し、マイグレーションファイルを作成する | HIGH | Wave 1 | OOS-03 | 03-serial-data-source-and-storage-contract で実施 |
| UT-05 | CI/CD パイプライン実装 | GitHub Actions を使用して feature→dev→main のブランチプッシュ時に自動テスト・自動デプロイを行うパイプラインを構築する | MEDIUM | Wave 1 | OOS-06 | 02-serial-monorepo-runtime-foundation で実施 |
| UT-06 | 本番デプロイ実行 | Cloudflare Pages / Workers / D1 の本番環境への初回デプロイを実施し、動作確認を行う | HIGH | Wave 1 | OOS-05 | 02/03 タスク完了後 |
| UT-07 | 通知基盤設計と導入 | バンドマン向けの通知機能 (メール・LINE・Slack 等) の設計と実装を行う | LOW | Wave 2 以降 | OOS-04 | アプリケーションコア機能の実装後 |
| UT-08 | モニタリング/アラート設計 | Cloudflare Analytics や外部監視ツールを用いたシステム監視・障害アラートの仕組みを構築する | LOW | Wave 2 以降 | OOS-07 | Wave 1 全タスク完了後 |
| UT-09 | Sheets→D1 同期ジョブ実装 | UT-01 で設計した同期アーキテクチャに基づき、実際の同期処理 (Cloudflare Workers Cron Triggers 等) を実装する | HIGH | Wave 1 | OOS-01 | UT-01, UT-03, UT-04 完了後 |
| UT-10 | エラーハンドリング標準化 | API エラーレスポンス形式・Sheets 同期失敗時のリトライ戦略・D1 書き込み失敗時のロールバック方針を定義する | MEDIUM | Wave 1〜2 | - | 02/03 タスクの設計フェーズで定義 |

---

## 優先度別サマリー

| 優先度 | 件数 | 項目 |
| --- | --- | --- |
| HIGH | 4 | UT-01 (Sheets→D1同期方式), UT-03 (Sheets API認証), UT-04 (D1スキーマ設計), UT-06 (本番デプロイ), UT-09 (同期ジョブ実装) |
| MEDIUM | 3 | UT-02 (D1 WAL mode), UT-05 (CI/CD), UT-10 (エラーハンドリング) |
| LOW | 2 | UT-07 (通知基盤), UT-08 (モニタリング) |

---

## Wave 別配置推奨

| Wave | タスク | 前提条件 |
| --- | --- | --- |
| Wave 1 (02-serial-monorepo-runtime-foundation) | UT-02, UT-05, (UT-06 一部) | 本タスク完了後に開始可能 |
| Wave 1 (03-serial-data-source-and-storage-contract) | UT-01, UT-03, UT-04, UT-09 | 本タスク完了後に開始可能 |
| Wave 1 (新規タスク検討) | UT-10 | 02/03 の設計フェーズで定義 |
| Wave 2 以降 (未タスク) | UT-07, UT-08 | Wave 1 全タスク完了後 |

---

## 完了確認

- [x] 未タスク候補一覧作成済み (UT-01〜UT-10 / 10件)
- [x] 優先度別サマリー作成済み
- [x] Wave 別配置推奨記載済み
- [x] 各候補に対応する OOS/MINOR との紐付け記載済み
