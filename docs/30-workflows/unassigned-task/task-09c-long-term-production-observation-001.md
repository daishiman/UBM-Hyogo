# task-09c-long-term-production-observation-001

## メタ情報

```yaml
issue_number: 350
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-09c-long-term-production-observation-001 |
| タスク名 | 1週間 / 1か月 production 継続観測の仕様化 |
| 分類 | operations |
| 対象機能 | Production observation / post-release metrics |
| 優先度 | 中 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-05-01 |

## 1. なぜこのタスクが必要か（Why）

09c は production release 後の 24h verification を定義しているが、1週間・1か月の継続観測は未割当である。24h の正常性だけでは、cron、D1、traffic、cost の遅延的な増加を検出できない。

放置すると、free-tier 超過や sync job の write amplification が月次まで見逃される可能性がある。

## 2. 何を達成するか（What）

1週間・1か月の production observation checkpoint を仕様化し、指標、閾値、evidence path、異常時の rollback / postmortem 分岐を定義する。

## 3. どのように実行するか（How）

09c の 24h thresholds を baseline とし、req/day、D1 reads/writes、error rate、cron success/failure、authz smoke failure を観測対象にする。手動 checklist でもよいが、期日忘れを防ぐため Issue checklist または scheduled reminder を作る。

## 4. 実行手順

1. 09c Phase 11/12 の 24h verification 指標を抽出する。
2. 1週間・1か月で見る閾値と evidence path を決める。
3. 異常時の escalation、rollback、postmortem 分岐を定義する。
4. reminder または Issue checklist を作成する。
5. aiworkflow-requirements の operations / deployment 参照へ導線を追加する。

## 5. 完了条件チェックリスト

- [ ] 1週間と1か月の観測日が定義されている
- [ ] 指標と閾値が 09c runtime threshold と整合している
- [ ] evidence path が固定されている
- [ ] 異常時の分岐が rollback / postmortem と接続されている

## 6. 検証方法

```bash
rg -n "1 week|1 month|継続観測|production observation" docs/30-workflows .claude/skills/aiworkflow-requirements/references
```

期待: 継続観測の正本タスク、閾値、evidence path が検索できる。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| 観測だけが増えて判断が曖昧 | req/day、D1 reads/writes、error rate の閾値を Phase 1 で固定 |
| 手動運用の忘れ | GitHub Issue checklist または scheduled reminder を作る |
| 24h verification と重複する | 24h は 09c、1週間/1か月は本タスクと役割分担を明記する |

## 8. 参照情報

- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/post-release-summary.md`
- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md`

## 9. 備考

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260501-065106-wt-10/docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/post-release-summary.md`
- 症状: 24h 以降の観測期間、判定閾値、evidence path が未割当だった
- 参照: 09c Phase 12 unassigned-task-detection

## スコープ

### 含む

- 1週間 / 1か月観測の閾値と evidence
- 異常時の rollback / postmortem 分岐

### 含まない

- 24h verification の代替
- 有料 APM 導入
