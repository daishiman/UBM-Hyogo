# task-utgov001-second-stage-reapply

## メタ

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-GOV-001 second-stage contexts reapply |
| 発見元 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-12/unassigned-task-detection.md C-3 |
| 状態 | unassigned |
| taskType | implementation / NON_VISUAL |
| 依存 | UT-GOV-001 で `contexts=[]` fallback を採用、かつ UT-GOV-004 完了 |

## 苦戦箇所【記入必須】

GitHub branch protection の `required_status_checks.contexts` に未出現 context を入れると、PR が永続的に green にならず merge 不能になる。UT-GOV-001 Phase 13 で UT-GOV-004 未完了のまま `contexts=[]` の 2 段階適用を選んだ場合、UT-GOV-004 完了後に contexts を埋めた payload で再 PUT しないと branch protection が最終状態にならない。

## スコープ

### 含む

- UT-GOV-004 完了成果物から実在 job/check-run context を取得
- `branch-protection-payload-{dev,main}.json` の `required_status_checks.contexts` を再生成
- dev / main 独立 PUT
- GET 実値確認と `applied-{branch}.json` 更新
- CLAUDE.md / deployment branch strategy との drift 確認

### 含まない

- 初回 branch protection 適用
- rollback rehearsal
- UT-GOV-004 自体の job 名同期
- commit / PR / push の自動実行

## リスクと対策

| リスク | 対策 |
| --- | --- |
| typo context による merge block | workflow 名ではなく job/check-run context 名を実行済み check から取得する |
| dev / main 片側だけ更新 | branch 別 payload / applied JSON を必須成果物にする |
| admin block | UT-GOV-001 の rollback payload と enforce_admins DELETE 経路を再確認してから PUT |

## 検証方法

```bash
gh api repos/:owner/:repo/branches/dev/protection | jq '.required_status_checks.contexts'
gh api repos/:owner/:repo/branches/main/protection | jq '.required_status_checks.contexts'
```

期待値: UT-GOV-004 で確認済みの実在 context のみが含まれ、`contexts=[]` の暫定状態が残っていない。
