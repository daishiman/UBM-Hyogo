# Phase 7: カバレッジ確認 — issue-1081-bulk-tag-real-d1-runtime-smoke

## 目的

runner の各関数・各分岐が test または runbook（Gate-B 実走）で覆われることをマトリクスで可視化し、local では到達不能な real D1 部分を `runtime_pending` として Phase 11 へ明示移譲する。

## AC カバレッジマトリクス

| AC | 内容 | カバーする test | runtime（Gate-B） |
| -- | ---- | --------------- | ----------------- |
| AC-1 | assign → 全 assigned | TC-1 / TC-6 / TC-7（部分失敗検知） | 実 D1 で全 assigned を実証 |
| AC-2 | retry → 全 noop ＋ audit count 不変 | TC-2 / TC-3 | 実 audit count の retry 前後差分 0 を実証 |
| AC-3 | unassign → 全 unassigned ＋ audit parity | TC-4 / TC-5 | 実 tag_unassigned audit 増分を実証 |
| AC-4 | cleanup が `e2e_test_issue1081_%` 限定・残件 0 | TC-8 / TC-9 / G-3 / G-4 + seed-syntax test | 実 D1 で cleanup 後残件 0 を実証 |
| AC-5 | command log に endpoint / redaction / response summary / audit query | G-2（redaction）+ summary.json 構造 test | 実 log artifact を evidence ledger に保存 |
| AC-6 | production 誤実行 guard（exit 2） | FP-2 / FP-3 / FP-4 / G-5 | （local 完結。実走不要） |
| AC-7 | local test PASS | 本 Phase 全 test | （local 完結） |

→ 全 AC に最低 1 つの local test が紐づく。AC-1〜AC-5 の **real D1 実走部分のみ** Gate-B で最終確認する。

## runner 分岐カバレッジマトリクス

| 分岐 | 関数 | カバーする test / runbook |
| ---- | ---- | ------------------------- |
| 引数 parse 正常 | `resolve_env` | TC-1（staging + flags） |
| 引数 parse 異常（env なし / 非 staging） | `resolve_env` | FP-1 / FP-2 |
| 必須 env 欠落 | `resolve_env` | FP-5 |
| guard pass（staging host） | `assert_staging_guard` | TC-1 |
| guard fail（production marker / allowlist 不一致 / D1 名不一致） | `assert_staging_guard` | FP-3 / FP-4 |
| seed 成功 | `seed` | TC-1（cf.sh stub no-op） |
| seed 失敗 | `seed` | FP-6 |
| bulk POST 200 + 集計 PASS | `post_bulk` / `assert_status` | TC-1 / TC-4 |
| bulk POST 非 200 | `post_bulk` | FP-7 |
| bulk POST 不正 body | `post_bulk` / `assert_status` | FP-8 |
| status 集計不一致（部分失敗） | `assert_status` | TC-6 / TC-7 |
| audit count 同値（冪等 OK） | `audit_count` | TC-2 |
| audit count drift（冪等 NG） | `audit_count` | TC-3 |
| audit count 増分（parity OK） | `audit_count` | TC-4 |
| audit count 不変（parity NG） | `audit_count` | TC-5 |
| cleanup 成功（残件 0） | `cleanup` | TC-1（stub count=0） |
| cleanup 不完全（残件 != 0） | `cleanup` | TC-8 / TC-9 |
| cleanup always（smoke 失敗時も実行） | runner `trap ... EXIT` | FP-6/FP-7 経由で trap 発火を確認 + Gate-B 実走 |
| summary 出力 | `emit_summary` | TC-1（summary.json 構造 assert） |
| fail 記録 / exit 1 | `fail_and_exit` | 全 FP / 不一致 TC |

## CI job カバレッジ

| edge | 確認 |
| ---- | ---- |
| secret 不足 fail-closed | FP-9 + actionlint |
| job → runner（exit code が job 成否へ） | run step の exit code 反映（actionlint + Gate-B 実走） |
| runner cleanup trap | local stub test + Gate-B 実走 |
| redaction grep gate | redaction step の grep（local で artifact に対し試走可） |
| step-scoped `CLOUDFLARE_API_TOKEN`（job-level 禁止 gate） | workflow-env-scope test（既存）+ actionlint |

## カバレッジ上の既知ギャップ（Gate-B で解消＝`runtime_pending`）

local test は curl / cf.sh stub のため、以下は **Gate-B（staging deploy 後の user-gated 実走）でのみ確定**する。Phase 11 evidence ledger に記録する:

1. 実 D1 への seed 投入が成功し、assign が実 INSERT で `assigned` を返す（AC-1 実走）。
2. 再送が実 D1 上で `noop` を返し、`admin.member.tag_assigned` audit が実際に増えない（AC-2 実走）。
3. unassign が実 DELETE で `unassigned` を返し、`admin.member.tag_unassigned` audit が実際に増える（AC-3 実走）。
4. cleanup 後に `e2e_test_issue1081_%` の全テーブル残件が実 D1 で 0（AC-4 実走）。
5. 実 log artifact に bearer 平文が残らない（AC-5 実走 redaction）。

## 完了判定

- [x] 全 AC・全 runner 分岐に test または Gate-B を紐付け
- [x] real D1 実走部分を `runtime_pending` として Phase 11 へ明示移譲
- [x] cleanup always（trap + job step）の二重カバレッジを記録
