# Phase 12: ドキュメント整備（6 必須タスク）— 索引

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| 作成日 | 2026-05-06 |
| 状態 | completed_local_sync |
| 親 Issue | #348 (CLOSED) |
| workflow_state ルール | 実コードが配置済みのため `implemented-local` に同期する。GitHub Release mutation は Phase 11 user gate 後まで未実行。 |

## 目的

task-specification-creator skill 規定の **6 必須タスク** を整備し、release note 自動生成の構造（script + workflow + runbook + SSOT）を Part 1（中学生レベル）/ Part 2（技術者レベル）両面で説明する。

## Step 0: P50 チェック（必須）

- [x] Phase 11 local evidence が実体配置済（GitHub Release view JSON は user gate 後）
- [x] Phase 5-9 実装が完了し PR 直前
- [x] aiworkflow-requirements `references/release-runbook.md` が新規 or 編集済

## 6 必須タスクと成果物

| # | 必須タスク | 成果物 |
| --- | --- | --- |
| 1 | implementation guide（中学生レベル + 技術者レベル） | `outputs/phase-12/implementation-guide.md` |
| 2 | docs / SSOT 更新履歴 | `outputs/phase-12/documentation-changelog.md` |
| 3 | 残課題（unassigned）検出（0 件でも必須） | `outputs/phase-12/unassigned-task-detection.md` |
| 4 | task-specification-creator skill への feedback | `outputs/phase-12/skill-feedback-report.md` |
| 5 | spec compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| 6 | aiworkflow-requirements SSOT 反映ログ | `outputs/phase-12/system-spec-update-summary.md` |

## 各成果物の必須内容

### 1. `implementation-guide.md`

- **Part 1（中学生レベル / 比喩 = 自動おしらせ係）**: 「リリースタグが打たれたら、その日の変更点を自動で『おしらせ文』に組み立てて GitHub の Releases ページに貼り付ける係を作る」を 200-300 字で説明。
- **Part 2（技術者レベル）**: 以下の data flow 図と各構成要素の責務分離を記載。
  - data flow: `git tag push (vYYYYMMDD-HHMM)` → `.github/workflows/release-create.yml` → `scripts/release/generate-release-notes.sh`（template + Phase 12 changelog + Phase 11 evidence URL を merge）→ `scripts/release/create-github-release.sh`（dry-run → apply 2 段ゲート）→ `gh release create` → GitHub Release ページ
  - 入力 SSOT: Phase 12 `documentation-changelog.md` のみ
  - 検証境界: tag format（`vYYYYMMDD-HHMM`）/ template placeholder 全置換 / dry-run 決定論性
  - manual fallback: `docs/runbooks/release-create.md`

### 2. `documentation-changelog.md`

新規 / 編集ファイルを表形式で列挙:

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `scripts/release/release-notes.template.md` | 新規 | release note placeholder template |
| `scripts/release/generate-release-notes.sh` | 新規 | template + changelog + evidence URL merge |
| `scripts/release/create-github-release.sh` | 新規 | tag 検証 → dry-run → apply 3 段ゲート |
| `scripts/release/__tests__/generate-release-notes.bats` | 新規 | bats テスト 8 TC |
| `.github/workflows/release-create.yml` | 新規 | tag push / workflow_dispatch トリガ |
| `docs/runbooks/release-create.md` | 新規 | manual fallback runbook |
| `.claude/skills/aiworkflow-requirements/references/release-runbook.md` | 新規 or 編集 | SSOT 反映 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 編集 | 新 reference index 追加 |

### 3. `unassigned-task-detection.md`

**0 件でも出力必須**。本タスクで完結せず後続タスク化される項目を列挙:

- Slack 通知連携（`task-09c-incident-runbook-slack-delivery-001` の責務 / 本タスクスコープ外）
- rollback release 削除自動化（事故時に `gh release delete --yes` を実行する小タスクとして別 Issue 化候補）
- prerelease vs stable 切替の運用ポリシー（タグ命名規則の拡張要否）

該当なしの場合は「検出なし」と明記し、その判定理由（スコープ完結を確認した evidence ファイル名）を併記する。

### 4. `skill-feedback-report.md`

task-specification-creator skill への feedback。改善点が無くても以下 **3 観点固定** で記述:

1. **テンプレート観点**: Phase 10/11/12/13 thin pointer + outputs body の 2 層構造が retention task / release task で再利用できたか
2. **ワークフロー観点**: user gate（Phase 11 `--apply` / Phase 13 `commit/push/PR`）の境界が明示できたか
3. **ドキュメント観点**: NON_VISUAL evidence の必須ファイル化（Phase 11 の 3 ファイル）が spec 段階で確定できたか

### 5. `phase12-task-spec-compliance-check.md`

spec compliance 検証チェックリスト:

- [ ] Phase 1-13 すべてに index.md からの参照が通っている
- [ ] artifacts.json の `phases.phase-N.outputs` がすべて実体ファイルと一致
- [ ] Phase 12 6 必須成果物がすべて実体配置
- [ ] index.md `claudeCodeContext` の値が Phase 13 の `gh pr create` 引数と一致
- [ ] `status:unassigned` ラベルが PR 側に付与されない仕様になっている

### 6. `system-spec-update-summary.md`

aiworkflow-requirements への反映ログ:

- 新規追加: `.claude/skills/aiworkflow-requirements/references/release-runbook.md`
- index 反映: `.claude/skills/aiworkflow-requirements/indexes/keywords.json` に `release-runbook` / `gh release create` / `vYYYYMMDD-HHMM` 等のキーワード追加
- `pnpm indexes:rebuild` の実行コマンドと再生成 evidence の保存先（`outputs/phase-12/indexes-rebuild.log`）

## DoD

- [x] 6 必須成果物すべて実体配置
- [x] `implementation-guide.md` に Part 1 / Part 2 両方が含まれる
- [x] `unassigned-task-detection.md` が 0 件の場合でも判定理由付きで存在
- [x] `system-spec-update-summary.md` に `pnpm indexes:rebuild` evidence への参照
- [x] 実コード配置済みのため workflow_state / artifacts.json を `implemented-local` に同期

## 成果物

- `outputs/phase-12/phase-12.md`（本ファイル / 索引）
- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 次 Phase の前提条件

6 必須成果物すべての実体配置と compliance check PASS。
