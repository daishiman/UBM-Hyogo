# Phase 8: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | alert-relay KV 操作エラーの observability 計測 |
| Phase 番号 | 8 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | 7 (テスト計画) |
| 次 Phase | 9 (受入確認) |
| 状態 | spec_created |
| GitHub Issue | #701 |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` への追記、index.md / 仕様書本体への注釈、Phase 12 changelog 反映項目を具体 Markdown snippet として確定する。 |

---

## 目的

monthly healthcheck runbook に「KV 操作エラーログ確認」セクションを追加し、
オペレーターが Workers Logs から `alert_relay_kv_op_failed` event を検索・集計・閾値判断できる手順を残す。
追記内容は AC-9（ログ schema field 定義表 / `scripts/cf.sh tail | grep` 例 / しきい値ガイドライン）を満たす形で固定する。

---

## 8-1. 追記対象

| ファイル | セクション | 追記方針 |
| --- | --- | --- |
| `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 新規セクション「## 5. KV 操作エラーログ確認」 | 既存 runbook 章立てに合わせて 8-2 snippet を追記 |
| `docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics/index.md` | 注意点末尾 | 「runbook section 5 を参照」を 1 行追記 |
| `docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics/outputs/phase-12/documentation-changelog.md` | 反映項目（後続 Phase 12 で記録） | 8-3 一覧をそのまま転記 |

> `apps/api` 配下の README / inline doc 追記は本タスクスコープ外（コードコメントは Phase 6 で実装済み前提）。

---

## 8-2. runbook 追記 Markdown snippet（そのまま貼り付け）

既存 runbook 末尾（「## 5. fail-closed 退避手順」より後）に挿入する。

````markdown
## 5. KV 操作エラーログ確認

UT-17-FU-005 で `apps/api/src/routes/internal/alert-relay.ts` の `ALERT_DEDUP_KV.get` / `.put` 失敗を
構造化 JSON ログ 1 行で `console.warn` 経由 emit するようにした。本セクションはその確認手順。

### 7-1. ログ schema（field 定義表）

| field | 型 | 値 / 算出方法 | 用途 |
| --- | --- | --- | --- |
| `event` | string 固定 | `"alert_relay_kv_op_failed"` | 検索用先頭マーカー（`grep` / logpush filter） |
| `op` | `"get"` \| `"put"` | KV 操作種別 | dedup スキップ率 / put 失敗率の分離 |
| `errorClass` | string | `err instanceof Error ? err.constructor.name : typeof err` | 一時障害（`TypeError`/`Error`）と恒久障害の切り分け |
| `dedupeKeyHash` | string (12 hex) | `SHA-256(dedupeKey).slice(0, 12)` | key 単位の失敗集中検出（raw key は PII 配慮で出さない） |
| `isolateId` | string (UUID v4) | module top で `crypto.randomUUID()` 1 回採番 | 同一 isolate 内ログのグルーピング（再生成で別 UUID） |
| `ts` | string (ISO 8601) | `new Date().toISOString()` | 時系列集計 |

> schema は logpush / dashboard 契約の正本。**field 追加は additive のみ可、削除・rename 禁止**（CONST_007）。

### 7-2. ログサンプル（1 行 JSON）

```json
{"event":"alert_relay_kv_op_failed","op":"get","errorClass":"Error","dedupeKeyHash":"a3f1c0d4b9e2","isolateId":"6f1b3c8a-2d4e-4a9b-9f0c-7e1d2b3a4c5d","ts":"2026-05-16T07:14:16.000Z"}
```

`JSON.parse` 後の構造:

```js
{
  event: "alert_relay_kv_op_failed",
  op: "get",
  errorClass: "Error",
  dedupeKeyHash: "a3f1c0d4b9e2",
  isolateId: "6f1b3c8a-2d4e-4a9b-9f0c-7e1d2b3a4c5d",
  ts: "2026-05-16T07:14:16.000Z"
}
```

### 7-3. 検索コマンド

```bash
# production tail を 30 秒程度取り、event マーカーで先絞り
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --format pretty \
  | grep alert_relay_kv_op_failed

# op 別件数（直近 1 時間想定）
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --format pretty \
  | grep alert_relay_kv_op_failed \
  | grep -oE '"op":"(get|put)"' \
  | sort \
  | uniq -c

# errorClass 別件数
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --format pretty \
  | grep alert_relay_kv_op_failed \
  | grep -oE '"errorClass":"[^"]+"' \
  | sort \
  | uniq -c
```

> `wrangler tail` の直接実行は禁止（CLAUDE.md / Cloudflare 系 CLI 実行ルール）。`scripts/cf.sh` 経由のみ。

### 7-4. しきい値ガイドライン

| 状態 | 件数（直近 1 時間） | 対応 |
| --- | --- | --- |
| 平常 | 0–2 件 | 様子見。Cloudflare KV の eventual consistency 由来。 |
| 監視 | 3–9 件 | 7-3 の `errorClass` 別集計で偏りを確認。同一 `dedupeKeyHash` 集中なら Slack 重複配信を疑う。 |
| 調査開始 | **10 件超** | Cloudflare Status / KV namespace の write rate limit / API token 期限を確認。UT-17-FU-002 の `dedupPersisted=false` レスポンス頻度と照合。 |
| エスカレーション | 50 件超かつ 5 分継続 | Section 5 fail-closed 退避手順を検討（webhook unbind） |

> しきい値は dashboard 化（UT-17-FU-006）後に SLO へ昇格させる。本 runbook 値は **observability 立ち上げ期の暫定値**。

### 7-5. `isolateId` の意味と限界

- Workers には `isolate.id` 公式 API がない。module top の `crypto.randomUUID()` を 1 isolate あたり 1 回採番した値。
- 同一 isolate 内の連続ログ（例: get throw → 直後 put throw）は同 UUID。
- isolate 再生成（deploy / cold start / Cloudflare 内部）で別 UUID に変わる点を運用前提とする。
- 「同 isolateId が 5 分以上連続して大量 emit」は **特定 isolate に固着する localized 障害**の信号。

### 7-6. behaviour 不変条件

- `get` 失敗 → fail-open（Slack 配信継続、200 / `ok:true`）
- `put` 失敗 → 200 / `{ok:true, dedupPersisted:false}` 維持
- どちらも response body / status は変えない。**観測可能性のみ追加**（UT-17-FU-005）。

````

---

## 8-3. Phase 12 documentation-changelog.md 反映項目

Phase 12 で `outputs/phase-12/documentation-changelog.md` に転記する一覧（仕様）:

| 変更先 | 変更種別 | 内容 |
| --- | --- | --- |
| `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | section 追加 | 「## 7. KV 操作エラーログ確認」セクション一式 |
| `docs/30-workflows/ut-17-followup-005-.../index.md` | 注釈追記 | 「監視手順は runbook section 5 を参照」1 行 |
| `apps/api/src/routes/internal/alert-relay.ts` | コードコメント | `logKvOperationError` ヘルパ docstring（schema 安定化 / PII 配慮の根拠コメント） |
| `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | テスト追加コメント | TC-LOG-04 の「module top 1 回採番」検証意図コメント |

> `docs/00-getting-started-manual/specs/` 配下は対象外（本タスクは observability で system spec 変更を伴わない）。

---

## 8-4. index.md 注釈追記方針

`docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics/index.md` 末尾「注意点」セクションに以下 1 行を追加（Phase 12 で `unassigned-task/...` 原典との差分明記と同時に反映する）。

```markdown
- 本タスクで追加する構造化ログの監視手順・しきい値は `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` section 5 を正本とする。dashboard 化（UT-17-FU-006）時に SLO へ昇格させる。
```

---

## 8-5. 内部リンク整合性チェック

```bash
# runbook → 仕様書への back-link が存在することを確認（Phase 12 main.md で）
grep -n "ut-17-followup-005" docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md
# 期待: 1 件以上（section 5 冒頭の "UT-17-FU-005 以降..." 行）

# 仕様書 → runbook section 5 への参照
grep -n "section 5\|KV 操作エラーログ確認" docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics/index.md
# 期待: 1 件以上
```

---

## 8-6. 完了条件

- [ ] runbook に「## 7. KV 操作エラーログ確認」セクションが追加されている（8-2 snippet 全文）
- [ ] field 定義表（`event` / `op` / `errorClass` / `dedupeKeyHash` / `isolateId` / `ts`）が記載されている
- [ ] `scripts/cf.sh tail | grep alert_relay_kv_op_failed` の検索コマンドが記載されている
- [ ] しきい値ガイドライン（10 件超で調査開始）が記載されている
- [ ] 1 サンプル JSON 行と `JSON.parse` 後の構造が記載されている
- [ ] `isolateId` の意味と限界（isolate 再生成で UUID 変化）が説明されている
- [ ] index.md に runbook section 5 への参照が 1 行追記されている
- [ ] 内部リンク整合性チェック（8-5）が PASS する
- [ ] 平文 secret / API token が runbook に記載されていないこと（grep `op://Vault` 表記を確認）

---

## 8-7. lint / build 影響なし宣言

- `pnpm typecheck` / `pnpm lint`: Markdown のみ変更のため影響なし
- `docs/**/*.md` の lint は本リポジトリで未設定（前例：`ut-17-followup-003` phase-08 同様）
- 既存 runbook の 1〜6 セクションには手を入れない（regression 防止）

---

## 次 Phase 引き継ぎ事項

- 次: Phase 9（受入確認）
- 引き継ぎ事項:
  - 8-2 snippet の section 5-3 「判定目安」は Phase 9 の AC-9 evidence に直接対応
  - 8-3 一覧は Phase 12 `documentation-changelog.md` にそのまま貼り付け
  - 7-5 「isolateId の限界」は Phase 10 リファクタで helper docstring に転記
- ブロック条件: field 定義表が AC-3 schema と乖離している場合は Phase 2（log-schema.md）へ差し戻す

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
