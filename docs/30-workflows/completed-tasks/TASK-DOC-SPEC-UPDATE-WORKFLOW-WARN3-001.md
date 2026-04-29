# spec-update-workflow warning severity documentation - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | TASK-DOC-SPEC-UPDATE-WORKFLOW-WARN3-001 |
| タスク名 | spec-update-workflow warning severity documentation |
| 分類 | ドキュメント改善 |
| 対象機能 | `.claude/skills/task-specification-creator/references/spec-update-workflow.md` |
| 優先度 | 低 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | `skill-md-codex-validation-fix` Phase 12 |
| 発見日 | 2026-04-28 |

---

## 1. なぜこのタスクが必要か（Why）

`quick_validate.test.js` の既存失敗に、Warning 3 段階分類セクションが `spec-update-workflow.md` に存在しないことが含まれている。Phase 12 の警告・未タスク判断を一貫させるには、warning severity の扱いを正本に明記する必要がある。

## 2. 何を達成するか（What）

- Warning の 3 段階分類を `spec-update-workflow.md` に追記する
- Phase 12 の未タスク検出・close-out 判定で warning の扱いを明確化する
- 該当 quick_validate 回帰テストを GREEN にする

## 3. どのように実行するか（How）

1. 既存テストが期待する見出し・文言を確認する
2. `spec-update-workflow.md` に warning severity セクションを追加する
3. Phase 12 documentation guide との重複を確認する
4. quick_validate 関連テストを実行する

## 4. 完了条件

- Warning 3 段階分類が正本ドキュメントから参照可能
- quick_validate の該当テストが通る
- Phase 12 成果物で warning と unassigned の境界が説明できる

## 5. 苦戦箇所・知見（Lessons）

- **「Warning 3 段階」の語が複数ドキュメントに散在**: `task-specification-creator/SKILL.md` 本体・`spec-update-workflow.md`・`automation-30/references/elegant-review-prompt.md` で warning の重み付けが微妙に違う表現で書かれている。正本を `spec-update-workflow.md` に固定するなら、他 2 ドキュメントは参照に置き換える必要がある。テスト追加だけでは「正本 1 箇所」原則が守れない。
- **quick_validate 失敗ケース TC-RG-006/007 の意図が不明瞭**: テストは「Warning 3 段階という見出し / 文言の存在」を assert しているが、なぜ `spec-update-workflow.md` 限定なのかが test description に書かれていない。本タスクで追記する際、test 側にも対象ファイル限定の理由コメントを付ける必要がある（regression 時に削除されにくくなる）。
- **Phase 12 close-out で warning と unassigned の境界判定に時間を使った**: 本タスクが「未タスク化すべきか / Warning として無視すべきか」を Phase 12 中に判断する際、正本に severity 定義がないため恣意的にならざるを得なかった。同種の判断を将来再発させないため、severity 定義に「未タスク昇格条件」を一文添える方針を推奨。

## 6. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| `spec-update-workflow.md` と `task-specification-creator/SKILL.md`・`automation-30/references/elegant-review-prompt.md` の severity 定義がドリフトする | 中 | 正本を `spec-update-workflow.md` に固定し、他 2 ファイルは「正本へのリンク」だけに置換する。PR 内 grep `Warning 3 段階` で重複定義 0 を確認 |
| 既存 quick_validate テスト（TC-RG-006/007）が見出し文字列に過敏で、軽微な節タイトル変更で再 RED 化する | 中 | テスト追加時に対象ファイルを `spec-update-workflow.md` に限定する理由コメントを test 説明に追記し、見出し文言は ASCII の安定 ID（`### Warning Severity (3 levels)`）も併記 |
| Phase 12 close-out で「未タスク昇格条件」が曖昧なまま運用継続 | 低 | severity 定義に「ERROR=即タスク化 / WARN=未タスク化候補 / INFO=記録のみ」の昇格マトリクスを 1 表で同梱 |

## 7. 検証方法

### 単体検証

```bash
node .claude/skills/skill-creator/scripts/quick_validate.js .claude/skills/task-specification-creator
```

期待: exit code 0。`Warning 3 段階` 系の violation が 0 件。TC-RG-006 / TC-RG-007 が PASS。

### 統合検証

```bash
mise exec -- node --test .claude/skills/skill-creator/scripts/__tests__/quick_validate.test.js
grep -rn "Warning 3 段階" .claude/skills/ | grep -v spec-update-workflow.md
```

期待: 2 件目のコマンドが空（正本以外に severity 定義の重複が無い）。`quick_validate.test.js` 全件 GREEN。

## 8. スコープ

### 含む

- `.claude/skills/task-specification-creator/references/spec-update-workflow.md` への Warning 3 段階分類追記（ERROR / WARN / INFO の定義 + 未タスク昇格条件）
- 同 SKILL.md・`automation-30/references/elegant-review-prompt.md` の重複記述を「正本へのリンク」に置換
- TC-RG-006 / TC-RG-007 の PASS 化

### 含まない

- `quick_validate.js` 本体のロジック変更（→ severity 判定ロジック改修は別タスクへ切り出し）
- Phase 12 テンプレ（`phase12-checklist-definition.md`）の severity 反映（→ 本タスク完了後の追従タスクで対応）
- 既存 fixture (`__tests__/fixtures/*`) の severity アノテーション追加（→ `TASK-SKILL-VALID-FIXTURE-EXAMPLE-LINK-001` と重複しないよう範囲外）

