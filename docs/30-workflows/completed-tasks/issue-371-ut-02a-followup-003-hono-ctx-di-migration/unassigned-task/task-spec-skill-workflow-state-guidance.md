# workflow_state 分類ガイダンスの task-specification-creator skill 本体への昇格 - タスク指示書

## メタ情報

```yaml
issue_number: TBD
```

## メタ情報

| 項目         | 内容                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------ |
| タスクID     | task-spec-skill-workflow-state-guidance                                                    |
| タスク名     | workflow_state 分類ガイダンスの task-specification-creator skill 本体への昇格              |
| 分類         | skill 改善（promotion）                                                                    |
| 対象機能     | task-specification-creator skill の workflow_state 状態定義 / 遷移条件 / reclassify ルール |
| 優先度       | 中                                                                                         |
| 見積もり規模 | 小規模                                                                                     |
| ステータス   | 未実施                                                                                     |
| 発見元       | issue-371-ut-02a-followup-003-hono-ctx-di-migration / Phase 12 skill-feedback-report       |
| 発見日       | 2026-05-06                                                                                 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親タスク `docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration/` の Phase 12 で生成された `outputs/phase-12/skill-feedback-report.md` L9-13 に、skill promotion target として以下が明示されている:

- `CONTRACT_READY_IMPLEMENTATION_PENDING` と `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` の使い分けが `task-specification-creator` skill 本体（SKILL.md / references）に未文書化
- 同 phase の `outputs/phase-12/phase12-task-spec-compliance-check.md` で「The real problem was state drift: code was implemented while outputs still described a specification-only task」と苦戦箇所が報告済み

つまり、workflow_state を表現する語彙は phase template に断片的に登場するものの、状態の一覧・遷移条件・各状態に必要な証跡のマッピングが skill 本体に集約されておらず、再現性のあるガイダンスになっていない。

### 1.2 問題点・課題

- workflow_state 値（例: `spec_created` / `CONTRACT_READY_IMPLEMENTATION_PENDING` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` / `completed`）の定義と境界条件が SKILL.md / references に統合されていない
- 状態遷移のトリガー（Phase 開始時 reclassify、Phase 11 close-out、Phase 12 close-out など）が言語化されていないため、code 着手と outputs 表現が乖離する drift が発生する
- 状態名が長く意味が誤読されやすい（例: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` は「契約境界は同期済 / runtime 検証は未了」を表すが文字列上は読み取りにくい）
- compliance-check の観点（state vs 実コード乖離検知）が template 化されておらず、毎回 ad-hoc に書かれる

### 1.3 放置した場合の影響

- 別タスクでも同じ state drift が再発し、Phase 12 で「spec-only と書きながら実装が完了している」逆転現象が継続する
- 状態語彙の誤用（`PASS` 単独表記など）が紛れ込み、PR レビュアー / 親タスクのオーナーが完了範囲を誤認する
- skill 本体の信頼性が下がり、phase template と feedback の相関が追跡できなくなる

---

## 2. 何を達成するか（What）

### 2.1 目的

`task-specification-creator` skill の SKILL.md および references に、workflow_state の状態定義・遷移条件・reclassify ルール・必要証跡マッピングを集約し、Phase 12 compliance-check の観点を再利用可能なテンプレートとして提供する。

### 2.2 最終ゴール

- SKILL.md から辿れる単一の reference（例: `references/workflow-state-vocabulary.md`）に以下が記述される:
  - workflow_state 値の一覧と意味
  - 各状態に到達するための必要証跡（contract test / runtime evidence / D1 parity 等）のマッピング表
  - Phase 開始時の reclassify ルール（spec_created → implementation 着手時の必須切り替え）
  - 禁止表記（`PASS` 単独、状態混在）の明示
- `references/phase-12-spec.md` または `references/phase12-skill-feedback-promotion.md` から新 reference に link が張られる
- `outputs/phase-12/phase12-task-spec-compliance-check.md` を生成するためのテンプレート（または checklist）が `references/` に追加される

### 2.3 スコープ

#### 含むもの

- `task-specification-creator` skill 本体（SKILL.md / references / SKILL-changelog.md / LOGS.md）への workflow_state ガイダンス追加
- phase-12 compliance-check のテンプレート化
- 状態 → 必要証跡マッピング表の作成

#### 含まないもの

- 他 skill（aiworkflow-requirements / github-issue-manager 等）への波及改修
- workflow_state を機械的に強制する hook / lefthook / CI gate の実装（本タスクでは「必要性の記述」までに留める。実装は後続タスクで分離）
- 既存 workflow（過去完了タスク）への遡及書き換え

### 2.4 成果物

- `.claude/skills/task-specification-creator/references/workflow-state-vocabulary.md`（新規 or 既存に統合）
- `.claude/skills/task-specification-creator/SKILL.md` の References 表追記
- `.claude/skills/task-specification-creator/SKILL-changelog.md` への version 行追加
- `.claude/skills/task-specification-creator/LOGS.md` への usage log
- phase-12 compliance-check テンプレート（references 配下）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 親タスク `issue-371-ut-02a-followup-003-hono-ctx-di-migration` の Phase 12 成果物（skill-feedback-report.md / phase12-task-spec-compliance-check.md）が main にマージ済み
- task-specification-creator skill の現行 SKILL.md / references 構成を理解している

### 3.2 依存タスク

- 親タスク Phase 12 完了（skill-feedback-report.md が正本として参照可能）

### 3.3 必要な知識

- task-specification-creator skill の Progressive Disclosure 設計
- workflow_state の既存使用箇所（phase-template-phase11.md / phase-12-spec.md / phase12-skill-feedback-promotion.md）
- compliance-check が検出すべき drift パターン

### 3.4 推奨アプローチ

1. 親タスクの skill-feedback-report.md / phase12-task-spec-compliance-check.md から「状態語彙」「drift 事例」「証跡条件」を抜き出す
2. 状態 → 必要証跡のマッピング表を作成（縦軸: 状態値 / 横軸: 必要証跡カテゴリ）
3. 既存 references（phase-template-phase11.md / phase-12-spec.md / phase12-skill-feedback-promotion.md）に散在する記述と整合させ、新 reference へ集約
4. compliance-check のテンプレートを「観点リスト + 検証コマンド + drift パターン例」の3部構成で作成
5. SKILL.md References 表 / SKILL-changelog.md / LOGS.md を同一 wave で更新

---

## 4. 実行手順

### Phase 構成

1. 既存 workflow_state 記述の棚卸し
2. 状態 → 必要証跡マッピング表設計
3. 新 reference 作成と既存 reference からの link
4. compliance-check テンプレート化
5. SKILL.md / changelog / LOGS 同期

### Phase 1: 既存 workflow_state 記述の棚卸し

#### 目的

skill 内に散在する workflow_state 関連記述を全件列挙し、用語の不一致 / 重複 / 矛盾を抽出する。

#### 手順

1. `rg -n "workflow_state|spec_created|CONTRACT_READY|PASS_BOUNDARY_SYNCED|RUNTIME_PENDING" .claude/skills/task-specification-creator/`
2. 親タスクの skill-feedback-report.md / phase12-task-spec-compliance-check.md から状態語彙を抽出
3. 状態値の重複・命名揺れを台帳化

#### 成果物

状態語彙台帳（一時メモ可）

#### 完了条件

skill 内の workflow_state 記述箇所が全件把握できている

### Phase 2: 状態 → 必要証跡マッピング表設計

#### 目的

各状態に到達するための必要証跡（contract test / runtime evidence / D1 parity / commit / PR 等）を明示する。

#### 手順

1. 状態値ごとに「直前条件 / 必要証跡 / 後続状態」を整理
2. 表形式でマッピングを設計（縦軸: 状態 / 横軸: phase × 証跡）
3. 禁止表記（`PASS` 単独 / 状態混在）の明示

#### 成果物

マッピング表ドラフト

#### 完了条件

親タスクで挙げられた `CONTRACT_READY_IMPLEMENTATION_PENDING` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を含む全状態が表に収まっている

### Phase 3: 新 reference 作成と既存 reference からの link

#### 目的

`references/workflow-state-vocabulary.md` を新規作成（または既存 reference へ統合）し、SKILL.md References 表からアクセスできるようにする。

#### 手順

1. `references/workflow-state-vocabulary.md` を作成
2. SKILL.md の References 表に行追加
3. `references/phase-12-spec.md` / `references/phase12-skill-feedback-promotion.md` / `references/phase-template-phase11.md` から新 reference へ link 追加

#### 成果物

新 reference ファイルと既存 reference の差分

#### 完了条件

新 reference が SKILL.md から 1 hop で到達可能

### Phase 4: compliance-check テンプレート化

#### 目的

`outputs/phase-12/phase12-task-spec-compliance-check.md` を生成する際の観点リストと drift パターン例を再利用可能化する。

#### 手順

1. 親タスクの compliance-check ファイルから観点を抽出
2. 観点リスト + 検証コマンド + drift パターン例の3部構成でテンプレート化
3. references 配下に配置（`references/phase12-compliance-check-template.md` など）

#### 成果物

compliance-check テンプレート

#### 完了条件

任意のタスクが本テンプレートで compliance-check を生成可能

### Phase 5: SKILL.md / changelog / LOGS 同期

#### 目的

skill 本体の正本ファイル群を同一 wave で同期し、indexes 再生成まで含めて drift を残さない。

#### 手順

1. SKILL.md References 表を更新
2. SKILL-changelog.md に version 行を追記
3. LOGS.md に usage log を追記
4. `mise exec -- pnpm indexes:rebuild` を実行

#### 成果物

skill 本体ファイル群の差分と indexes 再生成結果

#### 完了条件

`verify-indexes-up-to-date` gate 相当の検査が green

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `references/workflow-state-vocabulary.md`（または統合先）に状態定義・遷移条件・必要証跡マッピングが記述されている
- [ ] phase-12 compliance-check テンプレートが references 配下にある
- [ ] SKILL.md References 表から新 reference に到達可能
- [ ] 禁止表記（`PASS` 単独 / 状態混在）が明示されている

### 品質要件

- [ ] `mise exec -- pnpm indexes:rebuild` 成功
- [ ] `verify-indexes-up-to-date` gate 相当の検査が green
- [ ] SKILL-changelog.md / LOGS.md 同期済み

### ドキュメント要件

- [ ] 親タスクの skill-feedback-report.md L9-13 で挙げられた promotion target が解消されている
- [ ] 親タスクの compliance-check ファイルから本 reference への参照が可能（または改訂時に link 可能）

---

## 6. 検証方法

### テストケース

- 新 reference が SKILL.md References 表に登録され、1 hop で到達可能
- 状態 → 必要証跡マッピング表に `spec_created` / `CONTRACT_READY_IMPLEMENTATION_PENDING` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` / `completed` が含まれる
- compliance-check テンプレートを使って親タスクの compliance-check ファイルが再生成可能（観点が網羅されている）

### 検証手順

```bash
rg -n "workflow_state|CONTRACT_READY_IMPLEMENTATION_PENDING|PASS_BOUNDARY_SYNCED_RUNTIME_PENDING" .claude/skills/task-specification-creator/
mise exec -- pnpm indexes:rebuild
git diff --stat .claude/skills/task-specification-creator/
```

---

## 7. リスクと対策

| リスク                                                                       | 影響度 | 発生確率 | 対策                                                                                                |
| ---------------------------------------------------------------------------- | ------ | -------- | --------------------------------------------------------------------------------------------------- |
| 既存 references との記述重複により、正本がかえって分散する                   | 中     | 中       | 既存 reference からは link のみとし、定義本体は新 reference に一本化                                |
| 状態語彙が将来追加された際、新 reference が陳腐化する                        | 中     | 中       | SKILL-changelog.md に version 単位で追記する運用を最初の version 行で明示                           |
| hook / CI gate なしでは drift 防止が人間規律のみに依存する                   | 高     | 中       | 「機械的強制が必要」と reference 末尾に明記し、後続タスク（hook 化）の発見トリガーとする            |
| 命名が長い状態語彙の誤用（`PASS` 単独表記）が継続する                        | 中     | 中       | 禁止表記を reference 冒頭に明示し、phase-template-phase11.md からも link する                       |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-12/skill-feedback-report.md`（L9-13 が promotion target の正本）
- `docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md`
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`

### 参考資料

- task-specification-creator SKILL-changelog.md `v2026.05.05-09a-A-staging-deploy-smoke-execution`（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 初出）

---

## 9. 備考

### 苦戦箇所【記入必須】

> 親タスクで気づいた具体的困難点を記録する。

| 項目     | 内容                                                                                                                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | workflow_state が `spec_created` のまま実装が進行し、Phase 12 close-out 時に「outputs は spec-only を主張、実コードは完了済み」という drift が発生した                                                                 |
| 原因     | 状態定義・遷移条件・reclassify ルールが skill 本体に集約されておらず、Phase 開始時に状態を切り替える機械的強制（hook / checklist）が存在しない。状態名が長く（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 等）誤用しやすい |
| 対応     | 親タスクの compliance-check で個別に検出・記録したが、テンプレート化されていないため再発防止策にならない                                                                                                              |
| 再発防止 | 状態 → 必要証跡マッピング表を skill 本体に組み込み、Phase 開始時の reclassify を必須化する。長期的には hook / lefthook での機械的強制が必要（後続タスクで分離）                                                        |

### レビュー指摘の原文（該当する場合）

```
outputs/phase-12/skill-feedback-report.md L9-13:
- CONTRACT_READY_IMPLEMENTATION_PENDING と PASS_BOUNDARY_SYNCED_RUNTIME_PENDING の使い分けが skill 本体に未文書化
- skill promotion target として明示

outputs/phase-12/phase12-task-spec-compliance-check.md:
"The real problem was state drift: code was implemented while outputs still described a specification-only task"
```

### 補足事項

本タスクは skill 本体の文書化までをスコープとし、機械的強制（hook / CI gate）の実装は後続タスクとして分離する。状態語彙の長さに起因する誤用は命名再設計ではなく「マッピング表 + 禁止表記の明示」で対処する（既存 SKILL-changelog.md に状態名が記録済みのため、命名変更は影響範囲が大きい）。
