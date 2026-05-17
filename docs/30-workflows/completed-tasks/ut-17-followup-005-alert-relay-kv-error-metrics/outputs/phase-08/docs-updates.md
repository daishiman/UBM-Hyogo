# Phase 8 成果物: runbook 追記文案（差分本文の正本）

本ファイルは `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` への
追記内容をそのまま反映できる状態で記録する。Phase 8 完了時点で本ファイルを正本とし、
runbook 本体への適用は Phase 6（実装）または Phase 8 内の編集で行う。

---

## 適用対象

- ファイル: `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`
- 編集方針: **追記のみ**（既存記述の上書き禁止）

---

## 差分A: §2「確認手順」末尾に新セクション追加

挿入位置: `### Step 4b: ALERT_DEDUP_KV namespace 健全性確認（ut-17-followup-002）` の直後・
`### Step 5: 1Password の secret 鮮度確認` の直前。

````markdown
### Step 4c: KV 操作エラーログの確認（ut-17-followup-005）

`apps/api/src/routes/internal/alert-relay.ts` は KV `get` / `put` 失敗時に
`console.warn(JSON.stringify({...}))` で **構造化ログ**を 1 行 JSON として emit する。
Workers Logs からこのログを集計することで、KV 一時障害・global replication 遅延・
write rate limit 接近による dedup 不整合（Slack 重複配信）を「人間が Slack で気づく」前に
観測する。

#### 構造化ログ schema

| field | 型 | 例値 | 説明 |
| --- | --- | --- | --- |
| `event` | string (literal) | `"alert_relay_kv_op_failed"` | 後段 logpush の filter 契約。改名禁止 |
| `op` | `"get"` \| `"put"` | `"get"` | 失敗した KV 操作種別 |
| `errorClass` | string | `"Error"` / `"TypeError"` | `err instanceof Error ? err.constructor.name : typeof err`。stack は含めない |
| `dedupeKeyHash` | string (12 hex) | `"a1b2c3d4e5f6"` | SHA-256(dedupeKey) の先頭 12 hex chars（lowercase）。raw key は emit しない |
| `isolateId` | string (UUID) | `"3f2a..."` | module top で 1 回採番。同一 isolate ライフサイクル中のログ集約用代理識別子 |
| `ts` | string (ISO 8601) | `"2026-05-16T03:21:45.123Z"` | emit 時刻 UTC |

> stack trace は意図的に含めない（Workers Logs の 1 行上限超過防止）。
> raw `dedupeKey` も emit しない（容量圧迫 + 不要な冗長化抑制）。

#### tail での確認コマンド

```bash
bash scripts/cf.sh tail \
  --config apps/api/wrangler.toml \
  --env production \
  --format pretty \
  | grep alert_relay_kv_op_failed
```

> `wrangler tail` を直接呼ばないこと（CLAUDE.md「Cloudflare 系 CLI 実行ルール」）。

#### しきい値（調査開始トリガー）

| 観点 | しきい値 | 一次対応 |
| --- | --- | --- |
| 直近 1 時間の `alert_relay_kv_op_failed` 件数 | 10 件超 | 本 §2 Step 4c の調査フローへ移行 |
| 同一 `dedupeKeyHash` の連続失敗 | 同一 hash で 5 連続 | 該当 hash の policy_id を特定し Cloudflare KV namespace 状況を確認 |
| `op:"put"` のみ偏って増加 | `op:"put"` が 1 時間で 5 件超 / `op:"get"` 1 件未満 | write rate limit 接近を疑い Cloudflare Dashboard KV usage を確認 |
| `op:"get"` のみ偏って増加 | `op:"get"` が 1 時間で 5 件超 | global replication 遅延を疑い Cloudflare status を確認 |

> しきい値はサイレント検知防止の運用 SLO であり、production traffic 量に応じて
> ut-17-followup-006（KV usage dashboard）以降で調整する。
> 現時点では「10 件 / 1 時間」を暫定値として運用する。

#### 調査フロー

1. 上記 grep コマンドで直近 1 時間分の emit を抽出
2. `op` 別件数・`errorClass` 別件数を集計（jq 推奨）
3. `dedupeKeyHash` の分布が偏っている場合、特定 policy の dedup key 競合を疑う
4. 偏りがなく全体的に増加していれば、Cloudflare 側 KV インシデントを疑い
   https://www.cloudflarestatus.com/ を確認
5. Slack 重複配信が実害として発生しているか確認するため、
   同時間帯の Slack `#ubm-alerts` の重複投稿を目視で照合
6. 必要に応じて ut-17-followup-002 のフェイルセーフ（`dedupPersisted=false`）が
   レスポンスに反映されているか `bash scripts/cf.sh tail` で並行確認

#### 注意

- `isolateId` は Cloudflare Workers に公式の `isolate.id` API が無いため、
  `crypto.randomUUID()` で module top に 1 回採番した代理識別子。
  isolate が再生成されると別 UUID になる点を留意する。
- 本ログは fail-open 運用（KV 失敗時も Slack 配信を止めない）が前提。
  「ログが出ている = Slack は配信されている」ことに注意し、
  Slack 配信の有無は別軸（`#ubm-alerts` 到達）で確認する。
````

---

## 差分B: §3「異常検知時の対応」テーブル末尾に 1 行追加

挿入位置: 既存テーブルの最終行の直後。

```markdown
| `alert_relay_kv_op_failed` 件数が直近 1 時間で 10 件超 | §2 Step 4c の調査フローへ移行。Cloudflare KV namespace 状況 + write rate limit 接近 + global replication 遅延 を順に確認 |
```

---

## 差分C（条件付き）: §0 への参照追加

`§0 本 runbook の位置付け` が ut-17-followup-003 で既に追記済みの場合のみ、末尾に 1 行追加する:

```markdown
- KV dedup の構造化ログ集計は §2 Step 4c（ut-17-followup-005 で追加）を参照
```

現在の HEAD（origin/dev = caa42915）の runbook には §0 が **存在しない**ため、
本差分Cは適用しない。`§0` が後続タスクで追記された段階で必要に応じて適用する。

---

## specs grep 結果評価

```bash
grep -rIn -e "alert_relay" -e "alert-relay" -e "ALERT_DEDUP_KV" -e "alert_relay_kv_op_failed" \
  docs/00-getting-started-manual/specs/ \
  | tee outputs/phase-08/specs-grep.txt
```

判定方針:
- hit 0 件の場合 → `specs` 修正不要。`outputs/phase-08/specs-grep.txt` を空または「no hits」で保存
- hit がある場合 → 該当 spec に「KV 操作失敗時は `alert_relay_kv_op_failed` 構造化ログが emit される」を 1 行追記し、本ファイルに diff を追記

実測結果は Phase 8 実行時に `specs-grep.txt` に保存し、本セクションの末尾に「hit N 件」「対応: 修正不要 / diff 適用」を追記する。

---

## CLAUDE.md 影響なし根拠

| 項目 | 判定 | 追記要否 |
| --- | --- | --- |
| 新規 binding / secret 追加なし（既存 `ALERT_DEDUP_KV` のみ利用） | 既存「シークレット管理」テーブルで足りる | 不要 |
| `apps/web` env アクセス不変条件 | 本タスクは `apps/api` 限定 | 不要 |
| Cloudflare 系 CLI 実行ルール | runbook 内 grep 例は `bash scripts/cf.sh tail` 経由を明記済み | 既存ルールで足りる |
| 不変条件（1〜10 項目） | 構造化ログ schema は本タスクで新設だが、CLAUDE.md レベルの不変条件には該当しない | 不要 |

**結論**: `CLAUDE.md` への追記は **不要**。

---

## DoD 対応表

| Phase 8 DoD 項目 | 本ファイル該当箇所 |
| --- | --- |
| 「Step 4c」セクション追記 | 差分A |
| schema 表（6 field） | 差分A の schema 表 |
| `bash scripts/cf.sh tail` の grep 例 | 差分A の tail 確認コマンド |
| しきい値（直近 1 時間 10 件超） | 差分A のしきい値表 |
| §3 異常検知テーブル 1 行追加 | 差分B |
| Markdown ブロック単位 diff 記録 | 差分A / B / 条件付き C |
| specs grep 結果保存 | 上記「specs grep 結果評価」セクション |
| CLAUDE.md 影響なし根拠 | 上記「CLAUDE.md 影響なし根拠」セクション |
