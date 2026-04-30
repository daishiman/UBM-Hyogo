# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 データスキーマ設計 (UT-04) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-29 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了 / 後続実装は別タスク） |
| 状態 | pending_user_approval |
| タスク分類 | implementation（spec PR / approval gate） |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created（PR merge 後も spec 段階のため `spec_created` を維持） |
| user_approval_required | **true** |
| ブランチ | `feat/issue-53-ut-04-d1-schema-design-task-spec` |
| ベース | `main` |

## 目的

Phase 1〜12 の成果物（D1 schema 設計仕様書 13 Phase / mapping / migration runbook / docs sync）をまとめて PR を作成し、ユーザーの明示的な承認を経てレビュー → マージへ進める。本 PR は **タスク仕様書のみ**（`docs/30-workflows/ut-04-d1-schema-design/` 配下）を対象とし、`apps/api/migrations/*.sql` などの実 DDL コードは本 PR に含めない。承認ゲート前のいかなる commit / push / PR 作成も禁止し、approval を取得して初めて自動同期手順へ進む。

> **重要: このフェーズは user の明示的な承認なしに実行してはならない。**
> approval 取得前に commit / push / PR を作らない（厳守）。Claude Code は本仕様書の段階で commit / push / PR を実行しない。

## 承認ゲート（approval gate）【最優先 / 必須】

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 10 GO 判定 | `outputs/phase-10/go-no-go.md` が GO | 要確認 |
| Phase 11 NON_VISUAL evidence | 自動テスト名 / 件数・スクリーンショットを作らない理由が明記 | 要確認 |
| Phase 12 compliance check | 必須 6 ファイル PASS / workflow_state=spec_created 維持 | 要確認 |
| validate / verify スクリプト | exit code 0 | 要確認 |
| change-summary レビュー | user が PR 内容（spec のみ / 実 DDL は別 PR）を把握 | **user 承認待ち** |
| 機密情報の非混入 | 実 database_id / 実 API token / 実会員データが diff に無い | 要確認 |
| spec_created 維持確認 | `artifacts.json` の `metadata.workflow_state` が `spec_created` / `docsOnly=true` | 要確認 |
| `apps/api/migrations/` 非混入 | 実 DDL ファイルが本 PR に含まれていないこと | 要確認 |
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
| 必須 | docs/30-workflows/ut-04-d1-schema-design/outputs/phase-12/documentation-changelog.md | PR 変更ファイル一覧の根拠 |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/outputs/phase-12/phase12-task-spec-compliance-check.md | 承認ゲート前提 |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/outputs/phase-11/main.md | NON_VISUAL evidence サマリー |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/outputs/phase-10/go-no-go.md | GO 判定 |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/index.md | PR タイトル / 説明根拠 |
| 必須 | CLAUDE.md | ブランチ戦略（feature/* → main）/ solo 運用ポリシー |
| 必須 | docs/30-workflows/unassigned-task/UT-04-d1-schema-design.md | 原典 / 完了条件 |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-13.md | PR テンプレ参照 |

## 実行手順

### ステップ 1: 承認ゲート通過（user 承認必須）

1. Phase 10 GO 判定 / Phase 11 NON_VISUAL evidence / Phase 12 compliance check が PASS していることを確認する。
2. 本 worktree に存在する検証手段で ledger / 参照整合を確認する。
3. `git status` で `apps/api/migrations/` 配下に変更が無いことを確認する（spec PR の境界遵守）。
4. change-summary を user に提示し、**明示的な承認**を待つ。
5. 承認取得後にステップ 2 へ進む。承認が得られない場合はここで停止し、指摘事項を Phase 5 / 11 / 12 に差し戻す。

> **Claude Code は本仕様書の作成段階では commit / push / PR を行わない。** approval 後の実行段階でのみ以下を行う。

### ステップ 2: local-check-result（PR 前ローカル確認）

```bash
# 型チェック
mise exec -- pnpm typecheck

# Lint
mise exec -- pnpm lint

# Indexes drift 検証（CI verify-indexes と同等）
mise exec -- pnpm indexes:rebuild
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes

# 単体テスト
mise exec -- pnpm test

# 機密情報 grep（.env / token / database_id 実値の混入チェック）
git diff main..HEAD | grep -nE "ya29\.|-----BEGIN PRIVATE|sk-[A-Za-z0-9]{20,}|[0-9a-f]{32}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" || echo "OK: no secrets"

# 実 DDL ファイル混入チェック（spec PR 境界）
git diff --name-only main..HEAD | grep -E "^apps/api/migrations/" && echo "BLOCKED: migration混入" || echo "OK: spec only"
```

| チェック項目 | 期待値 | 記録先 |
| --- | --- | --- |
| typecheck | exit 0 | outputs/phase-13/main.md §local-check |
| lint | exit 0 | 同上 |
| verify-indexes | drift 0 | 同上 |
| test (unit / integration) | 全 PASS | 同上 |
| `git status` で意図せぬ変更が無い | clean | 同上 |
| 機密情報 grep | 0 件 | 同上 |
| `apps/api/migrations/` 混入 | 0 件 | 同上 |

### ステップ 3: change-summary（PR description 草案）

`outputs/phase-13/main.md` および `outputs/phase-13/pr-template.md` に以下構造で記述する。

#### 概要

UT-04 に基づき、Cloudflare D1 の初期スキーマ設計（テーブル定義 / インデックス / 制約 / Sheets→D1 マッピング表 / migration runbook）の **タスク仕様書** を `docs/30-workflows/ut-04-d1-schema-design/` 配下に作成する。本 PR は spec のみで、`apps/api/migrations/*.sql` の実 DDL は後続の実装 PR で投入する。

#### 動機

- GitHub Issue: #53 — UT-04: D1 データスキーマ設計
- UT-09（Sheets→D1 同期ジョブ）/ UT-06（本番デプロイ）/ UT-21 の上流前提として schema 確定が必須
- CLAUDE.md 不変条件 #5（D1 直アクセスは `apps/api` に閉じる）の前提となる正本 schema を整備

#### 変更内容

**新規ファイル一覧（spec のみ）**:

- `docs/30-workflows/ut-04-d1-schema-design/index.md`
- `docs/30-workflows/ut-04-d1-schema-design/phase-01.md` 〜 `phase-13.md`（13 Phase）
- `docs/30-workflows/ut-04-d1-schema-design/artifacts.json`
- `docs/30-workflows/ut-04-d1-schema-design/outputs/phase-01/` 〜 `outputs/phase-13/`（各 Phase 成果物）
- `docs/30-workflows/ut-04-d1-schema-design/outputs/artifacts.json`

**修正ファイル一覧（Phase 12 same-wave sync 起因）**:

- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（UT-04 workflow 導線追加）
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（workflow inventory 追加）
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（UT-04 spec sync root 追加）
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json`（索引再生成）
- `docs/30-workflows/unassigned-task/UT-04-d1-schema-design.md`（状態を `spec_created` に更新）

**含まないファイル（明示）**:

- `apps/api/migrations/*.sql`（実 DDL は別 PR）
- `apps/api/src/**`（schema を利用するアプリコードは別 PR）
- `packages/shared/src/zod/*`（型生成は別 PR）

#### 動作確認

- Phase 11 NON_VISUAL evidence: 自動テスト件数 / 採取証跡パスを `outputs/phase-11/main.md` から転記
- typecheck / lint / verify-indexes / unit / integration: 全 PASS（local-check-result 記録）
- 機密情報 grep: 0 件
- spec PR 境界 grep（`apps/api/migrations/` 混入チェック）: 0 件

#### リスク・後方互換性

- **破壊的変更なし**（spec ドキュメントのみの追加）
- 実 DDL 適用は別 PR / 別タスクで行うため、本 PR が merge されても production D1 への影響は無い
- skill references の DDL 反映は **正本仕様の予告**であり、実装が追従しない期間を Phase 12 changelog に明記済み

#### workflow_state 維持の確認

- `artifacts.json` の `metadata.workflow_state = "spec_created"` / `metadata.docsOnly = true` を merge 後も維持する（phase-12-pitfalls.md「設計タスクの workflow root を completed にしてしまう」漏れパターン回避）
- 本 PR は spec 境界のため、`apps/api/migrations/*.sql` の実 DDL は含めない。
- 実装 PR で migration が merge された段階で初めて `workflow_state = implementation_ready` → `implemented` に昇格させる

### ステップ 4: PR 作成（user 承認後のみ）

```bash
# 現在のブランチが feat/issue-53-ut-04-d1-schema-design-task-spec であることを確認
git status
git branch --show-current

# 必要なファイルを明示的に add（git add . / git add -A は使わない）
git add docs/30-workflows/ut-04-d1-schema-design/ \
        docs/30-workflows/unassigned-task/UT-04-d1-schema-design.md \
        docs/30-workflows/unassigned-task/task-ut-04-seed-data-runbook.md \
        docs/30-workflows/unassigned-task/task-ut-04-shared-zod-codegen.md \
        docs/30-workflows/unassigned-task/task-ut-04-sync-ledger-transition-plan.md \
        docs/30-workflows/unassigned-task/task-ut-09-member-responses-table-name-drift.md \
        .claude/skills/aiworkflow-requirements/indexes/topic-map.md \
        .claude/skills/aiworkflow-requirements/indexes/resource-map.md \
        .claude/skills/aiworkflow-requirements/indexes/quick-reference.md \
        .claude/skills/aiworkflow-requirements/indexes/keywords.json

# コミット
git commit -m "$(cat <<'EOF'
docs(ut-04): D1 データスキーマ設計タスク仕様書 (Issue #53)

- Phase 1〜13 の仕様書を docs/30-workflows/ut-04-d1-schema-design/ に追加
- DDL / マッピング / migration runbook / NON_VISUAL evidence を spec として整備
- Phase 12 same-wave sync（aiworkflow indexes + 原典 unassigned status）完了
- workflow_state は spec_created を維持（実 DDL は後続実装 PR で投入）

Refs #53
EOF
)"

# push
git push -u origin feat/issue-53-ut-04-d1-schema-design-task-spec

# PR 作成（base=main / head=feat ブランチ、solo 運用ポリシー: required reviewers=0、CI gate のみで保護）
gh pr create \
  --title "docs(ut-04): D1 データスキーマ設計タスク仕様書 (Issue #53)" \
  --base main \
  --head feat/issue-53-ut-04-d1-schema-design-task-spec \
  --body "$(cat <<'EOF'
## 概要
UT-04 に基づき、Cloudflare D1 の初期スキーマ設計（テーブル / インデックス / 制約 / Sheets→D1 マッピング / migration runbook）のタスク仕様書を整備します。本 PR は spec のみで、apps/api/migrations/*.sql の実 DDL は後続の実装 PR で投入します。

## 動機
- GitHub Issue: #53（UT-04: D1 データスキーマ設計）
- UT-09 / UT-06 / UT-21 の上流前提として schema 確定が必須
- CLAUDE.md 不変条件 #5（D1 直アクセスは apps/api に閉じる）の前提整備

## 変更内容
- 新規: docs/30-workflows/ut-04-d1-schema-design/（13 Phase + index + artifacts.json + outputs/）
- 同期: .claude/skills/aiworkflow-requirements/references/database-schema.md / deployment-cloudflare.md / topic-map.md
- 同期: aiworkflow indexes + 原典 unassigned status（same-wave sync）
- 更新: docs/30-workflows/unassigned-task/UT-04-d1-schema-design.md の状態を spec_created に変更

## 含まないもの（明示）
- apps/api/migrations/*.sql（実 DDL は別 PR）
- apps/api/src/**（アプリコードは別 PR）
- packages/shared/src/zod/*（型生成は別 PR）

## 動作確認
- typecheck / lint / verify-indexes / unit / integration: 全 PASS
- Phase 11 NON_VISUAL evidence 採取済（自動テスト / docs-only smoke）
- 機密情報 grep: 0 件
- spec PR 境界 grep（apps/api/migrations/ 混入）: 0 件

## リスク・後方互換性
- 破壊的変更なし（spec ドキュメントのみ）
- production D1 への影響なし
- workflow_state は spec_created を維持

## 関連 Issue
Refs #53
EOF
)"
```

## PR テンプレ

| 項目 | 値 |
| --- | --- |
| title | `docs(ut-04): D1 データスキーマ設計タスク仕様書 (Issue #53)` |
| body | 概要 / 動機 / 変更内容 / 含まないもの / 動作確認 / リスク・後方互換性 / 関連 Issue（上記参照） |
| base | `main`（solo 運用 / `feature/* → main` 直 PR、CLAUDE.md ブランチ戦略・solo ポリシー準拠） |
| head | `feat/issue-53-ut-04-d1-schema-design-task-spec` |
| reviewer | required reviewers=0（solo 運用 / CI gate のみで保護） |
| labels | `area:docs` / `task:UT-04` / `wave:1` / `spec-only` |
| linked issue | #53（`Refs #53`、実 DDL 実装 PR で `Closes #53` に切り替え） |

## CI gate 通過条件

| gate | 条件 | 必須 |
| --- | --- | --- |
| typecheck | exit 0 | YES |
| lint | exit 0 | YES |
| verify-indexes-up-to-date | `.claude/skills/aiworkflow-requirements/indexes` に drift なし | YES |
| unit test | 全 PASS | YES |
| integration test | 全 PASS | YES |
| codeowners 構文 | `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` が `{"errors":[]}` | 参考 |

## pre-merge チェックリスト

- [ ] Phase 12 same-wave sync が完了（aiworkflow indexes + 原典 unassigned status）
- [ ] root `artifacts.json` と `outputs/artifacts.json` が parity（drift 0）
- [ ] `metadata.workflow_state = "spec_created"` / `metadata.docsOnly = true`
- [ ] GitHub Issue #53 が PR 本文に `Refs #53` で記載
- [ ] `apps/api/migrations/` 配下の変更が 0 件（spec PR 境界遵守）
- [ ] 機密情報 grep 0 件
- [ ] CI gate（typecheck / lint / verify-indexes / unit / integration）全 green
- [ ] Phase 11 NON_VISUAL evidence のメタ情報（自動テスト名 / 件数 / 撮影しない理由）が PR 本文から辿れる
- [ ] Phase 12 phase12-task-spec-compliance-check の PASS 判定 link
- [ ] CLAUDE.md「Cloudflare 系 CLI 実行ルール」（`scripts/cf.sh` 経由 / `wrangler` 直呼び禁止）が migration runbook に反映されている

## 承認後の自動同期手順（user 操作）

PR 作成後の以下は **user の操作領域** とし、Claude は実行しない（指示があれば補助コマンドの提示のみ）。

```bash
# CI 確認
gh pr checks <PR番号>

# user による承認後のマージ（user 操作）
gh pr merge <PR番号> --squash --delete-branch
```

- マージ後、`artifacts.json` の `phases[*].status` を `completed` に更新（ただし `metadata.workflow_state` は `spec_created` を維持）。
- 実 DDL 実装は後続タスク（別 PR）で `apps/api/migrations/*.sql` を投入し、その PR で `Closes #53` を行う。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO 判定を承認ゲートの前提として再利用 |
| Phase 11 | NON_VISUAL evidence を PR の動作確認セクションに転記 |
| Phase 12 | documentation-changelog から変更ファイルリストを生成 |

## 多角的チェック観点

- 価値性: PR が Issue #53 の spec 段階成果物を網羅しているか。
- 実現性: local-check-result が typecheck / lint / verify-indexes / test すべて PASS か。
- 整合性: change-summary が Phase 12 documentation-changelog と一致しているか。
- 運用性: PR description が後続実装 PR 担当者に必要十分な情報を含むか。
- 認可境界: コミット差分に database_id 実値 / API token / 実会員データが混入していないか（grep）。
- 後方互換性: spec のみで実コード変更がないことを diff レビューで再確認したか。
- 境界遵守: `apps/api/migrations/` への変更が 0 件であることを `git diff --name-only` で確認したか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 承認ゲート通過 | 13 | spec_created | **user 承認なし禁止** |
| 2 | local-check-result（typecheck/lint/verify-indexes/test） | 13 | spec_created | 全 PASS |
| 3 | 機密情報 grep | 13 | spec_created | 0 件 |
| 4 | spec PR 境界 grep（migrations/ 混入） | 13 | spec_created | 0 件 |
| 5 | change-summary 作成 | 13 | spec_created | user 提示用 |
| 6 | branch / commit / push | 13 | spec_created | 承認後のみ |
| 7 | gh pr create | 13 | spec_created | base=main / head=feat/issue-53-... |
| 8 | CI 確認 | 13 | spec_created | gh pr checks |
| 9 | マージ手順記録（user 操作） | 13 | spec_created | Claude は実行しない |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | local-check-result + change-summary + 承認ログ |
| テンプレ | outputs/phase-13/pr-template.md | PR title / body テンプレと CI gate 一覧 |
| 結果 | outputs/phase-13/pr-info.md | PR 作成後の URL / CI 結果（承認後のみ） |
| 結果 | outputs/phase-13/pr-creation-result.md | PR 作成プロセスの実行ログ（承認後のみ） |
| PR | user 承認後に作成 | UT-04 spec PR（Issue #53 Refs） |
| メタ | artifacts.json | 全 Phase 状態の更新（merge 後 phases completed / workflow_state は spec_created 維持） |

## 完了条件

- [ ] 承認ゲートの全項目が PASS（user 明示承認を含む）
- [ ] local-check-result が typecheck / lint / verify-indexes / test 全 PASS
- [ ] 機密情報 grep が 0 件
- [ ] `apps/api/migrations/` 混入 grep が 0 件
- [ ] change-summary が PR body と一致している
- [ ] PR が作成され Issue #53 に紐付いている（`Refs #53`）
- [ ] CI（`gh pr checks`）が green
- [ ] solo 運用ポリシーに従い required reviewers=0 / CI gate で保護されている
- [ ] マージ後、`phases[*].status` が `completed` / `metadata.workflow_state` は `spec_created` 維持

## タスク100%実行確認【必須】

- 全実行タスク（9 件）が `spec_created`
- 承認ゲートが他のすべての手順より先行する設計
- approval 取得前に commit / push / PR 作成しない方針が明文化されている
- マージ操作は user の領域として明確に分離されている
- artifacts.json の `phases[12].user_approval_required = true`、`status = spec_created`
- `metadata.workflow_state = "spec_created"` / `metadata.docsOnly = true` 維持

## 次 Phase

- 次: なし（タスク完了 / 後続は別タスクの実装 PR）
- 引き継ぎ事項:
  - 実 DDL（`apps/api/migrations/0001_init.sql` 等）は後続実装 PR で投入し、その PR で `Closes #53`
  - UT-09（Sheets→D1 同期ジョブ）/ UT-06（本番デプロイ）/ UT-21 への上流条件 fulfilled を伝達
  - artifacts.json の `phases[*].status` を `completed` に更新（user マージ後）。`metadata.workflow_state` は `spec_created` を維持
- ブロック条件:
  - user 承認が無い場合は PR 作成・push を一切実行しない
  - local-check-result のいずれかが FAIL（→ Phase 5 / 11 / 12 へ差し戻し）
  - 機密情報 grep で 1 件以上検出（→ 即時停止 / Phase 12 secret hygiene 再確認）
  - `apps/api/migrations/` への変更が混入（→ 即時停止 / spec PR 境界違反）
