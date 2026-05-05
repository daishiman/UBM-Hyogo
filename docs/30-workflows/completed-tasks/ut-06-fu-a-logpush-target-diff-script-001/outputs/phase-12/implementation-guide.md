# Implementation guide — UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001

production observability target diff script の追加 (read-only / 完全 redaction)。

## Part 1: 中学生向け説明

この変更は、本番サイトの「見守り先」が新しい Worker と古い Worker でずれていないかを確認するための道具を追加したものです。

学校の放送室を例にすると、放送が新しい教室に届いているつもりでも、実は古い教室のスピーカーを見ていたら、問題が起きた時に気づけません。この script は、Workers Logs / Tail / Logpush / Analytics Engine という 4 つの見守り先を、新旧 Worker で見比べます。

大事な約束は 3 つです。

| 約束 | 意味 |
| --- | --- |
| 読み取り専用 | Cloudflare の設定を作ったり消したりしない |
| 秘密を隠す | token / credential / URL query は出力前に伏字にする |
| 画面なし | UI 変更ではないためスクリーンショットではなく text evidence で確認する |

実行入口は `bash scripts/cf.sh observability-diff ...` です。中では `scripts/observability-target-diff.sh` が動きます。

## Part 2: 技術者向け実装ガイド

### 概要

`ubm-hyogo-web-production` (新 Worker) と `ubm-hyogo-web` (旧 Worker) の observability target (Workers Logs / Tail / Logpush / Analytics Engine) を `bash scripts/cf.sh` ラッパー経由で取得し、redaction を通したうえで diff 出力する read-only script を `scripts/` 配下に追加する。secret / token / sink URL credential が出力に一切残らないことを redaction module + golden + integration test で機械検証する。

GitHub Issue: #329 / 親タスク: UT-06-FU-A-PROD-ROUTE-SECRET-001

## Why

production deploy 後の障害観測漏れを防ぐため、4 軸 observability target の新旧 Worker 差分を script 1 本で機械検出可能にする。親タスクが手動 runbook で整備した dashboard 確認手順を、redaction を保証した read-only diff script で補完する。

## What

### 追加ファイル
- `scripts/observability-target-diff.sh` — 本 script 本体 (CLI / fetch / diff / format / 出力)
- `scripts/lib/redaction.sh` — redaction 共通関数 (R-01〜R-06)
- `tests/unit/redaction.test.sh` — redaction 単体テスト (11 ケース)
- `tests/integration/observability-target-diff.test.sh` — script 統合テスト (18 ケース)
- `tests/fixtures/observability/{logpush-with-token.json, logpush-empty.json, api-error-403.json, sink-url-with-query.txt}` — 合成 fixture
- `tests/golden/{diff-mismatch.md, usage.txt}` — golden 比較用
- `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-12/observability-diff-runbook.md` — 親タスク runbook 追記

### 変更ファイル
- `scripts/cf.sh` — 以下 2 サブコマンドを追加。スタンドアロン script を残しつつ、運用入口を `cf.sh` に統一する方針に最終転換した結果。
  - `observability-diff` (経路 A): `cf_call` allowlist 経由ではなく、`scripts/with-env.sh` + `mise exec` で `scripts/observability-target-diff.sh` に直接 exec する。read-only 保証は呼び出し先 script の `cf_call` allowlist (`whoami` / `d1` / `kv` / `r2` / `tail` / `deployments`) と HTTP GET-only 制約に閉じる。
  - `api-get` (経路 B): `/client/v4/...` パスのみ allowlist し、`curl -fsS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"` で実行する read-only ラッパー。read-only 保証は (1) パス prefix 検査で他 endpoint を遮断、(2) curl の default method GET 依存、(3) `-X` 引数を `cf.sh` 側で受け付けない、の 3 点で担保する。

> 経路 A / 経路 B いずれも mutation を発しないが、保証メカニズムが異なる (A は呼び出し先 script の allowlist、B は curl default GET) ため、テスト側で経路ごとに固定化している (`tests/integration/observability-target-diff.test.sh` 参照)。

## How

### 使い方

```bash
bash scripts/cf.sh observability-diff \
  --current-worker ubm-hyogo-web-production \
  --legacy-worker  ubm-hyogo-web \
  --config apps/web/wrangler.toml
```

内部実装を直接確認する場合のみ `bash scripts/observability-target-diff.sh ...` を使う。運用 runbook では `scripts/cf.sh observability-diff` を公開入口とする。

| exit | 意味 |
| --- | --- |
| 0 | 一致 |
| 1 | 差分あり |
| 2 | API 失敗 / network / config 不在 |
| 3 | 認証失敗 |
| 64 | 引数不正 |

### redaction 仕様 (R-01〜R-06)

| ID | 対象 | 置換後 |
| --- | --- | --- |
| R-01 | 40 文字以上のランダム英数字 (token-like) | `***REDACTED_TOKEN***` |
| R-02 | Authorization / Bearer / Basic 値 | `***REDACTED_AUTH***` |
| R-03 | URL の query string (host を残す) | `host?***REDACTED***` |
| R-04 | AWS Access Key (`AKIA...`) | `***REDACTED_ACCESS_KEY***` |
| R-05 | named credentials (`dataset_credential` / `access_key_id` 等) | `field: ***REDACTED***` |
| R-06 | OAuth (`ya29.*`) | `***REDACTED_OAUTH***` |

stdout / stderr の両方に適用。一時ファイル生成しない (on-memory のみ)。

### read-only 保証

- 全 Cloudflare 呼び出しは `bash scripts/cf.sh` 経由 (`cf_call` allowlist: `whoami` / `d1` / `kv` / `r2` / `tail` / `deployments`)
- HTTP method GET only (script に POST/PUT/DELETE/PATCH リテラル 0 件、コメントを除く)
- `wrangler` / `wrangler login` 直叩き 0 件
- mutation 系操作 (Logpush job 作成・削除 / Analytics dataset 操作) を一切呼ばない

## 受入基準 (AC) と検証

| AC | 内容 | 検証 | 結果 |
| --- | --- | --- | --- |
| AC-1 | 新旧 Worker 両方の inventory を出力 | integration smoke で 4 軸 × current/legacy 出力確認 | PASS |
| AC-2 | secret / token / sink credential 出力 0 件 | unit test 11 / no-secret-leak audit | PASS |
| AC-3 | 4 軸 (Workers Logs / Tail / Logpush / Analytics) 網羅 | integration `## R1〜R4` セクション存在 | PASS |
| AC-4 | 親タスク runbook からの導線 | `observability-diff-runbook.md` 追記 | PASS |
| AC-5 | `bash scripts/cf.sh` 経由のみ | wrangler 直叩き grep 0 件 | PASS |

## テスト結果

```
$ bash tests/unit/redaction.test.sh
PASS=11 FAIL=0

$ bash tests/integration/observability-target-diff.test.sh
PASS=18 FAIL=0
```

## 既知の制限

- R3 Logpush は default で dashboard fallback (`N/A`) を返す。Cloudflare Logpush API は無料 plan で利用不可のため。`OBS_DIFF_FETCH_LOGPUSH=1` で取得試行は可能。
- shellcheck の機械実行は CI 整備に依存。本タスクは `bash -n` syntax check までを保証。
- 認証失敗 (exit 3) は `cf_call` allowlist 違反経路では到達しない (allowlist 違反時は exit 2)。

## 不変条件への影響

| 不変条件 | 影響 |
| --- | --- |
| #5 D1 直接アクセスは apps/api に閉じる | 影響なし (D1 を呼ばない) |
| その他 | 影響なし |

## 参考

- タスク仕様書: `docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/`
- 起源 spec: `docs/30-workflows/unassigned-task/UT-06-FU-A-logpush-target-diff-script-001.md`
- 親タスク: `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/`
- CLAUDE.md `Cloudflare 系 CLI 実行ルール`

## スクリーンショット

本タスクは `visualEvidence: NON_VISUAL`。redaction 不変条件に従い、スクリーンショットの代わりに redacted text 出力 (`outputs/phase-11/diff-sample.md`) を evidence とする。
