# Phase 13: PR 作成（ユーザー承認後にのみ実行）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sheets-to-d1-sync-implementation |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-30 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（最終） |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| 起源 Issue | GitHub #67（CLOSED 維持・**reopen しない**） |
| 状態 | pending（**user explicit yes 取得後に実行**） |

## 目的

`apps/api/src/sync/*` 実装と Phase 12 の 7 ファイルをまとめた PR を `feature/u-04-* → dev → main` の戦略に沿って作成する。**Issue #67 は既に CLOSED であり、本 Phase では reopen しない**（index.md Decision Log に明記済み）。PR description には `Closes #67` ではなく `Refs #67` を使用し、双方向リンクのみ維持する。

## 重要な実行制約

- **PR 自動作成禁止**: `gh pr create` は user の **explicit yes** を取得した後にのみ実行する（CLAUDE.md commit / PR 規約）
- **Issue 状態**: #67 は CLOSED 維持。`Closes #67` / `Fixes #67` / `Resolves #67` の **使用禁止**（reopen される副作用がある）。代わりに `Refs #67` のみ使用
- **branch protection**: solo 運用ポリシー（required_pull_request_reviews=null）。CI gate と線形履歴で品質担保
- **Cloudflare CLI**: `wrangler` 直接呼び出し禁止。すべて `bash scripts/cf.sh` 経由（UBM-012）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-07/ac-matrix.md | AC-1〜AC-12 トレース |
| 必須 | outputs/phase-09/main.md | 品質結果 |
| 必須 | outputs/phase-10/main.md | GO 判定 |
| 必須 | outputs/phase-11/main.md | smoke evidence（NON_VISUAL） |
| 必須 | outputs/phase-12/（7 ファイル） | Phase 12 成果物 |
| 必須 | CLAUDE.md | branch 戦略 / Cloudflare CLI ルール / commit 規約 |
| 参考 | `.claude/skills/task-specification-creator/references/phase-12-spec.md` §CLOSED Issue 切り離し | reopen 回避ルール |

## 実行タスク

1. approval gate（user explicit yes）
2. branch / commit 確定
3. PR description 生成
4. labels / reviewers 設定
5. merge 戦略確認
6. CI green 確認

## 実行手順

### ステップ 1: approval gate（必須）

| ゲート | 条件 | 確認方法 |
| --- | --- | --- |
| user explicit yes | 「PR 作成して良い」旨の明示的な user 発話あり | チャットログで確認 |
| Phase 10 GO 判定 | GO | outputs/phase-10/main.md |
| Phase 11 全 AC PASS | AC-1〜AC-12 PASS | outputs/phase-11/main.md |
| Phase 12 7 ファイル揃い | OK | `ls outputs/phase-12/` で 7 ファイル |
| Phase 12 compliance-check | PASS | outputs/phase-12/phase12-task-spec-compliance-check.md |
| LOGS x2 同期 | OK | git diff で 2 ファイル確認 |
| screenshots ディレクトリ不在 | OK | NON_VISUAL（`test ! -d outputs/phase-11/screenshots`） |

> **いずれかが NG の場合は本 Phase を実行せず、該当 Phase に戻る**。

### ステップ 2: branch / commit

| 項目 | 値 |
| --- | --- |
| branch 名 | `feat/u-04-sheets-to-d1-sync-implementation` |
| base branch | `dev`（CLAUDE.md branch 戦略） |
| commit 規約 | conventional commits（`feat(api/sync): U-04 manual / scheduled / backfill 三系統 + sync_audit writer`） |
| Co-Authored-By | `Claude Opus 4.7 <noreply@anthropic.com>` |
| 署名 | `--no-verify` / `--no-gpg-sign` 禁止（CLAUDE.md Git Safety Protocol） |
| amend | 禁止（新規 commit を作る） |
| stage 方法 | 個別ファイル指定（`git add -A` / `git add .` 禁止 → secrets 混入防止） |

```bash
# USER_APPROVAL_REQUIRED_BEFORE_PR_CREATE
git checkout -b feat/u-04-sheets-to-d1-sync-implementation
git add docs/30-workflows/completed-tasks/u-04-serial-sheets-to-d1-sync-implementation/
git add apps/api/src/sync/ apps/api/wrangler.toml
git add .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md
git add .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md
git add .claude/skills/aiworkflow-requirements/references/topic-map.md
git add .claude/skills/aiworkflow-requirements/LOGS.md
git add .claude/skills/task-specification-creator/LOGS.md
git add docs/30-workflows/completed-tasks/U-04-sheets-to-d1-sync-implementation.md
git commit -m "$(cat <<'EOF'
feat(api/sync): U-04 Sheets→D1 sync implementation (manual / scheduled / backfill + audit writer)

03 contract task の data-contract.md / sync-flow.md を差分ゼロで充足する apps/api/src/sync/* を実装。
manual (POST /admin/sync/run) / scheduled (Cron 0 * * * *) / backfill (POST /admin/sync/backfill)
の三系統と sync_audit writer 共通基盤を Workers 互換 fetch ベースで配備。AC-1〜AC-12 PASS、
不変条件 #1〜#7 trace 済み。Issue #67 は CLOSED 維持で Refs のみ使用。

Refs #67

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

### ステップ 3: PR description（テンプレート）

```bash
# USER_APPROVAL_REQUIRED
gh pr create --base dev --title "feat(api/sync): U-04 Sheets→D1 sync implementation" --body "$(cat <<'EOF'
## Summary
- `apps/api/src/sync/{manual,scheduled,backfill,audit}.ts` を新規配備し、03 contract task の sync-flow / data-contract を稼働化
- Cloudflare Workers Cron Trigger（既定 `0 * * * *`）で scheduled 全件 upsert sync を起動、論理 `sync_audit`（物理 `sync_job_logs`）writer 共通基盤で全経路の running → success/failed/skipped を記録
- Workers 互換 fetch + `crypto.subtle` JWT で Google Sheets API を呼び出し、`googleapis` Node SDK 等の非互換依存はゼロ

## Linked Issue
- Refs #67（CLOSED 維持・本 PR で reopen しない。governance / 履歴完結のため意図的に切り離し済み。Decision Log: docs/30-workflows/completed-tasks/u-04-serial-sheets-to-d1-sync-implementation/index.md）

## Linked specs
- docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/data-contract.md
- docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/sync-flow.md
- docs/00-getting-started-manual/specs/01-api-schema.md
- docs/00-getting-started-manual/specs/08-free-database.md
- .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md（本 PR で Sheets→D1 sync 節を追記）
- .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md（本 PR で Cron Triggers 節を追記）

## AC
AC-1〜AC-12 完全トレース → outputs/phase-07/ac-matrix.md / outputs/phase-11/main.md

## Invariants
- #1 schema をコードに固定しすぎない（form_field_aliases 駆動）
- #2 consent キーは publicConsent / rulesConsent のみ受理
- #3 responseEmail は system field
- #4 backfill は admin-managed 列に触れない
- #5 D1 への直接アクセスは apps/api に閉じる
- #6 GAS prototype を本番仕様に格上げしない（fetch ベース）
- #7 MVP では Sheets を真として backfill

## Test
- typecheck / lint / unit / contract / integration: pass（outputs/phase-09/main.md）
- manual smoke S-01〜S-08（local）/ S-10〜S-14（staging）: outputs/phase-11/main.md
- NON_VISUAL（screenshot は取得しない理由は outputs/phase-11/manual-test-result.md 参照）

## Free tier
- D1 writes: 24 sync/day × 数十件 ≈ 数百〜数千 writes/day（無料枠 100K/day の 1〜3%）
- Workers Cron: 1 cron 利用（無料枠 5/account 内）
- Sheets API: 60 read req/min/user 上限、本タスクは 24 req/day で余裕

## Cloudflare CLI 統制
- `wrangler` 直接呼び出しなし。deploy / d1 / triggers すべて `bash scripts/cf.sh` 経由（UBM-012）
- `wrangler login` ローカル OAuth 不使用、`.env` の op:// 参照経由で `CLOUDFLARE_API_TOKEN` を動的注入

## Documents
- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md（Part 1 中学生レベル + Part 2 技術者レベル）
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md（0 件、ファイルは生成）
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md

## Test plan
- [ ] CI green（typecheck / lint / unit / contract / integration / secret scan）
- [ ] dev deploy 後 `curl -X POST .../admin/sync/run` が 200 + auditId 返却
- [ ] dev で scheduled handler 1 回起動を `sync_audit` で確認
- [ ] dev で backfill 後 `member_status.publish_state` が不変
- [ ] 下流 05b smoke readiness の入力として handoff

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

#### 実行ガード

ユーザーの明示承認後にのみ実行する。

### ステップ 4: labels / reviewers

| 種別 | 値 |
| --- | --- |
| labels | `area/api`, `wave-1`, `serial`, `sync`, `cron` |
| reviewers | solo 運用のため required reviewer 0（CLAUDE.md branch 戦略）。任意で self-review |
| assignees | `daishiman` |

### ステップ 5: merge 戦略

| 項目 | 値 |
| --- | --- |
| dev merge | `Squash and merge`（線形履歴維持） |
| main merge | `Create a merge commit`（履歴保全） |
| 自動デプロイ | dev → Cloudflare staging（apps/api worker） / main → production |
| force push | 禁止（CLAUDE.md Git Safety Protocol） |

### ステップ 6: CI green 確認 + 完了記録

| 確認 | コマンド |
| --- | --- |
| CI status | `gh pr checks <PR_URL>` |
| status_checks 必須項目 | required_status_checks に従う（typecheck / lint / unit / verify-indexes 等） |
| Issue 側双方向リンク | `gh issue comment 67 --body "PR <URL> で U-04 実装完了。Issue は CLOSED 維持。"` |

### ステップ 7: Issue #67 コメント運用（reopen 回避）

| 操作 | 内容 |
| --- | --- |
| 禁止 | `gh issue reopen 67` |
| 禁止 | PR body / commit message に `Closes #67` / `Fixes #67` / `Resolves #67` |
| 必須 | PR open 後に `gh issue comment 67` で PR URL と仕様書 path を貼付 |
| 必須 | merge 後にも `gh issue comment 67` で merge SHA を残す |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| 下流 05b | dev deploy 完了確認後に smoke readiness 開始 |
| 下流 09b | Cron Trigger 配備済みを前提に monitoring / runbook 化 |

## 多角的チェック観点

| # | 不変条件 | PR description での明示 |
| --- | --- | --- |
| #1 | schema 固定回避 | Invariants 節 |
| #2 | consent キー統一 | Invariants 節 |
| #3 | responseEmail = system | Invariants 節 |
| #4 | admin 列分離 | Invariants 節 + Test plan |
| #5 | D1 直接アクセス境界 | Invariants 節 |
| #6 | GAS 不昇格 | Invariants 節 + Free tier 節 |
| #7 | Sheets を真 | Invariants 節 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | approval gate（user yes） | 13 | pending | 必須 |
| 2 | branch / commit | 13 | pending | feat/u-04-* / Refs #67 |
| 3 | PR description | 13 | pending | テンプレ準拠 |
| 4 | labels / reviewers | 13 | pending | solo 運用 |
| 5 | merge 戦略 | 13 | pending | squash → merge |
| 6 | CI green 確認 | 13 | pending | gh pr checks |
| 7 | Issue #67 コメント（reopen 回避） | 13 | pending | comment のみ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | PR URL / merge SHA / Issue コメント URL |
| メタ | artifacts.json | phase 13 status |

## 完了条件

- [ ] user explicit yes が記録されている
- [ ] PR が dev に open されている
- [ ] PR description が AC + 7 ドキュメント link + Invariants + Refs #67 を含む
- [ ] PR description / commit message に `Closes #67` 等が含まれていない
- [ ] CI green
- [ ] Issue #67 に PR URL を comment（reopen していない）
- [ ] outputs/phase-13/main.md に PR URL を記録
- [ ] **本 Phase 内の全タスクを 100% 実行完了**

## タスク 100% 実行確認【必須】

- 全 7 サブタスクが completed
- PR URL を outputs/phase-13/main.md に記録
- Issue #67 は CLOSED 状態のまま（`gh issue view 67 --json state` で確認）
- artifacts.json の phase 13 を completed に更新
- merge 後 dev staging 確認 / production deploy 確認は 09b へ引継ぎ

## 次 Phase

- 次: なし（最終）
- 引き継ぎ事項: PR URL / merge SHA / dev staging URL を 05b / 09b に共有
- ブロック条件: approval gate 未通過、CI red、`Closes #67` 混入、`wrangler` 直接呼び出し検出のいずれか
