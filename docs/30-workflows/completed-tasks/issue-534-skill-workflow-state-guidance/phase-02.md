# Phase 2: 設計

## 2.1 `references/workflow-state-vocabulary.md` の章立て設計

```
# workflow_state Vocabulary

1. 概要（このファイルの役割）
2. 状態値の一覧と意味
   2.1 spec_created
   2.2 CONTRACT_READY_IMPLEMENTATION_PENDING
   2.3 PASS_BOUNDARY_SYNCED_RUNTIME_PENDING
   2.4 implemented_local_evidence_captured
   2.5 completed
   2.6 blocked / pending（補助状態）
3. 状態 → 必要証跡マッピング表
4. 状態遷移図（テキストベース）
5. Phase 開始時 reclassify ルール
6. 禁止表記（PASS 単独 / 状態混在 / phase-status と workflow-status の混在）
7. 機械的強制が必要な観点（後続タスクへの引き渡し）
8. 参照（既存 reference / 親タスク証跡）
```

### 2.1.1 状態値の一覧（最低限定義する内容）

| 状態 | 意味 | 直前条件 | 後続状態 |
| --- | --- | --- | --- |
| `spec_created` | 仕様書作成済 / 実装着手前 | Phase 1〜10 完了、Phase 11 未着手 | `CONTRACT_READY_IMPLEMENTATION_PENDING` |
| `CONTRACT_READY_IMPLEMENTATION_PENDING` | 契約は確定、実装ローカル未着手 | ADR 確定、テスト戦略確定 | `implemented_local_evidence_captured` または runtime 外部ゲート付きなら `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| `implemented_local_evidence_captured` | ローカル実装と evidence は揃った | Phase 11 evidence 配置済 | runtime 外部ゲート付きなら `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`、それ以外は Phase 13 user gate |
| `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` | 境界は同期済、runtime smoke 未了 | ローカル実装 + 単体テスト PASS + runtime pending marker | `completed` |
| `completed` | 全 Phase 完了、PR merge 済 | Phase 13 PR merge | （終端） |
| `blocked` | 外部要因で停止 | 任意 | 元状態へ復帰 |
| `pending` | 着手前 | 任意 | 任意 |

### 2.1.2 状態 → 必要証跡マッピング表（縦軸: 状態 / 横軸: 必要証跡）

| 状態 | spec docs | ADR | unit/integration test | runtime smoke | PR merge |
| --- | --- | --- | --- | --- | --- |
| spec_created | ✅ | — | — | — | — |
| CONTRACT_READY_IMPLEMENTATION_PENDING | ✅ | ✅ | — | — | — |
| PASS_BOUNDARY_SYNCED_RUNTIME_PENDING | ✅ | ✅ | ✅ | — | — |
| implemented_local_evidence_captured | ✅ | ✅ | ✅ | △ (任意) | — |
| completed | ✅ | ✅ | ✅ | ✅ | ✅ |

### 2.1.3 Phase 開始時 reclassify ルール

- **Phase 5（実装ランブック）開始時**: `spec_created` → `CONTRACT_READY_IMPLEMENTATION_PENDING`
- **Phase 8（テスト実行）PASS 時**: runtime 外部ゲートがない場合は `implemented_local_evidence_captured` へ向かう。runtime 外部ゲートがある場合のみ `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を使う
- **Phase 11（evidence contract）配置時**: → `implemented_local_evidence_captured`
- **Phase 13（PR merge）後**: → `completed`

### 2.1.4 禁止表記（明示）

- `PASS` 単独表記禁止（必ず `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` のように境界を明示）
- workflow_state と phase status を同じ用語で混在させない（`completed` は workflow root のみ、phase は `completed/pending/blocked`）
- 状態を任意の和訳に置き換えない（語彙は英識別子で固定）

## 2.2 `references/phase12-compliance-check-template.md` の章立て設計

```
# Phase 12 Task Spec Compliance Check Template

1. このテンプレの目的
2. 観点リスト（チェック項目）
   2.1 状態 vs 実コード乖離検知
   2.2 outputs と code の整合
   2.3 docs-only / NON_VISUAL の判定整合
   2.4 既存 SKILL-changelog.md / LOGS/_legacy.md 同期
3. 検証コマンド集
   3.1 git diff --stat による変更範囲確認
   3.2 grep による禁止表記検知
   3.3 indexes:rebuild diff
4. drift パターン例（ナレッジ蓄積枠）
5. このテンプレで生成する compliance-check ファイル雛形
```

### 2.2.1 観点リスト（必須項目の例）

- workflow_state が phase 進捗と整合しているか
- outputs/phase-11 の evidence ファイル名と artifacts.json の outputs 列が完全一致するか
- 実コード変更と spec 表現に drift がないか（spec で「実装あり」を主張しているのに code に変更がない、またはその逆）
- skill 本体（SKILL.md / references / changelog / LOGS/_legacy.md）が同一 wave で更新されているか
- 禁止表記（`PASS` 単独 / 状態混在）が混入していないか

### 2.2.2 検証コマンド集（最低限）

```bash
# 状態語彙の禁止表記検知
rg -n '\bPASS\b' docs/30-workflows/<task>/outputs/

# workflow_state 値の存在確認
rg -n 'workflow_state' docs/30-workflows/<task>/artifacts.json

# indexes 再生成 diff
mise exec -- pnpm indexes:rebuild
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes
```

## 2.3 changed-files

| パス | 変更種別 | 主な変更内容 |
| --- | --- | --- |
| `.claude/skills/task-specification-creator/references/workflow-state-vocabulary.md` | 新規 | 2.1 章立て全体 |
| `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | 新規 | 2.2 章立て全体 |
| `.claude/skills/task-specification-creator/SKILL.md` | 編集 | References 表に行 2 件追加 |
| `.claude/skills/task-specification-creator/references/phase-12-spec.md` | 編集 | 末尾または該当節に新 reference へのリンクを追加 |
| `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md` | 編集 | 同上 |
| `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | 編集 | 状態語彙が登場する節からリンク追加 |
| `.claude/skills/task-specification-creator/SKILL-changelog.md` | 編集 | 既存最新行の上に version 行を追加 |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md` | 編集 | usage log 追記 |
| `.claude/skills/aiworkflow-requirements/{LOGS/_legacy.md,SKILL-changelog.md,references/task-workflow-active.md,indexes/*}` | 編集 / 自動更新 | Issue #534 inventory sync と `mise exec -- pnpm indexes:rebuild` の差分 |

## 2.4 入出力・副作用

- 入力: 親タスク Phase 12 成果物（read-only）、現行 SKILL.md / references
- 出力: 上記 changed-files 表のすべてのファイル diff
- 副作用: indexes 再生成（aiworkflow-requirements 側）

## 2.5 DoD（Definition of Done）

- [ ] 上記 changed-files 表 9 行のうち、新規 2 / 編集 7 ファイルすべてに変更が入っている
- [ ] `mise exec -- pnpm indexes:rebuild` 実行後、`git diff --exit-code .claude/skills/aiworkflow-requirements/indexes` が 0 を返す
- [ ] SKILL.md References 表に新 reference 2 件のリンクが存在する（`grep -n 'workflow-state-vocabulary\|phase12-compliance-check-template' .claude/skills/task-specification-creator/SKILL.md` で 2 件以上ヒット）
- [ ] 既存 3 reference に新 reference へのリンクが存在する（`grep -l 'workflow-state-vocabulary' .claude/skills/task-specification-creator/references/{phase-12-spec.md,phase12-skill-feedback-promotion.md,phase-template-phase11.md}` で 3 ファイルすべてヒット）

## 2.6 次フェーズへの引き渡し

Phase 3 では vocabulary の置き場所と compliance-check の置き場所について 3 alternatives を比較する ADR を作成する（`outputs/phase-03/adr-vocabulary-placement.md`）。
