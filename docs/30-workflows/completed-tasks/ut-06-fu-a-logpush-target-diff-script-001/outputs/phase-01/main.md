# Phase 1 成果物: 要件定義 (UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001)

## 1. 真の論点

**「4 軸 (Workers Logs / Tail / Logpush / Analytics Engine) すべてについて、新 Worker `ubm-hyogo-web-production` と旧 Worker `ubm-hyogo-web` のどちらに observability target が紐付いているかを script 1 本で diff 可能にし、token / sink credential / dataset key を一切出力に残さないこと」**。

副次論点: Cloudflare API plan 制限で取得不可な項目は dashboard fallback として明示し、exit code 0 を維持する。

## 2. visualEvidence / taskType 確定

| 項目 | 値 |
| --- | --- |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |
| 規模 | small |
| 検証手段 | unit test (redaction) / contract test (cf.sh wrapper) / golden output diff |

## 3. 4 軸 × 取得方法 × redaction マトリクス

| # | 観測経路 | 取得方法 | 出力許可 | redaction 対象 |
| --- | --- | --- | --- | --- |
| R1 | Workers Logs | `wrangler.toml` の `[observability]` parse + `bash scripts/cf.sh` 経由 metadata 確認 | enabled / head_sampling_rate / target Worker 名 | dataset credential / API token |
| R2 | Tail | Worker 名解決のみ (実 tail を行わない) | tail 可能性 / target Worker 名 | 実 tail 出力 / Authorization / Cookie |
| R3 | Logpush | `bash scripts/cf.sh` 経由 `GET /accounts/{id}/logpush/jobs` | job 名 / dataset / host / enabled / filter 概要 | destination_conf URL / sink credential / token |
| R4 | Analytics Engine | `wrangler.toml` の `[[analytics_engine_datasets]]` parse | binding 名 / dataset 名 / target Worker 名 | dataset write key / query key |

## 4. 受入基準 (AC)

- **AC-1** 新 Worker (`ubm-hyogo-web-production`) と旧 Worker (`ubm-hyogo-web`) の両方の observability target を一覧化する。両 inventory が出力に必須。
- **AC-2** token / secret / sink credential / dataset write key / Authorization / OAuth トークン値が一切出力されない。token-like fixture を投入しても出力は host / dataset / worker target name のみとなることを unit test で検証。
- **AC-3** 4 軸 (R1〜R4) を網羅。取得不可項目は `N/A (dashboard fallback: ...)` と出力。
- **AC-4** 親タスク runbook (`docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/`) からの導線が追加される。
- **AC-5** 全実行が `bash scripts/cf.sh` ラッパー経由でのみ可能。`wrangler` 直叩き / `curl` 直接 API 呼び出し / `wrangler login` は実装に含めない。

## 5. スコープ

### 含むもの
- 4 軸 observability target の read-only 一覧化 script (`scripts/observability-target-diff.sh`)
- redaction logic 共通化 (`scripts/lib/redaction.sh`)
- 新旧 Worker 比較 diff 出力
- 親タスク runbook への導線追記
- redaction の unit test + golden output

### 含まないもの
- Logpush job の作成 / 削除 / 変更 (mutation)
- Analytics dataset の操作
- production deploy 実行 / 旧 Worker 物理削除 / route 移譲
- staging 環境の同等 diff
- dashboard UI の自動操作

## 6. 制約 (C-1〜C-7)

| # | 制約 | 順守方法 |
| --- | --- | --- |
| C-1 | `wrangler` 直接実行禁止 | 全 Cloudflare 呼び出しは `bash scripts/cf.sh` 経由 |
| C-2 | `.env` 実値・OAuth トークンを出力に残さない | redaction logic で token-like を検出置換、golden で検証 |
| C-3 | `wrangler login` 禁止 | `op run --env-file=.env` 経由のみ |
| C-4 | observability 設定の mutation 禁止 | HTTP method は GET のみ |
| C-5 | 旧 Worker 削除導線に接続しない | 出力に削除推奨文言を含めない |
| C-6 | sink URL / dataset credential を出力しない | host / dataset name / worker target name のみ許可 |
| C-7 | API plan 差で取得不可項目は dashboard fallback として明示 | エラー時 exit 0 で `N/A (dashboard fallback: <経路>)` |

## 7. 4 条件チェック

| 条件 | 評価 |
| --- | --- |
| 矛盾なし | PASS — read-only / mutation 禁止 / redaction 完全性は内部で衝突しない |
| 漏れなし | PASS — 4 軸 R1〜R4 と AC-1〜AC-5 が 1:1 対応 |
| 整合性 | PASS — CLAUDE.md `Cloudflare 系 CLI 実行ルール` と整合 |
| 依存関係整合 | PASS — 親タスク (route-secret-observability-design) の Worker 名特定を前提に成立 |

## 8. 完了

- visualEvidence = NON_VISUAL / taskType = implementation
- 4 軸マトリクスと AC-1〜AC-5、C-1〜C-7 を Phase 2 入力として固定
