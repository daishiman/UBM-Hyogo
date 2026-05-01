# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `sync_log` 論理名と既存 `sync_job_logs` / `sync_locks` の整合（U-UT01-07） |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-30 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了 / 後続実装は UT-04 / UT-09） |
| 状態 | pending_user_approval |
| タスク分類 | docs-only-design-reconciliation（spec PR / approval gate） |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created（PR merge 後も spec 段階のため `spec_created` を維持） |
| user_approval_required | **true** |
| ブランチ | `feat/issue-261-u-ut01-07-sync-log-naming-reconciliation-task-spec` |
| ベース | `main` |

## 目的

Phase 1〜12 の成果物（命名 reconciliation 設計 / マッピング表 / 後方互換戦略 / UT-04・UT-09 引き継ぎ事項 / NON_VISUAL evidence / docs sync）をまとめて PR を作成し、ユーザーの明示的な承認を経てレビュー → マージへ進める。本 PR は **タスク仕様書のみ**（`docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/` 配下）を対象とし、`apps/api/migrations/*.sql` などの実 DDL / コード変更は本 PR に含めない。

> **重要: このフェーズは user の明示的な承認なしに実行してはならない。**
> approval 取得前に commit / push / PR を作らない（厳守）。Claude Code は本仕様書の段階で commit / push / PR を実行しない。**自動実行禁止**。

## 承認ゲート（approval gate）【最優先 / 必須】

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 10 GO 判定 | `outputs/phase-10/` の GO 判定文書 | 要確認 |
| Phase 11 NON_VISUAL evidence | 自動テスト名 / 件数・スクリーンショットを作らない理由が明記 | 要確認 |
| Phase 12 必須 7 成果物 | implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report が PASS | 要確認 |
| change-summary レビュー | user が PR 内容（spec のみ / 実 DDL は別 PR）を把握 | **user 承認待ち** |
| 機密情報の非混入 | 実 database_id / 実 API token / 実会員データが diff に無い | 要確認 |
| spec_created 維持確認 | `artifacts.json` の `metadata.workflow_state` が `spec_created` / `docsOnly=true` | 要確認 |
| `apps/api/migrations/` 非混入 | 実 DDL ファイルが本 PR に含まれていないこと | 要確認 |
| `apps/api/src/` 非混入 | アプリコード変更が本 PR に含まれていないこと | 要確認 |
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
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-12/documentation-changelog.md | PR 変更ファイル一覧の根拠 |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-12/system-spec-update-summary.md | Step 1-A diff plan |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-11/main.md | NON_VISUAL evidence サマリー |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/index.md | PR タイトル / 説明根拠 |
| 必須 | CLAUDE.md | ブランチ戦略（feature/* → main）/ solo 運用ポリシー |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-07-sync-log-naming-reconciliation.md | 原典 / 完了条件 |
| 参考 | docs/30-workflows/ut-04-d1-schema-design/phase-13.md | PR テンプレ参照 |

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

#### 概要

U-UT01-07 に基づき、論理名 `sync_log`（UT-01 Phase 2 設計）と既存物理 `sync_job_logs` / `sync_locks`（`apps/api/migrations/0002_sync_logs_locks.sql` で稼働中）の **命名 reconciliation 設計タスク仕様書** を `docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/` 配下に作成する。本 PR は spec のみで、物理 DDL・コード変更は後続の UT-04 / UT-09 で投入する。

#### 動機

- GitHub Issue: #261 — U-UT01-07: `sync_log` 論理名と既存 `sync_job_logs` / `sync_locks` の整合
- UT-04（D1 スキーマ設計）/ UT-09（Sheets→D1 同期ジョブ）が二重 ledger を作らないための上流前提として canonical 名・マッピング・migration 戦略が必須
- CLAUDE.md 不変条件 #5（D1 直アクセスは `apps/api` に閉じる）の整合確認

#### 変更内容

**新規ファイル一覧（spec のみ）**:

- `docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/index.md`
- `docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/phase-01.md` 〜 `phase-13.md`
- `docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/artifacts.json`
- `docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-01/` 〜 `outputs/phase-13/`

**修正ファイル一覧（Phase 12 same-wave sync 起因 / 該当する場合）**:

- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json`
- `docs/30-workflows/unassigned-task/U-UT01-07-sync-log-naming-reconciliation.md`（状態を `spec_created` に更新）

**含まないファイル（明示）**:

- `apps/api/migrations/*.sql`（→ UT-04）
- `apps/api/src/**`（→ UT-09）
- `packages/shared/src/**`（→ U-10）
- `.claude/skills/aiworkflow-requirements/references/database-schema.md` の実編集（diff plan のみ提示。実適用は別 PR or UT-04 着手時）

### ステップ 4: PR 作成（user 承認後のみ）

```bash
# 必要なファイルを明示的に add
git add docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/ \
        docs/30-workflows/unassigned-task/U-UT01-07-sync-log-naming-reconciliation.md \
        .claude/skills/aiworkflow-requirements/indexes/

git commit -m "$(cat <<'EOF'
docs(u-ut01-07): sync_log 命名 reconciliation 設計タスク仕様書 (Issue #261)

- Phase 1〜13 の仕様書を docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/ に追加
- canonical 命名 / 論理→物理マッピング / 後方互換戦略 / UT-04・UT-09 引き継ぎ を spec として整備
- Phase 12 same-wave sync（aiworkflow indexes + 原典 unassigned status）完了
- workflow_state は spec_created を維持（実 DDL は UT-04、実コードは UT-09 で投入）

Refs #261
EOF
)"

git push -u origin feat/issue-261-u-ut01-07-sync-log-naming-reconciliation-task-spec

gh pr create \
  --title "docs(u-ut01-07): sync_log 命名 reconciliation 設計タスク仕様書 (Issue #261)" \
  --base main \
  --head feat/issue-261-u-ut01-07-sync-log-naming-reconciliation-task-spec \
  --body "..."
```

## PR テンプレ

| 項目 | 値 |
| --- | --- |
| title | `docs(u-ut01-07): sync_log 命名 reconciliation 設計タスク仕様書 (Issue #261)` |
| base | `main` |
| head | `feat/issue-261-u-ut01-07-sync-log-naming-reconciliation-task-spec` |
| reviewer | required reviewers=0（solo 運用） |
| labels | `area:docs` / `task:U-UT01-07` / `wave:1` / `spec-only` |
| linked issue | #261（CLOSED）— `Refs #261`（spec PR のため Closes は使わない） |

## 含めるファイル一覧（本ワークフロー配下のみ）

- `docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/` 全体
- `docs/30-workflows/unassigned-task/U-UT01-07-sync-log-naming-reconciliation.md`（状態更新）
- `.claude/skills/aiworkflow-requirements/indexes/`（same-wave sync の差分のみ）

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
- [ ] GitHub Issue #261 が PR 本文に `Refs #261` で記載
- [ ] `apps/api/migrations/` / `apps/api/src/` / `packages/shared/src/` への変更 0 件
- [ ] 機密情報 grep 0 件
- [ ] CI gate 全 green

## 承認後の自動同期手順（user 操作）

```bash
gh pr checks <PR番号>
gh pr merge <PR番号> --squash --delete-branch
```

- マージ後、`artifacts.json` の `phases[*].status` を `completed` に更新（ただし `metadata.workflow_state` は `spec_created` を維持）。
- 実 DDL / コード実装は UT-04 / UT-09 で投入する。

## 多角的チェック観点

- 価値性: PR が Issue #261 の reconciliation 設計成果物を網羅しているか。
- 整合性: change-summary が Phase 12 documentation-changelog と一致しているか。
- 認可境界: コミット差分に database_id 実値 / API token / 実データが混入していないか。
- 境界遵守: `apps/api/migrations/` / `apps/api/src/` への変更が 0 件か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 承認ゲート通過 | 13 | pending_user_approval | **user 承認なし禁止** |
| 2 | local-check-result | 13 | pending | 全 PASS |
| 3 | 機密情報 grep | 13 | pending | 0 件 |
| 4 | spec PR 境界 grep | 13 | pending | 0 件 |
| 5 | change-summary 作成 | 13 | pending | user 提示用 |
| 6 | branch / commit / push | 13 | pending | 承認後のみ |
| 7 | gh pr create | 13 | pending | base=main |
| 8 | CI 確認 | 13 | pending | gh pr checks |
| 9 | マージ手順記録 | 13 | pending | Claude は実行しない |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | local-check-result + change-summary + 承認ログ |
| メタ | artifacts.json | 全 Phase 状態の更新（merge 後 phases completed / workflow_state は spec_created 維持） |

## 完了条件

- [ ] 承認ゲートの全項目が PASS（user 明示承認を含む）
- [ ] local-check-result が typecheck / lint / verify-indexes / test 全 PASS
- [ ] 機密情報 grep が 0 件
- [ ] `apps/api/migrations/` / `apps/api/src/` / `packages/shared/src/` 混入 grep 0 件
- [ ] PR が作成され Issue #261 に紐付いている（`Refs #261`）
- [ ] CI 全 green
- [ ] マージ後、`phases[*].status` が `completed` / `metadata.workflow_state` は `spec_created` 維持

## タスク100%実行確認【必須】

- 全実行タスク（9 件）が `pending` / `pending_user_approval`
- 承認ゲートが他のすべての手順より先行する設計
- approval 取得前に commit / push / PR 作成しない方針が明文化されている
- artifacts.json の `phases[12].user_approval_required = true` / `status = pending_user_approval`
- `metadata.workflow_state = "spec_created"` / `metadata.docsOnly = true` 維持

## 次 Phase

- 次: なし
- 引き継ぎ事項:
  - canonical name / マッピング / 後方互換戦略を **下流 UT-04** が migration 計画として継承
  - canonical name を **下流 UT-09** が実装で参照
  - **直交 U-UT01-08 / U-UT01-09** に enum / retry 値の決定を委譲
- ブロック条件:
  - user 承認が無い場合は PR 作成・push を一切実行しない
  - local-check-result のいずれかが FAIL
  - 機密情報 grep で 1 件以上検出
  - `apps/api/migrations/` / `apps/api/src/` への変更が混入
