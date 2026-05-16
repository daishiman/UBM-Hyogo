# Phase 12: skill / docs / system spec 同期計画

| 項目 | 値 |
|------|----|
| 入力 | 本仕様書一式 + 実装 commit |
| 出力 | skill indexes / 関連 docs の更新計画 |

---

## 1. 中学生レベル概念説明（Phase 12 SSOT 準拠）

> **何をやっているか**: 「重い自動テスト」を、本当にテストが必要な変更（アプリのコードや設定の変更）の時だけ動かすように設定する。文書だけ直したような変更では、重いテストは飛ばすけど「OK のハンコ」だけは押すように、もう一つの軽い workflow を用意する。これによって、PR を出してから merge できるまでの時間を短くする。
>
> もう一つの作業は、いろんな shell script で同じ書き方を毎回コピペしていたところを、共通の「下準備ファイル」に集めて、その shell script の文法ミスを自動で見つける gate も用意する。これで script のバグが本番で出にくくなる。

---

## 2. skill / indexes 更新

| 対象 | 操作 | コマンド / 手順 |
|------|------|----------------|
| `aiworkflow-requirements` indexes | rebuild | `mise exec -- pnpm indexes:rebuild` |
| `aiworkflow-requirements` indexes drift gate | CI で自動検証済（`verify-indexes-up-to-date`） | 追加対応不要 |
| `task-specification-creator` references | 不変条件追加なし | 追加対応不要 |
| `github-issue-manager` skill | Issue #668 を CLOSED 状態のまま据え置き、本仕様書 PR を関連リンクとして本文末に追記 | Phase 13 の user approval 後に `gh issue comment 668 --body "follow-up spec: docs/30-workflows/issue-668-stage3b-rb03-rb04-paths-filter-shell-helper/"` |

---

## 3. docs 更新

| 対象 | 操作 | 内容 |
|------|------|------|
| `docs/30-workflows/unassigned-task/task-e2e-stage3b-rb-followup-composite-actions-001.md` | edit（注記追加） | 冒頭に **deprecation 注記**「RB-3b-03 / RB-3b-04 は `docs/30-workflows/issue-668-stage3b-rb03-rb04-paths-filter-shell-helper/` に分割移管。本ファイルは履歴目的のみ」を追加 |
| `docs/30-workflows/LOGS.md`（存在する場合） | append | 本 PR merge 後、entry を 1 行追記 |
| `CLAUDE.md` | no-op | 不変条件への影響なし |
| `docs/00-getting-started-manual/specs/` | no-op | システム仕様への影響なし |

---

## 4. system spec への影響

| 観点 | 影響 |
|------|------|
| API schema | なし |
| D1 schema | なし |
| Auth | なし |
| Form schema | なし |
| design tokens | なし |
| branch protection | **要確認**: `e2e-tests-coverage-gate` context は本 PR でも同名で出力されるため、required check 設定の変更は **不要**。再確認のため `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection --jq '.required_status_checks.contexts'` を Phase 11 evidence に保存 |

---

## 5. compliance gate

| gate | 確認 |
|------|------|
| `verify-phase12-compliance` | 本 phase ファイルに「中学生レベル概念説明」見出しが存在することを確認（§1） |
| `verify-indexes-up-to-date` | `pnpm indexes:rebuild` 実行で drift なし |
| `verify-test-suffix` | 本タスクは新規 `*.test.*` を生成しないため自動 pass |
| `verify-design-tokens` | 影響なし |

---

## 6. Phase 12 strict 7 outputs

| ファイル | 状態 |
|----------|------|
| `outputs/phase-12/main.md` | implemented-local-runtime-pending close-out として作成済 |
| `outputs/phase-12/implementation-guide.md` | Part 1 / Part 2 作成済 |
| `outputs/phase-12/system-spec-update-summary.md` | Step 1-A〜1-C / Step 2 判定を記録済 |
| `outputs/phase-12/documentation-changelog.md` | 本サイクルの仕様改善履歴を記録済 |
| `outputs/phase-12/unassigned-task-detection.md` | 新規未タスク 0 件、旧 unassigned-task 分割移管を記録済 |
| `outputs/phase-12/skill-feedback-report.md` | 本仕様書内で反映したフィードバックを記録済 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | strict 7 / 4条件 / 30思考法 compact evidence を記録済 |

---

## 7. 完了条件

- [x] 中学生レベル概念説明 SSOT セクションが存在
- [x] skill indexes 再生成手順が明示
- [x] 旧 unassigned-task ファイルの deprecation 注記計画が記載
- [x] system spec への影響評価が完了
- [x] Phase 12 strict 7 outputs が実体ファイルとして存在
