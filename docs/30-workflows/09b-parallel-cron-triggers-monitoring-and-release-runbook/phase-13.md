# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09b-parallel-cron-triggers-monitoring-and-release-runbook |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| Wave | 9 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし |
| 状態 | pending |

## 目的

Phase 12 までの成果物を `feature/09b-cron-triggers-monitoring-and-release-runbook` ブランチにまとめ、`dev` 向けの PR を作成する。**user 承認が必須**。

## 実行タスク

1. local check
2. change-summary
3. pr-info / pr-creation-result 作成準備
4. approval gate（**blocked**）
5. `gh pr create`

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-12.md | Phase 12 成果物 |
| 必須 | CLAUDE.md | branch 戦略 |

## 実行手順

### ステップ 1: local check

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

### ステップ 2: change-summary

```bash
git diff --stat origin/dev..HEAD
```

### ステップ 3: Phase 13 成果物作成
- `outputs/phase-13/local-check-result.md`
- `outputs/phase-13/change-summary.md`
- `outputs/phase-13/pr-info.md`
- `outputs/phase-13/pr-creation-result.md`

### ステップ 4: approval gate
- user に summary + AC matrix + evidence link を提示

### ステップ 5: PR 作成

```bash
gh pr create \
  --base dev \
  --head feature/09b-cron-triggers-monitoring-and-release-runbook \
  --title "docs(09b): cron triggers + monitoring + release runbook 仕様書"
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| 並列 09a | 同時 dev merge を調整 |
| 下流 09c | 09a / 09b merge 後に 09c の Phase 1 開始 |

## 多角的チェック観点（不変条件）

- PR body に不変条件 #5/#6/#10/#15 への compliance を記載
- branch 戦略遵守

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local check | 13 | pending | lint/typecheck/test/build |
| 2 | change-summary | 13 | pending | git diff |
| 3 | pr-info / pr-creation-result | 13 | pending | 承認後に URL / 実行ログを記録 |
| 4 | approval gate | 13 | pending | **user 承認必須** |
| 5 | gh pr create | 13 | pending | 承認後 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | local-check / change-summary / approval log |
| ドキュメント | outputs/phase-13/local-check-result.md | typecheck / lint / test / build 結果 |
| ドキュメント | outputs/phase-13/change-summary.md | PR 作成前に提示する変更概要 |
| ドキュメント | outputs/phase-13/pr-info.md | PR 作成後の URL / CI 状態 |
| ドキュメント | outputs/phase-13/pr-creation-result.md | PR 作成コマンドの実行ログ |
| メタ | artifacts.json | Phase 13 を completed に更新（PR URL 含む） |

## 完了条件

- [ ] local check 4 種 exit 0
- [ ] change-summary 完成
- [ ] local-check-result.md 完成
- [ ] pr-info.md / pr-creation-result.md は PR 作成後に記録できる状態
- [ ] **user 承認取得**
- [ ] `gh pr create` 完了

## タスク100%実行確認【必須】

- 全実行タスクが completed
- PR URL が artifacts.json に記録
- artifacts.json の phase 13 を completed に更新

## 次 Phase

- 次: なし（最終 Phase）
- 引き継ぎ事項: PR URL を 09a / 09c / README に通知
- ブロック条件: user 承認なしで PR 作らない

## approval gate

```
[ APPROVAL REQUIRED ]
PR タイトル: docs(09b): cron triggers + monitoring + release runbook 仕様書
base: dev
head: feature/09b-cron-triggers-monitoring-and-release-runbook
変更行数: TBD
不変条件 compliance: 15/15 PASS
AC matrix: positive 9/9, negative 12/12

承認しますか？ [y/N]
```

## local-check 結果テンプレ

```
$ pnpm lint     → exit 0
$ pnpm typecheck → exit 0
$ pnpm test      → exit 0
$ pnpm build     → exit 0
```

## change-summary テンプレ

```
追加:
  docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md
  docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/artifacts.json
  docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-01.md ... phase-13.md
  docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/outputs/phase-{01..13}/...

変更: なし
削除: なし
```

## change-summary 追記テンプレ

```markdown
## Summary
- `apps/api/wrangler.toml` の `[triggers]` current facts を `0 * * * *` (legacy current fact) + `0 18 * * *` (schema sync) + `*/15 * * * *` (response sync) として runbook に固定
- Cloudflare Analytics / Sentry / Logpush の placeholder を release runbook と incident response runbook に配置
- release runbook（go-live + rollback + cron 制御 + dashboard URL）と incident response runbook（initial / escalation / postmortem）を完成
- worker / pages / D1 migration / cron の 4 種 rollback 手順を spec 化
- 不変条件 #5（rollback で web D1 操作なし）/ #6（GAS apps script trigger 不採用）/ #10（cron 頻度 100k 内）/ #15（rollback で attendance 整合性）を担保

## Test plan
- [ ] `pnpm lint` exit 0
- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm test` exit 0
- [ ] `pnpm build` exit 0
- [ ] outputs/phase-11/manual-smoke-log.md 配置
- [ ] outputs/phase-11/link-checklist.md 配置
- [ ] outputs/phase-12/release-runbook.md 完成
- [ ] outputs/phase-12/incident-response-runbook.md 完成
- [ ] outputs/phase-12/phase12-task-spec-compliance-check.md で不変条件 15 件 PASS

## AC
- AC-1〜AC-9（index.md 参照）すべて PASS

## Invariants compliance
- #5, #6, #10, #15 を本タスクで担保

## Related
- depends_on: 08a / 08b / 05a (infra)
- blocks: 09c
- parallel: 09a

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
