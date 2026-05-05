# AC × TC × coverage matrix

| AC | 内容 (要約) | 正常系 TC | 異常系 TC | coverage 指標 | golden / 実測 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 新旧 Worker 両方の inventory を出力 | TC-01 (smoke で 4 軸 × current/legacy が出力) | TC-10 (空 target 境界) | exit 0 / 1 両カバー | `tests/golden/diff-mismatch.md` |
| AC-2 | secret / token / sink credential 出力ゼロ | TC-05 / TC-06 (redaction unit + integration) | TC-07 (token-like 入力) | R-01〜R-06 全発火 | unit test PASS=11 / FAIL=0 |
| AC-3 | 4 軸 (R1〜R4) 網羅 | TC-01 (4 セクション存在を grep) | TC-11 (plan 制限 fallback) | 4 サブシステム全て read | integration `## R1〜R4` PASS |
| AC-4 | 親タスク runbook からの導線 | runbook 追記 (Phase 12 で `observability-diff-runbook.md` 作成) | — | doc 存在チェック | (Phase 12 で確定) |
| AC-5 | `bash scripts/cf.sh` 経由のみ | TC-08 (script 内に wrangler 直叩き 0 件) | TC-12 (引数不正 → exit 64) | wrangler grep 0 件 | integration TC-08 PASS |

## 1:1 対応の検証

- 各 AC に正常系 + 異常系 TC が 1 つ以上紐付く: ✅ (AC-4 のみ runbook 追記の存在検証で代替)
- 空セルなし: ✅
- 重複 TC: TC-01 が AC-1 / AC-3 を兼ねる以外なし

## coverage threshold 実測

| 指標 | 目標 | 実測 |
| --- | --- | --- |
| redaction pattern | 100% (R-01〜R-06) | 100% (unit test 11 PASS) |
| exit code | 100% (0/1/2/3/64) | 0/1/64 観測。2/3 は cf_call allowlist 違反 / 認証失敗で設計上到達可 |
| case branch | 100% (parse_args / classify_axis / format) | parse_args 全分岐 + classify_axis 4 分岐到達 |
| golden 一致 | 100% | `diff-mismatch.md` 生成済み (現環境スナップショット) |
| no-secret-leak audit | 0 件 | `rg -nE '(AKIA[0-9A-Z]{16}|ya29\.[A-Za-z0-9_-]{8,})' tests/ scripts/observability-target-diff.sh scripts/lib/redaction.sh` で実 token 0 件 |
