# task-utgov-downstream-precondition-link-001

## メタ情報

```yaml
issue_number: 305
task_id: task-utgov-downstream-precondition-link-001
task_name: Add UT-GOV downstream precondition links after second-stage branch protection
category: 改善
target_feature: UT-GOV governance workflow dependencies
priority: 中
scale: 小規模
status: 未実施
```

| 項目 | 値 |
| --- | --- |
| タスクID | task-utgov-downstream-precondition-link-001 |
| タスク名 | Add UT-GOV downstream precondition links after second-stage branch protection |
| 分類 | 改善 |
| 対象機能 | UT-GOV governance workflow dependencies |
| 発見元 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-12/unassigned-task-detection.md |
| ステータス | 未実施 |
| 優先度 | 中 |
| 見積もり規模 | 小規模 |
| taskType | docs-only / NON_VISUAL |
| 依存 | UT-GOV-001 second-stage reapply Phase 13 completion |

## 実装ガイド

### Part 1: 中学生でもわかる説明

なぜ必要か: 後から行う作業は、前の作業が終わっていることを前提にしています。たとえば、鍵をかける係の仕事は、先に扉が取り付けられていないと始められません。

何をするか: UT-GOV-005〜007 の仕様書に、UT-GOV-001 second-stage が終わっていることを前提条件として書き足します。

### Part 2: 技術者向け

- 対象候補: UT-GOV-005、UT-GOV-006、UT-GOV-007 の workflow specs
- 追記内容: protected dev / main が `contexts=[]` fallback ではなく、Phase 13 applied contexts を持つこと
- 参照リンク: `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-13/branch-protection-applied-{dev,main}.json`
- 禁止: downstream task 本体の実装範囲を変更しない

## 苦戦箇所【記入必須】

- 対象: `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/index.md`
- 症状: downstream governance task は「protected branch」を前提にするが、first-stage の `contexts=[]` と second-stage の contexts enforced state が同じ言葉で書かれると、着手条件が曖昧になる。
- 参照: `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-12/unassigned-task-detection.md`

## スコープ

### 含む

- UT-GOV-005〜007 の上流前提に「contexts 強制済み protected dev / main」を追記する
- second-stage applied evidence path を関連リンクに追加する
- downstream task の着手条件が `contexts=[]` fallback を前提にしないことを確認する

### 含まない

- UT-GOV-005〜007 の実装内容変更
- branch protection PUT
- GitHub Actions workflow 名や job 名の再設計

## リスクと対策

| リスク | 対策 |
| --- | --- |
| first-stage protected branch と second-stage contexts enforced state を混同する | 追記文では `contexts=[] fallback` と `contexts enforced` を明示的に分ける |
| downstream 仕様のスコープを広げてしまう | 前提条件と関連リンクだけを更新し、AC や実装タスクは変更しない |
| 存在しない workflow ID にリンクする | `find docs/30-workflows -maxdepth 2 -iname '*ut-gov-00[5-7]*'` で対象を確認してから編集する |

## 検証方法

```bash
find docs/30-workflows -maxdepth 2 -iname '*ut-gov-00[5-7]*' -o -iname '*utgov00[5-7]*'
rg -n "UT-GOV-001|second-stage|contexts enforced|contexts=\\[\\]" docs/30-workflows
```

期待: UT-GOV-005〜007 が UT-GOV-001 second-stage completion を上流前提として参照し、`contexts=[]` fallback を完了状態として扱っていない。

## 完了条件

- downstream governance specs が UT-GOV-001 second-stage completion を上流前提として参照している

## 1. なぜこのタスクが必要か（Why）

下流 task が `contexts=[]` fallback を完了状態と誤認しないようにするため。

## 2. 何を達成するか（What）

UT-GOV-005〜007 に second-stage completion と applied evidence path を上流前提として追加する。

## 3. どのように実行するか（How）

対象 spec の関連タスク / 上流前提欄にリンクを追記し、stale wording を検索で潰す。

## 4. 実行手順

対象特定、前提リンク追記、stale wording 検索、必要な index 更新の順で実行する。

## 5. 完了条件チェックリスト

- [ ] UT-GOV-005〜007 に上流前提リンクがある
- [ ] `contexts=[]` fallback を完了状態として扱う記述がない

## 6. 検証方法

上記 `## 検証方法` の find / rg を実行する。

## 7. リスクと対策

上記 `## リスクと対策` の表を適用する。

## 8. 参照情報

- `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/`

## 9. 備考

branch protection PUT は含めない。
