# Phase 4: テスト作成（TDD Red）— issue-1081-bulk-tag-real-d1-runtime-smoke

## 目的

local test `scripts/smoke/__tests__/runtime-tag-bulk.test.sh` のケース設計を固定する。
**real D1 / staging には接続せず**、runner の純粋ロジック（引数 parse / production guard / redaction / contract assert 関数）を local で検証する。
命名規則は Phase 1 の規約（shell test = `*.test.sh`、`scripts/smoke/__tests__/` 配下・CLAUDE.md 不変条件 8 と整合）に従う。

## 依存関係整合の事前チェック（FB-MSO-002）

```bash
mise exec -- pnpm install   # esbuild darwin バイナリ mismatch は worktree 直後に多発するため事前に解消
```

> 本 local test は shell（bash）のみで完結し外部ビルド成果物に依存しない。`jq` / `bash` が前提。

## real D1 を使わない方針（最重要）

| 何を | どう | なぜ |
| ---- | ---- | ---- |
| `curl`（HTTP POST） | PATH 先頭の **fake `curl`** に差し替え（stub）。固定 JSON を返す | staging endpoint へ実接続しない |
| `cf.sh`（seed / cleanup / count） | PATH 先頭の **fake `cf.sh`** または `--skip-cleanup` + stub で差し替え | real D1 mutation を起こさない |
| production guard / 引数 parse | runner を引数違反で起動し exit code を assert | 純粋ロジックは stub 不要 |
| redaction | 既知の bearer/cookie 文字列を `redact.sh` に通し masked 出力を grep | real token 不要 |
| contract assert | `assert_all_status` 関数を fixture JSON で直接呼ぶ（runner を `source` する） | response 集計の判定境界を real endpoint なしで確認 |

> stub 方式は `runtime-attendance-provider.test.sh` を雛形とする（curl/wrangler を PATH 先頭の fake で差し替える既存パターン）。

## テストケース設計表

| ケース | 入力 / 条件 | 期待 exit code | 検証方法 |
| ------ | ----------- | -------------- | -------- |
| TC-A 引数なし | `runtime-tag-bulk.sh`（無引数） | 2 | stderr に `env required`。`$?` == 2 を assert |
| TC-B production env 指定 | `runtime-tag-bulk.sh production` | 2 | production guard 発火（AC-6）。stderr に staging のみ許可の旨。`$?` == 2 |
| TC-C 不正 env 指定 | `runtime-tag-bulk.sh dev` | 2 | staging 以外は全て拒否。`$?` == 2 |
| TC-D production URL 検出 | `env staging`、`STAGING_API_BASE=https://api.ubm-hyogo.workers.dev`（production marker） | 2 | `assert_not_production_url` が exit 2（AC-6）。stderr に URL guard の旨 |
| TC-E 必須 env 欠落 | `env staging`、`STAGING_API_BASE` 未設定 | 2 | required env 名を stderr に出力（値は出さない）。`$?` == 2 |
| TC-F CLOUDFLARE_ENV 不一致 | `env staging`、`CLOUDFLARE_ENV=production` | 2 | seed/cleanup guard 発火。`$?` == 2 |
| TC-G redaction: bearer マスク | `printf 'authorization: Bearer abc123tokenvalue....' \| bash redact.sh` | — | 出力に生 bearer が**残らない**こと（`grep -q 'Bearer [REDACTED]'` 成功 / 生 token 文字列 grep 失敗） |
| TC-H redaction: cookie マスク | `printf 'Cookie: __Secure-authjs.session-token=secretval' \| bash redact.sh` | — | 出力に `[REDACTED]`、生 cookie 値が残らない |
| TC-I contract assert: assigned 全件 | fixture JSON `{"batchId":"b1","results":[{...,"status":"assigned"},{...,"status":"assigned"}]}` を `assert_all_status "$json" assigned` | 0（fail しない） | 関数が PASS（off==0）。assigned を正しく全件判定 |
| TC-J contract assert: noop 全件 | results 全 status="noop" を `assert_all_status "$json" noop` | 0 | noop を正しく判定（AC-2） |
| TC-K contract assert: unassigned 全件 | results 全 status="unassigned" を `assert_all_status "$json" unassigned` | 0 | unassigned を正しく判定（AC-3） |
| TC-L contract assert: 混在で fail | results に `assigned` と `tag_not_found` が混在、`assert_all_status "$json" assigned` | 1（fail） | 期待外 status を検出し fail。off>0 |
| TC-M contract assert: batchId 欠落で fail | `{"results":[...]}` に batchId なし | 1 | contract 違反として fail |
| TC-N contract assert: results 空で fail | `{"batchId":"b1","results":[]}` | 1 | 空 results を fail |
| TC-O audit count 集計（任意） | stub cf.sh が `{"results":[[{"c":2}]]}` 相当を返す、`audit_count tag_assigned` | — | 返り値が `2`（数値抽出ロジックの単体確認） |

## 各ケースの実装方針

### exit code 系（TC-A〜TC-F）

```bash
test_production_guard() {
  set +e
  STAGING_API_BASE="https://api-staging.ubm-hyogo.workers.dev" \
    bash scripts/smoke/runtime-tag-bulk.sh production >/dev/null 2>err.txt
  local code=$?
  set -e
  assert_eq 2 "$code" "TC-B production guard exit 2"
  grep -q "staging" err.txt || fail_test "TC-B stderr should mention staging-only"
}
```

### redaction 系（TC-G/TC-H）

```bash
test_redact_bearer() {
  local out
  out="$(printf 'authorization: Bearer abc123tokenvalue0000\n' | bash scripts/smoke/redact.sh)"
  echo "$out" | grep -q '\[REDACTED\]' || fail_test "TC-G should redact"
  echo "$out" | grep -q 'abc123tokenvalue' && fail_test "TC-G raw bearer leaked"
}
```

### contract assert 系（TC-I〜TC-N）

runner を `source` して関数を直接呼べるよう、runner 冒頭に `if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then main "$@"; fi` 相当の **CLI entry guard** を設ける（Phase 5 実装事項）。これにより test 側は `source runtime-tag-bulk.sh` で `assert_all_status` を呼べる。`fail` は exit 1 するため subshell で exit code を捕捉する。

```bash
test_assert_all_status_assigned() {
  ( source scripts/smoke/runtime-tag-bulk.sh
    assert_all_status '{"batchId":"b1","results":[{"memberId":"m1","tagId":"t1","status":"assigned"},{"memberId":"m2","tagId":"t1","status":"assigned"}]}' assigned )
  assert_eq 0 $? "TC-I assigned all pass"
}
test_assert_all_status_mixed_fail() {
  set +e
  ( source scripts/smoke/runtime-tag-bulk.sh
    assert_all_status '{"batchId":"b1","results":[{"status":"assigned"},{"status":"tag_not_found"}]}' assigned )
  local code=$?
  set -e
  assert_eq 1 "$code" "TC-L mixed status must fail"
}
```

> source guard（Phase 5 実装）: `if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then main "$@"; fi` により、test が `source runtime-tag-bulk.sh` した場合は関数定義のみ読み込み、main を実行しない。

## テストパターンと命名規則の整合確認

- shell test は `*.test.sh`（CLAUDE.md 不変条件 8。`*.test.{ts,tsx}` 禁止は TS のみが対象。shell の `.test.sh` は既存 `runtime-attendance-provider.test.sh` と同一規約で許可）。✅
- stub は curl / cf.sh を PATH 先頭の fake で差し替える（既存 test 踏襲）。
- 実 staging / real D1 へは一切接続しない（unit 範囲）。

## RED → GREEN

本 cycle では Phase 4 のケースを先に固定し、Phase 5 の runner 実装で focused に GREEN にした。

```bash
bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh   # 全ケース PASS が GREEN 条件
```

## 完了判定

- [x] local test の 15 ケース（TC-A〜TC-O）の入力・期待 exit code・検証方法を定義
- [x] real D1 / staging 非接続（curl / cf.sh stub・source guard による関数 import）の方針を明記
- [x] production guard / redaction / contract assert を network なしで検証する設計を確定
- [x] 命名規則（`*.test.sh` / `scripts/smoke/__tests__/`）の整合を確認
