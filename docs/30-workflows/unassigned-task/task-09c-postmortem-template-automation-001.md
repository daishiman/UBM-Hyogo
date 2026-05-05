# task-09c-postmortem-template-automation-001

## メタ情報

```yaml
issue_number: 352
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-09c-postmortem-template-automation-001 |
| タスク名 | Incident / rollback postmortem テンプレート自動生成 |
| 分類 | operations |
| 対象機能 | Postmortem / rollback evidence |
| 優先度 | 低 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-05-01 |

## 1. なぜこのタスクが必要か（Why）

09c には rollback procedures があるが、incident / rollback 発生後の postmortem template 生成は未割当である。障害対応直後に白紙から文書を作ると、timeline、impact、root cause、prevention の粒度がぶれやすい。

放置すると、再発防止策が evidence と結びつかず、次回 release の品質改善へつながりにくい。

## 2. 何を達成するか（What）

incident / rollback 発生時に、09c Phase 11 evidence と release metadata を入力にした postmortem template を自動生成する手順を作る。

## 3. どのように実行するか（How）

template は blame を避け、timeline、impact、root cause、detection、response、prevention、follow-up issue に限定する。incident response runbook 本文の置換は行わず、発生後の記録作成だけを扱う。

## 4. 実行手順

1. 09c Phase 6 rollback procedures と Phase 11 evidence path を確認する。
2. postmortem template の必須見出しを定義する。
3. release tag、commit、deploy evidence、rollback evidence を入力項目にする。
4. template 生成コマンドまたは手動 runbook を作る。
5. 生成物の保存先と follow-up issue 作成ルールを正本化する。

## 5. 完了条件チェックリスト

- [ ] postmortem template の見出しが固定されている
- [ ] 09c evidence path を必須入力として参照している
- [ ] blame 表現を避ける記述ルールがある
- [ ] follow-up issue 作成ルールが定義されている

## 6. 検証方法

```bash
rg -n "postmortem|incident|rollback" docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification docs/30-workflows/unassigned-task
```

期待: postmortem template と 09c evidence へのリンクが確認できる。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| blame 文書化 | timeline / impact / root cause / prevention に限定し個人責任表現を禁止 |
| evidence link 欠落 | Phase 11 evidence path を必須入力にする |
| incident runbook と責務重複 | 本タスクは postmortem 生成だけに限定する |

## 8. 参照情報

- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-06.md`
- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/post-release-summary.md`
- `docs/30-workflows/unassigned-task/task-09c-incident-runbook-slack-delivery-001.md`

## 9. 備考

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260501-065106-wt-10/docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-06.md`
- 症状: rollback procedures はあるが、事後振り返りのテンプレ生成と evidence link 必須化が未割当だった
- 参照: 09c Phase 12 unassigned-task-detection

## スコープ

### 含む

- postmortem template
- rollback / incident 発生時の生成手順

### 含まない

- incident response runbook 本文の置換
- 外部障害管理 SaaS 導入
