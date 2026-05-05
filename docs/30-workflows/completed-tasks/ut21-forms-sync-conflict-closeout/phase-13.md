# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-forms-sync-conflict-closeout-001 |
| タスク名 | UT-21 Sheets sync 仕様を Forms sync 現行正本へ吸収する close-out |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-30 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了） |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup（PR creation / approval gate） |
| visualEvidence | NON_VISUAL |
| user_approval_required | **true** |
| 作業ブランチ | `feat/issue-234-ut21-forms-sync-closeout-task-spec` |
| GitHub Issue | #234 (CLOSED, 維持) |

## 目的

Phase 1〜12 の成果物（仕様書 13 Phase / 移植マトリクス / 新設禁止方針 / docs-only smoke 証跡 / docs sync）をまとめて PR を作成し、ユーザーの明示的な承認を経てレビュー → マージへ進める。承認ゲート前のいかなる commit / push / PR 作成も禁止し、approval を取得して初めて自動同期手順へ進む。

> **重要: このフェーズは user の明示的な承認なしに実行してはならない。**
> approval 取得前に commit / push / PR を作らない（厳守）。本タスクの実行エージェントは Phase 12 までを完成させた段階で **必ず停止** し、user に change-summary を提示してから次の操作の許可を待つ。

> **docs-only 据え置き重要事項**: 本タスクは docs-only / legacy umbrella close-out であり、PR 差分は仕様書（`docs/30-workflows/ut21-forms-sync-conflict-closeout/`）、UT-21 当初仕様書（legacy）の状態欄パッチ、aiworkflow-requirements の `references/task-workflow.md` および `indexes/*`、LOGS / SKILL.md のみ。`apps/` / `packages/` / `.github/workflows/` / `wrangler.toml` への変更は **本 PR に含めてはならない**（含まれていた場合は docs-only 前提崩壊として停止）。

> **GitHub Issue #234 据え置き重要事項**: Issue #234 は CLOSED のまま **再オープンしない**。PR からは `Refs #234` で参照のみ行う（`Closes #234` / `Fixes #234` は使用しない）。

## 承認ゲート（approval gate）【最優先 / 必須】

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 10 GO 判定 | `outputs/phase-10/go-no-go.md` が GO | 要確認 |
| Phase 11 manual evidence | 7 項目すべて採取済（または N/A 理由明記） | 要確認 |
| Phase 11 spec-integrity | aiworkflow-requirements `task-workflow.md` との整合 OK | 要確認 |
| Phase 12 compliance check | 全項目 PASS（docs-only close-out 据え置き含む） | 要確認 |
| Phase 12 必須 5 タスク | 7 ファイル（main.md + 6 補助。compliance check 含む）揃い | 要確認 |
| skill-feedback 両 skill 記述 | task-specification-creator + aiworkflow-requirements 両方 | 要確認 |
| validate / verify スクリプト | exit code 0 | 要確認 |
| `apps/` / `packages/` / workflow yaml / wrangler.toml 配下の変更 | 0 件（docs-only 前提） | 要確認 |
| `workflow_state` 据え置き | root / outputs `artifacts.json` が `spec_created` | 要確認 |
| GitHub Issue #234 状態 | CLOSED のまま維持 | 要確認 |
| change-summary レビュー | user が変更内容を把握 | **user 承認待ち** |
| 機密情報の非混入 | `SYNC_ADMIN_TOKEN` / `GOOGLE_FORMS_API_KEY` / OAuth secret 実値が無い | 要確認 |
| PR 作成実行 | **user の明示的な指示があった場合のみ実行** | **承認待ち** |

> **本ゲートが PASS するまで `git commit` / `git push` / `gh pr create` を一切実行しない**。

## 実行タスク

1. 承認ゲートを通過する（user に change-summary を提示し、明示承認を取得する）。
2. local-check（typecheck / lint / docs-only smoke 再確認 / 機密情報 grep）を実行・記録する。
3. change-summary（PR description 草案）を作成する。
4. **user 承認後**、ブランチ確認（`feat/issue-234-ut21-forms-sync-closeout-task-spec`）→ commit → push → PR 作成を実行する。
5. CI 確認と承認後マージの手順を記録する（マージ実行は user 操作）。
6. close-out 後の Issue #234 cross-link 手順（コメント追記のみ・再オープンしない）を記録する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-12/documentation-changelog.md | PR 変更ファイル一覧の根拠 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-12/phase12-task-spec-compliance-check.md | 承認ゲート前提 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-12/unassigned-task-detection.md | 後続 U02/U04/U05 cross-link |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-12/skill-feedback-report.md | 両 skill フィードバック |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-11/main.md | docs-only smoke 検証サマリー |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-11/spec-integrity-check.md | aiworkflow-requirements 整合 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-10/go-no-go.md | GO 判定 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/index.md | PR タイトル / 説明根拠 |
| 必須 | CLAUDE.md | ブランチ戦略 / レビュー方針 / solo 運用ポリシー |
| 参考 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/phase-13.md | PR テンプレ参照 |
| 参考 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | 姉妹 close-out 形式 |

## 実行手順

### ステップ 1: 承認ゲート通過（user 承認必須）

1. Phase 10 GO 判定 / Phase 11 manual evidence + spec-integrity / Phase 12 compliance check が PASS していることを確認する。
2. `validate-phase-output.js` / `verify-all-specs.js` が exit 0 であることを再確認する。
3. `git status` で `apps/` / `packages/` / `.github/workflows/` / `wrangler.toml` への変更が 0 件であることを確認する（docs-only 前提）。
4. root / outputs `artifacts.json` の `metadata.workflow_state` が `spec_created` のまま据え置かれていることを確認する。
5. `gh issue view 234 --json state` で state == CLOSED を再確認する。
6. change-summary（後述ステップ 3）を user に提示し、**明示的な承認**を待つ。
7. 承認取得後にステップ 4（PR 作成）へ進む。承認が得られない場合はここで停止し、指摘事項を Phase 5 / 11 / 12 に差し戻す。

### ステップ 2: local-check-result（PR 前ローカル確認 / docs-only 版）

```bash
# 型チェック / Lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# docs-only 整合（apps / packages / workflow yaml / wrangler.toml に変更がないこと）
git status --short apps/ packages/ .github/workflows/ apps/web/wrangler.toml apps/api/wrangler.toml

# Phase 11 と同等の docs-only smoke 再確認（rg / cross-link）
rg -n "POST /admin/sync\\b|GET /admin/sync/audit|sync_audit_logs|sync_audit_outbox" \
   docs/30-workflows/02-application-implementation \
   .claude/skills/aiworkflow-requirements/references \
   docs/30-workflows/ut21-forms-sync-conflict-closeout

# aiworkflow-requirements task-workflow.md current facts 追記が反映されていること
rg -nC3 "UT-21|legacy umbrella|close-out" \
   .claude/skills/aiworkflow-requirements/references/task-workflow.md

# UT-21 legacy 状態欄パッチが反映されていること
rg -nC3 "close-out|Forms sync が正本" \
   docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md

# 機密情報チェック
git diff --staged | rg -nE "ya29\\.|-----BEGIN PRIVATE|CLOUDFLARE_API_TOKEN=[A-Za-z0-9_-]{10,}|SYNC_ADMIN_TOKEN=[A-Za-z0-9_-]{10,}|GOOGLE_FORMS_API_KEY=[A-Za-z0-9_-]{10,}"

# 仕様書整合性
node scripts/validate-phase-output.js --task ut21-forms-sync-conflict-closeout
node scripts/verify-all-specs.js

# Issue #234 が CLOSED のままであること
gh issue view 234 --json state,title,url
```

| チェック項目 | 期待値 | 記録先 |
| --- | --- | --- |
| typecheck | exit 0 | outputs/phase-13/local-check-result.md §1 |
| lint | exit 0 | outputs/phase-13/local-check-result.md §2 |
| `apps/` / `packages/` / workflow yaml / wrangler.toml diff | 0 件（docs-only 前提） | outputs/phase-13/local-check-result.md §3 |
| `git status` で意図せぬ変更が無い | clean（docs / .claude / artifacts 以外なし） | outputs/phase-13/local-check-result.md §3 |
| 新設禁止 rg | 本仕様書外で hit 0 | outputs/phase-13/local-check-result.md §4 |
| task-workflow.md current facts 追記 | UT-21 / legacy / close-out hit あり | outputs/phase-13/local-check-result.md §5 |
| UT-21 legacy 状態欄パッチ | hit あり | outputs/phase-13/local-check-result.md §6 |
| 機密情報 grep | 0 件 | outputs/phase-13/local-check-result.md §7 |
| `validate-phase-output.js` | exit 0 | outputs/phase-13/local-check-result.md §8 |
| `verify-all-specs.js` | exit 0 | outputs/phase-13/local-check-result.md §8 |
| Issue #234 state | CLOSED | outputs/phase-13/local-check-result.md §9 |

### ステップ 3: change-summary（PR description 草案）

`outputs/phase-13/change-summary.md` および `outputs/phase-13/pr-info.md` に以下構造で記述する。

#### 概要

UT-21（`UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`）を Sheets direct 実装として進めず、有効な品質要件（Bearer guard / 409 排他 / D1 retry / manual smoke）を 03a / 03b / 04c / 09b に吸収する legacy umbrella close-out。`POST /admin/sync` / `GET /admin/sync/audit` / `sync_audit_logs` / `sync_audit_outbox` は新設しない方針を本仕様書 + UT-21 当初仕様書状態欄 + aiworkflow-requirements `task-workflow.md` current facts の 3 箇所で固定する docs-only PR。

#### 動機

- GitHub Issue: #234 (CLOSED) — UT-21 Sheets sync 仕様と現行 Forms sync 正本の二重正本化リスク解消
- Sheets sync と Forms sync の同期元二重化を防止
- `sync_jobs` ledger でカバー可能な audit 機能を別 table 新設で重複させない（要否判定は U02 へ）
- 旧 UT-09 と同形式の legacy umbrella 処理として閉じる（姉妹 close-out: `task-sync-forms-d1-legacy-umbrella-001`）

#### 変更内容（docs-only）

**新規ファイル一覧**:

- `docs/30-workflows/ut21-forms-sync-conflict-closeout/index.md` / `artifacts.json`
- `docs/30-workflows/ut21-forms-sync-conflict-closeout/phase-01.md` 〜 `phase-13.md`
- `docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-*/...md`（各 Phase 成果物）

**修正ファイル一覧**:

- `.claude/skills/aiworkflow-requirements/references/task-workflow.md`（current facts に「UT-21 close-out 済 / Forms sync 正本 / endpoint 新設禁止」追記）
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` / `quick-reference.md` / `topic-map.md` / `keywords.json`（`generate-index.js` で同期）
- `.claude/skills/aiworkflow-requirements/LOGS.md` / `SKILL.md`
- `.claude/skills/task-specification-creator/LOGS.md` / `SKILL.md`（更新事項あれば）
- `docs/30-workflows/LOGS.md`
- `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`（状態欄に close-out 済パッチ）
- 03a / 03b / 04c / 09b / 02c の index.md（関連タスクテーブルに本 close-out cross-link）

> **`apps/` / `packages/` / `.github/workflows/*.yml` / `wrangler.toml` への変更は本 PR に含まれない**（docs-only 前提）。

#### 動作確認

- Phase 11 docs-only smoke 7 項目すべて PASS（`outputs/phase-11/manual-smoke-log.md`）
- spec-integrity（`outputs/phase-11/spec-integrity-check.md`）で aiworkflow-requirements 整合 OK
- cross-link 死活 0 件（`outputs/phase-11/link-checklist.md`）
- `validate-phase-output.js` / `verify-all-specs.js` exit 0
- GitHub Issue #234 = CLOSED 維持

#### リスク・後方互換性

- **破壊的変更なし**（docs-only / 実装変更ゼロ）
- 03a / 03b / 04c / 09b の受入条件 patch は本 PR では適用せず cross-link のみ。実 patch 適用は各タスクの Phase 内で実施
- 後続 U02 / U04 / U05 が完了するまで audit / real-env smoke / 実装パス境界の最終確定は保留（既知制限として明記）
- 後方互換性: 既存 Forms sync ランタイム挙動への影響なし

#### 関連 Issue / 派生タスク

- 親: #234（CLOSED のまま、本仕様書を成果物として参照、`Refs #234` のみ・`Closes` 使用しない）
- 既存タスクに移植: 03a / 03b / 04c / 09b（cross-link のみ / 実 patch 適用は各タスク内）
- 後続独立タスク（既起票）: UT21-U02 / UT21-U04 / UT21-U05
- 姉妹 close-out: `task-sync-forms-d1-legacy-umbrella-001`

### ステップ 4: PR 作成（user 承認後のみ）

```bash
# 現在のブランチが feat/issue-234-ut21-forms-sync-closeout-task-spec であることを確認
git status
git branch --show-current
# 期待値: feat/issue-234-ut21-forms-sync-closeout-task-spec

# 必要なファイルを明示的に add（git add . / -A は使わない）
git add docs/30-workflows/ut21-forms-sync-conflict-closeout/ \
        docs/30-workflows/LOGS.md \
        docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md \
        .claude/skills/aiworkflow-requirements/references/task-workflow.md \
        .claude/skills/aiworkflow-requirements/indexes/resource-map.md \
        .claude/skills/aiworkflow-requirements/indexes/quick-reference.md \
        .claude/skills/aiworkflow-requirements/indexes/topic-map.md \
        .claude/skills/aiworkflow-requirements/indexes/keywords.json \
        .claude/skills/aiworkflow-requirements/LOGS.md \
        .claude/skills/aiworkflow-requirements/SKILL.md \
        .claude/skills/task-specification-creator/LOGS.md \
        .claude/skills/task-specification-creator/SKILL.md
# 03a/03b/04c/09b/02c の index.md cross-link を変更している場合のみ追加で add

# `apps/` / `packages/` / workflow yaml / wrangler.toml が含まれていないことを再確認
git diff --staged --name-only | rg "^(apps|packages|\\.github/workflows|.+wrangler\\.toml)" \
  && echo "ABORT: docs-only 違反" || echo "docs-only OK"

# コミット
git commit -m "$(cat <<'EOF'
docs(30-workflows): UT-21 Sheets sync close-out task spec (Refs #234)

- UT-21 Sheets direct 実装を進めず、Forms sync 現行正本へ吸収する legacy umbrella close-out
- 有効な品質要件 4 種（Bearer guard / 409 排他 / D1 retry / manual smoke）を 03a/03b/04c/09b へ移植 (cross-link)
- POST /admin/sync / GET /admin/sync/audit / sync_audit_logs / sync_audit_outbox は新設しない方針を 3 箇所で固定
- aiworkflow-requirements task-workflow.md current facts に close-out 済を追記
- 後続独立タスク UT21-U02 / U04 / U05 cross-link
- workflow_state は spec_created のまま据え置き（docs-only close-out ルール）

Refs #234 (CLOSED, 維持)
EOF
)"

# push
git push -u origin feat/issue-234-ut21-forms-sync-closeout-task-spec

# PR 作成（base=dev / head=feat ブランチ）
gh pr create \
  --title "docs(30-workflows): UT-21 Sheets sync close-out task spec (Refs #234)" \
  --base dev \
  --head feat/issue-234-ut21-forms-sync-closeout-task-spec \
  --body "$(cat <<'EOF'
## 概要
UT-21（Sheets direct 実装）を進めず、現行 Forms sync を正本として有効な品質要件のみを 03a/03b/04c/09b に吸収する legacy umbrella close-out の docs-only PR です。

## 動機
- GitHub Issue: #234 (CLOSED) — Sheets sync 仕様と Forms sync 正本の二重正本化リスク解消
- 旧 UT-09 と同形式の legacy umbrella 処理（姉妹 close-out: task-sync-forms-d1-legacy-umbrella-001）

## 変更内容（docs-only）
- 新規: docs/30-workflows/ut21-forms-sync-conflict-closeout/ の仕様書 13 Phase + outputs
- 更新: .claude/skills/aiworkflow-requirements/references/task-workflow.md（current facts に UT-21 close-out 済 / Forms sync 正本 / endpoint 新設禁止を追記）
- 更新: .claude/skills/aiworkflow-requirements/indexes/*（generate-index.js で同期）
- パッチ: docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md（状態欄に close-out 済追記）
- 同期: LOGS.md ×2 / SKILL.md ×2（更新事項あれば）

## 新設しない方針（3 箇所固定）
- 本 close-out 仕様書（移植マトリクス + 新設禁止方針）
- UT-21 当初仕様書（legacy）の状態欄
- aiworkflow-requirements task-workflow.md current facts

POST /admin/sync / GET /admin/sync/audit / sync_audit_logs / sync_audit_outbox は新設しません（要否判定は UT21-U02 へ委譲）。

## docs-only 前提
- apps/ / packages/ / .github/workflows/*.yml / wrangler.toml への変更は本 PR に含まれません
- workflow_state は spec_created のまま据え置き（implemented 昇格は派生 03a/03b/04c/09b および後続 U02/U04/U05 の完了後）

## 動作確認
- Phase 11 docs-only smoke 7 項目 PASS（rg / cross-link / spec-integrity / gh issue view #234）
- validate-phase-output.js / verify-all-specs.js exit 0
- GitHub Issue #234 = CLOSED 維持

## リスク・後方互換性
- 破壊的変更なし（docs-only）
- 03a/03b/04c/09b への実 patch 適用は各タスクの Phase 内で実施（本 PR は cross-link のみ）

## 関連 Issue / 後続タスク
- Refs #234 (CLOSED, 維持・再オープンしない)
- 後続独立タスク（既起票）: UT21-U02（audit table 要否）/ UT21-U04（real-env smoke）/ UT21-U05（実装パス境界）
- 姉妹 close-out: task-sync-forms-d1-legacy-umbrella-001
EOF
)"
```

### ステップ 5: PR 作成結果記録

`outputs/phase-13/pr-creation-result.md` に PR 番号 / URL / CI 状態を記録する。

```bash
gh pr view <PR番号> --json number,url,state,statusCheckRollup
gh pr checks <PR番号>
```

### ステップ 6: close-out 後の Issue #234 cross-link（user 承認後 / 任意）

Issue #234 は CLOSED のまま **再オープンせず**、コメント追記のみで本 close-out PR を双方向参照可能にする。

```bash
# Issue #234 にコメントとして本 close-out PR と仕様書ディレクトリへの cross-link を追加
gh issue comment 234 --body "$(cat <<'EOF'
本 Issue は CLOSED のまま、UT-21 Sheets sync 仕様の close-out として以下を成果物に紐付けます。

- close-out 仕様書: docs/30-workflows/ut21-forms-sync-conflict-closeout/
- close-out PR: <PR URL>
- 後続独立タスク: UT21-U02 / U04 / U05
- 姉妹 close-out: task-sync-forms-d1-legacy-umbrella-001

新設しない方針（POST /admin/sync / GET /admin/sync/audit / sync_audit_logs / sync_audit_outbox）が aiworkflow-requirements task-workflow.md current facts に追記されました。
EOF
)"

# Issue 状態が CLOSED のまま維持されていることを再確認
gh issue view 234 --json state,title,url
```

> **`gh issue reopen 234` は実行しない**（原典指示遵守）。

## PR テンプレ

| 項目 | 値 |
| --- | --- |
| title | `docs(30-workflows): UT-21 Sheets sync close-out task spec (Refs #234)` |
| body | 概要 / 動機 / 変更内容 / 新設しない方針 / docs-only 前提 / 動作確認 / リスク・後方互換性 / 関連 Issue（上記参照） |
| reviewer | solo 開発のため required reviewer なし（CLAUDE.md branch protection / `required_pull_request_reviews=null` に従う） |
| base | `dev`（推奨） → 後段で `main` へ昇格 |
| head | `feat/issue-234-ut21-forms-sync-closeout-task-spec` |
| labels | `area:docs` / `area:sync` / `task:UT-21-CLOSEOUT` / `wave:1` / `docs-only` / `legacy-umbrella` |
| linked issue | `Refs #234`（**CLOSED のまま、`Closes` / `Fixes` は使用しない**） |

## 承認後の自動同期手順（user 操作）

PR 作成後の以下は **user の操作領域** とし、Claude は実行しない（指示があれば補助コマンドの提示のみ）。

```bash
# CI 確認
gh pr checks <PR番号>

# user による承認後のマージ（user 操作）
gh pr merge <PR番号> --squash --delete-branch
```

- マージ後、`dev` から `main` への昇格 PR を別途作成する。
- マージ完了後、artifacts.json の全 Phase を `completed` に更新する（ただし `metadata.workflow_state` は `spec_created` のまま据え置き）。
- Issue #234 は CLOSED のまま維持し、ステップ 6 のコメントによる cross-link で運用する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO 判定を承認ゲートの前提として再利用 |
| Phase 11 | docs-only smoke 結果（rg / cross-link / spec-integrity）を PR の動作確認セクションに転記 |
| Phase 12 | documentation-changelog から変更ファイルリストを生成、unassigned-task-detection の cross-link を関連タスク欄へ |

## 多角的チェック観点

- 価値性: PR が Issue #234 の二重正本化リスク解消を完遂し、AC-1〜AC-11 の証跡へリンクできているか。
- 実現性: local-check-result が typecheck / lint / 新設禁止 rg / 機密情報 grep すべて PASS か。
- 整合性: change-summary が Phase 12 documentation-changelog と一致しているか / `task-workflow.md` current facts 追記が反映されているか。
- 運用性: PR description が dev → main 昇格時の self-review に必要十分な情報を含むか / Issue #234 を再オープンしない手順が明文化されているか。
- 認可境界: コミット差分に `SYNC_ADMIN_TOKEN` / `GOOGLE_FORMS_API_KEY` / OAuth secret 実値が混入していないか（grep）。
- docs-only 前提: 差分が `docs/` / `.claude/` / `LOGS.md` 系のみで `apps/` / `packages/` / workflow yaml / wrangler.toml が混入していないか。
- workflow_state 据え置き: artifacts.json が `spec_created` のままで、誤って `implemented` に昇格していないか。
- Issue 据え置き: `gh issue view 234` が CLOSED のままで、`gh issue reopen` が誤実行されていないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 承認ゲート通過 | 13 | spec_created | **user 承認なし禁止** |
| 2 | local-check-result（typecheck/lint/rg/validate/verify） | 13 | spec_created | 全 PASS |
| 3 | docs-only diff 検証（apps/ packages/ workflow yaml 0 件） | 13 | spec_created | 違反時は即停止 |
| 4 | 機密情報 grep | 13 | spec_created | 0 件 |
| 5 | task-workflow.md current facts 追記反映確認 | 13 | spec_created | rg で hit 確認 |
| 6 | UT-21 legacy 状態欄パッチ反映確認 | 13 | spec_created | rg で hit 確認 |
| 7 | change-summary 作成 | 13 | spec_created | user 提示用 |
| 8 | branch / commit / push | 13 | spec_created | 承認後のみ / branch 名固定 |
| 9 | gh pr create | 13 | spec_created | base=dev / head=feat/issue-234-... / Refs #234 |
| 10 | CI 確認 / PR 作成結果記録 | 13 | spec_created | gh pr checks |
| 11 | Issue #234 cross-link コメント追記（再オープン禁止） | 13 | spec_created | gh issue comment / reopen しない |
| 12 | マージ手順記録（user 操作） | 13 | spec_created | Claude は実行しない |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/local-check-result.md | typecheck / lint / docs-only diff / rg / 機密情報 grep / validate / verify / Issue 状態 |
| ドキュメント | outputs/phase-13/change-summary.md | PR description 草案（user 提示用） |
| ドキュメント | outputs/phase-13/pr-info.md | PR title / body / labels / base / head / 作業ブランチ |
| ドキュメント | outputs/phase-13/pr-creation-result.md | PR 番号 / URL / CI 状態 |
| ドキュメント | outputs/phase-13/issue-234-crosslink-record.md | Issue #234 への cross-link コメント追記記録（再オープン無し） |
| PR | user 承認後に作成 | UT-21 close-out docs-only PR（Issue #234 Refs / CLOSED 維持） |
| メタ | artifacts.json | 全 Phase 状態の更新（workflow_state は spec_created 据え置き） |

## 完了条件

- [ ] 承認ゲートの全項目が PASS（user 明示承認を含む）
- [ ] local-check-result が typecheck / lint / 新設禁止 rg / validate / verify 全 PASS
- [ ] docs-only diff 検証で `apps/` / `packages/` / workflow yaml / wrangler.toml の変更が 0 件
- [ ] 機密情報 grep が 0 件
- [ ] `task-workflow.md` current facts に UT-21 close-out 済追記が反映されている
- [ ] UT-21 当初仕様書（legacy）の状態欄パッチが反映されている
- [ ] change-summary が PR body と一致している
- [ ] PR が `feat/issue-234-ut21-forms-sync-closeout-task-spec` から作成され `Refs #234` で紐付いている（CLOSED のまま）
- [ ] CI（`gh pr checks`）が green
- [ ] reviewer 指定はブランチ戦略（solo / required reviewer なし）に従っている
- [ ] Issue #234 への cross-link コメントが追加されている（再オープン無し）
- [ ] マージ後、artifacts.json の全 Phase が `completed`（`metadata.workflow_state` は `spec_created` 据え置き）

## タスク100%実行確認【必須】

- 全実行タスク（12 件）が `spec_created`
- 承認ゲートが他のすべての手順より先行する設計になっている
- approval 取得前に commit / push / PR 作成しない方針が明文化されている
- docs-only 前提（`apps/` 等の変更 0 件）が承認ゲート / local-check / commit 直前に三重に確認されている
- マージ操作は user の領域として明確に分離されている
- Issue #234 を再オープンしない方針が複数箇所で明示されている
- 作業ブランチ名 `feat/issue-234-ut21-forms-sync-closeout-task-spec` が固定されている
- artifacts.json の `phases[12].user_approval_required = true`、`status = spec_created`

## 次 Phase

- 次: なし（タスク完了）
- 引き継ぎ事項:
  - PR マージ後、03a / 03b / 04c / 09b の各 Phase で受入条件 patch を適用する（本タスク責務外 / Phase 5 implementation-runbook 参照）
  - 後続独立タスク UT21-U02 / U04 / U05 の着手判断（既起票済）
  - artifacts.json の `phases[*].status` を `completed` に更新（user マージ後）。`metadata.workflow_state` は `spec_created` のまま据え置き
  - Issue #234 は CLOSED のまま維持
- ブロック条件:
  - user 承認が無い場合は PR 作成・push を一切実行しない
  - local-check-result のいずれかが FAIL（→ Phase 5 / 11 / 12 へ差し戻し）
  - docs-only diff 検証で `apps/` / `packages/` / workflow yaml / wrangler.toml の変更が検出（→ docs-only 前提崩壊 / 即停止）
  - 機密情報 grep で 1 件以上検出（→ 即時停止 / Phase 12 secret hygiene 再確認）
  - `metadata.workflow_state` が誤って `implemented` に昇格している
  - `task-workflow.md` current facts 追記が欠落している
  - Issue #234 が誤って再オープンされている（→ 即時 close 復旧）
