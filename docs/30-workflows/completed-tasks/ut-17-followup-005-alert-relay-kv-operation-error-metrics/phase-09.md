# Phase 9: 受入確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | alert-relay KV 操作エラーの observability 計測 |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 受入確認 |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | 8 (ドキュメント更新) |
| 次 Phase | 10 (リファクタ) |
| 状態 | spec_created |
| GitHub Issue | #701 |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | AC-1〜AC-10 / 不変条件 1〜8 への evidence マッピングと、`pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/api test -- alert-relay` / `grep` の逐次実行結果を記録する受入チェックポイント。 |

---

## 目的

Phase 6 実装・Phase 7 テスト・Phase 8 ドキュメントの成果物が、index.md 記載の **AC-1〜AC-10** と
**不変条件 1〜8** を満たすことを、コマンド実行 evidence と grep 結果で照合する。
behaviour parity（既存 dedup レスポンス / Slack 502 / dedupPersisted=false）が変更されていないことも本 Phase の必須項目。

---

## 9-1. AC evidence マッピング

| AC | 内容（要約） | evidence 種別 | 参照先 |
| --- | --- | --- | --- |
| AC-1 | `KV.get` 例外時に構造化ログ 1 行 emit / fail-open 維持 | テスト名 + コード行 | TC-LOG-01 (`alert-relay.spec.ts`) / `alert-relay.ts` get catch ブロック |
| AC-2 | `KV.put` 例外時に構造化ログ 1 行 emit / `dedupPersisted=false` 維持 | テスト名 + コード行 | TC-LOG-02 (`alert-relay.spec.ts`) / `alert-relay.ts` put catch ブロック |
| AC-3 | schema 固定（`event` / `op` / `errorClass` / `dedupeKeyHash` / `isolateId` / `ts`） / `JSON.stringify` 1 行 | テスト assertion + runbook | TC-LOG-01 の payload shape assertion / runbook section 5-2 field 定義表 |
| AC-4 | `dedupeKeyHash` は `SHA-256(dedupeKey)` の先頭 12 hex / 同一 key で同 hash | テスト名 | TC-LOG-05 (`alert-relay.spec.ts`) |
| AC-5 | `isolateId` は module top で `crypto.randomUUID()` 1 回採番 | テスト名 + コード行 | TC-LOG-04 (`alert-relay.spec.ts`) / `alert-relay.ts` module top `const isolateId = crypto.randomUUID()` |
| AC-6 | 成功パスで `console.warn` 0 回 | テスト名 | TC-LOG-03 (`alert-relay.spec.ts`) |
| AC-7 | 既存挙動（dedup hit / Slack 502 / dedupPersisted=false）が不変 | 既存テスト regression | ROUTE-04 / ROUTE-05 / ROUTE-05a / ROUTE-05b / TC-03 / TC-KV-01 が PASS |
| AC-8 | `mise exec -- pnpm --filter @ubm-hyogo/api test` / `pnpm typecheck` / `pnpm lint` PASS | コマンド実行 evidence | 9-3 の実行記録 |
| AC-9 | monthly runbook に KV 操作エラーログ確認 section / `cf.sh tail | grep` 例 / field 定義表 | ドキュメント反映 | runbook section 5 (Phase 8 snippet) |
| AC-10 | 新規/変更テストは `*.spec.ts` のみ | grep evidence | `find apps/api/src -name "*.test.ts"` で 0 件 |

---

## 9-2. 不変条件 1〜8 充足チェック

| 不変条件 | 内容 | 充足方法 | 検証コマンド |
| --- | --- | --- | --- |
| 1 | behaviour change なし（fail-open は明示的意思決定） | ROUTE-* / TC-* regression PASS / Phase 3 design review approval | `pnpm --filter @ubm-hyogo/api test -- alert-relay` |
| 2 | `*.spec.ts` 縛り | `*.test.ts` 新規作成なし | `git diff --name-only dev...HEAD \| grep -E '\.test\.ts$'` 期待 0 件 |
| 3 | D1 直接アクセス境界 | 本タスクで D1 操作なし | `grep -n "D1Database\|DB\." apps/api/src/routes/internal/alert-relay.ts` 期待 0 件 |
| 4 | `wrangler` 直接禁止 | secret/deploy 追加なし | `git diff dev...HEAD scripts/ \| grep -E "^\+.*wrangler "` 期待 0 件 |
| 5 | 平文 secret 禁止 | runbook / コードに raw token なし | `grep -rE "(sk_live\|whsec_)[a-zA-Z0-9]" docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md apps/api/src/routes/internal/alert-relay.ts` 期待 0 件 |
| 6 | CONST_007 遵守（Phase 1〜12 local complete / Phase 13 user-gated） | artifacts.json gates 状態 | `jq '.metadata.gates' artifacts.json` で Gate-C `pending` 確認 |
| 7 | ログ schema 安定化（additive のみ） | TC-LOG-01 payload assertion で 6 field 必須 | TC-LOG-01 PASS |
| 8 | PII non-leak（raw dedupeKey / stack 出力禁止） | grep gate | 9-4 grep 0 件 |

---

## 9-3. 検証コマンド逐次実行記録テンプレ

実装完了後、以下を順次実行し本セクションに結果を貼り付ける。

```bash
# 1. 型チェック
mise exec -- pnpm typecheck
# 期待: exit 0
# 記録: <実行日時> exit=<code> elapsed=<sec>

# 2. lint
mise exec -- pnpm lint
# 期待: exit 0
# 記録: <実行日時> exit=<code> elapsed=<sec>

# 3. focused test
mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay
# 期待: PASS / TC-LOG-01〜TC-LOG-05 + 既存 ROUTE-* / TC-* 全 PASS
# 記録: total=<n> passed=<n> failed=0

# 4. 全 api スイート（regression）
mise exec -- pnpm --filter @ubm-hyogo/api test
# 期待: PASS / failed=0
# 記録: total=<n> passed=<n> failed=0

# 5. event マーカーが実装本体に存在
grep -n "alert_relay_kv_op_failed" apps/api/src/routes/internal/alert-relay.ts
# 期待: 1 件以上（helper 内）
# 記録: <件数>

# 6. event マーカーがテストに存在
grep -n "alert_relay_kv_op_failed" apps/api/src/routes/internal/__tests__/alert-relay.spec.ts
# 期待: 複数件（TC-LOG-01 / TC-LOG-04 等）
# 記録: <件数>

# 7. runbook section 5 が存在
grep -n "KV 操作エラーログ確認" docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md
# 期待: 1 件
# 記録: <件数>

# 8. *.test.ts 新規追加なし
git diff --name-only dev...HEAD | grep -E '\.test\.ts$' || echo "OK: no .test.ts"
# 期待: "OK: no .test.ts"
```

---

## 9-4. PII / stack trace 漏洩 grep gate

```bash
# raw dedupeKey が console に出ていないこと（Hash だけ許容）
grep -nE "console\.(log|info|warn|error)" apps/api/src/routes/internal/alert-relay.ts \
  | grep -vE "dedupeKeyHash" \
  | grep -E "dedupeKey"
# 期待: 0 件

# stack trace を emit していないこと
grep -nE "console\.(log|info|warn|error)" apps/api/src/routes/internal/alert-relay.ts \
  | grep -E "\.stack"
# 期待: 0 件

# raw err.message を emit していないこと（errorClass のみ）
grep -nE "console\.(log|info|warn|error)" apps/api/src/routes/internal/alert-relay.ts \
  | grep -E "err\.message|error\.message"
# 期待: 0 件（既存の dedup KV put 失敗ログは structured 経路へ移行済み前提）
```

---

## 9-5. behaviour parity check

既存挙動が変わっていないことを既存テスト名で逐次確認する。

| 既存テスト ID | 検証する不変挙動 | 期待 |
| --- | --- | --- |
| ROUTE-04 | 正常 payload + Slack 200 で 200 / `{ok:true, attempts:1}` | PASS（fetchMock 1 回 / response 不変） |
| ROUTE-05 | Slack 5xx 連続で 502 / `{ok:false, attempts:3}` / kv.puts 0 件 | PASS（put 経路に到達しないことが不変） |
| ROUTE-05a | Slack retry 後 success の dedup 順序 | PASS（kv.puts 1 件） |
| ROUTE-05b / TC-02 | 5 分間 dedup（同一 alert 2 通目が `deduped:true`） | PASS |
| TC-03 | 異なる metric / policy_id / minute は dedup されない | PASS（fetchMock 2 回） |
| TC-KV-01 | TTL 経過後 dedup 解除 | PASS |

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay 2>&1 \
  | grep -E "ROUTE-(04|05|05a|05b)|TC-(02|03|KV-01)"
# 期待: 全行 PASS（FAIL 0）
```

---

## 9-6. response body / status 差分検査

```bash
# put throw 時の response が新規 field を漏らしていないこと（dedupPersisted のみ）
mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay -t "TC-LOG-02"
# 期待: PASS / response body keys = {ok, attempts, dedupPersisted}
# （isolateId / errorClass は response に出さない）

# get throw 時の response が dedup hit と誤認されないこと
mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay -t "TC-LOG-01"
# 期待: PASS / response body に "deduped":true が含まれない
```

---

## 9-7. coverage 確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage -- alert-relay
# 期待: line ≥ 既存ベース / branch ≥ 既存ベース（低下なし）
# 記録: line=<n>% branch=<n>%
```

---

## 9-8. 完了条件

- [ ] 9-1 AC マッピング表が全 AC（1〜10）について evidence 行を持つ
- [ ] 9-2 不変条件 1〜8 が全て充足 evidence を持つ
- [ ] 9-3 検証コマンド 1〜8 が全て期待値通り
- [ ] 9-4 PII / stack grep gate が全て 0 件
- [ ] 9-5 既存テスト 6 件（ROUTE-04 / 05 / 05a / 05b / TC-03 / TC-KV-01）が PASS
- [ ] 9-6 response body / status が既存と差分なし
- [ ] 9-7 coverage が既存ベース以上
- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test` failed=0

---

## 9-9. NO-GO 判定基準

以下のいずれかに該当する場合、Phase 6 または Phase 2 に差し戻し:

- TC-LOG-01〜TC-LOG-05 のいずれかが FAIL / flaky（連続 5 回中 1 回でも fail）
- 既存 ROUTE-* / TC-* が 1 件でも regression
- 9-4 grep gate に 1 件でもマッチ
- runbook section 5 の field 定義表が AC-3 schema と相違
- response body / status に新規 field が漏れている
- `*.test.ts` が新規追加されている（不変条件 2 違反）

---

## 次 Phase 引き継ぎ事項

- 次: Phase 10（リファクタ）
- 引き継ぎ事項:
  - 9-3 / 9-4 grep gate は Phase 10 完了後にも再実行（regression 検出）
  - 9-5 behaviour parity check の結果は Phase 12 `implementation-guide.md` に転記
  - coverage 値は Phase 12 `system-spec-update-summary.md` の品質メトリクスに反映
- ブロック条件: 9-9 NO-GO 基準に 1 件でも該当した場合は Phase 6 へ差し戻す

## 実行タスク

本 Phase の対象実装・検証・ドキュメント同期を実行する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `apps/api/src/routes/internal/alert-relay.ts` | 実装正本 |
| 必須 | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | テスト正本 |

## 成果物/実行手順

`@ubm-hyogo/api` を package filter として typecheck / lint / build / test を実行し、Phase 11 evidence に記録する。

## 完了条件

local evidence が PASS し、runtime / git operation は Phase 13 user gate に分離されていること。

## 統合テスト連携

`alert-relay.spec.ts` の focused tests と Phase 11 grep gate に接続する。
