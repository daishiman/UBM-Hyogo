# Phase 7: 単体テスト（redact filter / wrangler env vars 解析）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| 作成日 | 2026-05-08 |
| 状態 | spec-confirmed |
| 親 Issue | #572（CLOSED） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | 単体テスト仕様書 |

> 本 Phase 内ではテスト実装を行わない。追加すべきケース・合成サンプル方針を spec として固定する。実装手順は本ドキュメント内に記述する。

## 目的

Phase 6 で確定した redact filter 拡張（R-07..R-11）と wrangler binding 解析ロジックを、unit test 層で先に網羅する。production smoke 偽陰性（redact 漏れ）を Phase 11 の本実行前に潰し、evidence 信頼性を担保する。

## 追加テストファイル

| パス | 変更種別 | フレームワーク |
| --- | --- | --- |
| `tests/unit/redaction.test.sh` | 既存編集（5 ケース追加） | bash + sed + grep（既存スタイル踏襲） |
| `tests/unit/wrangler-binding-parse.test.sh` | 新規（3 シナリオ） | bash + jq |

## ケース 1: `redaction.test.sh` 追加 5 ケース

既存ファイルの `assert_redacted` / `assert_contains` ヘルパーを再利用する。実 token / 実 secret / 実 email / 実 fullName を fixture に書かない。**合成サンプルのみ**使用。

### R-07-01: cf-* token redaction

```bash
assert_redacted "R-07-01 cf-ray header" \
  'cf-ray: 8a1b2c3d4e5f6789-NRT' \
  '8a1b2c3d4e5f6789-NRT'
```

期待: `***REDACTED_CF***` が含まれ、原 token 値が grep で hit しない。

### R-08-01: OAuth secret redaction

```bash
assert_redacted "R-08-01 client_secret in JSON" \
  '"client_secret": "GOCSPX-FAKE-SYNTHETIC-VALUE-FOR-TEST"' \
  'GOCSPX-FAKE-SYNTHETIC-VALUE-FOR-TEST'
```

期待: `***REDACTED_OAUTH_SECRET***` が含まれ、原値が hit しない。

### R-09-01: email redaction

```bash
assert_redacted "R-09-01 email in body" \
  '{"email":"synthetic-user@example.test"}' \
  'synthetic-user@example\.test'
```

期待: `***REDACTED_EMAIL***` が含まれる。

### R-10-01: fullName redaction

```bash
assert_redacted "R-10-01 fullName in profile body" \
  '{"profile":{"fullName":"Synthetic Tester","other":"v"}}' \
  'Synthetic Tester'
```

期待: `***REDACTED_NAME***` が含まれる（R-11 も同時に hit するが順序依存しない結果）。

### R-11-01: profile body 全体 redaction

```bash
assert_redacted "R-11-01 entire profile body" \
  '{"id":"m-1","profile":{"fullName":"X","email":"a@b.test"}}' \
  '"fullName"|"email"'
```

期待: `***REDACTED_PROFILE***` が含まれ、内側 key も grep で hit しない。

### sed 評価順序の non-regression

```bash
assert_redacted "R-09 before R-03 (URL with email in query)" \
  'https://api.example.test/users?email=u@h.test&token=abcd1234567890abcdef1234567890abcdef1234' \
  'u@h\.test'
```

期待: email も URL query もそれぞれ redact される（R-09 が先に email を潰し、R-03 が ?query を潰す）。

## ケース 2: `wrangler-binding-parse.test.sh` 新規 3 シナリオ

### fixture（合成）

```bash
STAGING_TOML='
[env.staging]
[[env.staging.d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db-staging"
database_id = "00000000-0000-0000-0000-000000000001"
[[env.staging.kv_namespaces]]
binding = "CACHE"
id = "00000000000000000000000000000001"
'

PRODUCTION_TOML='
[env.production]
[[env.production.d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db-prod"
database_id = "00000000-0000-0000-0000-000000000002"
[[env.production.kv_namespaces]]
binding = "CACHE"
id = "00000000000000000000000000000002"
'
```

### Scenario A: binding name 同型・値別（PASS）

両環境で `DB` / `CACHE` binding name が一致し、`database_id` / `id` 値のみ差分。

期待: parser が binding-name diff = 0 を返す（値差分は staging/production 別なので想定内）。

### Scenario B: staging のみ存在 binding（FAIL 検出）

staging に `EXTRA_KV` を追加、production には無い。

期待: parser が `staging-only: EXTRA_KV` を report、終了コード 1。

### Scenario C: production のみ存在 binding（FAIL 検出）

production に `RATE_LIMITER` を追加、staging には無い。

期待: parser が `production-only: RATE_LIMITER` を report、終了コード 1。

### redaction 連携

binding name 自体は機密でないが、`database_id` / namespace `id` は **summary-only** で扱い、evidence には binding name + 一致/不一致 のみ記録（実 id 値を残さない）。

```bash
assert_redacted "wrangler database_id never leaked" \
  '$(diff_output)' \
  '00000000-0000-0000-0000-000000000001'
```

## ローカル検証コマンド

```bash
# redaction unit test
bash tests/unit/redaction.test.sh

# wrangler binding parse test
bash tests/unit/wrangler-binding-parse.test.sh
```

期待: 両方 `FAIL=0` で完了。

## 合成サンプル方針（必須）

| 種別 | 禁止 | 推奨 |
| --- | --- | --- |
| token / OAuth secret | 実 token を fixture に貼る | `GOCSPX-FAKE-SYNTHETIC-VALUE-FOR-TEST` 等の合成プレースホルダ |
| email | 実 email | `*@example.test` / `*@example.invalid` |
| fullName | 実利用者名 | `Synthetic Tester` 等の架空名 |
| database_id / namespace id | 実 id | `00000000-...-0000000000XX` 等の zero-padded 合成値 |

`tests/unit/redaction.test.sh` 既存ヘッダの方針（「実 token / 実 secret は記載しない (合成サンプルのみ)」）を踏襲する。

## 副作用 / エラーハンドリング

| 条件 | 挙動 |
| --- | --- |
| `assert_redacted` で原値が grep hit | `FAIL=$((FAIL+1))` + stderr に input/output 出力（既存挙動踏襲） |
| `wrangler-binding-parse.test.sh` で diff 検出 | exit 1 + binding name のみ報告（id 値除外） |
| jq 不在 | exit 2 + stderr に jq 必須メッセージ |

## DoD（完了定義）

- [ ] R-07..R-11 各 1 ケース + sed 評価順序 non-regression 1 ケース、合計 6 ケースが `redaction.test.sh` に追加される spec
- [ ] `wrangler-binding-parse.test.sh` の Scenario A/B/C 3 シナリオが describe 単位で確定
- [ ] 合成サンプル方針（実 token / 実 secret / 実 email / 実 id を fixture に書かない）が明記
- [ ] ローカル検証コマンドが 2 つとも記述されている
- [ ] redaction 連携で wrangler 出力中の id 値が evidence に残らない方針が明記
- [ ] 本 Phase ではテスト実装を行わない（別タスクで実装）旨が冒頭で明示

## 次 Phase の前提条件

Phase 8 以降で runbook（`docs/30-workflows/runbooks/production-runtime-smoke-attendance.md`）と aiworkflow-requirements への lessons-learned 反映を確定し、Phase 11 で production 本実行 evidence を取得する。
