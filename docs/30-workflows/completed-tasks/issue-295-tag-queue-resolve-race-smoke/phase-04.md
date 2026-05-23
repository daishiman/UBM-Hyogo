# Phase 4: テスト作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | issue-295-tag-queue-resolve-race-smoke |
| phase | 4 |
| status | completed |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Issue #295 / UT-07A-03 の tag queue resolve race smoke を、local implementation と runtime_pending evidence 境界が読み違えられない形で進める。

## 実行タスク

- Phase 4 の成果物を current implementation / runtime_pending 境界に同期する。
- 関連する証跡と downstream Phase 12 compliance へ trace を残す。

## 参照資料

- docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/index.md
- scripts/smoke/tag-queue-race.mjs
- scripts/smoke/__tests__/tag-queue-race.test.sh

## 成果物

- outputs/phase-04/main.md

## 完了条件

- [x] Phase 4 の主成果物が存在する。
- [x] runtime_pending / user-gated 境界を必要箇所に明記する。

## 統合テスト連携

- この Phase の成果は focused shell test / Phase 11 NON_VISUAL evidence / Phase 12 compliance に接続する。

---

# Phase 04 — テスト戦略

[実装区分: 実装仕様書]

## テストレベル

| level | 対象 | 場所 |
| --- | --- | --- |
| unit (shell) | 引数 parse / analyzeResults | `scripts/smoke/__tests__/tag-queue-race.test.sh` |
| smoke (manual) | staging 実打鍵 | Phase 11 |

staging 打鍵 test は CI 自動化しない（fixture 準備コストと冪等性の都合）。

## shell test 仕様（`scripts/smoke/__tests__/tag-queue-race.test.sh`）

### 前提

- `node` (>=24) と `tag-queue-race.mjs` が同一 repo に存在
- `analyzeResults` 単体呼び出し用 sub-command を script に実装する: `node scripts/smoke/tag-queue-race.mjs --analyze-only --input <path-to-results.json>`
  - 入力 JSON: `[{status, body}, ...]`
  - 出力 JSON: `{successes, raceLosts, others, sideEffects, verdict, reason}`（stdout）
  - 終了コード: verdict=pass→0 / fail→1 / usage error→2

### case 一覧

| case | 入力 | 期待 |
| --- | --- | --- |
| 1: 引数 parse 正常 | `--env staging --queue-id q1 --concurrency 3 --base-url https://x --session-cookie c --action confirmed --tag-codes t1 --dry-run` | exit 0、stdout JSON に `env=staging, queueId=q1, concurrency=3` |
| 2: analyze pass | `[{status:200,body:{ok:true}},{status:409,body:{ok:false,error:"race_lost"}},{status:409,body:{ok:false,error:"race_lost"}}]` | `verdict=pass, successes=1, raceLosts=2, others=0`、exit 0 |
| 3: analyze fail (multi-success) | `[{status:200,body:{ok:true}},{status:200,body:{ok:true}},{status:409,body:{ok:false,error:"race_lost"}}]` | `verdict=fail`、exit 1 |
| 4: analyze fail (no-success) | `[{status:409,body:{ok:false,error:"race_lost"}},{status:409,body:{ok:false,error:"race_lost"}},{status:409,body:{ok:false,error:"race_lost"}}]` | `verdict=fail`、exit 1 |
| 5: side-effect pass/fail | HTTP pass fixture + `--side-effect-input` summary | expected/actual 一致で pass、不一致で fail |

> case 1 用に `--dry-run`（実 fetch を発火せず parsed options を stdout JSON で吐く）を追加実装する。

### 実行コマンド

```bash
bash scripts/smoke/__tests__/tag-queue-race.test.sh
```

### shell test 構造（擬似）

```bash
#!/usr/bin/env bash
set -euo pipefail
SCRIPT="scripts/smoke/tag-queue-race.mjs"
PASS=0; FAIL=0
assert_eq() { [ "$1" = "$2" ] && PASS=$((PASS+1)) || { echo "FAIL: expected=$2 got=$1"; FAIL=$((FAIL+1)); }; }

# case 1
out=$(node "$SCRIPT" --dry-run --env staging --queue-id q1 --concurrency 3 \
  --base-url https://x --session-cookie c --action confirmed --tag-codes t1)
echo "$out" | grep -q '"queueId":"q1"' && PASS=$((PASS+1)) || FAIL=$((FAIL+1))

# case 2..4: tmp json -> --analyze-only
tmp=$(mktemp); printf '%s' '[{"status":200,"body":{"ok":true}},...]' > "$tmp"
node "$SCRIPT" --analyze-only --input "$tmp"
assert_eq "$?" "0"
# case 3 / case 4 は exit 1 期待のため set +e で捕捉する
set +e
out=$(node "$SCRIPT" --analyze-only --input "$tmp_fail")
ec=$?
set -e
assert_eq "$ec" "1"
echo "PASS=$PASS FAIL=$FAIL"
[ "$FAIL" -eq 0 ]
```

## test ファイル命名

- 拡張子: `.test.sh`（shell test）。
- CLAUDE.md 不変条件 #8 は `*.test.{ts,tsx}` を禁止する規約であり、shell test には適用されない。新規 `.test.sh` は許容。

## DoD

- 5 case すべて pass
- `pnpm lint` は対象外（scripts/.mjs は別途）
- shell test 単体実行で 5 秒以内に終了

## 成果物

- `outputs/phase-04/main.md`

## 次 Phase

- [phase-05.md](./phase-05.md): 実装ランブック
