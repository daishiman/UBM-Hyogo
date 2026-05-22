# Phase 8: ドキュメント更新（runbook KV エラーログ確認手順追記）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | alert-relay KV 操作エラーの observability 計測（構造化ログ emit） |
| タスクID | ut-17-followup-005-alert-relay-kv-error-metrics |
| Phase 番号 | 8 / 13 |
| Phase 名称 | ドキュメント更新（runbook KV エラーログ確認手順追記） |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | 7 (テスト計画) |
| 次 Phase | 9 (受入確認) |
| 状態 | completed |
| GitHub Issue | #701（CLOSED / completed marked / close時点では実コード未実装・本workflowでlocal実装済み） |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` への運用手順追記が、ut-17 monthly healthcheck の SLO 化の前提条件。markdown ファイルへの実差分を確定するため、ドキュメント反映そのものが成果物となる。 |

---

## 目的

`apps/api/src/routes/internal/alert-relay.ts` に追加する構造化ログ `alert_relay_kv_op_failed` を、
**運用オペレーターが Workers Logs から検出・トリアージできる手順**として
`docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` に追記する。

本 Phase は markdown 編集のみで、コード差分は伴わない。
ただし AC-8（runbook に「KV 操作エラーログの確認」セクション + grep 例 + しきい値 + schema 表）の
充足を本 Phase で確定する。

---

## 8-1. ドキュメント変更対象ファイル一覧

| # | ファイル | 変更種別 | 影響度 |
| --- | --- | --- | --- |
| 1 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 追記（§2 末尾に「Step 4c: KV 操作エラーログの確認」を新設 + §3 異常検知時の対応テーブルに 1 行追加） | 高 |
| 2 | `docs/30-workflows/ut-17-followup-005-alert-relay-kv-error-metrics/outputs/phase-08/docs-updates.md` | 新規（本 Phase 成果物 / 差分本文の正本） | — |
| 3 | `docs/00-getting-started-manual/specs/` 配下 | 影響有無確認のみ（grep で `alert_relay` / `ALERT_DEDUP_KV` の hit を確認） | 低 |
| 4 | `CLAUDE.md` | 影響有無確認のみ。新規 secret / binding を増やさないため追記不要が想定値 | 低 |

> 1 / 2 は本 Phase で必ず確定。3 / 4 は grep 後に「変更不要」または「diff 提示」の二択。

---

## 8-2. `ut-17-alert-relay-monthly-healthcheck.md` 差分（Markdown ブロック単位）

### 差分A: §2 末尾に「Step 4c: KV 操作エラーログの確認」を追加（§4b の直後・§5 の直前に挿入）

```markdown
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
6. ut-17-followup-002 のフェイルセーフ（`dedupPersisted=false`）が
   レスポンスに反映されているか `bash scripts/cf.sh tail` で並行確認

#### 注意

- `isolateId` は Cloudflare Workers に公式の `isolate.id` API が無いため、
  `crypto.randomUUID()` で module top に 1 回採番した代理識別子。
  isolate が再生成されると別 UUID になる点を留意する。
- 本ログは fail-open 運用（KV 失敗時も Slack 配信を止めない）が前提。
  「ログが出ている = Slack は配信されている」ことに注意し、
  Slack 配信の有無は別軸（`#ubm-alerts` 到達）で確認する。
```

### 差分B: §3「異常検知時の対応」テーブルに 1 行追加

既存テーブル末尾に以下 1 行を追加する:

```markdown
| `alert_relay_kv_op_failed` 件数が直近 1 時間で 10 件超 | §2 Step 4c の調査フローへ移行。Cloudflare KV namespace 状況 + write rate limit 接近 + global replication 遅延 を順に確認 |
```

### 差分C（条件付き）: §0 への参照追加

`§0 本 runbook の位置付け` が ut-17-followup-003 で既に追記済みの場合、Step 4c への参照を
末尾に 1 行追加する:

```markdown
- KV dedup の構造化ログ集計は §2 Step 4c（ut-17-followup-005 で追加）を参照
```

§0 が未追記の runbook 版（現在の HEAD では §0 なし）では本差分Cは適用しない。

---

## 8-3. `docs/00-getting-started-manual/specs/` 影響有無の判定手順

### 手順

```bash
grep -rIn -e "alert_relay" -e "alert-relay" -e "ALERT_DEDUP_KV" -e "alert_relay_kv_op_failed" \
  docs/00-getting-started-manual/specs/ \
  | tee outputs/phase-08/specs-grep.txt
```

### 判定マトリクス

| grep 結果 | 対応 |
| --- | --- |
| `alert-relay` / `ALERT_DEDUP_KV` の説明が specs 内に存在 | 該当 spec に「KV 操作失敗時は `alert_relay_kv_op_failed` 構造化ログが emit される」を 1 行追記し、本 Phase の `docs-updates.md` に diff を記録 |
| 言及がない | spec 修正なし。`docs-updates.md` に「specs grep 結果: hit 0 件のため修正不要」を明記 |

> grep hit 0 件であっても `specs-grep.txt` は evidence として保管する。

---

## 8-4. `CLAUDE.md` 追記判定

| 項目 | 判定 | 追記要否 |
| --- | --- | --- |
| 新規 binding / secret 追加なし | 既存「シークレット管理」テーブルで足りる | 不要 |
| `apps/web` env アクセス不変条件 | 本タスクは `apps/api` 限定 | 不要 |
| Cloudflare 系 CLI 実行ルール | runbook 内 grep 例は `bash scripts/cf.sh tail` 経由を明記 | 既存ルールで足りる |

> **結論**: `CLAUDE.md` への追記は **不要**。本 Phase の `docs-updates.md` に
> 「CLAUDE.md 影響なし」根拠を明記する。

---

## 8-5. 主要シンボル（runbook から参照される範囲）

本 Phase は markdown 編集のみだが、runbook §2 Step 4c で参照する識別子は以下に固定する
（Phase 9 受入で同じ識別子を再利用する）:

| 識別子 | 種別 | 固定値 / 規約 |
| --- | --- | --- |
| `event` literal | 構造化ログ field | `"alert_relay_kv_op_failed"` |
| `op` enum | 構造化ログ field | `"get"` \| `"put"` |
| `dedupeKeyHash` | 構造化ログ field | SHA-256 先頭 12 hex chars（lowercase） |
| `isolateId` | 構造化ログ field | `crypto.randomUUID()` module top で 1 回採番 |
| `ts` | 構造化ログ field | ISO 8601 UTC |

> 上記識別子は AC-3 / AC-4 / AC-8 と整合する。
> 後段 logpush の filter 契約となるため、改名は本タスク以後の互換性 break を伴う。

---

## 8-6. 入出力・副作用

| 入力 | 出力 | 副作用 |
| --- | --- | --- |
| `ut-17-alert-relay-monthly-healthcheck.md` の現状 | 差分A / B（および条件付き C）を適用した新版 | git 差分のみ。コード変更なし |
| `docs/00-getting-started-manual/specs/` の grep 結果 | `outputs/phase-08/specs-grep.txt` | evidence ファイル 1 件 |

---

## 8-7. テスト方針 / 検証コマンド

```bash
# 1. runbook 差分が構造を壊していないか確認
mise exec -- pnpm exec markdownlint-cli2 \
  "docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md"

# 2. specs grep を実行し、評価結果を docs-updates.md に転記
grep -rIn -e "alert_relay" -e "alert-relay" -e "ALERT_DEDUP_KV" -e "alert_relay_kv_op_failed" \
  docs/00-getting-started-manual/specs/ \
  | tee outputs/phase-08/specs-grep.txt

# 3. 差分A の schema 表 field 名が AC-3 と一致しているか確認
grep -nE 'event|op|errorClass|dedupeKeyHash|isolateId|ts' \
  docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md \
  | grep -c 'alert_relay_kv_op_failed'

# 4. CLAUDE.md に新規 secret 名が誤って入っていないか確認（不要追記の検知）
grep -nE "alert_relay_kv_op_failed" CLAUDE.md \
  && echo "WARN: CLAUDE.md に schema 直書きが入った可能性。意図的か確認" \
  || echo "OK: CLAUDE.md に schema 直書きなし"
```

---

## 8-8. DoD（Definition of Done）

- [ ] `ut-17-alert-relay-monthly-healthcheck.md` に「Step 4c: KV 操作エラーログの確認」セクションが §2 末尾に追記されている
- [ ] §2 Step 4c に schema 表（6 field × 4 列）が記載されている
- [ ] §2 Step 4c に `bash scripts/cf.sh tail` の grep コマンド例が記載されている
- [ ] §2 Step 4c にしきい値（直近 1 時間 10 件超）が記載されている
- [ ] §3 異常検知時の対応テーブルに 1 行追加されている
- [ ] `outputs/phase-08/docs-updates.md` に Markdown ブロック単位の diff が記録されている
- [ ] `outputs/phase-08/specs-grep.txt` に grep 結果（hit 0 件でも）が保存されている
- [ ] CLAUDE.md / specs に追記不要であった場合、その根拠が `docs-updates.md` に明記されている
- [ ] markdownlint で runbook が PASS する

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 9 | runbook §2 Step 4c の schema 表（6 field）を AC-3 検証で再利用 | Phase 9 で実装と runbook の整合を grep で確認 |
| Phase 10 | runbook で参照される identifier（`event` / `op` / `dedupeKeyHash` / `isolateId`）が refactor で改名されないことの根拠 | Phase 10 改名禁止の根拠ドキュメント |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md | 追記対象本体 |
| 必須 | docs/30-workflows/unassigned-task/ut-17-followup-005-alert-relay-kv-operation-error-metrics.md | 原典タスク指示書 |
| 必須 | docs/30-workflows/ut-17-followup-005-alert-relay-kv-error-metrics/outputs/phase-02/log-schema.md | schema 正本 |
| 参考 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | `bash scripts/cf.sh` 経由必須 |
| 参考 | docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-08.md | runbook 追記フォーマット参考 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/docs-updates.md | 差分A / B / 条件付き C 全文 + specs grep 結果評価 + CLAUDE.md 影響なし根拠 |
| evidence | outputs/phase-08/specs-grep.txt | specs grep 生出力 |
| メタ | artifacts.json | phase-08 を completed に更新 |

---

## 完了条件チェックリスト

- [ ] 8-2 差分A / B が `outputs/phase-08/docs-updates.md` に Markdown ブロック単位で記載
- [ ] 8-3 specs grep が実行され `specs-grep.txt` に保存
- [ ] 8-4 CLAUDE.md 追記不要の根拠が明記
- [ ] 8-7 検証コマンドで markdownlint / schema field 整合性が PASS
- [ ] 8-8 DoD 全項目が PASS

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-08 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 9（受入確認）
- 引き継ぎ事項:
  - runbook §2 Step 4c の schema 表（6 field）は AC-3 / AC-8 検証の正本として再利用する
  - しきい値「直近 1 時間 10 件超」は ut-17-followup-006（KV usage dashboard）で改訂候補
- ブロック条件: runbook 既存記述を上書きしてしまった場合は git revert で復旧してから追記方式に修正

## 実行タスク

- monthly healthcheck runbook と Phase 12 documentation-changelog に反映する項目を確定する。
