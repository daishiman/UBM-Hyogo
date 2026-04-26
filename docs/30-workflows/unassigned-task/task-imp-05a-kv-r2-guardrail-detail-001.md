# KV / R2 guardrail detail and executable degrade design - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | task-imp-05a-kv-r2-guardrail-detail-001                                       |
| タスク名     | KV / R2 guardrail detail and executable degrade design                        |
| 分類         | 改善                                                                          |
| 対象機能     | Cloudflare KV / R2 free-tier guardrail と degrade runbook                     |
| 優先度       | 中                                                                            |
| 見積もり規模 | 中規模                                                                        |
| ステータス   | 未実施                                                                        |
| 発見元       | 05a Phase 12                                                                  |
| 発見日       | 2026-04-26                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

05a では KV / R2 の無料枠を観測対象として整理したが、現行 MVP では利用開始前または binding 未整備の箇所がある。runbook の手順は将来の利用想定で記述されており、`apps/api` の実装側との整合性が確認されていない。

### 1.2 問題点・課題

- KV reads/writes、R2 storage、R2 Class A/B operations の閾値が公式値の最新版で再確認されていない
- `apps/api/wrangler.toml` と `Env` 型に KV / R2 binding の実体があるか棚卸しできていない
- runbook には「機能フラグで停止」「bucket への書き込み停止」など、binding がなければ実行できない手順が含まれる

### 1.3 放置した場合の影響

- 実利用開始後に異常を検知しても、runbook の degrade 手順が実体と乖離していて実行できない
- 無料枠超過時に対応が遅れ、課金または機能停止が発生するリスクがある
- 05a / 05b の handoff 時に「実装と仕様の不一致」が再燃し、後続タスクで再調査コストが発生する

---

## 2. 何を達成するか（What）

### 2.1 目的

KV / R2 の無料枠監視と degrade 手順を「コード実体 + 公式値」の二点で同期し、実行可能な runbook へ昇格させる。

### 2.2 最終ゴール

- KV / R2 の current limits が正本仕様に記録され、確認日が併記されている
- binding 有無がコード実体と一致しており、runbook の手順が実行可能か否か明示されている
- 05a runbook と `deployment-cloudflare.md` の表記が同期されている

### 2.3 スコープ

#### 含むもの

- Cloudflare KV / R2 公式ドキュメントの再確認と current limit の正本反映
- `apps/api/wrangler.toml` と API `Env` 型の binding 実装有無の棚卸し
- binding 有無ごとに分けた degrade 手順の runbook 化
- 05a / 05b handoff ドキュメントへの反映

#### 含まないもの

- 実際の KV / R2 binding 追加実装（必要であれば別タスク化）
- 有料プランへの切り替え判断
- アラート通知基盤（Slack 等）の導入

### 2.4 成果物

- 正本仕様（`deployment-cloudflare.md`）の KV / R2 limit 更新差分
- 05a runbook（`cost-guardrail-runbook.md`）の degrade 手順更新差分
- binding 棚卸し結果メモ（Phase 12 outputs）
- validator（`audit-unassigned-tasks.js` 等）の実行ログ

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Cloudflare KV / R2 の公式ドキュメントへアクセス可能
- `apps/api` のコードベースを読める
- 05a Phase 5 / Phase 12 の outputs に目を通している

### 3.2 依存タスク

なし（05a の完了をブロックしない）

### 3.3 必要な知識

- Cloudflare Workers の binding 設定（`wrangler.toml`）
- Cloudflare KV / R2 の operation 課金体系（Class A / Class B）
- 05a で整理した observability matrix

### 3.4 推奨アプローチ

公式値の再確認 → コード実体棚卸し → 手順差分化 → ドキュメント反映、の順で進める。binding がない場合は「未実装前提」と明示し、実行不能な手順は runbook から除去または注記する。

---

## 4. 実行手順

### Phase構成

1. 公式値再確認
2. コード実体棚卸し
3. degrade 手順の差分化
4. ドキュメント反映と検証

### Phase 1: 公式値再確認

#### 目的

KV / R2 の current limit を最新公式値で確認する。

#### 手順

1. Cloudflare KV ドキュメントから reads/writes/storage の free tier limit を取得
2. Cloudflare R2 ドキュメントから storage / Class A / Class B operations の free tier limit を取得
3. 確認日と URL を記録

#### 成果物

current-limits メモ（日付付き）

#### 完了条件

free tier 値と確認日が記録されている

### Phase 2: コード実体棚卸し

#### 目的

`apps/api` の binding 実装有無を確認する。

#### 手順

1. `apps/api/wrangler.toml` を確認
2. `Env` 型定義（TypeScript）を確認
3. KV / R2 binding の有無を一覧化

#### 成果物

binding 棚卸し表

#### 完了条件

KV / R2 各 binding の有無と名前が表に記録されている

### Phase 3: degrade 手順の差分化

#### 目的

binding 有無別に実行可能な手順を runbook 化する。

#### 手順

1. binding ありの場合: 操作停止コマンド or 手順を runbook 化
2. binding なしの場合: 「現状は未実装。手動コード変更が必要」と明示
3. 既存 runbook の実行不能な記述を除去 or 注記

#### 成果物

更新後の `cost-guardrail-runbook.md` 差分

#### 完了条件

runbook の各手順に「実行可能 / 未実装」のラベルが付いている

### Phase 4: ドキュメント反映と検証

#### 目的

正本仕様と 05a 成果物の整合を取り、validator で確認する。

#### 手順

1. `deployment-cloudflare.md` を更新
2. 05a runbook を更新
3. `audit-unassigned-tasks.js` で本タスクの formatting を確認
4. Phase 11/12 証跡を保存

#### 成果物

更新差分一式 + validator 実行ログ

#### 完了条件

validator が currentViolations = 0 を返す

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] KV / R2 の current limit が正本仕様に記録されている
- [ ] binding 有無がコード実体と一致している
- [ ] 実行できない手順が runbook から除去または注記されている
- [ ] 05a / 05b の handoff に反映済み

### 品質要件

- [ ] `audit-unassigned-tasks.js` の currentViolations = 0
- [ ] 公式値の確認日が文書に残っている

### ドキュメント要件

- [ ] `deployment-cloudflare.md` 更新
- [ ] `cost-guardrail-runbook.md` 更新
- [ ] Phase 12 outputs に棚卸し結果を残している

---

## 6. 検証方法

### テストケース

- runbook の各手順を読み「実行可能 / 未実装」が一意に判別できるか確認
- binding 棚卸し表とコード実体が一致しているか目視確認

### 検証手順

```bash
rg -n "KV|R2|Class A|Class B|FEATURE_" apps .claude/skills/aiworkflow-requirements/references docs/05a-parallel-observability-and-cost-guardrails
node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js \
  --target-file docs/30-workflows/unassigned-task/task-imp-05a-kv-r2-guardrail-detail-001.md
```

---

## 7. リスクと対策

| リスク                                       | 影響度 | 発生確率 | 対策                                                  |
| -------------------------------------------- | ------ | -------- | ----------------------------------------------------- |
| 公式値の変更                                 | 中     | 中       | 実行日に公式値を再確認し、確認日を文書に残す          |
| binding 未実装なのに実行可能と誤記           | 高     | 中       | `wrangler.toml` と `Env` 型の実体確認を完了条件にする |
| 05b 側で先に runbook が参照されて手戻り発生  | 中     | 低       | 05a / 05b handoff ドキュメントを必ず同期する          |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
- `docs/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md`

### 参考資料

- Cloudflare KV official documentation
- Cloudflare R2 official documentation（Class A / Class B operations）

---

## 9. 備考

### 苦戦箇所【記入必須】

> 05a 実装時に気づいた具体的困難点を記録する。

| 項目     | 内容                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------- |
| 症状     | 05a runbook で degrade 手順を書こうとしたが、`apps/api` 側に KV / R2 binding 実体があるか即断できなかった  |
| 原因     | `apps/api/wrangler.toml` と `Env` 型に KV / R2 binding が未整備で、runbook の前提と現行コードが乖離していた |
| 対応     | 05a 内では「将来 binding 整備後に詳細化する」と注記し、本未タスクとして follow-up に切り出した             |
| 再発防止 | runbook 化する前に必ず `wrangler.toml` と `Env` 型の binding 棚卸しを先行する手順をテンプレ化する          |

### レビュー指摘の原文（該当する場合）

```
05a Phase 12 unassigned-task-detection.md U-01 として formalize
```

### 補足事項

05a の完了をブロックしない。KV / R2 を本格利用する前に実施する。
