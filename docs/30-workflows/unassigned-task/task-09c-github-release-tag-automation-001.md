# task-09c-github-release-tag-automation-001

## メタ情報

```yaml
issue_number: 348
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-09c-github-release-tag-automation-001 |
| タスク名 | 09c release tag からの GitHub Release 自動作成 |
| 分類 | operations |
| 対象機能 | GitHub Release / release note |
| 優先度 | 中 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-05-01 |

## 1. なぜこのタスクが必要か（Why）

09c では release tag `vYYYYMMDD-HHMM` の作成手順はあるが、GitHub Release の作成と release note の生成は未割当である。tag だけでは、何が production に出たか、どの evidence に対応するかを GitHub 上で追跡しづらい。

放置すると、rollback や postmortem 時に tag、commit、Phase 12 changelog、runtime evidence の対応づけを手作業で復元することになる。

## 2. 何を達成するか（What）

09c の release tag から GitHub Release を作成する手順または workflow を定義し、release note template に Phase 12 changelog と Phase 11 runtime evidence へのリンクを含める。

## 3. どのように実行するか（How）

`gh release create` を基本手段にし、tag format と target commit を事前検証する。自動化する場合も production deploy 実行そのものは含めず、release note 生成と GitHub Release 作成だけに境界を限定する。

## 4. 実行手順

1. 09c Phase 5/12 の release tag 命名規則と changelog を確認する。
2. release note template に commit、tag、deploy evidence、rollback evidence、known follow-up を定義する。
3. `gh release create` の dry-run 相当手順を作る。
4. 既存 tag から release を1件作成できることを確認する。
5. aiworkflow-requirements の deployment / release runbook へ導線を追加する。

## 5. 完了条件チェックリスト

- [ ] tag format と target commit の検証手順がある
- [ ] release note template が Phase 12 changelog を入力にしている
- [ ] GitHub Release と tag の一致を確認できる
- [ ] production deploy 実行とは別タスクとして境界が固定されている

## 6. 検証方法

```bash
gh release view vYYYYMMDD-HHMM
```

期待: tag と release note が一致し、Phase 11/12 evidence へのリンクが含まれる。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| 誤 tag から Release 作成 | tag format と target commit を検証してから `gh release create` を実行 |
| changelog の過不足 | Phase 12 `documentation-changelog.md` を release note の入力にする |
| deploy 実行と release 作成が混ざる | production mutation は `task-09c-production-deploy-execution-001` に限定する |

## 8. 参照情報

- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-05.md`
- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/documentation-changelog.md`
- GitHub CLI `gh release create`

## 9. 備考

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260501-065106-wt-10/docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-05.md`
- 症状: tag 作成手順はあるが GitHub Release 連携と release note 入力が未割当だった
- 参照: 09c Phase 12 unassigned-task-detection

## スコープ

### 含む

- GitHub Release 作成手順または workflow
- release note template

### 含まない

- tag 命名規則の変更
- production deploy 実行
