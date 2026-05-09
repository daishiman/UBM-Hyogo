# Phase 3: 代替案比較 ADR

## ADR: workflow-state vocabulary の置き場所と compliance-check テンプレの責務分離

### Context

`task-specification-creator` skill 本体に workflow_state 状態定義を集約し、Phase 12 compliance-check 観点を再利用可能テンプレ化する。現状、状態語彙は `phase-12-spec.md` / `phase12-skill-feedback-promotion.md` / `phase-template-phase11.md` に断片的に登場し、単一正本がない。

### Alternatives

#### Alt A: 新規 reference 2 件を分離して配置（採用）

- `references/workflow-state-vocabulary.md`（語彙の定義）
- `references/phase12-compliance-check-template.md`（観点 + 検証コマンド + drift 例）

**Pros**:
- Clean Code SRP に整合（語彙の定義 vs テンプレ生成支援）
- vocabulary は将来別の workflow（execute-workflow.md 等）からも参照可能
- compliance-check テンプレは独立した checklist として進化させやすい

**Cons**:
- ファイル数が 2 増える（references 配下が肥大）
- 1 つを更新したとき他方の整合チェックが必要

#### Alt B: 既存 `phase-12-spec.md` に統合

**Pros**:
- 既存ファイルへの追記のみ。新規 reference を増やさない
- phase-12 文脈に閉じる

**Cons**:
- vocabulary は phase-12 だけのものではない（Phase 5 / 8 / 11 でも遷移する）。phase-12 配下に置くと意味的に正しくない
- 既存ファイルが肥大しすぎる
- Progressive Disclosure 原則（小さな reference 群で構成）に反する

#### Alt C: vocabulary と compliance-check を 1 ファイルに統合

`references/workflow-state-and-compliance.md` 1 ファイル。

**Pros**:
- ファイル数が 1 のみ
- 状態語彙と compliance 観点が同じ箇所で参照できる

**Cons**:
- SRP 違反（語彙の定義と検証テンプレが混在）
- vocabulary を別文脈から参照する際に不要な compliance 部分まで含む
- 1 ファイルが肥大する

### Decision

**Alt A を採用する**（reference 2 件分離）。

### Rationale

1. vocabulary は task-specification-creator skill 全体の語彙正本であり、phase-12 だけのものではない（Phase 1 reclassify ルール / Phase 5 開始時遷移 / Phase 8 PASS 後遷移 / Phase 11 配置時遷移を含む）。phase-12 ファイル配下への統合は意味的に誤る。
2. compliance-check テンプレは「検証手順 + drift 例」を蓄積する場所であり、語彙定義とは独立して進化する。テンプレの drift パターン例は親タスク以外でも追加されうるため、独立ファイルが望ましい。
3. Progressive Disclosure 原則（SKILL.md は References 表で索引のみ、本体は references/ に分離）に整合する。

### Consequences

- references/ 配下に 2 ファイル追加。SKILL.md References 表に 2 行追加。
- 既存 reference からの link 追加が必要（3 ファイル）。
- 状態語彙が将来追加された際は vocabulary 単一ファイルに集約され、SKILL-changelog.md に version 行を追記する運用となる。
- 機械的強制（hook / lefthook / CI gate）は本タスクのスコープ外だが、vocabulary 末尾に「機械的強制が必要」とのみ明記し、後続タスクのトリガーとする。

### 出力先

- `outputs/phase-03/adr-vocabulary-placement.md`（本ファイルを出力）

### 次フェーズへの引き渡し

Phase 4 では本決定に基づくテスト戦略（grep gate / link 到達性 / indexes drift）を確定する。
