# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | CI/CD workflow topology and deployment spec drift cleanup (UT-CICD-DRIFT) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-29 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了） |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup（PR creation / approval gate） |
| user_approval_required | **true** |

## 目的

Phase 1〜12 の成果物（仕様書 13 Phase / drift マトリクス / 正本仕様更新案 / docs-only smoke 証跡 / docs sync）をまとめて PR を作成し、ユーザーの明示的な承認を経てレビュー → マージへ進める。承認ゲート前のいかなる commit / push / PR 作成も禁止し、approval を取得して初めて自動同期手順へ進む。

> **重要: このフェーズは user の明示的な承認なしに実行してはならない。**
> approval 取得前に commit / push / PR を作らない（厳守）。

> **docs-only 据え置き重要事項**: 本タスクは docs-only / specification-cleanup であり、PR 差分は仕様書（`docs/`）、aiworkflow-requirements の正本 references / indexes（`deployment-gha.md` / `deployment-cloudflare.md` / `resource-map.md` / `quick-reference.md` / `topic-map.md` / `keywords.json`）、LOGS / SKILL.md のみ。`apps/` / `packages/` / `.github/workflows/` / `wrangler.toml` への変更は **本 PR に含めてはならない**（含まれていた場合は docs-only 前提崩壊として停止）。

## 承認ゲート（approval gate）【最優先 / 必須】

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 10 GO 判定 | `outputs/phase-10/go-no-go.md` が GO | 要確認 |
| Phase 11 manual evidence | 8 項目すべて採取済（または N/A 理由明記） | 要確認 |
| Phase 12 compliance check | 全項目 PASS（docs-only close-out 据え置き含む） | 要確認 |
| validate / verify スクリプト | exit code 0 | 要確認 |
| `apps/` / `packages/` 配下の変更 | 0 件（docs-only 前提） | 要確認 |
| `workflow_state` 据え置き | root / outputs `artifacts.json` が `spec_created` | 要確認 |
| change-summary レビュー | user が変更内容を把握 | **user 承認待ち** |
| 機密情報の非混入 | Token / Account ID / OAuth secret 実値が無い | 要確認 |
| PR 作成実行 | **user の明示的な指示があった場合のみ実行** | **承認待ち** |

> **本ゲートが PASS するまで `git commit` / `git push` / `gh pr create` を一切実行しない**。

## 実行タスク

1. 承認ゲートを通過する（user に change-summary を提示し、明示承認を取得する）。
2. local-check（typecheck / lint / docs-only smoke 再確認 / 機密情報 grep）を実行・記録する。
3. change-summary（PR description 草案）を作成する。
4. user 承認後、ブランチ作成 → commit → push → PR 作成を実行する。
5. CI 確認と承認後マージの手順を記録する（マージ実行は user 操作）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-12/documentation-changelog.md | PR 変更ファイル一覧の根拠 |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-12/phase12-task-spec-compliance-check.md | 承認ゲート前提 |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-12/unassigned-task-detection.md | 派生 IMPL タスク起票方針 |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-11/main.md | docs-only smoke 検証サマリー |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-10/go-no-go.md | GO 判定 |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/index.md | PR タイトル / 説明根拠 |
| 必須 | CLAUDE.md | ブランチ戦略 / レビュー方針 |
| 参考 | docs/30-workflows/completed-tasks/ut-02-d1-wal-mode/phase-13.md | PR テンプレ参照 |

## 実行手順

### ステップ 1: 承認ゲート通過（user 承認必須）

1. Phase 10 GO 判定 / Phase 11 manual evidence / Phase 12 compliance check が PASS していることを確認する。
2. `validate-phase-output.js` / `verify-all-specs.js` が exit 0 であることを再確認する。
3. `git status` で `apps/` / `packages/` / `.github/workflows/` / `wrangler.toml` への変更が 0 件であることを確認する（docs-only 前提）。
4. root / outputs `artifacts.json` の `metadata.workflow_state` が `spec_created` のまま据え置かれていることを確認する。
5. change-summary を user に提示し、**明示的な承認**を待つ。
6. 承認取得後にステップ 2 へ進む。承認が得られない場合はここで停止し、指摘事項を Phase 5 / 11 / 12 に差し戻す。

### ステップ 2: local-check-result（PR 前ローカル確認 / docs-only 版）

```bash
# 型チェック / Lint（docs にも yaml / md がある場合の構文確認）
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# Phase 11 と同等の docs-only smoke 再確認
yamllint .github/workflows/
actionlint .github/workflows/*.yml
rg -n "node-version|pnpm|on:|jobs:" .github/workflows/

# docs-only 整合（apps / packages に変更がないこと）
git status --short apps/ packages/ .github/workflows/ apps/web/wrangler.toml apps/api/wrangler.toml

# 機密情報チェック
git diff --staged | rg -nE "ya29\\.|-----BEGIN PRIVATE|CLOUDFLARE_API_TOKEN=[A-Za-z0-9_-]{10,}|account_id\\s*=\\s*\"[A-Za-z0-9]{20,}\""
```

| チェック項目 | 期待値 | 記録先 |
| --- | --- | --- |
| typecheck | exit 0 | outputs/phase-13/local-check-result.md §1 |
| lint | exit 0 | outputs/phase-13/local-check-result.md §2 |
| yamllint / actionlint | exit 0 | outputs/phase-13/local-check-result.md §3 |
| `apps/` / `packages/` / workflow yaml diff | 0 件（docs-only 前提） | outputs/phase-13/local-check-result.md §4 |
| `git status` で意図せぬ変更が無い | clean（docs / .claude / artifacts 以外なし） | 同上 |
| 機密情報 grep | 0 件 | 同上 |
| `validate-phase-output.js` | exit 0 | 同上 |
| `verify-all-specs.js` | exit 0 | 同上 |

### ステップ 3: change-summary（PR description 草案）

`outputs/phase-13/change-summary.md` および `outputs/phase-13/pr-info.md` に以下構造で記述する。

#### 概要

UT-CICD-DRIFT に基づき、`.github/workflows/*.yml` の現行 workflow 実体と aiworkflow-requirements skill の正本仕様（`deployment-gha.md` / `deployment-cloudflare.md`）の drift を整理し、docs-only 差分（仕様書側の表記更新）を本 PR で反映する。実体側の修正が必要な差分（yaml / wrangler.toml 変更）は派生 `UT-CICD-DRIFT-IMPL-*` 派生タスクとして起票する。

#### 動機

- GitHub Issue: #58 (CLOSED) — CI/CD workflow topology / deployment spec drift cleanup
- 05a observability and cost guardrails が「存在しない workflow」を監視し続けるリスクを解消
- Pages build budget 前提と OpenNext Workers 方針の混在による運用判断の誤りを防止

#### 変更内容（docs-only）

**新規ファイル一覧**:

- `docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/index.md` / `artifacts.json`
- `docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/phase-01.md` 〜 `phase-13.md`
- `docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-*/...md`（各 Phase 成果物）
- `docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-*.md`（派生タスク起票分のみ）

**修正ファイル一覧**:

- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`（current facts への正確化）
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`（Pages / Workers / OpenNext 整理）
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` / `quick-reference.md` / `topic-map.md` / `keywords.json`（CI/CD workflow topology 導線を `generate-index.js` で同期）
- `.claude/skills/aiworkflow-requirements/LOGS.md`
- `.claude/skills/task-specification-creator/LOGS.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md` / `.claude/skills/task-specification-creator/SKILL.md`（更新事項あれば）
- `docs/30-workflows/LOGS.md`

> **`apps/` / `packages/` / `.github/workflows/*.yml` / `wrangler.toml` への変更は本 PR に含まれない**（docs-only 前提）。

#### 動作確認

- Phase 11 docs-only smoke 8 項目すべて PASS（`outputs/phase-11/manual-smoke-log.md`）
- `rg` / `yamllint` / `actionlint` / `gh issue view 58` 全 PASS
- link checklist 死リンク 0 件
- `validate-phase-output.js` / `verify-all-specs.js` exit 0

#### リスク・後方互換性

- **破壊的変更なし**（docs-only / 実装変更ゼロ）
- 派生 `UT-CICD-DRIFT-IMPL-*` タスクが完了するまで実体側 drift は解消されない（既知制限として明記）
- 後方互換性: 既存 workflow / API クライアント / ランタイム挙動への影響なし

#### 関連 Issue / 派生タスク

- 親: #58（CLOSED のまま、本仕様書を成果物として参照）
- 派生（起票予定 / 起票済）: `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` / `UT-CICD-DRIFT-IMPL-05A-OBSERVABILITY-MAPPING` 等

### ステップ 4: PR 作成（user 承認後のみ）

```bash
# 現在のブランチが feat/<task> であることを確認
git status
git branch --show-current

# 必要なファイルを明示的に add（git add . は使わない）
git add docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/ \
        docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-*.md \
        docs/30-workflows/LOGS.md \
        .claude/skills/aiworkflow-requirements/references/deployment-gha.md \
        .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md \
        .claude/skills/aiworkflow-requirements/indexes/resource-map.md \
        .claude/skills/aiworkflow-requirements/indexes/quick-reference.md \
        .claude/skills/aiworkflow-requirements/indexes/topic-map.md \
        .claude/skills/aiworkflow-requirements/indexes/keywords.json \
        .claude/skills/aiworkflow-requirements/LOGS.md \
        .claude/skills/task-specification-creator/LOGS.md

# `apps/` / `packages/` が含まれていないことを再確認
git diff --staged --name-only | rg "^(apps|packages|\\.github/workflows|.+wrangler\\.toml)" && echo "ABORT: docs-only 違反" || echo "docs-only OK"

# コミット
git commit -m "$(cat <<'EOF'
docs(30-workflows): UT-CICD-DRIFT CI/CD workflow topology drift cleanup (Issue #58)

- .github/workflows/*.yml と deployment-gha.md / deployment-cloudflare.md の drift 整理
- docs-only 差分は本 PR で反映、impl 必要差分は UT-CICD-DRIFT-IMPL-* 派生タスクへ
- Phase 1〜12 仕様書 + same-wave sync 完了 + workflow_state は spec_created 据え置き

Refs #58
EOF
)"

# push
git push -u origin feat/<task-name>

# PR 作成
gh pr create \
  --title "docs(30-workflows): UT-CICD-DRIFT CI/CD workflow topology drift cleanup" \
  --base dev \
  --head feat/<task-name> \
  --body "$(cat <<'EOF'
## 概要
UT-CICD-DRIFT に基づき、.github/workflows/*.yml の現行 workflow 実体と aiworkflow-requirements skill の正本仕様（deployment-gha.md / deployment-cloudflare.md）の drift を整理する docs-only PR です。

## 動機
- GitHub Issue: #58 (CLOSED) — CI/CD workflow topology / deployment spec drift cleanup
- 05a observability の監視前提が現実体と整合するよう正本側を修正
- Pages vs OpenNext Workers の判断材料を整理（最終判断は派生タスクへ委譲）

## 変更内容（docs-only）
- 新規: docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/ の仕様書 13 Phase + outputs
- 更新: .claude/skills/aiworkflow-requirements/references/deployment-gha.md / deployment-cloudflare.md / topic-map.md
- 同期: LOGS.md ×2 / SKILL.md ×2（更新事項あれば）
- 起票: UT-CICD-DRIFT-IMPL-* 派生 implementation タスク

## docs-only 前提
- apps/ / packages/ / .github/workflows/*.yml / wrangler.toml への変更は本 PR に含まれません
- workflow_state は spec_created のまま据え置き（implemented 昇格は派生タスク完了後）

## 動作確認
- Phase 11 docs-only smoke 8 項目 PASS
- rg / yamllint / actionlint / gh issue view #58 全 PASS
- validate-phase-output.js / verify-all-specs.js exit 0

## リスク・後方互換性
- 破壊的変更なし（docs-only）
- 実体側 drift の解消は派生 UT-CICD-DRIFT-IMPL-* に委譲

## 関連 Issue
Refs #58 (CLOSED)
EOF
)"
```

### ステップ 5: PR 作成結果記録

`outputs/phase-13/pr-creation-result.md` に PR 番号 / URL / CI 状態を記録する。

```bash
gh pr view <PR番号> --json number,url,state,statusCheckRollup
gh pr checks <PR番号>
```

## PR テンプレ

| 項目 | 値 |
| --- | --- |
| title | `docs(30-workflows): UT-CICD-DRIFT CI/CD workflow topology drift cleanup` |
| body | 概要 / 動機 / 変更内容 / docs-only 前提 / 動作確認 / リスク・後方互換性 / 関連 Issue（上記参照） |
| reviewer | solo 開発のため required reviewer なし（CLAUDE.md branch protection に従う） |
| base | `dev`（推奨） → 後段で `main` へ昇格 |
| head | `feat/<task-name>`（feature → dev → main） |
| labels | `area:docs` / `area:cicd` / `task:UT-CICD-DRIFT` / `wave:1` / `docs-only` |
| linked issue | Refs #58（CLOSED のまま） |

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

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO 判定を承認ゲートの前提として再利用 |
| Phase 11 | docs-only smoke 結果を PR の動作確認セクションに転記 |
| Phase 12 | documentation-changelog から変更ファイルリストを生成、unassigned-task-detection を関連タスク欄へ |

## 多角的チェック観点

- 価値性: PR が Issue #58 の drift 整理を完遂し、AC-1〜AC-11 の証跡へリンクできているか。
- 実現性: local-check-result が typecheck / lint / yamllint / actionlint / 機密情報 grep すべて PASS か。
- 整合性: change-summary が Phase 12 documentation-changelog と一致しているか。
- 運用性: PR description が dev → main 昇格時のレビュアーに必要十分な情報を含むか。
- 認可境界: コミット差分に Token / Account ID / OAuth secret 実値が混入していないか（grep）。
- docs-only 前提: 差分が `docs/` / `.claude/` / `LOGS.md` 系のみで `apps/` / `packages/` / workflow yaml / wrangler.toml が混入していないか。
- workflow_state 据え置き: artifacts.json が `spec_created` のままで、誤って `implemented` に昇格していないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 承認ゲート通過 | 13 | spec_created | **user 承認なし禁止** |
| 2 | local-check-result（typecheck/lint/yamllint/actionlint） | 13 | spec_created | 全 PASS |
| 3 | docs-only diff 検証（apps/ packages/ workflow yaml 0 件） | 13 | spec_created | 違反時は即停止 |
| 4 | 機密情報 grep | 13 | spec_created | 0 件 |
| 5 | change-summary 作成 | 13 | spec_created | user 提示用 |
| 6 | branch / commit / push | 13 | spec_created | 承認後のみ |
| 7 | gh pr create | 13 | spec_created | base=dev / head=feat |
| 8 | CI 確認 / PR 作成結果記録 | 13 | spec_created | gh pr checks |
| 9 | マージ手順記録（user 操作） | 13 | spec_created | Claude は実行しない |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/local-check-result.md | typecheck / lint / yamllint / actionlint / docs-only diff / 機密情報 grep 結果 |
| ドキュメント | outputs/phase-13/change-summary.md | PR description 草案（user 提示用） |
| ドキュメント | outputs/phase-13/pr-info.md | PR title / body / labels / base / head |
| ドキュメント | outputs/phase-13/pr-creation-result.md | PR 番号 / URL / CI 状態 |
| PR | user 承認後に作成 | UT-CICD-DRIFT docs-only PR（Issue #58 Refs） |
| メタ | artifacts.json | 全 Phase 状態の更新（workflow_state は spec_created 据え置き） |

## 完了条件

- [ ] 承認ゲートの全項目が PASS（user 明示承認を含む）
- [ ] local-check-result が typecheck / lint / yamllint / actionlint 全 PASS
- [ ] docs-only diff 検証で `apps/` / `packages/` / workflow yaml / wrangler.toml の変更が 0 件
- [ ] 機密情報 grep が 0 件
- [ ] change-summary が PR body と一致している
- [ ] PR が作成され Issue #58 に Refs で紐付いている（CLOSED のまま）
- [ ] CI（`gh pr checks`）が green
- [ ] reviewer がブランチ戦略（solo / required reviewer なし）に従って指定されている
- [ ] マージ後、artifacts.json の全 Phase が `completed`（`metadata.workflow_state` は `spec_created` 据え置き）

## タスク100%実行確認【必須】

- 全実行タスク（9 件）が `spec_created`
- 承認ゲートが他のすべての手順より先行する設計になっている
- approval 取得前に commit / push / PR 作成しない方針が明文化されている
- docs-only 前提（`apps/` 等の変更 0 件）が承認ゲート / local-check / commit 直前に三重に確認されている
- マージ操作は user の領域として明確に分離されている
- artifacts.json の `phases[12].user_approval_required = true`、`status = spec_created`

## 次 Phase

- 次: なし（タスク完了）
- 引き継ぎ事項:
  - PR マージ後、派生 `UT-CICD-DRIFT-IMPL-*` タスクの起票・着手を行う（本タスク責務外）
  - UT-GOV-001 / UT-GOV-003 / UT-26 / 05a observability の index.md を双方向更新済みとして記録
  - artifacts.json の `phases[*].status` を `completed` に更新（user マージ後）。`metadata.workflow_state` は `spec_created` のまま据え置き
- ブロック条件:
  - user 承認が無い場合は PR 作成・push を一切実行しない
  - local-check-result のいずれかが FAIL（→ Phase 5 / 11 / 12 へ差し戻し）
  - docs-only diff 検証で `apps/` / `packages/` / workflow yaml / wrangler.toml の変更が検出（→ docs-only 前提崩壊 / 即停止）
  - 機密情報 grep で 1 件以上検出（→ 即時停止 / Phase 12 secret hygiene 再確認）
  - `metadata.workflow_state` が誤って `implemented` に昇格している
