# Phase 6: テスト拡充 — issue-1081-bulk-tag-real-d1-runtime-smoke

## 目的

Phase 4 の正常系 / 基本 fail path に加え、**部分失敗（partial failure）・回帰 guard・境界**を `scripts/smoke/__tests__/runtime-tag-bulk.test.sh` に追加し、AC-1〜AC-7 を local（real D1 接続なし）で最大限カバーする。

## 前提（real D1 が叩けない分の扱い）

local test では curl と `scripts/cf.sh` を PATH stub に差し替える。
実 staging D1 の挙動（実 INSERT/DELETE / 実 audit append）は **Gate-B（user-gated 実走）**で担保し、本 Phase は「runner が response / d1 出力をどう集計・判定するか」を stub で固定する。

## 追加する正常系 / partial failure test ケース

| ID | 対象 | stub が返す状態 | 期待 | AC |
| -- | ---- | -------------- | ---- | -- |
| TC-1 | runner / assign | 全 item `assigned`（4 件） | exit 0・summary `status==PASS` | AC-1 |
| TC-2 | runner / retry | 全 item `noop`（4 件）＋ tag_assigned count 同値 | exit 0 | AC-2 |
| TC-3 | runner / retry | 全 noop だが tag_assigned count が +1 にドリフト | exit 1・reason `audit-count-drift` | AC-2 |
| TC-4 | runner / unassign | 全 item `unassigned`（4 件）＋ tag_unassigned count +N | exit 0 | AC-3 |
| TC-5 | runner / unassign | 全 unassigned だが tag_unassigned count 不変 | exit 1・reason `audit-parity-missing` | AC-3 |
| TC-6 | runner / partial | results に `tag_not_found`（存在しない tag）が混在 | assert_status が assigned 件数 < 4 を検知し exit 1・reason `status-mismatch` | AC-1 部分失敗検知 |
| TC-7 | runner / partial | results に `skipped_deleted`（is_deleted member）が混在 | 同上 exit 1・reason `status-mismatch` | AC-1 部分失敗検知 |
| TC-8 | runner / cleanup | cleanup 後 `member_tags` 残件 count != 0 | exit 1・reason `cleanup-incomplete`（AC-4） | AC-4 |
| TC-9 | runner / cleanup | cleanup 後 `audit_log` 残件 count != 0 | exit 1・reason `cleanup-incomplete` | AC-4 |

> **partial failure の意味（TC-6/7）**: server は部分失敗でも `200 + results` を返す。AC-1 は「全 item assigned」を要求するため、`tag_not_found` / `skipped_deleted` が 1 件でも混ざれば runner は FAIL する必要がある（assigned 件数 == 4 の厳格 assert）。これが seed（active tag / writable member）が正しく投入されたことの裏返し検証になる。

## 追加する fail path test

| ID | 対象 | 入力 | 期待 |
| -- | ---- | ---- | ---- |
| FP-1 | runner | 引数なし | exit 2（env required） |
| FP-2 | runner | `production` / `preview` 等の env 引数 | exit 2（staging 固定・AC-6） |
| FP-3 | runner | `STAGING_API_BASE` が `...-production...` を含む | exit 2（production guard・AC-6） |
| FP-4 | runner | `STAGING_API_HOST_ALLOW_REGEX` 不一致の host | exit 2（target allowlist・AC-6） |
| FP-5 | runner | `STAGING_ADMIN_BEARER` 未設定 | exit 2（required env 欠落） |
| FP-6 | runner | seed の `cf.sh --file` が exit 1（seed 失敗） | exit 1・reason `seed-failed` |
| FP-7 | runner | bulk POST が HTTP 401 / 403 / 500 | exit 1（非 200 contract 違反） |
| FP-8 | runner | bulk POST body が `results` を含まない不正 JSON | exit 1（contract 違反） |
| FP-9 | CI job | `STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` 未設定 | job が fail-closed し、実 D1 mutation smoke 未実行を成功扱いしない |

## 回帰 guard（不変条件固定）

| Guard | 内容 | 検証 |
| ----- | ---- | ---- |
| G-1 | runner / test に `wrangler ` 直書きが無い | `! grep -q 'wrangler ' scripts/smoke/runtime-tag-bulk.sh`（I-3） |
| G-2 | `runtime-smoke.log` / `summary.json` に bearer 平文（stub の `e2e-bearer-secret`）が残らない | `! grep -Fq 'e2e-bearer-secret' "$dir/out/runtime-smoke.log"`（I-2 / AC-5） |
| G-3 | cleanup SQL の全 DELETE が `LIKE 'e2e_test_issue1081_%'` で限定（WHERE 無し DELETE が無い） | SQL file review + runner cleanup 残件 0 assertion で検査（AC-4 / I-6） |
| G-4 | seed SQL に real PII / 非 prefix の id が無い（全 id が `e2e_test_issue1081_` 始まり） | seed SQL の synthetic id 固定 + runner payload prefix 固定で検査（I-6） |
| G-5 | runner が `staging` 以外の env で必ず exit 2（production 誤接続防止） | FP-2 |

## SQL scope guard（seed / cleanup）

本 cycle では追加の TS spec を増やさず、実装面を最小化した。SQL scope は `bulk-tag-staging-seed.sql` / `bulk-tag-staging-cleanup.sql` と runner 側 assertion の組み合わせで固定する:

- seed / cleanup SQL は `BEGIN TRANSACTION;` … `COMMIT;` で囲む。
- cleanup の全 `DELETE` 文は `WHERE ... LIKE 'e2e_test_issue1081_%'` で限定する。
- seed の `INSERT` が触るテーブルは `member_responses` / `member_identities` / `member_status` / `tag_definitions` に限定する。
- runner は cleanup 後に対象 table の prefix 残件 count を 0 assert する。
- 全 synthetic id は `e2e_test_issue1081_` prefix。

## 補助 command

```bash
# runner 全ケース（curl / cf.sh stub 下）
bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh
```

## 完了判定

- [x] partial failure（TC-6/7）含む正常系 TC-1〜TC-9 を test 化
- [x] fail path FP-1〜FP-9（production guard / seed 失敗 / 非 200 / secret 不足 fail-closed）を test 化
- [x] 回帰 guard G-1〜G-5（wrangler 直書き禁止 / redaction / cleanup prefix 限定 / synthetic prefix）を test 化
- [x] seed / cleanup SQL の scope guard を SQL 本体と runner cleanup assertion に反映
