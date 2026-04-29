# Phase 13: PR 作成（承認ゲート必須）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | branch protection 草案の required_status_checks contexts と現行 CI job 名の同期 (UT-GOV-004) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-29 |
| 前 Phase | 12（ドキュメント更新 / close-out） |
| 次 Phase | なし（タスク完了） |
| 状態 | spec_created |
| タスク分類 | implementation / documentation（PR creation / approval gate） |
| **user_approval_required** | **true（最上位 / 厳守）** |
| 関連 Issue | #147（**既に CLOSED**） |

> **最上位ルール（最優先・厳守）**
>
> 1. **user の明示的承認なしに `git commit` / `git push` / `gh pr create` を実行してはならない**。
> 2. 承認ゲート（Phase 10 GO / Phase 11 evidence / Phase 12 compliance PASS）が **すべて PASS してから** user に change-summary を提示し、明示承認を取得する。
> 3. Issue #147 は既に CLOSED 済みのため、PR body では `Refs #147` を使い `Closes #147` / `Fixes #147` 等の **自動 close キーワードを使用しない**（再 close は不要・不可）。
> 4. PR の base ブランチは原則 `dev`。`main` への昇格は dev マージ後に別 PR で行う。

## 目的

Phase 1〜12 の成果物（実在 workflow 調査 / `gh api` 検証 evidence / 確定 contexts リスト / strict 採否 / lefthook ↔ CI 対応表 / docs sync）をまとめて PR を作成し、**user の明示承認**を経てレビュー → マージへ進める。承認ゲート前のいかなる commit / push / PR 作成も禁止する。

## 承認ゲート（approval gate）【最優先 / 必須】

PR 作成の前に下表の **すべて** が PASS している必要がある。

| ゲート項目 | 確認内容 | 参照成果物 | 状態 |
| --- | --- | --- | --- |
| Phase 10 GO 判定 | `outputs/phase-10/go-no-go.md` が GO | Phase 10 成果物 | 要確認 |
| Phase 11 evidence | `gh api` で確定 contexts の実績検証ログを採取済 | `outputs/phase-11/main.md` または `outputs/phase-11/manual-smoke-log.md` | 要確認 |
| Phase 12 compliance check | 全項目 PASS | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 要確認 |
| validate / verify スクリプト | exit 0 | `validate-phase-output.js` / `verify-all-specs.js` | 要確認 |
| change-summary レビュー | user が変更内容を把握 | 本 Phase ステップ 3 で生成 | **user 承認待ち** |
| 機密情報の非混入 | `gh auth token` / `GITHUB_TOKEN` 実値 / SA JSON / Bearer の混入なし | `git diff` + grep | 要確認 |
| Issue 状態確認 | #147 が CLOSED のままであり、自動 close キーワードを使わない方針が PR テンプレに反映済 | 本 Phase ステップ 3 PR body | 要確認 |
| PR 作成実行 | **user の明示的指示があった場合のみ実行** | — | **承認待ち** |

> **本ゲートが PASS するまで `git commit` / `git push` / `gh pr create` を一切実行しない**。

### 承認ゲートと上位 Phase 出力の連動

| 上位 Phase | 出力 | Phase 13 の利用先 |
| --- | --- | --- |
| Phase 10 | `outputs/phase-10/go-no-go.md`（GO/NO-GO） | 承認ゲート 1 行目 |
| Phase 11 | `outputs/phase-11/main.md`（gh api evidence） | PR body「動作確認」セクション |
| Phase 12 | `outputs/phase-12/documentation-changelog.md` | PR body「変更内容」セクションの根拠 |
| Phase 12 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 承認ゲート 3 行目 |
| Phase 8 | `outputs/phase-08/confirmed-contexts.yml` | UT-GOV-001 への唯一の機械可読入力 |

## 実行タスク

1. 承認ゲート 8 項目をすべて確認し、PASS した上で user に change-summary を提示する。
2. user の明示承認を取得する（取得できない場合はここで停止し、指摘事項を該当 Phase へ差し戻す）。
3. local-check-result（typecheck / lint / `validate-phase-output.js` / `verify-all-specs.js` / 機密 grep）を実行・記録する。
4. change-summary（PR description 草案）を作成する。
5. user 承認後、ブランチ確認 → 明示的 `git add` → commit → push → PR 作成を実行する。
6. CI 確認手順を記録する（マージ実行は user 操作領域）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-02/context-name-mapping.md | PR 変更説明の設計根拠 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-06/failure-cases.md | リスク説明の根拠 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-07/ac-matrix.md | AC カバレッジ根拠 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-09/main.md | QA 結果 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-12/documentation-changelog.md | PR 変更ファイル一覧の根拠 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-12/phase12-task-spec-compliance-check.md | 承認ゲート前提 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-08/confirmed-contexts.yml | UT-GOV-001 への唯一の機械可読入力 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-11/main.md | gh api 検証 evidence |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-10/go-no-go.md | GO 判定 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-004-required-status-checks-context-sync.md | 原典タスク指示書 |
| 必須 | CLAUDE.md | ブランチ戦略（dev=1 / main=2 / solo 運用）/ シークレット運用 |
| 参考 | docs/30-workflows/completed-tasks/task-verify-indexes-up-to-date-ci.md | CI gate 系 PR テンプレ参照 |

## 実行手順

### ステップ 1: 承認ゲート通過（user 承認必須）

1. 承認ゲート 8 項目のすべてを確認し、表形式で結果を `outputs/phase-13/main.md §approval-gate` に記録する。
2. 1 項目でも FAIL があれば該当 Phase（5 / 11 / 12）に差し戻す。
3. 全 PASS を確認したのち、change-summary（ステップ 3 で生成）を user に提示し **明示的な承認**を待つ。
4. 承認取得後にステップ 4 へ進む。承認が得られない場合はここで停止する。

### ステップ 2: local-check-result（PR 前ローカル確認）

```bash
# 型チェック / Lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# Phase / 仕様検証
mise exec -- node scripts/validate-phase-output.js \
  --task ut-gov-004-required-status-checks-context-sync
mise exec -- node scripts/verify-all-specs.js

# git status で意図せぬ変更が無いことを確認
git status

# 機密情報 grep（diff 全体に対して）
git diff --staged | grep -nE "ghp_|github_pat_|gho_|ghu_|ghs_|ghr_|-----BEGIN (RSA|EC|OPENSSH|PRIVATE)" || echo "no secrets"
```

| チェック項目 | 期待値 | 記録先 |
| --- | --- | --- |
| typecheck | exit 0 | outputs/phase-13/main.md §local-check |
| lint | exit 0 | 同上 |
| validate-phase-output.js | exit 0 | 同上 |
| verify-all-specs.js | exit 0 | 同上 |
| `git status` で意図せぬ変更無し | clean | 同上 |
| 機密情報 grep | 0 件 | 同上 |

### ステップ 3: change-summary（PR description 草案）

`outputs/phase-13/main.md` に以下構造で記述する。

#### 概要

UT-GOV-004 に基づき、`main` / `dev` ブランチに適用する branch protection の `required_status_checks.contexts` を、`.github/workflows/` 配下の **実在 workflow / job 名** および **`gh api` で確認できた実績** と同期させる。確定 contexts リスト・段階適用案・`strict` 採否・lefthook ↔ CI 対応表を `.claude/skills/aiworkflow-requirements/references/` に正本化し、UT-GOV-001（branch protection apply）が単一情報源として参照できる状態にする。

#### 動機

- GitHub Issue: **#147（CLOSED）** — UT-GOV-004 を遡及的に正規ワークフローへ整理するための仕様書化
- 草案 8 contexts と実在 job 名のドリフトを放置すると、UT-GOV-001 適用時点で main / dev への merge 経路が永久停止する
- ローカル lefthook と CI のチェック対応関係を文書化し、ローカル PASS → CI FAIL の摩擦を解消

#### 変更内容

**新規（docs）**:

- `docs/30-workflows/ut-gov-004-required-status-checks-context-sync/`（13 Phase + index.md + artifacts.json + outputs/）

**更新（references / 正本仕様）**:

- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`（実在 workflow / job 一覧 + 命名規則）
- `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md`（確定 contexts / strict 採否 / 段階適用ルール）
- `.claude/skills/aiworkflow-requirements/references/governance-hooks-factory-audit-sink.md`（lefthook ↔ CI 対応表 / drift 運用ルール）
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`

**同期（LOGS / SKILL）**:

- `docs/30-workflows/LOGS.md`
- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` / `SKILL.md`
- `.claude/skills/task-specification-creator/LOGS/_legacy.md` / `SKILL.md`

**更新（後続タスク連動）**:

- `docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md`（入力欄に本タスク確定 contexts への必須参照リンク追加）

**条件付き新規**:

- `scripts/governance/verify-required-contexts.sh`（追加した場合のみ・`metadata.taskType=implemented`）

#### 動作確認

- `gh api repos/:owner/:repo/commits/<recent-sha>/check-runs` で確定 contexts の実在性を検証（Phase 11 evidence）
- 草案 8 contexts のうち未存在のものを除外し、UT-GOV-005 へリレー（Phase 12 unassigned-task-detection）
- `validate-phase-output.js` / `verify-all-specs.js` exit 0
- typecheck / lint exit 0

#### リスク・後方互換性

- **branch protection の実 apply は本 PR では行わない**（UT-GOV-001 の責務）。本 PR は documentation / 設定値正本の確定のみ。
- 後方互換性: 既存 workflow / hook 動作への影響なし
- `scripts/governance/verify-required-contexts.sh` を追加する場合、実行には `gh auth login` 済みの環境が必要（CI からの実行は想定外）

#### 関連 Issue

`Refs #147`（CLOSED 済みのため自動 close は **使用しない**）

### ステップ 4: PR 作成（user 承認後のみ）

```bash
# 現在のブランチが feat/* であること確認
git status
git branch --show-current

# 必要なファイルを明示的に add（git add . / -A は使わない）
git add docs/30-workflows/ut-gov-004-required-status-checks-context-sync/ \
        docs/30-workflows/LOGS.md \
        docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md \
        .claude/skills/aiworkflow-requirements/references/deployment-gha.md \
        .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md \
        .claude/skills/aiworkflow-requirements/references/governance-hooks-factory-audit-sink.md \
        .claude/skills/aiworkflow-requirements/indexes/topic-map.md \
        .claude/skills/aiworkflow-requirements/LOGS/_legacy.md \
        .claude/skills/aiworkflow-requirements/SKILL.md \
        .claude/skills/task-specification-creator/LOGS/_legacy.md \
        .claude/skills/task-specification-creator/SKILL.md
# scripts/governance/verify-required-contexts.sh を追加した場合のみ
# git add scripts/governance/verify-required-contexts.sh

# コミット（CLOSED Issue のため Refs を使う / Closes は使わない）
git commit -m "$(cat <<'EOF'
docs(governance): UT-GOV-004 required_status_checks contexts を実在 CI job 名と同期 (Refs #147)

- .github/workflows/ の実在 workflow/job 名から確定 contexts リストを導出
- 草案 8 contexts のうち未存在のものは UT-GOV-005 へリレー
- strict 採否（dev=false / main=true）と段階適用ルールを正本化
- lefthook ↔ CI job 対応表を governance-hooks-factory-audit-sink.md に追加
- UT-GOV-001 が単一情報源として参照する状態を整備
- Phase 1〜12 の仕様書 + same-wave sync 完了

Refs #147
EOF
)"

# push
git push -u origin <feat-branch-name>

# PR 作成（base=dev / Closes は使わない）
gh pr create \
  --title "docs(governance): UT-GOV-004 required_status_checks contexts sync (Refs #147)" \
  --base dev \
  --head <feat-branch-name> \
  --body "$(cat <<'EOF'
## 概要
UT-GOV-004 に基づき、`main` / `dev` ブランチに適用する branch protection の `required_status_checks.contexts` を、`.github/workflows/` 配下の実在 workflow / job 名および `gh api` で確認できた実績と同期させます。確定 contexts リスト・段階適用案・strict 採否・lefthook ↔ CI 対応表を正本仕様に登録し、UT-GOV-001 が単一情報源として参照できる状態にします。

## 動機
- GitHub Issue: #147（CLOSED 済み・遡及的な仕様書化）
- 草案 contexts と実在 job 名のドリフト放置は、UT-GOV-001 適用時点で merge 経路を永続停止させる致命的リスクのため

## 変更内容
- 新規: docs/30-workflows/ut-gov-004-required-status-checks-context-sync/（13 Phase + index + artifacts + outputs）
- 更新: .claude/skills/aiworkflow-requirements/references/{deployment-gha,deployment-branch-strategy,governance-hooks-factory-audit-sink,topic-map}.md
- 同期: docs/30-workflows/LOGS.md / .claude/skills/*/LOGS.md / SKILL.md
- 連動: docs/30-workflows/completed-tasks/UT-GOV-001-*.md の入力欄に本タスク参照を追加
- 条件付き: scripts/governance/verify-required-contexts.sh（gh api 検証ヘルパー）

## 動作確認
- gh api commits check-runs で確定 contexts の実在性を検証（Phase 11 evidence）
- 未存在 context は UT-GOV-005 へリレー（Phase 12 unassigned-task-detection）
- validate-phase-output.js / verify-all-specs.js exit 0
- typecheck / lint exit 0

## リスク・後方互換性
- branch protection の実 apply は本 PR では行わない（UT-GOV-001 の責務）
- 既存 workflow / hook 動作への影響なし

## 関連 Issue
Refs #147（CLOSED 済みのため自動 close キーワードは使用しない）
EOF
)"
```

## PR テンプレ

| 項目 | 値 |
| --- | --- |
| title | `docs(governance): UT-GOV-004 required_status_checks contexts sync (Refs #147)` |
| body | 概要 / 動機 / 変更内容 / 動作確認 / リスク・後方互換性 / 関連 Issue（Refs のみ） |
| base | `dev`（推奨） → 後段で `main` 昇格 PR を別途作成 |
| head | `feat/<task-branch-name>` |
| reviewer | solo 開発のため必須レビュアー数 0（CLAUDE.md ブランチ戦略）。CI gate / 線形履歴 / force-push 禁止で品質担保 |
| labels | `area:governance` / `task:UT-GOV-004` / `wave:0`（infrastructure-setup） |
| linked issue | `Refs #147`（**`Closes` / `Fixes` 等の自動 close キーワードは使わない**） |

### target branch 判定

| 条件 | base ブランチ | 備考 |
| --- | --- | --- |
| 通常時 | `dev` | staging で確認後 main 昇格 PR を別途作成 |
| 緊急性が高く dev に他 PR が積まれている | `dev`（変更しない） | 段階適用のため dev 経由を厳守 |
| docs/正本のみで動作影響なしと user が判断 | `dev` → 後追いで `main` 昇格 | base を main に直接向けない |

## 承認後の自動同期手順（user 操作）

PR 作成後の以下は **user の操作領域**。Claude は実行せず、補助コマンドの提示のみ行う。

```bash
# CI 確認
gh pr checks <PR番号>

# user による承認後のマージ（user 操作）
gh pr merge <PR番号> --squash --delete-branch
```

- マージ後、`dev` から `main` への昇格 PR を別途作成する。
- マージ完了後、`artifacts.json` の全 Phase を `completed` に更新する。
- **Issue #147 は CLOSED 済みのため、再 close 操作は不要**。PR マージ完了をコメントで `gh issue comment 147 -b "..."` の形で連絡するのみ（任意）。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO 判定を承認ゲートの 1 行目に再利用 |
| Phase 11 | gh api evidence を PR の動作確認セクションに転記 |
| Phase 12 | documentation-changelog から PR 変更ファイルリストを生成 |
| 後続タスク UT-GOV-001 | 確定 contexts リストを本 PR マージ後に必須入力として参照 |
| 後続タスク UT-GOV-005 | 未存在 context（例: `phase-spec-validate` / `docs-link-check` / `security-scan`）の workflow 新設をリレー |

## 多角的チェック観点

- 価値性: PR が UT-GOV-001 の前提条件を満たし、merge 経路永続停止リスクを未然に防ぐ証跡へリンクできているか。
- 実現性: local-check-result（typecheck / lint / validate / verify）すべて PASS か。
- 整合性: change-summary が Phase 12 documentation-changelog と一致しているか。
- 運用性: PR description が dev → main 昇格時の判断材料を含むか。
- 認可境界: コミット差分に `gh auth token` / `GITHUB_TOKEN` 実値の混入が無いか（grep）。
- Issue 連携: PR body / commit message が `Refs #147` のみで、`Closes` / `Fixes` を使っていないか。
- 後方互換性: 本 PR は documentation / 正本更新のみで、既存 workflow / hook 動作に影響しないことを diff で再確認したか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 承認ゲート 8 項目 PASS 確認 | 13 | spec_created | **user 承認なし禁止** |
| 2 | local-check-result（typecheck/lint/validate/verify） | 13 | spec_created | 全 PASS |
| 3 | 機密情報 grep | 13 | spec_created | 0 件 |
| 4 | change-summary 作成 | 13 | spec_created | user 提示用 |
| 5 | branch / commit / push | 13 | spec_created | 承認後のみ・明示 add |
| 6 | gh pr create | 13 | spec_created | base=dev / Refs #147 |
| 7 | CI 確認 | 13 | spec_created | gh pr checks |
| 8 | マージ手順記録（user 操作） | 13 | spec_created | Claude は実行しない |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | approval-gate / local-check-result / change-summary / PR テンプレ / 承認ログ |
| PR | user 承認後に作成 | UT-GOV-004 PR（Refs #147・自動 close なし） |
| メタ | artifacts.json | 全 Phase 状態の更新（マージ後 completed） |

## 完了条件

- [ ] 承認ゲート 8 項目すべて PASS（user 明示承認を含む）
- [ ] local-check-result が typecheck / lint / validate / verify 全 PASS
- [ ] 機密情報 grep が 0 件
- [ ] change-summary が PR body と一致している
- [ ] PR が作成され `Refs #147` で参照（`Closes` / `Fixes` を使っていない）
- [ ] CI（`gh pr checks`）が green
- [ ] base=dev で作成されている（main 直接 PR 禁止）
- [ ] マージ後、artifacts.json の全 Phase が `completed`

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `spec_created`
- 承認ゲート 8 項目が他のすべての手順より先行する設計になっている
- approval 取得前に commit / push / PR 作成しない方針が最上位ルールとして明文化されている
- マージ操作は user の領域として明確に分離されている
- artifacts.json の `phases[12].user_approval_required = true`、`status = spec_created`
- Issue #147 が CLOSED 済みであることを前提に `Refs` 形式のみを使う方針が PR テンプレ / commit テンプレに反映されている

## 次 Phase

- 次: なし（タスク完了）
- 引き継ぎ事項:
  - 本 PR マージ後、UT-GOV-001（branch protection apply）が確定 contexts リストを唯一の入力として apply 実行可能になる
  - UT-GOV-005 へ未存在 context の workflow 新設をリレー（Phase 12 unassigned-task-detection 参照）
  - artifacts.json の `phases[*].status` を `completed` に更新（user マージ後）
- ブロック条件:
  - user 承認が無い場合は PR 作成・push を一切実行しない
  - local-check-result のいずれかが FAIL（→ Phase 5 / 11 / 12 へ差し戻し）
  - 機密情報 grep で 1 件以上検出（→ 即時停止 / Phase 12 secret hygiene 再確認）
  - PR body / commit message に `Closes #147` / `Fixes #147` が混入（→ ステップ 3 / 4 やり直し）

## 依存成果物参照

- `outputs/phase-02/context-name-mapping.md`
- `outputs/phase-02/staged-rollout-plan.md`
- `outputs/phase-02/lefthook-ci-correspondence.md`
- `outputs/phase-06/failure-cases.md`
- `outputs/phase-07/ac-matrix.md`
- `outputs/phase-09/main.md`
- `outputs/phase-09/strict-decision.md`
