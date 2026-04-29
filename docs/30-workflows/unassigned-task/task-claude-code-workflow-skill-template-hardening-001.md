# host/NON_VISUAL workflow skill テンプレート改善 - タスク指示書

## メタ情報

```yaml
issue_number: unassigned
```

## メタ情報

| 項目         | 内容                                                                  |
| ------------ | --------------------------------------------------------------------- |
| タスクID     | task-claude-code-workflow-skill-template-hardening-001                |
| タスク名     | host/NON_VISUAL workflow skill テンプレート改善                       |
| 分類         | スキル改善                                                            |
| 対象機能     | `task-specification-creator` / `aiworkflow-requirements` テンプレート |
| 優先度       | MEDIUM                                                                |
| 見積もり規模 | 中規模                                                                |
| ステータス   | 未実施                                                                |
| 発見元       | task-claude-code-permissions-apply-001 skill-feedback-report          |
| 発見日       | 2026-04-28                                                            |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-claude-code-permissions-apply-001` では、host 環境（`~/.claude/settings.*` / `~/.config/zsh/conf.d/*.zsh`）の書き換え、NON_VISUAL 証跡（screenshot 非作成）、FORCED-GO + TC BLOCKED の同居（TC-05 BLOCKED）、backup → smoke → rollback の三点セットを手作業で揃えた。これらの作業は再利用性が高く、`outputs/phase-12/skill-feedback-report.md` で `task-specification-creator` および `aiworkflow-requirements` のテンプレート改善候補として記録されている。

### 1.2 問題点・課題

- NON_VISUAL Phase 11 の「screenshots 非作成」ルールがテンプレートに明文化されていないため、毎回作業者が判断している
- host 環境書き換えに必須の `backup-manifest.md` / `runbook-execution-log.md` / `manual-smoke-log.md` 3 点セットが標準化されていない
- 「FORCED-GO + TC BLOCKED」のような状態（一部 TC が前提タスク未完了で BLOCKED でも完了承認する状態）に明確な状態語彙がない
- artifacts / index / Phase 成果物の状態同期チェックが validator 側に組み込まれていないため、状態語彙と Phase 出力の整合がドリフトしうる

### 1.3 放置した場合の影響

- 同種タスク（host 環境を書き換える系 / NON_VISUAL 系）でテンプレート品質がブレる
- 状態語彙が曖昧なまま `completed`/`spec_created`/`docs-only` の境界が混乱する
- skill validator の検出網が広がらず、レビューア人手依存が継続する

---

## 2. 何を達成するか（What）

### 2.1 目的

`task-claude-code-permissions-apply-001` で得た再利用性の高いルールを、関連 skill のテンプレート / references / validator に反映し、同種タスクの品質を安定化する。

### 2.2 最終ゴール

- NON_VISUAL Phase 11 の固定文言と `screenshots/` 非作成ルールが skill テンプレートに反映されている
- host 環境書き換えの 3 点セット（`backup-manifest.md` / `runbook-execution-log.md` / `manual-smoke-log.md`）が標準成果物として明示されている
- 「FORCED-GO + TC BLOCKED」の状態語彙が `completed_with_blocked_followup` 等の形で明文化されている
- artifacts / index / Phase 成果物の状態同期チェックを validator に追加するか、追加しない場合の判断根拠が記録されている
- 既存 workflow（docs-only / NON_VISUAL）を壊していない

### 2.3 スコープ

#### 含むもの

- `task-specification-creator` skill 本体 / references の NON_VISUAL ルール改修
- host 環境書き換え 3 点セットの標準化（テンプレート追加）
- 状態語彙の追加（`completed_with_blocked_followup` 等）
- `aiworkflow-requirements` references の関連項更新
- validator (`validate-phase-output.js` 等) の状態同期チェック追加検討

#### 含まないもの

- 既存タスク仕様書の遡及書き換え
- Phase 12 自体の構造変更
- skill 全体のリファクタリング

### 2.4 成果物

- skill テンプレート差分（`task-specification-creator` / `aiworkflow-requirements`）
- 状態語彙定義の追記差分
- validator 拡張差分（採用時）または非採用判断メモ
- 動作検証用の fixture（NON_VISUAL / FORCED-GO 両ケース）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `task-claude-code-permissions-apply-001` が完了している
- 元タスク `outputs/phase-12/skill-feedback-report.md` の指摘内容を読み込み済み
- `.claude/skills/task-specification-creator/scripts/validate-phase-output.js` の現状実装を把握している

### 3.2 依存タスク

- `task-claude-code-permissions-apply-001`（完了済み・参照入力）
- `task-claude-code-permissions-decisive-mode`（spec_created 完了済み）

### 3.3 必要な知識

- `task-specification-creator` skill の Phase 1〜13 構造
- NON_VISUAL / docs-only / implementation の判定軸
- skill validator のテスト実行方法（`pnpm` script 等）
- `aiworkflow-requirements` の Progressive Disclosure 構造

### 3.4 推奨アプローチ

skill のリファレンス更新を最小単位で進める（references → skill 本体 → validator の順）。状態語彙は新規追加とし、既存語彙（`completed` / `spec_created` / `docs-only`）の意味は変更しない。fixture を先に書き、テンプレート改修と validator 拡張をその fixture で検証する。

---

## 4. 実行手順

### Phase構成

1. NON_VISUAL ルールのテンプレート化
2. host 環境書き換え 3 点セットの標準化
3. 状態語彙の追加
4. validator 拡張の検討と実装/非実装判断

### Phase 1: NON_VISUAL ルールのテンプレート化

#### 目的

NON_VISUAL Phase 11 の固定文言と `screenshots/` 非作成ルールをテンプレートに反映する。

#### 手順

1. `task-claude-code-permissions-apply-001` の Phase 11 出力を参照
2. `task-specification-creator` references に NON_VISUAL 章を追加
3. fixture を作成し、NON_VISUAL タスクで `screenshots/` が生成されないことを確認

#### 成果物

NON_VISUAL ルール差分 + fixture

#### 完了条件

NON_VISUAL タスクのテンプレート出力に固定文言が含まれる

### Phase 2: host 環境書き換え 3 点セットの標準化

#### 目的

host 環境に触れるタスクの標準成果物を確立する。

#### 手順

1. `backup-manifest.md` / `runbook-execution-log.md` / `manual-smoke-log.md` のテンプレート骨子を作成
2. host 環境書き換え系タスクのテンプレートに必須出力として追加
3. 3 点セットが揃わない場合の警告を validator 側に書く（Phase 4 と連動）

#### 成果物

3 点セットテンプレート + 統合差分

#### 完了条件

host 環境書き換えタスクで 3 点セットが標準成果物として表示される

### Phase 3: 状態語彙の追加

#### 目的

「FORCED-GO + TC BLOCKED」の状態を明文化する。

#### 手順

1. `completed_with_blocked_followup` 等の語彙候補を検討
2. 既存語彙との関係を整理（`completed` / `spec_created` / `docs-only` との差分を明示）
3. references に状態定義を追記

#### 成果物

状態語彙定義差分

#### 完了条件

`task-claude-code-permissions-apply-001`（TC-05 BLOCKED 注記付き completed）のような状態を一意に表せる

### Phase 4: validator 拡張の検討と実装/非実装判断

#### 目的

artifacts / index / Phase 成果物の状態同期チェックを validator に追加するか判断する。

#### 手順

1. `validate-phase-output.js` の現状チェック内容を整理
2. 状態同期チェックの追加範囲（artifacts / index / Phase 成果物の三者整合）を設計
3. 実装するか judgement only にするか判断
4. 採用時は fixture で動作確認、非採用時は理由を記録

#### 成果物

validator 差分 または 非採用判断メモ

#### 完了条件

採用 / 非採用の判断と根拠が残っている

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] NON_VISUAL Phase 11 の固定文言がテンプレートに反映されている
- [ ] `screenshots/` 非作成ルールがテンプレートで明示されている
- [ ] host 環境 3 点セットが標準成果物として明示されている
- [ ] 状態語彙が追加され、既存語彙と矛盾しない

### 品質要件

- [ ] 既存 workflow の docs-only / NON_VISUAL ルールを壊していない
- [ ] fixture で改修箇所が動作確認されている
- [ ] validator 採用 / 非採用の判断根拠が残っている

### ドキュメント要件

- [ ] skill 本体または references に再利用可能なルールが反映されている
- [ ] `aiworkflow-requirements` の関連項が更新されている（必要時）
- [ ] 元タスクの skill-feedback-report に「テンプレート反映完了」を追記

---

## 6. 検証方法

### テストケース

| TC ID    | 内容                                                  | 期待                                |
| -------- | ----------------------------------------------------- | ----------------------------------- |
| TC-T-01  | NON_VISUAL タスクのテンプレート生成                   | `screenshots/` 非作成 / 固定文言    |
| TC-T-02  | host 環境書き換えタスクのテンプレート生成             | 3 点セットが必須成果物に含まれる    |
| TC-T-03  | `completed_with_blocked_followup` 語彙適用            | 状態が一意に表現される              |
| TC-T-04  | validator（採用時）で artifacts / index 不整合を検出 | FAIL を返す                         |

### 検証手順

```bash
# skill validator 実行
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  --target-file <fixture-path>

# fixture でテンプレート出力比較
diff -u <expected> <actual>
```

---

## 7. リスクと対策

| リスク                                                  | 影響度 | 発生確率 | 対策                                                        |
| ------------------------------------------------------- | ------ | -------- | ----------------------------------------------------------- |
| 状態語彙の追加が既存ワークフローを壊す                  | 高     | 中       | 既存語彙の意味は変えず、新規追加のみとする                  |
| validator 拡張で false positive が増える                | 中     | 中       | fixture を先に整備し、誤検出ケースを観測                    |
| テンプレート改修が既存タスク仕様書と乖離                | 中     | 低       | 遡及適用は本タスクスコープ外と明記                          |
| NON_VISUAL ルールが docs-only と混乱                    | 中     | 中       | references に判定軸の差分を明文化                           |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/completed-tasks/task-claude-code-permissions-apply-001.md`
- `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-12/skill-feedback-report.md`
- `.claude/skills/task-specification-creator/scripts/validate-phase-output.js`
- `.claude/skills/aiworkflow-requirements/references/`

### 参考資料

- skill-creator スキル説明（メタスキル）
- task-specification-creator Phase 1〜13 仕様

---

## 9. 備考

### 苦戦箇所【記入必須】

> `task-claude-code-permissions-apply-001` の skill-feedback-report より。

| 項目     | 内容                                                                                                                          |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 症状     | NON_VISUAL / host 環境 / FORCED-GO + TC BLOCKED の手順を毎回手作業で揃えており、テンプレート化されていない                    |
| 原因     | 元タスクは「実反映」スコープであり、skill 改修は別軸                                                                          |
| 対応     | skill-feedback-report に再利用候補として記録し、本未タスクとして切り出した                                                    |
| 再発防止 | host 環境書き換え / NON_VISUAL タスクは本テンプレート改修が反映された skill バージョンで仕様書を生成すること                  |

### レビュー指摘の原文（該当する場合）

```
task-claude-code-permissions-apply-001 outputs/phase-12/skill-feedback-report.md
- NON_VISUAL Phase 11 のテンプレート化
- host 環境 3 点セット標準化
- FORCED-GO + TC BLOCKED の状態語彙追加
- validator 状態同期チェック検討
```

### 補足事項

- 本タスクの成果物は将来の同種タスク（host 環境 / NON_VISUAL 系）の品質に直接効く
- skill 本体の Phase 1〜13 構造は変更しない（語彙追加とテンプレート改修にとどめる）
