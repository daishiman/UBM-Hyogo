# Cloudflare alert policy と KV/R2 binding のドリフト検知 - タスク指示書

## メタ情報

```yaml
issue_number: 1056
```


## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | issue-57-followup-003-kv-alert-policy-drift-detection                          |
| タスク名     | Cloudflare alert policy と KV/R2 binding のドリフト検知                        |
| 分類         | 改善                                                                          |
| 対象機能     | Cloudflare alert policy(`infra/cloudflare-alerts/`) / binding ドリフト検知    |
| 優先度       | 低                                                                            |
| 見積もり規模 | 小規模                                                                        |
| ステータス   | 未実施                                                                        |
| 発見元       | Issue #57 (issue-57-kv-r2-guardrail-degrade-design) 独立検証 候補3            |
| 発見日       | 2026-05-31                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #57 で KV/R2 の無料枠 free-tier limits を正本（`docs/00-getting-started-manual/specs/08-free-database.md`
/ `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`）に記録し、
binding 棚卸し表（"Current KV/R2 binding inventory" / 2026-05-31）を新設した。

一方で Cloudflare alert policy 側（`infra/cloudflare-alerts/policies/`）には
`workers-kv-writes-per-day` / `workers-kv-stored-bytes` の 2 policy が
Workers KV account quota guard として宣言されているが、初期値は `enabled:false`(disabled) で、
KV binding が実活性化された際にこの alert policy を有効化する連動が非明示的である。

### 1.2 問題点・課題

- KV binding（`SESSION_KV` / `ALERT_DEDUP_KV` 等）が将来実活性化されても、対応する
  alert policy（使用量監視）が自動で有効化される保証が無い
- 逆に alert policy だけ `enabled:true` 化しても、監視対象の binding が wrangler.toml /
  棚卸し表で active でなければ無意味な監視になる
- binding 実体 ↔ alert policy の整合が完全に手動依存で、整合を保証する単一の検証点が無い
- binding 活性 / free-tier 記録 / alert policy 有効化 が別々のタスク（#57 /
  UT-17-followup-006 / UT-33）に分散しており、三者を突き合わせる仕組みが欠落している

### 1.3 放置した場合の影響

- KV binding を実活性化しても無料枠監視が無効のまま放置され、quota 超過に気付けない
- 不要な alert policy が `enabled:true` のまま残り、運用ノイズや誤検知の温床になる
- binding ↔ policy 整合のレビューが属人化し、棚卸し表更新の抜けに気付けない
- ただし本ドリフトは「alert policy 運用開始（UT-17-followup-006）後」に初めて効くため、
  影響は将来時点に限定され、現時点での実害は小さい（→ 優先度 低）

---

## 2. 何を達成するか（What）

### 2.1 目的

KV/R2 binding の活性状態（`deployment-cloudflare.md` の binding 棚卸し表 +
`apps/api/wrangler.toml`）と、対応する Cloudflare alert policy
（`infra/cloudflare-alerts/` の schema / policy 定義）の整合をチェックし、
ドリフト（binding active なのに監視 policy disabled、あるいはその逆）を検出して報告する。

aiworkflow-requirements skill の observability / 運用性の思想（監視は宣言と実体の
整合が検証可能であること、ドリフトは自動検知すること）を反映する。

### 2.2 最終ゴール

- binding ↔ alert policy 対応表が明文化され、どの binding がどの policy で監視されるべきかが一意に定まる
- binding が active なのに対応 policy が `enabled:false`、または policy が `enabled:true` なのに
  対応 binding が inactive、という drift を read-only で検出・報告できる
- 検知は read-only（棚卸し）に徹し、policy の実有効化や binding 追加といった mutation は行わない
- UT-17-followup-006（KV alert policy 運用開始）との責務境界が文書上明確化される

### 2.3 スコープ

#### 含むもの

- binding（`SESSION_KV` / `ALERT_DEDUP_KV` / R2 系）↔ alert policy
  （`workers-kv-writes-per-day` / `workers-kv-stored-bytes` / `r2-class-a` 等）対応表の整理
- binding 活性状態（棚卸し表 + wrangler.toml）の読み取り
- alert policy の `enabled` 状態（`infra/cloudflare-alerts/policies/*.json`）の読み取り
- 両者の drift 検出ロジックの設計
- 検知の実行手段（手動 script か CI gate か）の決定（実装は Phase 13 ユーザー承認後）

#### 含まないもの

- alert policy の実有効化判断・`enabled:true` 化（→ UT-17-followup-006 射程）
- 新規 binding の追加・新規 alert policy の追加
- 有料プランへの切替判断
- Cloudflare 実環境への `alerts apply`（mutation 一切）
- KV 使用量監視の運用サイクル設計（→ #85 / #75 / #77 射程）

### 2.4 成果物

- binding ↔ alert policy 対応表（仕様書 §3 / `deployment-cloudflare.md` への追記候補）
- drift 検知ロジックの設計メモ（read-only / 入力 = 棚卸し表 + wrangler.toml + policy JSON）
- 検知実行手段の決定（script / CI gate の選択と根拠）
- UT-17-followup-006 との責務境界記述

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Issue #57（KV/R2 free-tier 正本化 + binding 棚卸し表）が完了している
- `infra/cloudflare-alerts/policies/` に KV/R2 alert policy JSON が存在する（確認済み）
- UT-17-followup-006（KV alert policy 運用開始）の運用が前提（本タスクは検知のみで運用判断は委ねる）

### 3.2 依存タスク

- Issue #57（binding 棚卸し表 + free-tier 正本）
- UT-17-followup-006（KV alert policy 運用開始 / 責務重複部の委譲先）

### 3.3 必要な知識

- `infra/cloudflare-alerts/` の alert policy schema（`schema/policy.schema.json` / `billing_usage_alert`）と
  `enabled` フィールドの意味
- `deployment-cloudflare.md` の binding 棚卸し表の読み方（active / not applied / commented の状態区別）
- `apps/api/wrangler.toml` の KV / R2 binding 宣言形式
- `bash scripts/cf.sh alerts {list,diff,apply}` の正本経路（drift 検知は diff 相当の read-only 思想を流用）
- aiworkflow-requirements skill の observability / 運用性ガイドライン

### 3.4 推奨アプローチ

宣言 vs 実体の突き合わせを read-only の「棚卸し diff」として設計する。
入力は (a) binding 棚卸し表 + wrangler.toml の active 判定、(b) alert policy JSON の `enabled` 判定。
両者を binding ↔ policy 対応表で結び、`active && !enabled`（監視欠落）と
`enabled && !active`（無意味な監視）の 2 種を drift として列挙する。

完全自動化（CI gate）と手動 script のどちらにするかは、運用開始（UT-17-followup-006）の
タイミングと ROI を踏まえて Phase 3 で決定する。優先度が低いため、初手は
`bash scripts/cf.sh alerts diff` 系の read-only 出力 + 棚卸し表クロスチェックを
手動 script として用意する案を第一候補とし、CI gate 化は運用開始後の follow-up に分離してよい。

---

## 4. 実行手順

### Phase構成

1. binding ↔ alert policy 対応表の整理
2. ドリフト検知ロジック設計
3. 検知の実行手段（script or CI gate）決定
4. UT-17-followup-006 との連携確認

### Phase 1: binding ↔ alert policy 対応表の整理

#### 目的

どの KV/R2 binding が、どの alert policy で監視されるべきかを一意に対応付ける表を作る。

#### 完了条件

`SESSION_KV` / `ALERT_DEDUP_KV` / R2 系 binding と `workers-kv-writes-per-day` /
`workers-kv-stored-bytes` / `r2-class-a` 等の policy の対応が、棚卸し表と policy JSON の
両方から一意に導けることを確認した対応表が文書化されている。

### Phase 2: ドリフト検知ロジック設計

#### 目的

binding 活性状態（棚卸し表 + wrangler.toml）と policy `enabled` 状態の不整合を
read-only で列挙するロジックを設計する。

#### 完了条件

`active && !enabled`（監視欠落）と `enabled && !active`（無意味な監視）の 2 種を
drift として定義し、入力・判定・出力（報告形式）が設計メモに記述されている。
mutation を一切含まないことが明記されている。

### Phase 3: 検知の実行手段（script or CI gate）決定

#### 目的

drift 検知を手動 script で回すか CI gate にするかを、運用開始タイミングと ROI から決定する。

#### 完了条件

実行手段が選択され、根拠（優先度が低く運用開始後に効くため初手は手動 script、
CI gate 化は follow-up に分離可、など）が記述されている。実装着手は Phase 13 ユーザー承認後とする。

### Phase 4: UT-17-followup-006 との連携確認

#### 目的

本タスク（drift 検知 = 棚卸し）と UT-17-followup-006（alert policy 運用開始判断）の
責務境界を確定し、二重実装・責務重複を排除する。

#### 完了条件

「本タスクは binding ↔ policy 整合のドリフト検知に限定し、policy の実有効化判断は
UT-17-followup-006 に委ねる」境界が §2 / §8 と整合して明記され、
#85 / #75 / #77 とも責務が重ならないことが確認されている。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] binding ↔ alert policy 対応表が一意に定まり文書化されている
- [ ] `active && !enabled` / `enabled && !active` の 2 種 drift を read-only で検出できる
- [ ] 検知ロジックが mutation を一切含まない（policy 有効化・binding 追加をしない）
- [ ] 検知の実行手段（script or CI gate）が根拠付きで決定されている

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功（script 実装時）
- [ ] read-only であることが review で確認できる（`alerts apply` 等の mutation 呼び出しが無い）
- [ ] aiworkflow-requirements skill の observability / 運用性思想に整合している

### ドキュメント要件

- [ ] `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` の
      "Cloudflare Alert Policy IaC" 節 / binding 棚卸し表との整合が取れている
- [ ] UT-17-followup-006 / #85 / #75 / #77 との責務境界が記述されている

---

## 6. 検証方法

### テストケース

- binding active + 対応 policy `enabled:false` → drift（監視欠落）として報告される
- binding inactive + 対応 policy `enabled:true` → drift（無意味な監視）として報告される
- binding active + 対応 policy `enabled:true` → drift なし
- binding inactive + 対応 policy `enabled:false` → drift なし（運用開始前の正常状態）

### 検証手順

```bash
# alert policy 宣言の read-only 確認（mutation しない）
bash scripts/cf.sh alerts list
bash scripts/cf.sh alerts diff
# binding 棚卸し表と policy enabled 状態のクロスチェック（本タスクの検知 script を想定）
# mise exec -- pnpm typecheck  # script 実装時
```

---

## 7. リスクと対策

| リスク                                                          | 影響度 | 発生確率 | 対策                                                                                      |
| --------------------------------------------------------------- | ------ | -------- | ----------------------------------------------------------------------------------------- |
| UT-17-followup-006 / #85 / #75 / #77 と責務が重複し二重実装になる | 中     | 中       | 本タスクを drift 検知（read-only 棚卸し）に限定し、運用開始判断は委譲。§2 / §8 で境界明記 |
| 検知ロジックが誤って mutation（policy 有効化）を実行する         | 中     | 低       | read-only 制約を完了条件と review で強制。`alerts apply` 系の呼び出しを禁止              |
| 棚卸し表 / wrangler.toml / policy JSON の表記揺れで誤判定        | 低     | 中       | binding 名・policy 名を対応表で正規化し、判定入力を 3 ソースに固定                        |
| 優先度が低く着手が後回しになり運用開始後にドリフトが残る        | 低     | 中       | UT-17-followup-006 運用開始の完了条件に本検知の併設を紐付ける（再発防止参照）             |

---

## 8. 参照情報

### 関連ドキュメント

- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
  （"Cloudflare Alert Policy IaC（UT-17 follow-up 004 / 006）" 節 +
  "Current KV/R2 binding inventory（Issue #57 / 2026-05-31）" 棚卸し表 +
  `workers-kv-writes-per-day` / `workers-kv-stored-bytes` の `enabled:false` 明記）
- `infra/cloudflare-alerts/policies/workers-kv-writes-per-day.json`
- `infra/cloudflare-alerts/policies/workers-kv-stored-bytes.json`
- `infra/cloudflare-alerts/README.md` / `infra/cloudflare-alerts/schema/policy.schema.json`
- `docs/00-getting-started-manual/specs/08-free-database.md`（KV/R2 free-tier 正本）
- Issue #57（issue-57-kv-r2-guardrail-degrade-design）
- UT-17-followup-006（KV alert policy 運用開始 / 重複部の委譲先）

### 関連 OPEN Issue（責務境界）

- #85（UT-33 Cloudflare KV 使用量監視・アラート設定）: 監視・アラートの運用設定。
  本タスクは「binding ↔ policy の整合 drift 検知のみ」に限定し、アラート設定自体は #85 射程
- #75（UT-08-IMPL モニタリング/アラート実装）: 監視実装。本タスクは検知（棚卸し）に限定し重複しない
- #77（UT-31 監視運用月次サイクル化）: 運用サイクル。本タスクは drift 検知点の提供に限定

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目     | 内容                                                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | #57 で binding 棚卸し表と free-tier limits は正本化できたが、その監視(alert policy)が binding 活性状態と連動しているかの保証は #57 スコープ外で、整合検証が手動依存のまま残った |
| 原因     | binding 活性 / free-tier 記録 / alert policy 有効化 が別々のタスク(#57 / UT-17-followup-006 / UT-33)に分散し、三者の整合を保証する単一の検証点が無い           |
| 対応     | #57 では正本記録に集中し、alert policy 連動は運用開始(UT-17-followup-006)前提の将来候補に分離した                                                              |
| 再発防止 | binding を実活性化するタスクでは、free-tier 記録・棚卸し表更新・対応 alert policy 有効化を 1 つの完了条件チェックリストに束ね、整合ドリフトを検知する仕組みを併設する |

### 補足事項

優先度が低い理由は、本ドリフト検知が「alert policy 運用開始（UT-17-followup-006）後」に
初めて効くため。運用開始前は KV binding 自体が未活性（`SESSION_KV` not applied /
`ALERT_DEDUP_KV` は wrangler block コメントアウト）で、policy も `enabled:false` の正常状態であり、
drift が発生しないため即時の実害が無い。

本タスクは UT-17-followup-006 と射程が重なる部分があるため、alert policy の運用開始判断
そのものは UT-17-followup-006 に委ね、本タスクは『binding 実活性 ↔ alert policy 有効化』の
ドリフト検知（read-only 棚卸し）に限定する。実装着手・script 実行・CI gate 追加・commit / push / PR は
すべてユーザー承認後（Phase 13）に行う。
