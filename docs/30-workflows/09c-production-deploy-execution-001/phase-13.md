# Phase 13: PR 作成（`Refs #353`）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | task-09c-production-deploy-execution-001 |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成（`Refs #353`） |
| Wave | 9 |
| Mode | serial（最終 / execution-only） |
| 作成日 | 2026-05-02 |
| 前 Phase | 12 (実装ガイド + 仕様書同期 + 未タスク検出 + skill feedback) |
| 次 Phase | なし（**Wave 9 execution 半身の最終 Phase / Wave 9 完了**） |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| user_approval | REQUIRED（**PR 作成承認 / production G1-G3 とは別枠**） |
| Cloudflare CLI | `bash scripts/cf.sh` 経由のみ（本 Phase では production mutation を実行しない） |
| Issue 紐付け | **`Refs #353`（Issue は CLOSED のまま、`Closes` は使用しない）** |

## 目的

Phase 1-12 の仕様書と Phase 12 strict 7 ドキュメントを **既存ブランチ** `docs/issue-353-09c-production-deploy-execution-spec` にまとめ、`dev` 向け PR を作成する。Issue #353 は既に CLOSED で、本タスクは spec_created の execution-only タスクのため、**`Refs #353` を採用し `Closes` は使用しない**（再 close を回避）。Phase 13 の承認は **PR 作成承認** であり、Phase 1 / 5 / 10 の production approval G1-G3 には数えない。production deploy 実行済み evidence は、実行後 close-out wave で別途同期する。

この Phase 13 は **spec PR 作成専用**である。`outputs/phase-11/24h-metrics.md`、`incident-or-no-incident.md`、Phase 11 screenshots は execution wave の必須入力であり、spec PR 作成のブロッカーにはしない。実行後 close-out PR を作る場合のみ、それらを必須入力へ昇格する。

## 実行タスク

1. local-check 実行（`pnpm install --force` / `pnpm typecheck` / `pnpm lint`）
2. change-summary 作成（`git diff --stat origin/dev..HEAD` 結果を `outputs/phase-13/branch-status.md` に保存）
3. PR body 作成（`outputs/phase-13/pr-body.md`）— Phase 12 implementation-guide の主要見出しを反映
4. user approval 取得（PR 作成承認 / production G1-G3 とは別枠）
5. commit 整理（**5 単位以内**） — `outputs/phase-13/commit-list.md` に粒度別記録
6. PR 作成前の branch status を保存（`outputs/phase-13/branch-status.md`）
7. `gh pr create --base dev` 実行（ユーザー明示承認後のみ）
8. PR 完了確認（PR URL 取得）
9. PR URL を artifacts.json と `outputs/phase-13/main.md` に記録
10. dev → main 昇格 PR の手順を `outputs/phase-13/main.md` に command 例として残す（実行は別運用）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/phase-12.md | 7 ドキュメント |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/outputs/phase-12/implementation-guide.md | PR body の主要見出し source |
| 実行後必須 | docs/30-workflows/09c-production-deploy-execution-001/outputs/phase-11/24h-metrics.md | 24h 実測値（spec PR では予約パスのみ） |
| 実行後必須 | docs/30-workflows/09c-production-deploy-execution-001/outputs/phase-11/incident-or-no-incident.md | incident 有無 evidence（spec PR では予約パスのみ） |
| 必須 | CLAUDE.md | branch 戦略 / 承認ルール / Cloudflare CLI ラッパールール |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-13.md | 親 PR 作成手順例 |
| 参考 | .claude/skills/task-specification-creator/references/phase-template-phase13.md | Phase 13 仕様 |
| 参考 | .claude/skills/task-specification-creator/references/phase-template-phase13-detail.md | Phase 13 詳細 |

## 実行手順

### ステップ 1: local check

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

- 全 exit 0 で次へ
- 失敗時は最大 3 回まで自動修復、修復差分はコミット

### ステップ 2: change-summary 作成

```bash
git fetch origin dev
git diff --stat origin/dev..HEAD > outputs/phase-13/branch-status.md
git diff origin/dev..HEAD --name-only >> outputs/phase-13/branch-status.md
```

- 追加 / 変更 / 削除を明記
- ブランチ名 / commit hash / base 比較結果を記録

### ステップ 3: PR body 作成（`outputs/phase-13/pr-body.md`）

Phase 12 implementation-guide の主要見出しを反映。**`Refs #353`** を採用し `Closes` は使用しない。

```markdown
## Summary
- Cloudflare production 環境（`ubm-hyogo-web` / `ubm-hyogo-api` / `ubm_hyogo_production`）への deploy / smoke / 24h post-release verification の実行 evidence を spec_created のタスク仕様書として整備
- Issue #353（CLOSED）は親 09c の docs-only 仕様作成側で完結。本 PR は execution-only 半身として `Refs #353` で参照のみ
- Phase 1-13 evidence plan: user-approval-log / preflight / d1-migration / deploy / release-tag / smoke / GO/NO-GO / 24h-metrics / share-evidence / incident-or-no-incident / 不変条件 #5 #15 SQL
- Cloudflare 操作はすべて `bash scripts/cf.sh` 経由（`wrangler` 直実行 0 件 grep evidence）
- 親 09c skill-feedback 指摘の「docs-only と production 実行の同一 lifecycle 混在」を本タスクで完全分離

## Test plan
- [ ] `pnpm install --force` exit 0
- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm lint` exit 0
- [ ] spec-created close-out: outputs/phase-01〜phase-11/main.md が NOT_EXECUTED / RESERVED boundary を明記
- [ ] execution wave only: outputs/phase-11/24h-metrics.md に 24h Workers req / D1 reads / writes 実測値
- [ ] execution wave only: outputs/phase-11/screenshots/ に 3 枚以上（analytics-workers-api / analytics-workers-web / analytics-d1）
- [ ] execution wave only: outputs/phase-11/share-evidence.md に Slack / Email + 受領確認
- [ ] execution wave only: outputs/phase-11/incident-or-no-incident.md に「異常なし」または runbook 起動 evidence
- [ ] outputs/phase-12/ 7 ドキュメント揃い
- [ ] outputs/phase-12/phase12-task-spec-compliance-check.md で不変条件 15 件が PENDING_EXECUTION として誤PASS化されていない
- [ ] root artifacts.json が唯一正本であることを Phase 12 compliance に記録

## AC
- AC-1〜AC-13（index.md 参照）は execution wave で確認。今回の spec PR では PASS 断定しない。

## Invariants compliance
- #4, #5, #6, #10, #11, #15 は execution wave の production 文脈で再担保する計画を固定（Phase 12 phase12-task-spec-compliance-check 参照）

## Approval gates
- Production approval G1: Phase 1 scope 固定
- Production approval G2: Phase 5 preflight 完了 / production mutation 直前
- Production approval G3: Phase 10 GO/NO-GO / 24h 観測開始
- PR creation approval: Phase 13 本 PR 作成前。これは production approval G1-G3 とは別枠。

## Related
- Refs #353（CLOSED のまま）
- 親 docs-only: docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification
- depends_on: 09a / 09b（spec PR 作成時は参照のみ。production Phase 5 開始時は 09a runtime evidence green と 09b runbook availability を再確認する）
- blocks: なし（Wave 9 / 24 タスクの最終 execution）

## Rollback evidence
- Production rollback evidence belongs to Phase 6-11 execution outputs.
- Phase 13 only records PR creation status and does not create branch-protection rollback payloads.
- 5 経路（worker / pages / D1 migration / cron / release tag）の手順は outputs/phase-12/implementation-guide.md Part 2 参照

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### ステップ 4: PR 作成 user approval 取得

```text
[ APPROVAL REQUIRED - PR CREATE GATE ]
Wave: 9 (execution 半身)
Task: task-09c-production-deploy-execution-001
Phase: 13 (PR 作成 / Refs #353)

Phase 1〜12 status: spec_created close-out
Phase 11 evidence: reserved paths only until production execution
Phase 12 documents: 7 ファイル（implementation-guide Part1+Part2 / system-spec-update /
                    documentation-changelog / unassigned-task-detection / skill-feedback /
                    phase12-task-spec-compliance-check / root artifacts parity）

不変条件 compliance: planned / pending production evidence
Cloudflare CLI: bash scripts/cf.sh 経由（wrangler 直実行 0 件）
Issue 紐付け: Refs #353（Closes は使用しない）

PR タイトル: docs(09c-prod-deploy-exec): task-09c-production-deploy-execution-001 仕様書整備 (Refs #353)
base: dev
head: docs/issue-353-09c-production-deploy-execution-spec
変更行数: TBD（ステップ 2 で確定）

このまま PR を作成しますか？ [y/N]
```

- **未承認の間は次ステップに進まない**

### ステップ 5: commit 整理（5 単位以内）

`outputs/phase-13/commit-list.md` に以下のような粒度別ログを記録（**最大 5 commit**）。

| # | commit subject | 含むファイル群 |
| --- | --- | --- |
| 1 | docs(09c-exec): index + artifacts + Phase 1-3 設計フェーズ仕様書 | index.md / artifacts.json / phase-01.md〜phase-03.md |
| 2 | docs(09c-exec): Phase 4-7 実装計画 + verify + preflight + D1 + deploy 仕様書 | phase-04.md〜phase-07.md |
| 3 | docs(09c-exec): Phase 8-10 release tag + smoke + GO/NO-GO 仕様書 | phase-08.md〜phase-10.md |
| 4 | docs(09c-exec): Phase 11-13 24h verify + Phase 12 7 ドキュメント + PR 作成仕様書 | phase-11.md〜phase-13.md |
| 5 | docs(09c-exec): outputs テンプレ配置 + artifacts parity 整合 | outputs/phase-{01..13}/ |

- 5 を超える場合は意味的に統合 / fixup する
- `git rebase -i` は使用禁止（CLAUDE.md ルール）
- `--amend` は禁止（CLAUDE.md ルール、新規 commit を作る）

### ステップ 6: branch status 保存

```bash
git status --short > outputs/phase-13/branch-status.md
git diff --stat origin/dev..HEAD >> outputs/phase-13/branch-status.md
```

- PR 作成対象の差分を保存する。
- 本 Phase では GitHub branch protection の PUT/rollback payload を扱わない。

### ステップ 7: PR 作成（gh pr create）

```bash
gh pr create \
  --base dev \
  --head docs/issue-353-09c-production-deploy-execution-spec \
  --title "docs(09c-prod-deploy-exec): task-09c-production-deploy-execution-001 仕様書整備 (Refs #353)" \
  --body-file docs/30-workflows/09c-production-deploy-execution-001/outputs/phase-13/pr-body.md
```

- exit 0 で PR URL を取得
- 失敗時は body の `Closes` 誤記が混入していないか check（**`Refs #353` のみ使用**）

### ステップ 8: PR 完了確認

```bash
# PR metadata confirmation
gh pr view <PR_NUMBER> --json url,state,baseRefName,headRefName,title \
  > outputs/phase-13/pr-info.json
```

- `state=OPEN` / `baseRefName=dev` / `headRefName=docs/issue-353-09c-production-deploy-execution-spec` を確認
- title に `Refs #353` を含むことを確認

### ステップ 9: PR URL 記録

- `artifacts.json` の Phase 13 を `completed` + PR URL 追加
- `outputs/phase-13/main.md` に PR URL / commit hash / base / head を記載

### ステップ 10: dev → main 昇格 PR の参考手順を記録

本 Phase では dev 向け PR だけを扱う。main 昇格は 24h 観測と user approval を別運用で確認してから実施する。

### ステップ 11: dev → main 昇格 PR の参考手順

```bash
# 別運用: dev に merge された後の main 向け PR
gh pr create \
  --base main \
  --head dev \
  --title "release: Wave 9 execution 完了 (09c production deploy execution)" \
  --body "Wave 9 execution 半身の最終 PR。CLAUDE.md ルールに従い 必須レビュアー 0 + CI gate。"
```

- 直接 main へ push しない（branch protection 想定）
- 必須レビュアー 0 + CI gate（CLAUDE.md solo 運用ポリシー）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | implementation-guide / phase12-task-spec-compliance-check を PR body に link |
| 親 09c Phase 13 | parent との lifecycle 分離記録を skill-feedback で参照 |
| 上流 09a / 09b | spec PR では参照のみ。production Phase 5 の開始条件は 09a runtime evidence green + 09b release / incident runbook availability |
| 上位 README | PR URL を Wave 9 execution 完了として README 追記提案 |

## 多角的チェック観点（不変条件）

- PR body に不変条件 #1-#15 への compliance 結果（Phase 12 の compliance check）を記載
- branch 戦略（feature → dev → main）に従っていること
- 直接 main へ push していないこと
- `dev` / `main` は solo 運用のため必須レビュアー 0、CI gate と線形履歴を必須にする（CLAUDE.md ルール）
- **`Closes #353` が body に混入していないこと**（grep で確認）
- Cloudflare 操作 grep: `git log -p origin/dev..HEAD | rg "^\+.*wrangler "` が 0 件（`bash scripts/cf.sh` 経由のみ）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local check | 13 | spec_created | install --force / typecheck / lint |
| 2 | change-summary | 13 | spec_created | git diff --stat |
| 3 | PR body 作成 | 13 | spec_created | implementation-guide 主要見出し反映 |
| 4 | PR 作成 user approval | 13 | spec_created | production G1-G3 とは別枠 |
| 5 | commit 整理（5 単位以内） | 13 | spec_created | commit-list.md |
| 6 | branch status 保存 | 13 | spec_created | PR 作成前の差分状態 |
| 7 | gh pr create | 13 | spec_created | user approval 後のみ |
| 8 | PR metadata 確認 | 13 | spec_created | pr-info.json |
| 9 | PR URL 記録 | 13 | spec_created | artifacts.json |
| 10 | dev → main 手順記載 | 13 | spec_created | 別運用 command 例 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | local-check / change-summary / approval log / PR URL / dev→main 手順 |
| ドキュメント | outputs/phase-13/pr-body.md | PR 本文（**`Refs #353`** / `Closes` 不使用） |
| ドキュメント | outputs/phase-13/branch-status.md | git diff --stat / ブランチ状態 |
| ドキュメント | outputs/phase-13/commit-list.md | commit 5 単位以内の粒度ログ |
| 証跡 | outputs/phase-13/pr-info.json | PR metadata confirmation |
| メタ | artifacts.json | Phase 13 を completed に更新（PR URL 含む） |

These Phase 13 outputs are intentionally absent in the Phase 12 spec-created close-out. They are generated only after explicit PR creation approval, and they are separate from production runtime evidence.

## 完了条件

- [ ] local-check 3 種 exit 0（`pnpm install --force` / `pnpm typecheck` / `pnpm lint`）
- [ ] `branch-status.md` に diff --stat / 変更ファイル一覧
- [ ] `pr-body.md` に **`Refs #353`** が記載され `Closes` が **混入していない**
- [ ] `pr-body.md` に Phase 12 implementation-guide の主要見出しが反映
- [ ] PR 作成承認 / gh pr create / PR metadata confirmation すべて evidence 化
- [ ] commit が **5 単位以内**（`commit-list.md` に記録）
- [ ] PR URL が artifacts.json と `outputs/phase-13/main.md` に記録
- [ ] dev → main 手順が `outputs/phase-13/main.md` に記載
- [ ] artifacts.json の Phase 13 を completed に更新

## タスク100%実行確認【必須】

- 全実行タスクが completed
- PR が作成され URL が artifacts.json に記録（`Refs #353` 採用）
- PR evidence（approval log / pr-info.json / push 確認）が揃っている
- commit 粒度が 5 単位以内
- artifacts.json の phase 13 を completed に更新
- **Wave 9 execution 半身の最終 Phase / Wave 9 完了** として、上位 README に「Wave 9 execution completed」追記提案を `outputs/phase-13/main.md` に残す

## 次 Phase

- 次: なし（**最終 Phase / Wave 9 execution 完了 / 24 タスク全体の最終 execution**）
- 引き継ぎ事項: PR URL を上位 README に通知、dev → main 昇格 PR は別運用
- ブロック条件: user 承認が得られない場合は PR を作らない、`Closes` が body に混入している場合は body を修正してから再 push

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| `Closes #353` の誤記混入 | 既に CLOSED の Issue が再 close される（重複アクション） | PR body に `Refs #353` のみ記述 / 自動 grep で `Closes #353` 検出時は body 修正 |
| commit が 5 単位を超える | review 困難 / 粒度ルール違反 | commit-list.md で粒度を spec 化、超過時は意味統合（rebase -i 禁止のため新規 commit に統合） |
| PR evidence の欠落 | PR 作成記録の監査不能 | approval log / pr-info.json / push 完了 log を成果物として強制 |
| Cloudflare CLI 直実行混入 | CLAUDE.md ルール違反 | `git log -p origin/dev..HEAD | rg "^\+.*wrangler "` が 0 件であることを PR 作成前に確認 |
| dev → main 自動昇格 | 24 時間観測なしで main へ流出 | 本 Phase は dev 向け PR のみ、main 昇格は別運用と明記 |
| PR 作成承認が遅延 | Wave 9 spec PR が滞留 | approval log の placeholder を残し、承認受領後に PR 作成、PR URL を後続記録 |
