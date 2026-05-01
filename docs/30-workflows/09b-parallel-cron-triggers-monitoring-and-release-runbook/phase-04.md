# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09b-parallel-cron-triggers-monitoring-and-release-runbook |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | 9 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | pending |

## 目的

cron schedule / 監視 / runbook 検証を 4 層（unit / integration / runbook 走破 / chaos）に分割し、各 AC を verify suite に対応付ける。

## 実行タスク

1. verify suite 4 層 × 各層 3〜5 ケース
2. AC ↔ verify suite matrix
3. 失敗時差し戻し先

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/03-data-fetching.md | 二重起動防止 / 部分失敗運用 |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | cron / リリース前チェック |
| 必須 | docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver/index.md | response sync test |

## 実行手順

### ステップ 1: verify suite 4 層
- unit / integration / runbook 走破 / chaos

### ステップ 2: AC matrix

### ステップ 3: 差し戻し先

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | suite を runbook の sanity check に紐付け |
| Phase 7 | AC matrix |
| Phase 11 | manual evidence で chaos suite を実行 |
| 並列 09a | runbook 走破 suite で staging を試走 |

## 多角的チェック観点（不変条件）

- #5: rollback test で web に D1 操作が含まれないこと
- #6: cron 設定検査で apps script trigger がないこと
- #10: 24h 試算で 100k 内
- #15: attendance 重複 / 削除済み除外を rollback test で確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | verify suite 4 層設計 | 4 | pending | unit/integration/runbook/chaos |
| 2 | AC matrix | 4 | pending | 9 AC × N suite |
| 3 | 差し戻し先 | 4 | pending | 03a/b, 04c, 02c |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | 戦略サマリ |
| ドキュメント | outputs/phase-04/verify-suite.md | 4 層 × ケース |
| メタ | artifacts.json | Phase 4 を completed に更新 |

## 完了条件

- [ ] 4 層 × 3〜5 ケース = 12〜20 ケース
- [ ] AC 9 件すべて対応
- [ ] 各 suite に確認コマンド付与

## タスク100%実行確認【必須】

- 全実行タスクが completed
- verify-suite.md 完成
- 未対応 AC 0 件
- artifacts.json の phase 4 を completed に更新

## 次 Phase

- 次: 5 (実装ランブック)
- 引き継ぎ事項: verify suite / AC matrix / 差し戻し先
- ブロック条件: 未対応 AC で次 Phase に進まない

## Verify suite 設計

### 1. unit 層（cron 定義 / 監視 placeholder）

| ID | ケース | 期待 |
| --- | --- | --- |
| U-1 | `apps/api/wrangler.toml` に `[triggers] crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]` 存在（spec / placeholder） | grep 1 hit |
| U-2 | release runbook に Cloudflare Analytics URL（Workers / D1 / Pages × staging / production = 6 URL）が記載 | 6 hit |
| U-3 | Sentry DSN / Logpush placeholder が runbook に記載（実値ではない） | placeholder 表記 |

### 2. integration 層（sync_jobs 二重起動防止）

| ID | ケース | 期待 |
| --- | --- | --- |
| I-1 | sync_jobs に `running` レコードがある状態で cron が起動 | 新規 job を作らずスキップ（spec/03-data-fetching.md 準拠） |
| I-2 | sync 失敗時 `failed` + error message 保存 | sync_jobs.status='failed', error カラムに stack |
| I-3 | 部分失敗時 直近成功 view model を返し `sync_unavailable` 警告 | API response に warning フィールド |

### 3. runbook 走破層

| ID | ケース | 期待 |
| --- | --- | --- |
| R-1 | release runbook を staging で完全走破 | 全ステップ exit 0 |
| R-2 | rollback 手順を staging で完全走破（worker / pages） | rollback 後の URL が直前 deploy に戻る |
| R-3 | cron 一時停止 → sync 停止 → 再開 → sync 再開 | 各遷移で sync_jobs 状態が想定通り |

### 4. chaos 層

| ID | ケース | 期待 |
| --- | --- | --- |
| C-1 | Forms API 429 を mock | sync_jobs.failed + retry 設計通り |
| C-2 | D1 read timeout | sync_jobs.failed + alert 発火（placeholder） |
| C-3 | wrangler deploy 中の cron 起動 | 二重起動防止 + 既存 job 完走 |
| C-4 | 無料枠 100k req/day 直前 | Cloudflare Analytics で alert 発火（placeholder） |

## AC ↔ verify suite matrix

| AC | 対応 suite |
| --- | --- |
| AC-1 (wrangler.toml triggers) | U-1 |
| AC-2 (確認方法 runbook 記載) | U-1 + R-1 |
| AC-3 (release-runbook.md 完成) | R-1, R-2 |
| AC-4 (incident response runbook) | C-1〜C-4 + R-3 |
| AC-5 (dashboard URL 一覧) | U-2 + U-3 |
| AC-6 (sync_jobs running 参照) | I-1 |
| AC-7 (#5 rollback で web D1 操作なし) | R-2 |
| AC-8 (#6 GAS trigger なし) | U-1 (検査) |
| AC-9 (#10 cron 頻度 100k 内) | C-4 + 試算 |
