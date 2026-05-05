# Phase 5 / script implementation log

## 実装ファイル

- `scripts/observability-target-diff.sh` (180 行程度, bash + sed + awk)
- `scripts/lib/redaction.sh` (40 行程度, 純粋関数)

## TDD 順序

1. redaction module を先に実装 (`scripts/lib/redaction.sh`)
2. unit test 雛形 `tests/unit/redaction.test.sh` (TC-05 / TC-06 相当 + R-01〜R-06) を作成して PASS 確認
3. script 本体の SRP 分離 (parse_args / cf_call / fetch_r1〜r4 / classify_axis / format_md / format_json)
4. smoke test: `--current-worker ubm-hyogo-web-production --legacy-worker ubm-hyogo-web` で exit code と出力形式を確認

## redaction 適用順 (実装で確定)

R-02(Bearer) → R-02(Authorization:) → R-06(ya29) → R-04(AKIA) → R-05(named credentials) → R-01(generic 40+) → R-03(URL query)

順序の根拠: 特定 prefix を持つパターン (Bearer / ya29 / AKIA / 名前付き credential field) を先に処理して保護的 marker (`***REDACTED_AUTH***` 等) に置換し、最後に汎用 R-01 (40 文字以上の英数字/-/_) と R-03 (URL の ? 以降) で最終 sweep を行う。

## 各 fetch 関数の挙動

### fetch_r1_workers_logs
- current: `wrangler.toml` の `[env.production.observability]` を toml_get parse
- legacy: 該当 section 未存在を期待 → `N/A (dashboard fallback: ...)`

### fetch_r2_tail
- どちらも target Worker 名を返すのみ (実 tail を行わない)
- `cf.sh tail` の実行は親タスク runbook 側で別途行う

### fetch_r3_logpush
- default は dashboard fallback (`OBS_DIFF_FETCH_LOGPUSH=1` で cf.sh 経由取得を試行)
- API plan 制限が想定されるため、N/A を保守的に既定とする

### fetch_r4_analytics
- current: `wrangler.toml` の `[[env.production.analytics_engine_datasets]]` を awk parse
- legacy: 静的に `bindings=[]` を返す (legacy worker は新仕様の dataset binding を持たない)

## diff 分類 (classify_axis)

| current | legacy | classify |
| --- | --- | --- |
| 値あり | 値あり | shared |
| 値あり | N/A or 空 | current-only |
| N/A or 空 | 値あり | legacy-only |
| 双方 N/A or 空 | shared-empty |

`legacy-only` または `current-only` が 1 個以上 → exit 1 (diff あり)

## 制約遵守

| 制約 | 順守 |
| --- | --- |
| C-1 wrangler 直叩き禁止 | 全 Cloudflare 呼び出しは `cf_call` (`bash scripts/cf.sh` 経由) |
| C-2 secret 出力禁止 | 全 stdout / stderr が `redact_stream` 通過 |
| C-3 wrangler login 禁止 | 呼ばない |
| C-4 mutation 禁止 | HTTP method は GET のみ。POST/PUT/DELETE/PATCH 文字列 0 件 |
| C-5 旧 Worker 削除導線非接続 | 出力に削除示唆文言なし |
| C-6 sink URL credential 出力禁止 | R-03 で query string redaction |
| C-7 plan 制限 fallback | exit 0 維持で `N/A (dashboard fallback: ...)` |
