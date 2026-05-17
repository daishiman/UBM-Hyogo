# Phase 8 成果物: ドキュメント更新

## 追記対象

| ファイル | セクション | 追記方針 |
| --- | --- | --- |
| `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 新規 section「## 5. KV 操作エラーログ確認」 | 下記 snippet を実 runbook の既存章立てに合わせて追記 |
| `docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics/index.md` | 注意点末尾 | 「runbook section 5 を参照」を 1 行追記 |
| `outputs/phase-12/documentation-changelog.md` | 反映項目 | 下記 8-3 一覧を転記 |

`apps/api` README / inline doc 追記は本タスクスコープ外（コードコメントは Phase 6 で実装済み）。

## 8-2. runbook 追記 snippet

```markdown
## 5. KV 操作エラーログ確認

UT-17-FU-005 で `apps/api/src/routes/internal/alert-relay.ts` の KV `get` / `put` 失敗は
`event=alert_relay_kv_op_failed` の構造化 JSON 1 行として `console.warn` で emit される。
月次健全性チェックの一部として以下を確認する。

### 5-1. ログ schema field 定義

| field | 型 | 説明 |
| --- | --- | --- |
| `event` | `"alert_relay_kv_op_failed"` | discriminator |
| `op` | `"get" \| "put"` | KV 操作種別 |
| `errorClass` | string | `Error` 系は `err.constructor.name`、非 Error throw は `typeof err` |
| `dedupeKeyHash` | string (12 hex) | `SHA-256(dedupeKey)` 先頭 12 hex。算出失敗時のみ `"hash_error"` |
| `isolateId` | string (UUID v4) | Workers isolate 起動時に 1 回採番される ID |
| `ts` | string (ISO 8601 UTC) | emit 時刻 |

### 5-2. 検索コマンド例

```bash
bash scripts/cf.sh tail apps/api/wrangler.toml --env production --format json \
  | grep alert_relay_kv_op_failed
```

JSON 抽出例（`jq` 利用時）:

```bash
bash scripts/cf.sh tail apps/api/wrangler.toml --env production --format json \
  | grep alert_relay_kv_op_failed \
  | jq -r '[.ts, .op, .errorClass, .isolateId] | @tsv'
```

### 5-3. しきい値ガイドライン

- 同一 `isolateId` で連続 emit が観測される場合 → isolate 単位の偏った KV エラー（colo / replica drift 等）を疑う
- 異なる `isolateId` で広域に emit される場合 → グローバル KV 一時障害を疑う
- 1 時間で 10 件以上を超えた場合は UT-17-FU-004 dashboard / Cloudflare Status を確認

### 5-4. 関連タスク

- 実装: `apps/api/src/routes/internal/alert-relay.ts` の `logKvOperationError` helper
- テスト: `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` の TC-LOG-01〜08
- 後続: UT-17-FU-006 (KV usage / latency dashboard) で同 event を時系列集計に昇格予定
```

## 8-3. Phase 12 documentation-changelog 反映項目

- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`: section 5「KV 操作エラーログ確認」追記（+49 LOC）
- `docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics/index.md`: 注意点末尾に runbook section 5 参照を追記
- Phase 12 documentation-changelog: 上記 2 ファイルと runbook 5-2 field 表を「ログ schema 正本」として記録

## AC-9 評価

- field 定義表 (6 field) → 5-2 で記載済
- `scripts/cf.sh tail | grep` 検索例 → 5-1 で記載済
- しきい値ガイドライン → 5-3 で記載済
- AC-9 を本 Phase 成果物で充足
