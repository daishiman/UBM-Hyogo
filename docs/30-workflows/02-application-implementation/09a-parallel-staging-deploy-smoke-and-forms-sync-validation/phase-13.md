# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09a-parallel-staging-deploy-smoke-and-forms-sync-validation |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| Wave | 9 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし |
| 状態 | pending |

## 目的

Phase 12 までの成果物を `feature/09a-staging-deploy-smoke-and-forms-sync-validation` ブランチにまとめ、`dev` 向けの PR を作成する。**user 承認が必須**。

## 実行タスク

1. local-check（lint / typecheck / test / build）を再実行
2. change-summary を作成（追加 / 変更 / 削除ファイル一覧）
3. PR template に沿って PR body 作成
4. user 承認を待つ（**ここで blocked**）
5. 承認後 `gh pr create` 実行

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-12.md | 6 ドキュメント |
| 必須 | CLAUDE.md | branch 戦略 |
| 必須 | doc/02-application-implementation/_design/phase-2-design.md | wave / depends_on |
| 参考 | docs/05b-parallel-smoke-readiness-and-handoff/phase-13.md | PR 作成手順例 |

## 実行手順

### ステップ 1: local check
```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
- 全 exit 0 で次へ

### ステップ 2: change-summary 作成
- `git diff --stat origin/dev..HEAD`
- 追加 / 変更 / 削除を `outputs/phase-13/main.md` に記述

### ステップ 3: PR body 作成
- `outputs/phase-13/pr-body.md` を本仕様書 末尾の PR template で作成

### ステップ 4: approval gate
- user に summary + AC matrix + evidence link を提示し承認を求める
- **未承認の間は次ステップに進まない**

### ステップ 5: PR 作成
```bash
gh pr create \
  --base dev \
  --head feature/09a-staging-deploy-smoke-and-forms-sync-validation \
  --title "docs(09a): staging deploy + Forms sync + Playwright validation 仕様書" \
  --body-file doc/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-13/pr-body.md
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| 並列 09b | 09b PR と同タイミングで dev へ merge（cherry-pick 競合回避） |
| 下流 09c | 09a / 09b merge 後に 09c の Phase 1 開始 |

## 多角的チェック観点（不変条件）

- PR body に不変条件 #1-#15 への compliance 結果を記載
- branch 戦略（feature → dev → main）に従っていること
- 直接 main へ push していないこと

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local check | 13 | pending | lint/typecheck/test/build |
| 2 | change-summary | 13 | pending | git diff --stat |
| 3 | PR body 作成 | 13 | pending | template に従う |
| 4 | approval gate | 13 | pending | **user 承認必須** |
| 5 | gh pr create | 13 | pending | 承認後 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | local-check / change-summary / approval log |
| ドキュメント | outputs/phase-13/pr-body.md | PR 本文 |
| メタ | artifacts.json | Phase 13 を completed に更新（PR URL 含む） |

## 完了条件

- [ ] local check 4 種 exit 0
- [ ] change-summary 完成
- [ ] PR body が template に従って完成
- [ ] **user 承認取得**
- [ ] `gh pr create` 完了 → PR URL 取得

## タスク100%実行確認【必須】

- 全実行タスクが completed
- PR が作成され URL が artifacts.json に記録
- artifacts.json の phase 13 を completed に更新

## 次 Phase

- 次: なし（最終 Phase）
- 引き継ぎ事項: PR URL を 09b / 09c / README に通知
- ブロック条件: user 承認が得られない場合は PR を作らない

## approval gate

```
[ APPROVAL REQUIRED ]
PR タイトル: docs(09a): staging deploy + Forms sync + Playwright validation 仕様書
base: dev
head: feature/09a-staging-deploy-smoke-and-forms-sync-validation
変更行数: TBD（実行時に埋める）
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
  doc/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/index.md
  doc/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/artifacts.json
  doc/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-01.md ... phase-13.md
  doc/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-{01..13}/...

変更: なし
削除: なし
```

## PR template

```markdown
## Summary
- staging deploy（`pnpm deploy:staging`）の実行手順を 11 ステップ runbook で固定
- staging で `POST /admin/sync/schema` + `POST /admin/sync/responses` を手動実行し sync_jobs.success を確認
- staging URL に対して Playwright を desktop / mobile profile で再実行し screenshot evidence を保存
- 10 ページ手動 smoke で認可境界（公開 / 未ログイン / 一般 / admin）を確認
- 不変条件 #5 (apps/web → D1 直接禁止) と #10 (無料枠) を staging build artifact + Cloudflare Analytics で再確認

## Test plan
- [ ] `pnpm lint` exit 0
- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm test` exit 0
- [ ] `pnpm build` exit 0
- [ ] outputs/phase-11/playwright-staging/ に desktop + mobile screenshot 存在
- [ ] outputs/phase-11/sync-jobs-staging.json に sync_jobs 5 件
- [ ] outputs/phase-11/wrangler-tail.log に 30 分以上の log
- [ ] outputs/phase-12/phase12-task-spec-compliance-check.md で不変条件 15 件 PASS

## AC
- AC-1〜AC-9（index.md 参照）すべて PASS

## Invariants compliance
- #1, #2, #3, #5, #6, #10, #11 を本タスクで担保

## Related
- depends_on: 08a / 08b / 04 (infra)
- blocks: 09c
- parallel: 09b

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
