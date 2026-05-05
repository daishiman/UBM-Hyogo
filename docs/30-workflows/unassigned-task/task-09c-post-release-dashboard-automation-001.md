# task-09c-post-release-dashboard-automation-001

## メタ情報

```yaml
issue_number: 351
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-09c-post-release-dashboard-automation-001 |
| タスク名 | 09c post-release dashboard artifact 自動化 |
| 分類 | operations |
| 対象機能 | GitHub Actions / Cloudflare metrics |
| 優先度 | 中 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-05-01 |

## 1. なぜこのタスクが必要か（Why）

09c の 24h post-release verification は手動証跡を中心に設計されている。release 後の Cloudflare / D1 / authz smoke の状態を毎回手で集めると、取り忘れや比較不能な証跡が発生する。

放置すると、production release 後の状態を GitHub Actions artifact などで再現できず、障害調査や費用傾向確認が属人的になる。

## 2. 何を達成するか（What）

GitHub Actions schedule または manual workflow で post-release metrics を収集し、dashboard artifact として保存する仕組みを仕様化する。

## 3. どのように実行するか（How）

Cloudflare API token は read-only analytics 用に限定し、schedule 頻度は free-tier を圧迫しない範囲に固定する。production deploy 実行は含めず、metrics 収集と artifact 保存に責務を絞る。

## 4. 実行手順

1. 09c Phase 11 の手動 metrics と threshold を抽出する。
2. 自動収集対象を Cloudflare req/error、D1 reads/writes、cron status に限定する。
3. GitHub Actions の workflow inputs、schedule、artifact path を設計する。
4. read-only token の secret/variable 配置を正本化する。
5. 1回 dry-run し、artifact の形を確認する。

## 5. 完了条件チェックリスト

- [ ] workflow の実行方式が manual / schedule のどちらかで定義されている
- [ ] Cloudflare API token scope が read-only に限定されている
- [ ] dashboard artifact path が固定されている
- [ ] 09c の 24h threshold と指標名が一致している

## 6. 検証方法

```bash
gh workflow list
rg -n "post-release|dashboard|Cloudflare Analytics" .github/workflows docs/30-workflows
```

期待: post-release metrics workflow が manual または schedule で確認でき、artifact path が仕様書から辿れる。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| Cloudflare API token scope 過大 | read-only analytics 用 token を別名 secret として設計 |
| 無料枠超過 | schedule 頻度を 1 日 1 回以下に固定 |
| production deploy と混線 | 本タスクは dashboard artifact 作成のみを扱う |

## 8. 参照情報

- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/post-release-summary.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md`

## 9. 備考

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260501-065106-wt-10/docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/post-release-summary.md`
- 症状: 24h metrics は手動証跡として設計されており、継続観測の自動化範囲と token scope が未割当だった
- 参照: 09c Phase 12 unassigned-task-detection

## スコープ

### 含む

- 24h metrics 収集 workflow の仕様化
- dashboard artifact path の定義

### 含まない

- production deploy 実行
- 有料監視基盤の導入
