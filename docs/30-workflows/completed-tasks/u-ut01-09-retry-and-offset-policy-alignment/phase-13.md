# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | retry 回数と offset resume 方針の統一 (U-UT01-09) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-30 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了 / 後続実装は UT-09 追補） |
| 状態 | pending_user_approval |
| タスク分類 | docs-only / NON_VISUAL / spec_created（approval-gated NON_VISUAL implementation pattern） |
| visualEvidence | NON_VISUAL |
| workflow_state | **spec_created**（merge 後も spec 段階のため `spec_created` を維持） |
| user_approval_required | **true** |
| GitHub Issue | **#263 (CLOSED)** — `Refs #263` 採用 / `Closes` 禁止 |
| ブランチ | `feat/u-ut01-09-retry-and-offset-policy-alignment` |
| ベース | `main`（solo 運用 / `feature/* → main` 直 PR、CLAUDE.md ブランチ戦略準拠） |

## 目的

Phase 1〜12 の成果物（canonical retry / backoff / `processed_offset` 採否 / migration 影響評価 / quota 算定 / NON_VISUAL evidence / docs sync）をまとめて PR を作成し、ユーザーの **明示的な承認** を経てレビュー → マージへ進める。本 PR は **タスク仕様書のみ**（`docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/` 配下 + same-wave sync 起因の indexes 更新 + 起票元 unassigned 仕様の更新）を対象とし、`apps/api/migrations/*.sql` / `apps/api/src/jobs/sync-sheets-to-d1.ts` 等の実コード / migration は本 PR に含めない。Issue #263 は CLOSED のまま据え置き、PR 本文では `Refs #263` を採用する（`Closes` 禁止）。

> **重要: このフェーズは user の明示的な承認なしに実行してはならない。**
> approval 取得前に commit / push / PR を作らない（厳守）。Claude Code は本仕様書の作成段階で commit / push / PR を実行しない。

## approval-gated NON_VISUAL implementation pattern（三役ゲート）

本 Phase は `phase-template-phase13.md` の approval-gated NON_VISUAL pattern に準拠し、以下 3 ゲートを順序付きで通過する。

| 役 | ゲート | 通過条件 |
| --- | --- | --- |
| 役1: user 承認 | change-summary を提示し明示承認を取得 | user の明示的な「承認 / GO」発話 |
| 役2: 実 push | local-check 全 PASS + 機密情報 0 件 + spec 境界 0 件混入を確認後、5 単位コミットで push | typecheck / lint / verify-indexes / 全テスト PASS、grep 0 件 |
| 役3: PR 作成 | `gh pr create` で PR body テンプレを適用 | base=main / head=feat/u-ut01-09-... / `Refs #263` 採用 |

> 役1 が PASS するまで役2・役3 は実行禁止。Claude Code は本仕様書の段階で `git commit` / `git push` / `gh pr create` を一切実行しない。

## 承認ゲート（approval gate）【最優先 / 必須】

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 10 GO 判定 | `outputs/phase-10/go-no-go.md` が GO | 要確認 |
| Phase 11 NON_VISUAL evidence | 観点 A/B/C 全 PASS / 固定文言「UI/UX変更なしのため Phase 11 スクリーンショット不要」記載 | 要確認 |
| Phase 12 compliance check | 必須 7 ファイル PASS / workflow_state=spec_created 維持 / Issue CLOSED 維持 | 要確認 |
| 機密情報の非混入 | 実 database_id / 実 API token / 実会員データが diff に無い | 要確認 |
| spec PR 境界 | `apps/api/migrations/` / `apps/api/src/jobs/sync-sheets-to-d1.ts` への変更が 0 件 | 要確認 |
| spec_created 維持 | `metadata.workflow_state = "spec_created"` / `metadata.docsOnly = true` / `metadata.github_issue_state = "CLOSED"` | 要確認 |
| change-summary レビュー | user が PR 内容（spec のみ / 実コード反映は UT-09 追補）を把握 | **user 承認待ち** |
| PR 作成実行 | **user の明示的な指示があった場合のみ実行** | **承認待ち** |
| rollback payload 上書き禁止 | 既存の rollback / migration payload を本 PR で書き換えていない | 要確認 |

> **本ゲートが PASS するまで `git commit` / `git push` / `gh pr create` を一切実行しない**。

## 実行タスク

- [ ] Task 13-1: 承認ゲート全項目を確認し、user に change-summary を提示して **明示承認** を取得する。
- [ ] Task 13-2: local-check-result（typecheck / lint / verify-indexes / unit / integration）を実行・記録する。
- [ ] Task 13-3: 機密情報 grep / spec PR 境界 grep（`apps/api/migrations/` / `apps/api/src/jobs/sync-sheets-to-d1.ts`）/ rollback payload 上書きチェックを実行する。
- [ ] Task 13-4: change-summary（PR description 草案）を `outputs/phase-13/main.md` および `outputs/phase-13/pr-template.md` に作成する。
- [ ] Task 13-5: user 承認後、ブランチ作成 → **5 単位コミット** → push → PR 作成を実行する。
- [ ] Task 13-6: CI（`gh pr checks`）を確認し、全 green を `outputs/phase-13/pr-info.md` / `pr-creation-result.md` に記録する。
- [ ] Task 13-7: マージ実行は user 操作領域として明確に分離し、Claude は補助コマンド提示のみ行う。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-12/documentation-changelog.md | PR 変更ファイル一覧の根拠 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-12/phase12-task-spec-compliance-check.md | 承認ゲート前提 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-11/main.md | NON_VISUAL evidence サマリ |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-10/go-no-go.md | GO 判定 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/index.md | PR タイトル / 説明根拠 |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md | 起票元 / 完了条件 |
| 必須 | CLAUDE.md | ブランチ戦略 / solo 運用ポリシー / scripts/cf.sh ルール |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase13.md | approval-gated NON_VISUAL implementation pattern |
| 参考 | docs/30-workflows/ut-04-d1-schema-design/phase-13.md | spec PR 境界 / approval ゲート構造リファレンス |

## 実行手順

### ステップ 1: 承認ゲート通過（user 承認必須）

1. Phase 10 GO 判定 / Phase 11 NON_VISUAL evidence / Phase 12 compliance check が PASS していることを確認する。
2. 二重 ledger parity を `jq` で確認する。
3. `git status` で `apps/api/migrations/` / `apps/api/src/jobs/sync-sheets-to-d1.ts` 配下に変更が無いことを確認する（spec PR 境界遵守）。
4. Issue #263 が CLOSED のまま据え置かれていることを `gh issue view 263 --json state` で確認する。
5. change-summary を user に提示し、**明示的な承認**を待つ。
6. 承認取得後にステップ 2 へ進む。承認が得られない場合はここで停止し、指摘事項を Phase 5 / 11 / 12 に差し戻す。

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

# 単体 / 統合テスト
mise exec -- pnpm test

# 機密情報 grep（.env / token / database_id 実値の混入チェック）
git diff main..HEAD | grep -nE "ya29\.|-----BEGIN PRIVATE|sk-[A-Za-z0-9]{20,}|[0-9a-f]{32}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" || echo "OK: no secrets"

# spec PR 境界 grep（実コード / migration 混入チェック）
git diff --name-only main..HEAD | grep -E "^apps/api/migrations/|^apps/api/src/jobs/sync-sheets-to-d1\.ts$" \
  && echo "BLOCKED: 実コード / migration 混入" || echo "OK: spec only"

# rollback payload 上書きチェック（既存 migration の payload 書き換え禁止）
git diff main..HEAD -- apps/api/migrations/ | grep -E "^[+-]" || echo "OK: no migration diff"
```

| チェック項目 | 期待値 | 記録先 |
| --- | --- | --- |
| typecheck | exit 0 | outputs/phase-13/main.md §local-check |
| lint | exit 0 | 同上 |
| verify-indexes | drift 0 | 同上 |
| test (unit / integration) | 全 PASS | 同上 |
| `git status` で意図せぬ変更が無い | clean | 同上 |
| 機密情報 grep | 0 件 | 同上 |
| spec PR 境界 grep | 0 件 | 同上 |
| rollback payload 上書き | 0 件 | 同上 |

### ステップ 3: change-summary（PR description 草案）

`outputs/phase-13/main.md` および `outputs/phase-13/pr-template.md` に以下構造で記述する。

#### Summary

UT-01 / UT-09 系で齟齬していた retry 最大回数 / Exponential Backoff curve / `processed_offset` の採否を canonical な設計判断記録として確定する。本 PR は **タスク仕様書のみ**で、実コード反映（`DEFAULT_MAX_RETRIES` 修正 / `processed_offset` migration 追加 / `SYNC_MAX_RETRIES` 既定値変更）は **UT-09 追補** で行う。Issue #263 は CLOSED 状態のまま据え置き、本 PR では `Refs #263` を採用する。

#### canonical 決定一覧

Phase 2 `canonical-retry-offset-decision.md` で確定した値を以下に転記（実値は Phase 2 文書を参照）。

| 項目 | canonical 値 | 引用元 |
| --- | --- | --- |
| retry 最大回数 | （Phase 2 確定値） | outputs/phase-02/canonical-retry-offset-decision.md |
| Exponential Backoff curve | base / 上限 / jitter（Phase 2 確定値） | 同上 |
| `processed_offset` 採否 | 追加 / hybrid / 不採用（Phase 2 確定値） | 同上 |
| offset 単位 | 行 / chunk index / 安定 ID（Phase 2 確定値） | 同上 |
| `SYNC_MAX_RETRIES` 既定値方針 | （Phase 2 確定値） | 同上 |

#### 影響範囲

**新規ファイル**:

- `docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/index.md`
- `docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/phase-01.md` 〜 `phase-13.md`（13 Phase）
- `docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/artifacts.json`
- `docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-01/` 〜 `outputs/phase-13/`（各 Phase 成果物）
- `docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/artifacts.json`

**修正ファイル（Phase 12 same-wave sync 起因）**:

- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（sync / retry / offset 索引導線）
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（workflow inventory）
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（canonical 即参照ポイント）
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json`（`pnpm indexes:rebuild` で再生成）
- `docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md`（状態 spec_created 維持 + 後継 workflow リンク + Issue CLOSED 注記）

**含まないファイル（明示）**:

- `apps/api/migrations/*.sql`（実 migration は UT-09 追補）
- `apps/api/src/jobs/sync-sheets-to-d1.ts`（`DEFAULT_MAX_RETRIES` 修正は UT-09 追補）
- `apps/api/wrangler.toml` / `.dev.vars`（`SYNC_MAX_RETRIES` 既定値変更は UT-09 追補）

#### UT-09 申し送り

- canonical retry 最大回数 / backoff curve / `processed_offset` 採否を UT-09 追補で実装反映する。
- 過渡期 SLA 再校正（適用直後 7 日は failed 件数しきい値を staging 実測ベースで再校正）を UT-09 受入条件に追加する。
- `SYNC_MAX_RETRIES` の wrangler.toml / `.dev.vars` 既定値変更を UT-09 追補で実施する。
- 実 Sheets API quota 観測は UT-09 phase-11 smoke で行う。

#### Phase 完了 evidence path

| Phase | evidence path |
| --- | --- |
| Phase 2 | `outputs/phase-02/canonical-retry-offset-decision.md` / `migration-impact-evaluation.md` |
| Phase 5 | `outputs/phase-05/ut09-handover-runbook.md` |
| Phase 7 | `outputs/phase-07/ac-matrix.md` |
| Phase 9 | `outputs/phase-09/quota-worst-case-calculation.md` |
| Phase 10 | `outputs/phase-10/go-no-go.md` |
| Phase 11 | `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` |
| Phase 12 | `outputs/phase-12/{implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check,main}.md` |

### ステップ 4: コミット粒度（5 単位）

approval 取得後、以下 **5 単位** でコミットを分割する（rollback / cherry-pick の柔軟性を確保）。

| # | コミット範囲 | 想定メッセージ prefix |
| --- | --- | --- |
| 1 | workflow ディレクトリ本体（13 Phase + index + artifacts.json） | `docs(u-ut01-09): add task spec phases 1-13` |
| 2 | outputs/ 配下の Phase 1〜10 成果物 | `docs(u-ut01-09): add phase 1-10 outputs` |
| 3 | outputs/ 配下の Phase 11〜13 成果物 | `docs(u-ut01-09): add phase 11-13 outputs` |
| 4 | aiworkflow-requirements indexes 同期 | `chore(indexes): sync u-ut01-09 to aiworkflow indexes` |
| 5 | 起票元 unassigned 仕様の更新（後継 workflow リンク + Issue CLOSED 注記） | `docs(unassigned): mark U-UT01-09 spec_created with successor link` |

### ステップ 5: PR 作成（user 承認後のみ）

```bash
# 現在のブランチ確認
git status
git branch --show-current  # 期待: feat/u-ut01-09-retry-and-offset-policy-alignment

# 5 単位の commit 後 push
git push -u origin feat/u-ut01-09-retry-and-offset-policy-alignment

# PR 作成（base=main / head=feat ブランチ、solo 運用 / required reviewers=0）
gh pr create \
  --title "docs(u-ut01-09): retry/backoff/offset canonical 決定タスク仕様書 (Refs #263)" \
  --base main \
  --head feat/u-ut01-09-retry-and-offset-policy-alignment \
  --body "$(cat <<'EOF'
## Summary
UT-01 / UT-09 系で齟齬していた retry 最大回数 / Exponential Backoff curve / processed_offset の採否を canonical な設計判断記録として確定します。本 PR は **タスク仕様書のみ**で、実コード反映は UT-09 追補で行います。Issue #263 は CLOSED のまま据え置き、本 PR では Refs #263 を採用します（Closes 禁止）。

## canonical 決定一覧
- retry 最大回数: Phase 2 canonical-retry-offset-decision.md 確定値
- Exponential Backoff curve（base / 上限 / jitter）: 同上
- processed_offset 採否（追加 / hybrid / 不採用）: 同上
- offset 単位（行 / chunk index / 安定 ID）: 同上
- SYNC_MAX_RETRIES 既定値方針: 同上

## 影響範囲
- 新規: docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/（13 Phase + index + artifacts.json + outputs/）
- 同期: .claude/skills/aiworkflow-requirements/indexes/{topic-map,resource-map,quick-reference,keywords.json}
- 更新: docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md（状態 spec_created 維持 + 後継 workflow リンク + Issue CLOSED 注記）

## 含まないもの（明示）
- apps/api/migrations/*.sql（実 migration は UT-09 追補）
- apps/api/src/jobs/sync-sheets-to-d1.ts（DEFAULT_MAX_RETRIES 修正は UT-09 追補）
- apps/api/wrangler.toml / .dev.vars（SYNC_MAX_RETRIES 既定値変更は UT-09 追補）

## UT-09 申し送り
- canonical retry / backoff / processed_offset を UT-09 追補で実装反映
- 過渡期 SLA 再校正を UT-09 受入条件に追加
- SYNC_MAX_RETRIES の wrangler.toml / .dev.vars 既定値変更を UT-09 追補で実施
- 実 Sheets API quota 観測は UT-09 phase-11 smoke

## Phase 完了 evidence path
- Phase 2: outputs/phase-02/canonical-retry-offset-decision.md / migration-impact-evaluation.md
- Phase 5: outputs/phase-05/ut09-handover-runbook.md
- Phase 7: outputs/phase-07/ac-matrix.md
- Phase 9: outputs/phase-09/quota-worst-case-calculation.md
- Phase 10: outputs/phase-10/go-no-go.md
- Phase 11: outputs/phase-11/{main,manual-smoke-log,link-checklist}.md
- Phase 12: outputs/phase-12/{implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check,main}.md

## 動作確認
- typecheck / lint / verify-indexes / unit / integration: 全 PASS
- Phase 11 NON_VISUAL evidence 採取済（観点 A/B/C 全 PASS）
- 機密情報 grep: 0 件
- spec PR 境界 grep（apps/api/migrations/ / apps/api/src/jobs/sync-sheets-to-d1.ts 混入）: 0 件
- rollback payload 上書き: 0 件

## リスク・後方互換性
- 破壊的変更なし（spec ドキュメントのみ）
- production D1 / 同期ジョブへの影響なし
- workflow_state は spec_created を維持（merge 後も）
- Issue #263 は CLOSED のまま据え置き

## 関連 Issue
Refs #263
EOF
)"
```

## PR テンプレ

| 項目 | 値 |
| --- | --- |
| title | `docs(u-ut01-09): retry/backoff/offset canonical 決定タスク仕様書 (Refs #263)` |
| body | Summary / canonical 決定一覧 / 影響範囲 / 含まないもの / UT-09 申し送り / Phase 完了 evidence path / 動作確認 / リスク・後方互換性 / 関連 Issue |
| base | `main`（solo 運用 / `feature/* → main` 直 PR） |
| head | `feat/u-ut01-09-retry-and-offset-policy-alignment` |
| reviewer | required reviewers=0（solo 運用 / CI gate のみで保護） |
| labels | `area:docs` / `task:U-UT01-09` / `wave:1` / `spec-only` |
| linked issue | **#263（`Refs #263` を採用 / `Closes` は禁止）** |

> **Issue #263 は CLOSED 状態のまま据え置く**。`Closes` を使うと再オープン → クローズの不要なノイズが発生するため必ず `Refs` を採用する。実コード反映 PR（UT-09 追補）でも `Refs #263` を採用する（Issue は CLOSED のままで運用）。

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

- [ ] Phase 12 same-wave sync が完了（aiworkflow indexes + 起票元 unassigned status）
- [ ] root `artifacts.json` と `outputs/artifacts.json` が parity（drift 0）
- [ ] `metadata.workflow_state = "spec_created"` / `metadata.docsOnly = true` / `metadata.github_issue_state = "CLOSED"`
- [ ] PR 本文に `Refs #263` が記載され、`Closes` が **使われていない**
- [ ] `apps/api/migrations/` / `apps/api/src/jobs/sync-sheets-to-d1.ts` 配下の変更が 0 件（spec PR 境界遵守）
- [ ] 機密情報 grep 0 件
- [ ] rollback payload 上書き 0 件
- [ ] CI gate（typecheck / lint / verify-indexes / unit / integration）全 green
- [ ] Phase 11 NON_VISUAL evidence のメタ情報（固定文言「UI/UX変更なしのため Phase 11 スクリーンショット不要」/ 観点 A/B/C 判定）が PR 本文から辿れる
- [ ] Phase 12 phase12-task-spec-compliance-check の PASS 判定 link
- [ ] CLAUDE.md「Cloudflare 系 CLI 実行ルール」（`scripts/cf.sh` 経由 / `wrangler` 直呼び禁止）が implementation-guide に反映されている
- [ ] コミット粒度が 5 単位に分割されている

## 承認後の自動同期手順（user 操作）

PR 作成後の以下は **user の操作領域** とし、Claude は実行しない（指示があれば補助コマンドの提示のみ）。

```bash
# CI 確認
gh pr checks <PR番号>

# user による承認後のマージ（user 操作）
gh pr merge <PR番号> --squash --delete-branch
```

- マージ後、`artifacts.json` の `phases[*].status` を `completed` に更新（ただし `metadata.workflow_state` は `spec_created` を維持）。
- Issue #263 は CLOSED のまま据え置き（再オープン禁止）。
- 実コード反映は UT-09 追補（別 PR）で `apps/api/src/jobs/sync-sheets-to-d1.ts` / `apps/api/migrations/` を修正し、その PR でも `Refs #263` を採用する（Issue は CLOSED のままで運用）。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO 判定を承認ゲートの前提として再利用 |
| Phase 11 | NON_VISUAL evidence を PR の動作確認セクションに転記 |
| Phase 12 | documentation-changelog から変更ファイルリストを生成 |
| UT-09 追補 | canonical 値の申し送り → 実コード反映（別 PR） |

## 多角的チェック観点

- 価値性: PR が canonical 値（retry / backoff / `processed_offset` / `SYNC_MAX_RETRIES`）の決定を網羅しているか。
- 実現性: local-check-result が typecheck / lint / verify-indexes / test すべて PASS か。
- 整合性: change-summary が Phase 12 documentation-changelog と一致しているか。
- 運用性: PR description が UT-09 追補担当者に必要十分な申し送り情報を含むか。
- 認可境界: コミット差分に database_id 実値 / API token / 実会員データが混入していないか（grep）。
- 後方互換性: spec のみで実コード変更がないことを diff レビューで再確認したか。
- 境界遵守: `apps/api/migrations/` / `apps/api/src/jobs/sync-sheets-to-d1.ts` への変更が 0 件であることを `git diff --name-only` で確認したか。
- Issue 整合: PR 本文で `Refs #263` を採用し `Closes` を使っていないか（CLOSED Issue 再オープン回避）。
- rollback 安全性: 既存 migration の payload を本 PR で書き換えていないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 承認ゲート通過（user 明示承認） | 13 | spec_created | **user 承認なし禁止** |
| 2 | local-check-result（typecheck/lint/verify-indexes/test） | 13 | spec_created | 全 PASS |
| 3 | 機密情報 grep | 13 | spec_created | 0 件 |
| 4 | spec PR 境界 grep（migrations/ / sync-sheets-to-d1.ts 混入） | 13 | spec_created | 0 件 |
| 5 | rollback payload 上書きチェック | 13 | spec_created | 0 件 |
| 6 | change-summary 作成 | 13 | spec_created | user 提示用 |
| 7 | 5 単位コミット | 13 | spec_created | 承認後のみ |
| 8 | branch / push | 13 | spec_created | 承認後のみ |
| 9 | gh pr create（`Refs #263` 採用 / `Closes` 禁止） | 13 | spec_created | base=main / head=feat/u-ut01-09-... |
| 10 | CI 確認 | 13 | spec_created | gh pr checks |
| 11 | マージ手順記録（user 操作） | 13 | spec_created | Claude は実行しない |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | local-check-result + change-summary + 承認ログ |
| テンプレ | outputs/phase-13/pr-template.md | PR title / body テンプレと CI gate 一覧 |
| 結果 | outputs/phase-13/pr-info.md | PR 作成後の URL / CI 結果（承認後のみ） |
| 結果 | outputs/phase-13/pr-creation-result.md | PR 作成プロセスの実行ログ（承認後のみ） |
| PR | user 承認後に作成 | U-UT01-09 spec PR（`Refs #263`） |
| メタ | artifacts.json | 全 Phase 状態の更新（merge 後 phases completed / `metadata.workflow_state` は spec_created 維持 / `metadata.github_issue_state` は CLOSED 維持） |

## 完了条件

- [ ] 承認ゲートの全項目が PASS（user 明示承認を含む）
- [ ] local-check-result が typecheck / lint / verify-indexes / test 全 PASS
- [ ] 機密情報 grep が 0 件
- [ ] `apps/api/migrations/` / `apps/api/src/jobs/sync-sheets-to-d1.ts` 混入 grep が 0 件
- [ ] rollback payload 上書きが 0 件
- [ ] change-summary が PR body と一致している
- [ ] PR が作成され Issue #263 に `Refs #263` で紐付いている（`Closes` 不使用）
- [ ] CI（`gh pr checks`）が green
- [ ] solo 運用ポリシーに従い required reviewers=0 / CI gate で保護されている
- [ ] 5 単位のコミット粒度が守られている
- [ ] マージ後、`phases[*].status` が `completed` / `metadata.workflow_state` は `spec_created` 維持 / `metadata.github_issue_state` は `CLOSED` 維持

## タスク100%実行確認【必須】

- 全実行タスク（11 件）が `spec_created`
- 承認ゲートが他のすべての手順より先行する設計
- approval 取得前に commit / push / PR 作成しない方針が明文化されている
- マージ操作は user の領域として明確に分離されている
- artifacts.json の `phases[12].user_approval_required = true`、`status = spec_created`
- `metadata.workflow_state = "spec_created"` / `metadata.docsOnly = true` / `metadata.github_issue_state = "CLOSED"` 維持
- PR 本文で `Refs #263` を採用し `Closes` 不使用
- コミットを 5 単位に分割

## Phase 完了スクリプト呼出例

```bash
# 1. 承認ゲート前提確認
ls docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-{10,11,12}/

# 2. 二重 ledger parity 確認
diff <(jq '.metadata' docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/artifacts.json) \
     <(jq '.metadata' docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/artifacts.json)

# 3. spec PR 境界の最終確認
git diff --name-only main..HEAD | grep -E "^apps/api/migrations/|^apps/api/src/jobs/sync-sheets-to-d1\.ts$" \
  && echo "BLOCKED" || echo "OK: spec only"

# 4. Issue 状態確認（CLOSED のまま）
gh issue view 263 --json state -q .state  # 期待: CLOSED

# 5. PR 本文に Closes が含まれていないことを確認（user 承認後の作成直前）
echo "$PR_BODY" | grep -E "(Closes|closes|CLOSES)\s+#" && echo "BLOCKED: Closes 禁止" || echo "OK: Refs only"

# 6. 5 単位コミット粒度確認
git log --oneline main..HEAD | wc -l  # 期待: 5
```

## 次 Phase

- 次: なし（タスク完了 / 後続は UT-09 追補での実コード反映）
- 引き継ぎ事項:
  - 実コード反映（`DEFAULT_MAX_RETRIES` / `processed_offset` / `SYNC_MAX_RETRIES`）は UT-09 追補で行い、その PR でも `Refs #263` を採用する
  - U-UT01-07（`sync_log` 物理対応）/ U-UT01-08（enum 統一）への直交関係を維持
  - artifacts.json の `phases[*].status` を `completed` に更新（user マージ後）。`metadata.workflow_state` は `spec_created` 維持 / `metadata.github_issue_state` は `CLOSED` 維持
- ブロック条件:
  - user 承認が無い場合は PR 作成・push を一切実行しない
  - local-check-result のいずれかが FAIL（→ Phase 5 / 11 / 12 へ差し戻し）
  - 機密情報 grep で 1 件以上検出（→ 即時停止 / Phase 12 secret hygiene 再確認）
  - `apps/api/migrations/` / `apps/api/src/jobs/sync-sheets-to-d1.ts` への変更が混入（→ 即時停止 / spec PR 境界違反）
  - rollback payload 上書きを検出（→ 即時停止 / 既存 migration を保護）
  - PR 本文に `Closes #263` を誤って記載（→ Issue CLOSED 再オープン回避のため `Refs` へ修正必須）
