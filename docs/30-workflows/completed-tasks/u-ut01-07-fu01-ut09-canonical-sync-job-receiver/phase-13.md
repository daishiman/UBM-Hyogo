# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 canonical sync job implementation receiver (U-UT01-07-FU01) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-05-01 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了 / 後続実装は UT-09 implementation task） |
| 状態 | pending_user_approval |
| sourceIssue | #333 (CLOSED) |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created（PR merge 後も spec 段階のため `spec_created` を維持） |
| user_approval_required | **true** |
| ブランチ | `feat/issue-333-u-ut01-07-fu01-ut09-canonical-sync-job-receiver-task-spec` |
| ベース | `main` |

## 目的

Phase 1〜12 の成果物（UT-09 implementation root 確定 / canonical 名引き渡し / `sync_log` 物理化禁止 / 直交性維持 / NON_VISUAL evidence / docs sync）をまとめて PR を作成し、ユーザーの明示的な承認を経てレビュー → マージへ進める。本 PR は **タスク仕様書のみ**（`docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/` 配下）を対象とし、`apps/api/src/**` などの実コード変更は本 PR に含めない（UT-09 implementation task のスコープ）。

> **重要: このフェーズは user の明示的な承認なしに実行してはならない。**
> approval 取得前に commit / push / PR を作らない（厳守）。Claude Code は本仕様書の段階で commit / push / PR を実行しない。**自動実行禁止**。

## 三役ゲート（user 承認 / 実 push / PR 作成）

| ゲート役 | 担当 | 実行条件 |
| --- | --- | --- |
| user 承認ゲート | user | change-summary を提示し、明示的承認を得る |
| 実 push ゲート | Claude Code | user 承認後 + local-check-result 全 PASS 後のみ |
| PR 作成ゲート | Claude Code | push 成功後のみ `gh pr create` を実行 |

## 承認ゲート（approval gate）【最優先 / 必須】

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 10 GO 判定 | `outputs/phase-10/` の GO 判定文書 | 要確認 |
| Phase 11 NON_VISUAL evidence | UT-09 root 実測 / canonical grep / 物理化禁止 grep / drift / link / 直交性 | 要確認 |
| Phase 12 必須 7 成果物 | implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check / main.md が PASS | 要確認 |
| change-summary レビュー | user が PR 内容（spec のみ / 実コードは別 PR）を把握 | **user 承認待ち** |
| 機密情報の非混入 | 実 database_id / 実 API token / 実会員データが diff に無い | 要確認 |
| spec_created 維持確認 | `artifacts.json` の `metadata.workflow_state` が `spec_created` / `docsOnly=true` | 要確認 |
| `apps/api/migrations/` 非混入 | 実 DDL ファイルが本 PR に含まれていないこと | 要確認 |
| `apps/api/src/` 非混入 | アプリコード変更が本 PR に含まれていないこと | 要確認 |
| sourceIssue #333 CLOSED 確認 | Issue は CLOSED 済 → PR 本文は `Refs #333`（`Closes` 禁止） | 要確認 |
| PR 作成実行 | **user の明示的な指示があった場合のみ実行** | **承認待ち** |

> **本ゲートが PASS するまで `git commit` / `git push` / `gh pr create` を一切実行しない**。

## 実行タスク

1. 承認ゲートを通過する（user に change-summary を提示し、明示承認を取得する）。
2. local-check-result（typecheck / lint / verify-indexes / unit / integration）を実行・記録する。
3. change-summary（PR description 草案）を作成する。
4. user 承認後、ブランチ作成 → commit → push → PR 作成を実行する。
5. CI 確認と承認後マージの手順を記録する（マージ実行は user 操作）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/outputs/phase-12/documentation-changelog.md | PR 変更ファイル一覧の根拠 |
| 必須 | docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/outputs/phase-12/system-spec-update-summary.md | Step 1-A diff plan |
| 必須 | docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/outputs/phase-11/main.md | NON_VISUAL evidence サマリー |
| 必須 | docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/index.md | PR タイトル / 説明根拠 |
| 必須 | CLAUDE.md | ブランチ戦略（feature/* → main）/ solo 運用ポリシー |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/ | 親タスク成果物 |
| 参考 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/phase-13.md | PR テンプレ参照 |

## 実行手順

### ステップ 1: 承認ゲート通過（user 承認必須）

1. Phase 10 GO 判定 / Phase 11 NON_VISUAL evidence / Phase 12 必須 7 成果物が PASS していることを確認する。
2. `git status` で `apps/api/migrations/` / `apps/api/src/` / `packages/shared/src/` 配下に変更が無いことを確認する（spec PR の境界遵守）。
3. change-summary を user に提示し、**明示的な承認**を待つ。
4. 承認取得後にステップ 2 へ進む。承認が得られない場合はここで停止する。

> **Claude Code は本仕様書の作成段階では commit / push / PR を行わない。**

### ステップ 2: local-check-result（PR 前ローカル確認）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm indexes:rebuild
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes
mise exec -- pnpm test

# 機密情報 grep
git diff main..HEAD | grep -nE "ya29\.|-----BEGIN PRIVATE|sk-[A-Za-z0-9]{20,}|[0-9a-f]{32}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" || echo "OK: no secrets"

# spec PR 境界 grep
git diff --name-only main..HEAD | grep -E "^(apps/api/migrations/|apps/api/src/|packages/shared/src/)" && echo "BLOCKED: 実コード混入" || echo "OK: spec only"
```

### ステップ 3: change-summary（PR description 草案）

`outputs/phase-13/main.md` に以下構造で記述する。

#### Summary

U-UT01-07-FU01（Issue #333、CLOSED）に基づき、UT-09 同期ジョブ実装タスクの **canonical 名受け皿仕様書** を `docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/` 配下に作成する。canonical 名 `sync_job_logs` / `sync_locks` が UT-09 必須参照および AC に反映されること、`sync_log` を物理テーブル化しないこと、UT-04 / U-UT01-08 / U-UT01-09 との直交性を維持することを spec として整備する。本 PR は spec のみで、実コード変更は後続の UT-09 implementation task で投入する。

#### 主要成果物

- `docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/index.md`
- `phase-01.md` 〜 `phase-13.md`（13 ファイル）
- `artifacts.json`
- `outputs/phase-01/` 〜 `outputs/phase-13/`（特に Phase 11 NON_VISUAL 3 点 + Phase 12 必須 7 ファイル）

#### AC マッピング

| AC | 充足エビデンス |
| --- | --- |
| AC-1: UT-09 実装タスク root の実パス確定 | Phase 11 ステップ 1 ls 結果（または Phase 12 unassigned-task-detection で受け皿 follow-up 化） |
| AC-2: canonical 名 `sync_job_logs` / `sync_locks` が UT-09 必須参照・AC に反映 | Phase 11 ステップ 2 grep 結果 + Phase 12 implementation-guide Part 2 |
| AC-3: `sync_log` 物理テーブル化禁止 | Phase 11 ステップ 3 grep 結果（`CREATE TABLE sync_log` 検出 0） |
| AC-4: U-UT01-08 / U-UT01-09 / UT-04 直交性維持 | Phase 11 ステップ 6 直交性チェック + Phase 12 system-spec-update-summary Step 1-C |

#### 動機

- GitHub Issue: #333（CLOSED）— U-UT01-07-FU01: UT-09 canonical sync job implementation receiver
- 親タスク U-UT01-07 で確定した canonical（`sync_job_logs` / `sync_locks`）を UT-09 実装タスクが二重 ledger を作らずに受け取るための上流前提
- CLAUDE.md 不変条件 #5（D1 直アクセスは `apps/api` に閉じる）の整合確認

#### 含まないファイル（明示）

- `apps/api/migrations/*.sql`（→ UT-04）
- `apps/api/src/**`（→ UT-09 implementation task）
- `packages/shared/src/**`（→ U-10）
- `.claude/skills/aiworkflow-requirements/references/database-schema.md` の実編集（diff plan のみ提示。実適用は別 PR or UT-04 着手時）

### ステップ 4: PR 作成（user 承認後のみ）

```bash
git add docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/ \
        .claude/skills/aiworkflow-requirements/indexes/

git commit -m "$(cat <<'EOF'
docs(u-ut01-07-fu01): UT-09 canonical sync job implementation receiver 仕様書 (Refs #333)

- Phase 1〜13 の仕様書を docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/ に追加
- canonical 名 sync_job_logs / sync_locks の UT-09 受け皿確定 / sync_log 物理化禁止 / 直交性維持を spec として整備
- Phase 12 same-wave sync（aiworkflow indexes + 原典 unassigned status）完了
- workflow_state は spec_created を維持（実コードは UT-09 implementation task で投入）

Refs #333
EOF
)"

git push -u origin feat/issue-333-u-ut01-07-fu01-ut09-canonical-sync-job-receiver-task-spec

gh pr create \
  --title "docs(u-ut01-07-fu01): UT-09 canonical sync job receiver 仕様書 (Refs #333)" \
  --base main \
  --head feat/issue-333-u-ut01-07-fu01-ut09-canonical-sync-job-receiver-task-spec \
  --body "..."
```

## PR テンプレ

| 項目 | 値 |
| --- | --- |
| title | `docs(u-ut01-07-fu01): UT-09 canonical sync job receiver 仕様書 (Refs #333)` |
| base | `main` |
| head | `feat/issue-333-u-ut01-07-fu01-ut09-canonical-sync-job-receiver-task-spec` |
| reviewer | required reviewers=0（solo 運用） |
| labels | `area:docs` / `task:U-UT01-07-FU01` / `wave:1` / `spec-only` |
| linked issue | #333（CLOSED）— `Refs #333`（CLOSED 済のため `Closes` 禁止） |

## 含めるファイル一覧（本ワークフロー配下のみ）

- `docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/` 全体
- `.claude/skills/aiworkflow-requirements/indexes/`（same-wave sync の差分のみ）
- 原典 unassigned doc（存在すれば状態更新差分）

## CI gate 通過条件

| gate | 条件 | 必須 |
| --- | --- | --- |
| typecheck | exit 0 | YES |
| lint | exit 0 | YES |
| verify-indexes-up-to-date | drift なし | YES |
| unit / integration test | 全 PASS | YES |

## pre-merge チェックリスト

- [ ] Phase 12 same-wave sync 完了
- [ ] `metadata.workflow_state = "spec_created"` / `metadata.docsOnly = true`
- [ ] GitHub Issue #333 が PR 本文に `Refs #333` で記載（`Closes` 不使用）
- [ ] `apps/api/migrations/` / `apps/api/src/` / `packages/shared/src/` への変更 0 件
- [ ] 機密情報 grep 0 件
- [ ] CI gate 全 green

## 承認後の自動同期手順（user 操作）

```bash
gh pr checks <PR番号>
gh pr merge <PR番号> --squash --delete-branch
```

- マージ後、`artifacts.json` の `phases[*].status` を `completed` に更新（ただし `metadata.workflow_state` は `spec_created` を維持）。
- 実コード実装は UT-09 implementation task で投入する。

## rollback 戦略

| 状況 | rollback 手順 |
| --- | --- |
| PR merge 後に spec 内容に欠陥発覚 | `git revert <merge-commit-sha>` で spec ファイル群を一括 revert（コード変更を含まないため副作用 0） |
| Phase 12 same-wave sync の indexes 差分のみ問題 | `.claude/skills/aiworkflow-requirements/indexes/` 該当ファイルのみ revert + `pnpm indexes:rebuild` |
| 原典 unassigned doc 状態更新の取り消し | 該当 unassigned doc を `git checkout <prev-sha> -- <file>` で戻す |
| UT-09 implementation task 着手済の場合 | 本仕様書の rollback は UT-09 への影響大のため、原則 forward-fix（追補 PR）で対応 |

## 多角的チェック観点

- 価値性: PR が Issue #333 の receiver 設計成果物（AC-1〜AC-4）を網羅しているか。
- 整合性: change-summary が Phase 12 documentation-changelog と一致しているか。
- 認可境界: コミット差分に database_id 実値 / API token / 実データが混入していないか。
- 境界遵守: `apps/api/migrations/` / `apps/api/src/` への変更が 0 件か。
- Issue 紐付け: sourceIssue #333 が CLOSED のため `Refs #333` を採用、`Closes` を使わないこと。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 承認ゲート通過 | 13 | pending_user_approval | **user 承認なし禁止** |
| 2 | local-check-result | 13 | pending | 全 PASS |
| 3 | 機密情報 grep | 13 | pending | 0 件 |
| 4 | spec PR 境界 grep | 13 | pending | 0 件 |
| 5 | change-summary 作成 | 13 | pending | user 提示用 |
| 6 | branch / commit / push | 13 | pending | 承認後のみ |
| 7 | gh pr create | 13 | pending | base=main / `Refs #333` |
| 8 | CI 確認 | 13 | pending | gh pr checks |
| 9 | マージ手順記録 | 13 | pending | Claude は実行しない |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | local-check-result + change-summary + AC マッピング + rollback 戦略 + 承認ログ |
| メタ | artifacts.json | 全 Phase 状態の更新（merge 後 phases completed / workflow_state は spec_created 維持） |

## 完了条件

- [ ] 承認ゲートの全項目が PASS（user 明示承認を含む）
- [ ] local-check-result が typecheck / lint / verify-indexes / test 全 PASS
- [ ] 機密情報 grep が 0 件
- [ ] `apps/api/migrations/` / `apps/api/src/` / `packages/shared/src/` 混入 grep 0 件
- [ ] PR が作成され Issue #333 に `Refs #333` で紐付いている（`Closes` 不使用）
- [ ] CI 全 green
- [ ] マージ後、`phases[*].status` が `completed` / `metadata.workflow_state` は `spec_created` 維持

## タスク100%実行確認【必須】

- 全実行タスク（9 件）が `pending` / `pending_user_approval`
- 承認ゲートが他のすべての手順より先行する設計
- approval 取得前に commit / push / PR 作成しない方針が明文化されている
- artifacts.json の Phase 13 entry（`phase: 13`）は `status = pending_user_approval`。`user_approval_required` は本 Phase 13 文書で表現し、root `artifacts.json` には追加しない。
- `metadata.workflow_state = "spec_created"` / `metadata.docsOnly = true` 維持
- sourceIssue #333 が CLOSED 済のため `Refs #333` 採用 / `Closes` 禁止が明記

## 次 Phase

- 次: なし
- 引き継ぎ事項:
  - canonical name（`sync_job_logs` / `sync_locks`）を **下流 UT-09 implementation task** が実装で参照
  - **直交 U-UT01-08 / U-UT01-09 / UT-04** に enum / retry / migration の決定を委譲
  - rollback 発生時は `git revert <merge-commit-sha>` で spec ファイルを一括戻し
- ブロック条件:
  - user 承認が無い場合は PR 作成・push を一切実行しない
  - local-check-result のいずれかが FAIL
  - 機密情報 grep で 1 件以上検出
  - `apps/api/migrations/` / `apps/api/src/` への変更が混入
  - PR 本文に `Closes #333` が誤って記載されている（CLOSED Issue のため `Refs` のみ許容）
