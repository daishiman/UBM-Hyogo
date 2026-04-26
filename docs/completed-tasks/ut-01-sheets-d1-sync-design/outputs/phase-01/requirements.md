# Phase 1 — 要件定義

## タスク分類

| 項目 | 値 |
|------|----|
| タスクID | ut-01-sheets-d1-sync-design |
| タスク種別 | docs-only |
| 実装ステータス | spec_created |
| 担当フェーズ | Phase 1（要件定義） |

---

## 上流タスク完了確認

| タスクID | 完了状態 | 備考 |
|---------|---------|------|
| 02-serial-monorepo-runtime-foundation | 完了前提 | blockerなし |
| 01b-parallel-cloudflare-base-bootstrap | 完了前提 | blockerなし |
| 01c-parallel-google-workspace-bootstrap | 完了前提 | blockerなし |
| 03-serial-data-source-and-storage-contract | 完了前提 | sync_audit テーブル定義はこのタスクで確定済み |

---

## 外部制約

### Google Sheets API

| 制約 | 値 | 対処方針 |
|------|----|---------|
| Quota上限 | 500 req / 100秒 | バッチサイズ500行/リクエスト + Exponential Backoff |
| 認証方式 | Service Account（OAuth 2.0） | apps/api 内で管理 |
| スコープ | `spreadsheets.readonly` | 読み取り専用で十分 |

### Cloudflare D1

| 制約 | 値 | 対処方針 |
|------|----|---------|
| アクセス経路 | apps/api 経由の Workers binding のみ | apps/web からの直接アクセス禁止（CLAUDE.md不変条件5） |
| 無料枠上限 | 5GB storage / 5M reads/day / 100K writes/day | バッチ500行・1日1回同期で余裕あり |

### Cloudflare Workers Cron Triggers

| 制約 | 値 | 備考 |
|------|----|------|
| 無料枠 | 3 Cron Trigger / Workerまで | 1つ使用で余裕あり |
| 最小間隔 | 1分 | 必要十分 |

---

## 同期方式候補

| 方式 | 概要 | 無料枠 | 実装コスト | 冪等性 | 信頼性 |
|------|------|-------|-----------|-------|-------|
| Push（Sheets → D1直接） | SheetsからD1への書き込みトリガー | 不可（D1はWorkers bindingのみ） | 高 | 低 | 低 |
| Poll（定期pull） | WorkerがSheetsを定期的に読み取る | 可（Cron Triggers） | 低 | 高（response_id） | 高 |
| Webhook（変更通知） | Sheets変更イベントをWorkerが受信 | 要Google Workspace有料 | 中 | 中 | 中 |
| Cron Triggers（pull方式） | Workers Cron がSheetsを定期取得 | 可（無料枠内） | 低 | 高（response_id UPSERT） | 高 |

**採択**: Cron Triggers（pull方式）— 無料枠内・実装コスト低・冪等性高

---

## AC事前充足可能性確認

| AC | 内容 | 充足可能性 |
|----|------|-----------|
| AC-1 | 同期方式比較表と採択理由 | 可 |
| AC-2 | 3種フロー図（手動/定期/バックフィル） | 可 |
| AC-3 | エラーハンドリング・リトライ・部分失敗方針 | 可 |
| AC-4 | sync_audit 監査契約の運用定義 | 可 |
| AC-5 | source-of-truth優先順位の明文化 | 可 |
| AC-6 | Sheets API quota対処方針 | 可 |
| AC-7 | UT-09が本仕様書を参照して実装着手可能 | 可 |

全AC充足可能と判断。

---

## Open Questions

| # | 課題 | 回答方針 |
|---|------|---------|
| OQ-1 | Sheetsの各行に一意キーが存在しない問題 | Googleフォーム回答の `response_id`（Sheets列として取得可能）を冪等キーとして使用。存在しない場合は行番号+タイムスタンプのfingerprintを補助キーとするが、Phase 2設計で詳細確定 |
| OQ-2 | バックフィル時の重複検出 | response_id による UPSERT（ON CONFLICT(response_id) DO UPDATE）で対応 |
