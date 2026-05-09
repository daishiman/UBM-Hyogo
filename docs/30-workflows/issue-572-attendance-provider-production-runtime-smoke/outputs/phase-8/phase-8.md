# Phase 8 正本: 統合テスト（staging リハーサル smoke / production 実行設計）

[実装区分: 実装仕様書（CONST_004 / CONST_005 準拠）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| 作成日 | 2026-05-08 |
| 状態 | spec-confirmed |
| 親 Issue | #572 (CLOSED) |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 設計方針サマリ

production 環境への read-only GET smoke は外部から hermetic な統合テストとして再現できないため、以下 2 段で代替する:

1. **staging リハーサル smoke (再実行可)**: 既存 staging 資産（issue-531 で整備）を本タスクのスクリプト経路で再実行し、shape / redact / DI-bound assertion の整合を確認する。
2. **production 実行 (1 回, user-gated)**: Phase 10 で確定する runbook に従い、Phase 11 で user 明示承認 (G1) 後に **新規 terminal tab + `read -s` 注入 + `unset` 後始末** で 1 回だけ起動する。CI / hook / cron では起動しない。

## Step 0: 既存ファイル実在確認

```bash
test -f apps/api/wrangler.toml
grep -q '\[env.production\]' apps/api/wrangler.toml
grep -q '\[env.staging\]' apps/api/wrangler.toml

# 既存 staging smoke 資産の所在
ls apps/api/scripts/ 2>&1 | tee outputs/phase-8/api-scripts.log
ls docs/30-workflows/runbooks/ 2>&1 | tee outputs/phase-8/runbooks-listing.log
```

| 結果 | 対応 |
| --- | --- |
| `apps/api/scripts/runtime-smoke/` 既存 | 編集（production 切替パラメータの追加検証） |
| `apps/api/scripts/runtime-smoke/` 不在 | Phase 5 で staging 流用パスを新規追加（issue-531 完了資産を移植） |
| `docs/30-workflows/runbooks/production-runtime-smoke-attendance.md` 不在 | Phase 10 で新規追加 |

## 変更対象ファイル

| パス | 変更種別 | 役割 |
| --- | --- | --- |
| `apps/api/scripts/runtime-smoke/run-smoke.sh`（仮称・既存 or 新規） | 新規 / 編集 | `--env staging` / `--env production` の引数で API URL と redact 拡張を切替 |
| `apps/api/scripts/runtime-smoke/redact.jq` | 新規 / 編集 | summary-only filter を jq で定義（除外フィールドを SSOT 化） |
| `apps/api/scripts/runtime-smoke/expectations.jq` | 新規 / 編集 | `.attendance | type == "array"` 等の DI-bound assertion を集約 |
| `docs/30-workflows/runbooks/production-runtime-smoke-attendance.md` | 新規 | production 実行 runbook（Phase 10 で完成） |

> 既存 staging 経路を破壊しない。production 経路は env 引数のみで分岐する。

## staging リハーサル smoke 仕様

### 対象 endpoint

| endpoint | 期待 shape (jq assertion) |
| --- | --- |
| `GET /admin/members?limit=5` | `.members | type == "array" and length <= 5` |
| `GET /admin/members/:memberId` | `.attendance | type == "array"` （DI-bound 中核） |
| `GET /me/profile` | `.profile.attendance | type == "array"` （DI-bound 中核） |

### 実行コマンド（staging リハーサル）

```bash
mkdir -p outputs/phase-8

# 1) staging API URL は wrangler.toml [env.staging] route と整合した値を 1Password から取得
#    （実値は scripts/cf.sh / op run 経由で揮発注入）
bash apps/api/scripts/runtime-smoke/run-smoke.sh \
  --env staging \
  --endpoints admin-members,me-profile \
  --readonly \
  2>&1 | tee outputs/phase-8/staging-rehearsal.log

echo "exit=$?" | tee -a outputs/phase-8/staging-rehearsal.log
```

期待:

| 項目 | 期待 |
| --- | --- |
| exit | 0 |
| `.attendance | type` 出力 | `"array"` |
| log 内の cookie / Bearer / `cf-*` 実値 | 0 hit |
| 全レスポンス body | summary 化済み（生 body は保存しない） |

### evidence summary-only 規約

`redact.jq` で **必ず除外** するキー（SSOT）:

```
session, sessionToken, __Secure-*, cf-*, _cfuvid, _cf_bm,
authorization, cookie, set-cookie, x-amz-*, oauth_*,
email, fullName, profile.body
```

evidence ログに残してよいのは以下のみ:

| 項目 | 例 |
| --- | --- |
| HTTP status | `200` |
| 応答 shape の jq 結果 | `"array"`, `5`, `true` |
| 実行 timestamp（UTC） | `2026-05-08T12:34:56Z` |
| エンドポイント名（path のみ） | `/admin/members/:memberId` |
| DI-bound assertion の判定 | `PASS` / `FAIL` |

## production 実行 dry-run（shape 検証のみ・Phase 11 着手前）

production session 値が確定する前に shape の経路だけを検証する dry-run を仕様化する:

```bash
# session 値はダミー（404 を期待）。URL / redact / jq の経路のみ確認する。
bash apps/api/scripts/runtime-smoke/run-smoke.sh \
  --env production \
  --dry-run \
  --endpoints admin-members,me-profile \
  2>&1 | tee outputs/phase-8/production-dry-run.log
```

期待:

| 項目 | 期待 |
| --- | --- |
| 実行された URL | `https://<production-api-host>/...`（staging URL でないこと） |
| dry-run 出力に含まれる token / session 実値 | 0 hit |
| jq filter / redact filter | staging リハーサルと同一経路 |

> dry-run は production 実 session を必要としない経路のみ走らせる。real evidence 取得は Phase 11 で user gate 後に 1 回。

## redact filter production 拡張ケース

| key 種別 | 例（実値ではなく pattern） | 含まれる場面 |
| --- | --- | --- |
| Cloudflare ray header | `cf-ray` | 全 production レスポンス header |
| Cloudflare cache | `cf-cache-status` | static / cached endpoint |
| `__Secure-` prefix cookie | `__Secure-next-auth.session-token` | Auth.js production cookie |
| Cloudflare bot management | `_cfuvid`, `_cf_bm` | 全 production 訪問 |
| OAuth state | `oauth_state`, `code_verifier` | 認証 redirect 経路 |

これらが redact 0 hit を満たすことは Phase 9 grep gate で別途確認する。本 Phase は **redact filter に上記キーが登録されていること** を仕様として確定する。

## 入出力

| 項目 | 値 |
| --- | --- |
| 入力 | Phase 1-3 の AC / E1-E4 evidence 仕様、Phase 5 実装、Phase 7 trace |
| 出力 | staging rehearsal log（summary-only） / production dry-run log / redact 拡張仕様 |
| 副作用 | staging API への read-only GET 数回。production には到達しない |

## テスト/検証方針

| ID | 観点 | 検証 |
| --- | --- | --- |
| T8-01 | staging リハーサル smoke が PASS | `outputs/phase-8/staging-rehearsal.log` exit=0 |
| T8-02 | DI-bound assertion 通過 | `.attendance \| type == "array"` が `/admin/members/:memberId` と `/me/profile` で PASS |
| T8-03 | summary-only 規約遵守 | log 内 grep で除外キーが 0 hit |
| T8-04 | production dry-run 経路整合 | URL が production host を指す / token 不要経路のみ走る |
| T8-05 | redact filter production 拡張登録 | redact 設定に `cf-*` / `__Secure-` / `_cfuvid` / `_cf_bm` が含まれる |

## ローカル/リモート実行コマンド

```bash
# ローカル（staging への read-only GET）
bash apps/api/scripts/runtime-smoke/run-smoke.sh --env staging --readonly

# リモート（CI からの起動は staging のみ。production は CI からは決して起動しない）
# production 実行は Phase 11 の runbook 経路でのみ起動。
```

## DoD（完了定義）

- [ ] staging リハーサル smoke コマンドと PASS 判定基準が確定
- [ ] DI-bound assertion `.attendance | type == "array"` が両 endpoint に対して仕様化
- [ ] summary-only 規約（除外キー一覧）が確定
- [ ] production dry-run 仕様が確定（real session 不要経路）
- [ ] redact filter production 拡張ケースが列挙
- [ ] production 実行は user gate 後の単発に限定する旨が仕様で明記

## 次 Phase の前提条件

Phase 9（ビルド／品質ゲート）は本 Phase で確定したスクリプト・redact 設定が typecheck / lint / build / grep gate に通る状態を要求する。
