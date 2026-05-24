# Phase 12: ドキュメント更新

[実装区分: ドキュメントのみ]

**判定根拠**: Phase 12 strict 7 outputs（main.md + 必須 6 成果物）の生成のみで、runtime code / D1 / Secret 変更なし。

---

## メタ情報

| 項目 | 値 |
|------|----|
| Workflow | issue-291-forms-d1-legacy-followup-cleanup |
| 実装区分 | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #291 (CLOSED, Refs only) |

## 目的

task-specification-creator skill の Phase 12 仕様に従い、close-out evidence として strict 7 outputs（main.md + 必須 6 成果物）を全件生成する。本 spec phase ではそれぞれの **セクション構成と必須項目** を定義する。実コンテンツは Phase 5 実編集と Phase 11 evidence 確定後に生成される。

---

## 2. スコープ

### 対象（Phase 12 strict 7 outputs）

1. `main.md`
2. `implementation-guide.md`（Part 1 中学生レベル + Part 2 技術者レベル）
3. `system-spec-update-summary.md`
4. `documentation-changelog.md`
5. `unassigned-task-detection.md`（0 件でも必須）
6. `skill-feedback-report.md`（改善点なしでも必須）
7. `phase12-task-spec-compliance-check.md`

### 対象外

- スクリーンショット（NON_VISUAL）
- 新規 IPC surface / 新規型定義

---

## 3. 前提条件

- Phase 11 NON_VISUAL evidence が確定済み
- Phase 10 go / conditional-go 判定済み
- root `artifacts.json` と `outputs/artifacts.json` mirror が parity

---

## 実行タスク

### 4.1 `implementation-guide.md` の必須セクション

#### Part 1（中学生レベル）

```markdown
# Forms D1 legacy follow-up cleanup — 実装ガイド

## Part 1: 概念説明（中学生レベル）

### 何が起きた？
- 昔（u-04 時代）は Google Sheets API で会員データを D1（データの貯蔵庫）に同期していた
- 今は Google Forms API で直接同期する仕組みに変わった
- でも、参考ドキュメント（references）には昔のやり方の説明が残っていた

### なぜ整理が必要？
- 新しく実装する人が、古いやり方を「今のやり方」と勘違いするから
- 図書館の「最新版コーナー」に古い本が紛れていると、読む人が間違えるのと同じ

### 何をした？
- 古いやり方の説明には「（昔の方式・廃止済み）」と注記を付けた
- 新しい関連タスクからは「昔の整理タスクへのリンク」を辿れるようにした
```

#### Part 2（技術者レベル）

```markdown
## Part 2: 技術的詳細

### Current 経路（編集後の正本）
- API: `POST /admin/sync/schema` + `POST /admin/sync/responses`
- D1 table: `sync_jobs`（02c owner）+ `schema_versions` / `schema_questions` / `schema_diff_queue`（03a owner）+ `member_responses` / `member_identities` / `member_status`（03b owner）
- Secret: `GOOGLE_SERVICE_ACCOUNT_JSON`（Forms API 用）/ `SYNC_ADMIN_TOKEN`（split endpoint のみ）
- Provider: Google Forms API（u-04 legacy では Google Sheets API v4）

### 編集対象（5 references + 1 backlog）
- `api-endpoints.md` L69-74
- `environment-variables.md` L55, L65, L436, L442, L443
- `deployment-cloudflare.md` L293
- `deployment-secrets-management.md` L86
- `architecture-overview-core.md` L243
- `task-workflow-backlog.md` L349, L350

### 視覚証跡
UI/UX 変更なしのため Phase 11 スクリーンショット不要。代替証跡として `outputs/phase-11/manual-test-result.md` および `rg-before-after.md` を参照。

### Issue 参照モード
`Refs #291` のみ（`Closes #291` 禁止。Issue は既に CLOSED）
```

### 4.2 `system-spec-update-summary.md` の必須セクション

```markdown
# システム仕様書 更新サマリ

## Step 1-A: タスク完了記録
- 完了タスク: issue-291-forms-d1-legacy-followup-cleanup
- 関連: task-sync-forms-d1-legacy-umbrella-001
- 変更履歴: references 5 + backlog 1 の current drift 解消
- LOGS.md 更新: aiworkflow-requirements/LOGS.md + task-specification-creator/LOGS.md
- topic-map 更新: 該当時のみ

## Step 1-B: 実装状況テーブル更新
- 旧: current drift 残存
- 新: current = Forms API + split endpoint + sync_jobs に固定

## Step 1-C: 関連タスクテーブル更新
- 03a / 03b / 04c / 09b / 02c の related-tasks セクションに legacy umbrella 逆リンクを追加

## Step 2: 新規インターフェース判定
- 該当なし（仕様掃除のみ、新規 IPC / 型定義なし）
```

### 4.3 `documentation-changelog.md` の必須セクション

各 Step を個別に記録（該当なしも明記）:

```markdown
# Documentation Changelog

## Step 1-A: タスク完了記録
- 更新ファイル: ...

## Step 1-B: 実装状況テーブル
- 更新ファイル: ...

## Step 1-C: 関連タスクテーブル
- 更新ファイル: ...

## Step 2: ドメイン同期
- 該当なし（新規 interface なし）

## Workflow-local 同期 vs Global skill sync
（別ブロックで区別して記録）
```

### 4.4 `unassigned-task-detection.md`（0 件でも必須）

```markdown
# 未タスク検出レポート

## 検出ソース
- 元タスク仕様書: スコープ外項目なし
- Phase 3 レビュー: MINOR 指摘 X 件
- Phase 10 レビュー: MINOR 指摘 X 件
- Phase 11 手動 smoke: スコープ外発見 X 件
- TODO/FIXME/HACK: 0 件
- describe.skip: 該当なし

## 検出結果
（0 件でも 0 件と明記）

検出事項が 1 件以上ある場合は、各行の処理状態を `implemented` / `rejected-with-reason` / `linked-existing-task` / `new-task-created` のいずれかに分類する。0 件と記録できるのは、元タスク仕様書・Phase 3/10 レビュー・Phase 11 smoke・TODO/FIXME/HACK・skip scan の全ソースを確認済みの場合のみ。

## 関連タスク差分確認
- 既存タスクとの重複: なし
```

### 4.5 `skill-feedback-report.md`（改善点なしでも必須）

```markdown
# スキルフィードバックレポート

## テンプレート改善
- closed-issue-canonical-workflow-recovery パターンの適用結果

## ワークフロー改善
- legacy umbrella → follow-up cleanup の連鎖判定パターン
- stale 0 hit 自己申告禁止ルールの effectiveness

## ドキュメント改善
- 共通テンプレート（Phase 8）が他 legacy 整理タスクに転用可能か
```

### 4.6 `phase12-task-spec-compliance-check.md`

```markdown
# Phase 12 タスク仕様 compliance check

## canonical 9 headings parity
- 全 phase-*.md が 9 headings で構成されているか

## Phase 11 evidence 表
- NON_VISUAL 宣言 + rg before/after diff 引用

## workflow root scan
- root `artifacts.json` / `outputs/artifacts.json` mirror parity
- root evidence file 存在確認

## identifier consistency
- references 編集前後の current API 名 / D1 table 名が implementation-guide.md と一致
```

### 4.7 同波更新の徹底

Phase 12 close-out では以下を **同一 wave** で更新する（[FB-04] 対策）:

1. backlog ledger（`task-workflow-backlog.md`）
2. completed ledger（`task-workflow-completed.md`、本タスク追記）
3. lane index（該当時）
4. workflow artifacts（本 `artifacts.json`）
5. skill artifacts（aiworkflow-requirements / task-specification-creator）
6. aiworkflow-requirements artifact inventory（`workflow-issue-291-forms-d1-legacy-followup-cleanup-artifact-inventory.md`）

### 4.8 indexes 再生成

すべての references / SKILL.md / LOGS.md 更新後に再生成:

```bash
mise exec -- pnpm indexes:rebuild
```

---

## 成果物

| ファイル | 必須項目 |
|---------|---------|
| `outputs/phase-12/main.md` | Phase 12 全タスク完了サマリ |
| `outputs/phase-12/implementation-guide.md` | Part 1 + Part 2 + 視覚証跡（NON_VISUAL）+ Issue 参照モード |
| `outputs/phase-12/system-spec-update-summary.md` | Step 1-A/B/C + Step 2（N/A）|
| `outputs/phase-12/documentation-changelog.md` | 全 Step を個別記録（該当なしも記載）|
| `outputs/phase-12/unassigned-task-detection.md` | 0 件でも検出ソース別記録 |
| `outputs/phase-12/skill-feedback-report.md` | テンプレート/ワークフロー/ドキュメント 3 観点 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 headings parity + Phase 11 evidence + identifier consistency |

---

## 完了条件

- [ ] Phase 12 strict 7 outputs（main.md + 必須 6 成果物）が全件存在
- [ ] implementation-guide.md が Part 1/2 構成
- [ ] 視覚証跡セクションに NON_VISUAL 固定フレーズ記載
- [ ] documentation-changelog.md に全 Step が個別記録
- [ ] unassigned-task-detection.md が 0 件でも出力
- [ ] 検出事項がある場合は `implemented` / `rejected-with-reason` / `linked-existing-task` / `new-task-created` のいずれかに分類済み
- [ ] skill-feedback-report.md が改善点なしでも出力
- [ ] phase12-task-spec-compliance-check.md が root evidence として残る
- [ ] backlog / completed / artifacts / skill / artifact inventory の 6 点同波更新済み
- [ ] `pnpm indexes:rebuild` 実行済み、drift 0
- [ ] `artifacts.json` phase 12 status → `completed`

---

## 7. リスクと対策

| リスク | 対策 |
|--------|------|
| strict 7 outputs のうち一部欠落で false complete | Phase 12 完了前に `ls outputs/phase-12/` と artifacts.json の outputs 配列を 1:1 突合 |
| Part 1 / Part 2 構成漏れ | implementation-guide.md ファイル先頭に `## Part 1: 概念説明（中学生レベル）` / `## Part 2: 技術的詳細` の見出しを必須化 |
| documentation-changelog.md に「該当なし」記録漏れ | Step 1-A/B/C/Step 2 を空欄チェックリストで先に作成し、逐次消化 |
| identifier drift | Phase 12 Task 12-6 で implementation-guide.md 内の API 名 / D1 table 名 / endpoint 名を実 references と grep 突合 |

---

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md`
- `.claude/skills/task-specification-creator/references/spec-update-workflow.md`
- `.claude/skills/task-specification-creator/references/phase-template-audit-task.md`
- `.claude/skills/task-specification-creator/assets/phase12-task-spec-compliance-template.md`

---

## 9. 次フェーズへの引き継ぎ

Phase 13 で本 phase の implementation-guide.md を PR 本文の主要セクションに反映する。`Refs #291` のみ・`Closes #291` 禁止を厳守。
