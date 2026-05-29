# Phase 12 — ドキュメント同期

## 1. 必須成果物（6 件）

| # | 出力 | 内容 |
|---|------|------|
| 12-1 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル概念）+ Part 2（型/API/コード例）|
| 12-2 | `outputs/phase-12/system-spec-update-summary.md` | Step 1-A/1-B/1-C/Step 2 判定 |
| 12-3 | `outputs/phase-12/documentation-changelog.md` | workflow-local + global skill sync を別ブロック |
| 12-4 | `outputs/phase-12/unassigned-task-detection.md` | 0 件でも出力。Phase 10 MINOR M-01 / M-02 を current として記録 |
| 12-5 | `outputs/phase-12/skill-feedback-report.md` | 改善点なしでも出力 |
| 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 headings 逐語 SSOT |

## 2. Task 12-1 実装ガイド要件

### Part 1（中学生レベル）

例え話: 「ホテルの受付」。お客様（ブラウザ）が来たとき、受付係（PublicHeader）はその人が「初めての人（guest）」「会員カードを持ったお客様（member）」「ホテルの支配人（admin）」のどれかを見分け、それぞれに合わせた案内を出す。

- なぜ必要か: ログイン済みなのに「ログイン」ボタンしか出ないと、お客様がマイページにたどり着けない。
- 何をするか: 受付係に「お客様の身分を判定する助手（resolveAuthView）」と「身分証を見にいく助手（getAuthView）」を付ける。

### Part 2（技術者レベル）

- `AuthView` discriminated union 型定義
- `resolveAuthView(session)` 純関数シグネチャ + 4 分岐表
- `getAuthView()` async helper + fail-closed 契約
- `PublicHeader` async server component の prop / fallback
- `(public)/layout.tsx` 配線スニペット
- エッジケース表（null / empty memberId / isAdmin null）

## 3. Task 12-2 システム仕様更新

| Step | 対応 |
|------|------|
| 1-A | 完了タスク記録（`docs/00-getting-started-manual/specs/02-auth.md` に AuthView 公開 surface を追記）+ aiworkflow-requirements LOGS.md + task-specification-creator LOGS.md + topic-map.md |
| 1-B | 実装状況テーブル: `AuthView 基盤` → `完了` |
| 1-C | 関連タスクテーブル: Task B/C/E/G の依存基盤完了を記録 |
| Step 2 | 新規 type `AuthView` を `02-auth.md` のインターフェース章に追記（新規型追加に該当） |

## 4. Task 12-3 changelog

- workflow-local: 8 file 追加/編集の diff サマリ
- global skill sync: aiworkflow-requirements `02-auth.md` への AuthView 型追記、LOGS.md 同波更新

## 5. Task 12-4 未タスク検出

| 候補 | 判定 | 理由 |
|------|------|------|
| M-01: getAuth 戻り値型変更検知の integration test | 未タスク化（FU-001） | 親 workflow `public-header-logged-in-nav-cleanup` の FU として登録 |
| M-02: child page test の async render 統一 | 未タスク化しない | 後続 Task B/C で実施予定（重複登録回避） |

## 6. Task 12-5 skill feedback

| 観点 | 内容 |
|------|------|
| テンプレート改善 | 「親 workflow を持つ single-task 仕様書」のテンプレ化候補 |
| ワークフロー改善 | discriminated union を `as const` literal で固定するパターンを `references/patterns.md` 追加候補 |

## 7. Task 12-6 compliance check

canonical 9 headings:
1. taskId / scope
2. implementation_mode
3. workflow_state
4. Phase 1-13 status
5. artifacts.json parity
6. Phase 11 evidence inventory
7. unassigned-task detection
8. skill sync
9. hasCompletedTasksAncestor

## 8. 完了条件

- [ ] 6 成果物すべて作成
- [ ] `artifacts.json` と `outputs/artifacts.json` parity
- [ ] indexes:rebuild idempotent
- [ ] LOGS.md 2 ファイル更新
