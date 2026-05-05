# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09c-serial-production-deploy-and-post-release-verification |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| Wave | 9 |
| Mode | serial（最終） |
| 作成日 | 2026-04-26 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（**Wave 9 / 24 タスク全体の最終 Phase**） |
| 状態 | pending_user_approval |
| 承認 | **user 承認必須（production release の 3 段目 approval gate）** |

## 目的

Phase 12 までの docs-only / spec_created 成果物を `feature/09c-production-deploy-and-post-release-verification` ブランチにまとめ、`dev` 向け PR を作成する。CLAUDE.md のブランチ戦略は solo 運用で必須レビュアー 0、CI gate + 履歴保護を品質保証の正本とする。本 Phase は production deploy を実行せず、`dev` PR 作成と、Phase 13 後に実行する production execution follow-up の導線固定までを完了条件とする。**Phase 10 / Phase 11 に続く 3 段目 approval gate** としての user 承認を必須とする。

## 実行タスク

1. local-check（lint / typecheck / test / build）を再実行
2. change-summary を作成（追加 / 変更 / 削除ファイル一覧）
3. PR template に沿って PR body 作成
4. **user 承認 gate（3 段目）** を待つ
5. 承認後 `gh pr create --base dev` 実行
6. PR URL を `artifacts.json` と `outputs/phase-13/main.md` に記録
7. dev → main 昇格 PR と production deploy execution は `docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md` に分離して記載

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-12.md | 7 ドキュメント |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/release-tag-evidence.md | tag URL template（runtime value pending） |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/post-release-summary.md | MVP リリース完了報告 template（runtime metrics pending） |
| 必須 | CLAUDE.md | branch 戦略 / 承認ルール |
| 必須 | docs/30-workflows/02-application-implementation/_design/phase-2-design.md | wave / depends_on |
| 参考 | docs/30-workflows/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-13.md | PR 作成手順例 |
| 参考 | docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-13.md | PR 作成手順例 |

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
- post-release-summary.md / release-tag-evidence.md / share-evidence.md / 24h evidence template を link し、runtime values は pending_user_approval と明記

### ステップ 4: approval gate（3 段目 / 最終）
- user に summary + AC matrix + evidence template link + pending runtime boundary + follow-up execution task を提示
- **未承認の間は次ステップに進まない**

### ステップ 5: PR 作成
```bash
gh pr create \
  --base dev \
  --head feature/09c-production-deploy-and-post-release-verification \
  --title "docs(09c): production deploy + release tag + 24h post-release verification 仕様書" \
  --body-file docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-13/pr-body.md
```

### ステップ 6: PR URL 記録
- artifacts.json の Phase 13 を `completed` + PR URL 追加
- `outputs/phase-13/main.md` に PR URL 記載

### ステップ 7: dev → main 昇格 PR 手順記載
- 別運用なので command 例のみ `outputs/phase-13/main.md` に残す

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | post-release-summary を PR body に link |
| 上流 09a | 09a / 09b の PR が dev へ merge 済みであること |
| 上流 09b | 同上 |
| 上位 README | PR URL を Wave 9 完了として README に追記提案 |

## 多角的チェック観点（不変条件）

- PR body に不変条件 #1-#15 への compliance 結果（Phase 12 の compliance check）を記載
- branch 戦略（feature → dev → main）に従っていること
- 直接 main へ push していないこと
- `dev` / `main` は solo 運用のため必須レビュアー 0、CI gate と線形履歴を必須にする（CLAUDE.md ルール）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local check | 13 | pending | lint/typecheck/test/build |
| 2 | change-summary | 13 | pending | git diff --stat |
| 3 | PR body 作成 | 13 | pending | template に従う |
| 4 | approval gate（3 段目） | 13 | pending | **user 承認必須** |
| 5 | gh pr create | 13 | pending | 承認後 |
| 6 | PR URL 記録 | 13 | pending | artifacts.json |
| 7 | dev → main 手順記載 | 13 | pending | 別運用 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | local-check / change-summary / approval log / PR URL / dev→main 手順 |
| ドキュメント | outputs/phase-13/pr-body.md | PR 本文 |
| メタ | artifacts.json | Phase 13 を completed に更新（PR URL 含む） |

## 完了条件

- [ ] local check 4 種 exit 0
- [ ] change-summary 完成
- [ ] PR body が template に従って完成
- [ ] **user 承認取得（3 段目）**
- [ ] `gh pr create` 完了 → PR URL 取得
- [ ] artifacts.json に PR URL 記録
- [ ] dev → main 昇格 PR 手順が `outputs/phase-13/main.md` に記載

## タスク100%実行確認【必須】

- 全実行タスクが completed
- PR が作成され URL が artifacts.json に記録
- artifacts.json の phase 13 を completed に更新
- **Wave 9 / 24 タスク全体の最終 Phase の完了として、上位 README に「Wave 9 completed」を追記する提案を `outputs/phase-13/main.md` に残す**

## 次 Phase

- 次: なし（**最終 Phase / Wave 9 完了 / 24 タスク全体の最終ゲート**）
- 引き継ぎ事項: PR URL を上位 README に通知、dev → main 昇格 PR の手順をユーザーへ
- ブロック条件: user 承認が得られない場合は PR を作らない（**production release の最終 gate**）

## user 承認 gate（3 段目 / 最終 / Wave 9 完了 gate）

```text
[ APPROVAL REQUIRED - PRODUCTION RELEASE GATE 3/3 / FINAL ]
Wave: 9
Task: 09c-serial-production-deploy-and-post-release-verification
Phase: 13 (PR 作成)

Phase 1〜12 status: 12/12 completed
Phase 11 evidence: production-smoke-runbook / playwright-production / sync-jobs-production.json
                   wrangler-tail-production.log / release-tag-evidence.md / share-evidence.md
                   post-release-24h-evidence.md（合計 7 種、配置済）
Phase 12 documents: post-release-summary / implementation-guide / system-spec-update-summary
                    documentation-changelog / unassigned-task-detection / skill-feedback-report
                    phase12-task-spec-compliance-check（合計 7 種、配置済）

不変条件 compliance: 15/15 PASS（Phase 12 phase12-task-spec-compliance-check）
AC matrix: positive 12/12, negative 13/13（Phase 7）
release tag: v20260426-1530（placeholder）
production URL: ${PRODUCTION_WEB} / ${PRODUCTION_API}
24h メトリクス: Workers req <値> / 5k, D1 reads <値> / 50k, D1 writes <値> / 10k

PR タイトル: docs(09c): production deploy + release tag + 24h post-release verification 仕様書
base: dev
head: feature/09c-production-deploy-and-post-release-verification
変更行数: TBD（実行時に埋める）

このまま PR を作成しますか？（PR 作成後は dev → main 昇格 PR が別運用で必要） [y/N]
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
  docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/index.md
  docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/artifacts.json
  docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-01.md ... phase-13.md
  docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-{01..13}/...

変更:
  docs/30-workflows/README.md（Wave 9 completed 追記提案）

削除: なし
```

## PR template

```markdown
## Summary
- Cloudflare production 環境（`ubm-hyogo-web` / `ubm-hyogo-api` / `ubm_hyogo_production`）への deploy 13 ステップ runbook を spec 化
- production D1 migration 適用 + secrets 確認（必須 7 種）+ api / web deploy + 10 ページ smoke + manual sync trigger を一連の流れで固定
- release tag フォーマット (`vYYYYMMDD-HHMM`) を確立、`outputs/phase-05/release-tag-script.md` で生成手順を spec 化
- production rollback 5 種（worker / pages / D1 migration / cron / release tag）と failure case 13 種を spec 化
- incident response runbook（09b 成果物）の関係者共有経路（Slack / Email placeholder）と share-evidence の取り方を spec 化
- 24h post-release verify として Cloudflare Analytics dashboard と不変条件 #5 / #15 SQL 確認を spec 化
- 不変条件 #4（本人本文 override しない）/ #5（apps/web → D1 直接禁止）/ #6（GAS prototype 昇格しない）/ #10（Cloudflare 無料枠）/ #11（admin は本文編集不可）/ #15（attendance 重複防止）を production 文脈で担保

## Test plan
- [ ] `pnpm lint` exit 0
- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm test` exit 0
- [ ] `pnpm build` exit 0
- [ ] outputs/phase-11/playwright-production/ に desktop + mobile screenshot 存在
- [ ] outputs/phase-11/sync-jobs-production.json に sync_jobs 5 件
- [ ] outputs/phase-11/wrangler-tail-production.log に 30 分以上の log
- [ ] outputs/phase-11/release-tag-evidence.md に commit hash + remote 反映確認
- [ ] outputs/phase-11/share-evidence.md に Slack / Email + 受領確認
- [ ] outputs/phase-11/post-release-24h-evidence.md に 24h Analytics + 不変条件 SQL
- [ ] outputs/phase-12/post-release-summary.md に MVP リリース完了報告
- [ ] outputs/phase-12/phase12-task-spec-compliance-check.md で不変条件 15 件 PASS

## AC
- AC-1〜AC-12（index.md 参照）すべて PASS

## Invariants compliance
- #4, #5, #6, #10, #11, #15 を本タスクで production 文脈で担保（Phase 12 phase12-task-spec-compliance-check 参照）

## Related
- depends_on: 09a / 09b（Wave 9 上流）
- blocks: なし（**Wave 9 / 24 タスク全体の最終 task**）
- parallel: なし

## Approval gates
- Phase 10: 6 軸 GO 判定 + user 承認（TBD at execution）
- Phase 11: production deploy 着手前の user 承認（09c 本体では未実行、follow-up で取得）
- Phase 13: PR 作成前の user 承認（TBD at execution）

## Post-release follow-up
- dev → main 昇格 PR は別運用（CLAUDE.md ルール: 必須レビュアー 0 + CI gate必須）
- 1 週間後 / 1 ヶ月後の継続観測（unassigned-task-detection.md 参照）
- 上位 README に Wave 9 completed 追記提案

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## dev → main 昇格 PR の参考手順（別運用）

```bash
# Phase 13 の PR が dev に merge された後（別作業）

# main 向け PR を作る場合
gh pr create \
  --base main \
  --head dev \
  --title "release: Wave 9 production deploy + post-release verification 仕様書 完了" \
  --body "Wave 9 (09a / 09b / 09c) の MVP リリース仕様書を main へ昇格。CLAUDE.md ルールに従い 必須レビュアー 0 + CI gateが必要。"

# 注意: main への PR は 必須レビュアー 0 + CI gate（CLAUDE.md）
# 注意: 直接 main へ push しない（branch protection 想定）
```
