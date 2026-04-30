# UT-07B alias recommendation i18n - タスク指示書

## メタ情報

```yaml
issue_number: 292
task_id: UT-07B-alias-recommendation-i18n-001
task_name: recommendedStableKeys 多言語 label 正規化
category: 改善
target_feature: GET /admin/schema/diff recommendedStableKeys
priority: 中
scale: 小規模
status: 未実施
source_phase: docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/unassigned-task-detection.md
created_date: 2026-04-30
dependencies: []
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-07B-alias-recommendation-i18n-001 |
| タスク名 | recommendedStableKeys 多言語 label 正規化 |
| 分類 | implementation / quality |
| 対象機能 | `GET /admin/schema/diff` recommendedStableKeys |
| 優先度 | 中 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-04-30 |
| issue_number | #292 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

07b では schema diff の未知質問に対して `recommendedStableKeys` を返す recommendation を実装した。現状は label 文字列の Levenshtein 距離、section、index を使って候補を並べるが、日本語 label や全角・半角、Unicode 正規化の揺れを専用に扱っていない。

### 1.2 問題点・課題

フォーム質問 label は日本語・英数字・記号が混在する。Unicode 正規化や空白・括弧・全角半角の扱いが不安定だと、実質的に同じ label でも距離が大きくなり、管理者に不自然な候補順を提示する可能性がある。

### 1.3 放置した場合の影響

- 管理者が alias 確定時に誤った stableKey 候補を選ぶリスクが上がる
- label の表記揺れにより recommendation が環境や入力元に依存する
- 多言語フォーム追加時に schema diff UI の信頼性が低下する

---

## 2. 何を達成するか（What）

### 2.1 目的

`recommendedStableKeys` の label 比較前処理を多言語 label に強くし、日本語・全角半角・Unicode 正規化の揺れを吸収する。

### 2.2 最終ゴール

- label 比較前に Unicode normalization と安全な trim / whitespace normalization が適用される
- 日本語 label、全角英数字、半角英数字、括弧・空白揺れの test case が追加される
- score の説明が Phase 12 implementation guide と aiworkflow-requirements に同期される

### 2.3 スコープ

#### 含む

- `apps/api/src/services/aliasRecommendation.ts` の normalization helper 追加
- `apps/api/src/services/aliasRecommendation.test.ts` の多言語 label test 追加
- `GET /admin/schema/diff` の response contract 変更が必要な場合の最小更新
- Phase 12 implementation guide / 正本仕様の同期

#### 含まない

- 機械学習・embedding・辞書ベース recommendation の導入
- 管理 UI の新規説明文追加
- stableKey apply workflow の DB 制約や back-fill 強化（`UT-07B-schema-alias-hardening-001` で対応）
- commit、push、PR 作成

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 07b の `aliasRecommendation.ts` が存在し、`GET /admin/schema/diff` から `recommendedStableKeys` が返ること
- 現行 score の入力要素（label / section / index）を変えず、まず比較前処理だけを改善すること

### 3.2 推奨アプローチ

1. label 比較前処理を helper として切り出し、`normalize("NFKC")`、trim、連続 whitespace 圧縮を行う。
2. 記号除去は過剰一致を生むため、最初は括弧・コロン・空白など明確な表記揺れだけを test-driven に扱う。
3. 日本語 label、全角英数字、半角英数字、空白揺れの fixture を追加する。
4. score や response shape を変えた場合のみ API contract を更新する。

---

## 4. 実行手順

### Phase 1: 現状確認

1. `apps/api/src/services/aliasRecommendation.ts` の score 計算を読む。
2. `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/implementation-guide.md` の recommendation 説明を確認する。

### Phase 2: test case 設計

1. 日本語 label の完全一致・空白揺れを fixture 化する。
2. 全角英数字と半角英数字が同等に近く扱われる case を追加する。
3. 過剰 normalization で別 label が誤一致しない negative case を追加する。

### Phase 3: 実装

1. normalization helper を追加する。
2. Levenshtein 入力を normalized label に差し替える。
3. section / index score への影響がないことを確認する。

### Phase 4: 仕様同期

1. Phase 12 implementation guide に normalization 方針を追記する。
2. 必要に応じて `aiworkflow-requirements` の API contract / lessons learned を同期する。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `recommendedStableKeys` が Unicode 正規化済み label で比較される
- [ ] 日本語・全角半角・空白揺れの test が追加されている
- [ ] 既存の英語 label recommendation test が regress していない

### 品質要件

- [ ] normalization の範囲が helper と tests で明示されている
- [ ] 過剰一致を防ぐ negative test がある

### ドキュメント要件

- [ ] Phase 12 implementation guide または正本仕様に normalization 方針が記録されている
- [ ] `UT-07B-schema-alias-hardening-001` との責務分離が保たれている

---

## 6. 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run src/services/aliasRecommendation.test.ts
```

期待: 日本語・全角半角・空白揺れ・negative case が全 PASS。

### 回帰検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run src/routes/admin/schema.test.ts
```

期待: `GET /admin/schema/diff` の response shape が既存 contract と互換である。

---

## 7. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| normalization が強すぎて別 label を同一視する | 中 | negative case を追加し、記号除去は最小限にする |
| score 順が既存英語 fixture で regress する | 中 | 既存 test を維持し、多言語 case を追加する |
| response contract を不要に変更する | 低 | helper 内の前処理に閉じ、response shape は原則変えない |

---

## 8. 参照情報

- `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/unassigned-task-detection.md`
- `apps/api/src/services/aliasRecommendation.ts`
- `apps/api/src/services/aliasRecommendation.test.ts`
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`

---

## 9. 備考

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260430-091723-wt-1/apps/api/src/services/aliasRecommendation.ts`
- 症状: 現状の Levenshtein は文字列差としては動作するが、日本語・全角半角・Unicode 合成文字の正規化方針が未定義で、候補順が表記揺れに引きずられる。
- 参照: `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/unassigned-task-detection.md`
