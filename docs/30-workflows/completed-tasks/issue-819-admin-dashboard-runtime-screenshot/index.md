# issue-819-admin-dashboard-runtime-screenshot

> Source issue: [#819](https://github.com/daishiman/UBM-Hyogo/issues/819)（CLOSED のまま仕様書化 / ユーザー明示指示）
> Parent workflow: `docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/`
> Unassigned-task spec: `docs/30-workflows/unassigned-task/step-05-followup-001-admin-dashboard-runtime-screenshot-capture.md`
> 実装区分: **実装仕様書**（コード変更ゼロを基本とするが、populated 状態取得のため一時 fixture 注入＋revert を行うため、ファイル変更・テスト・検証コマンドを含む実装仕様として作成）
> 判定根拠: 「dummy PNG → 本物 PNG 置換」「親 workflow 配下 outputs/phase-11/main.md / phase-12/main.md の status 行更新」「一時 fixture 注入と revert」を伴うため CONST_005 を満たす必要があり docs-only 仕様では完了不可能
> taskType: implementation
> visualEvidence: VISUAL_ON_EXECUTION
> workflow_state: implemented_runtime_evidence_captured

| メタ情報 | 値 |
| --- | --- |
| タスク種別 | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_runtime_evidence_captured |

> 状態更新 (2026-05-20): PNG 置換 (920x352 / 920x135) と Playwright runtime spec (`apps/web/playwright/tests/issue-819-status-distribution.spec.ts`) 取得が完了し、親 `step-05-dashboard-chart-implementation` 配下 outputs/phase-11/main.md と outputs/phase-12/main.md は `runtime_completed` に同期済み。残るユーザ承認境界は commit / push / PR のみ。

## 概要

`step-05-dashboard-chart-implementation` で実装した admin dashboard `StatusDistribution` の SVG bar chart について、Phase 11 evidence inventory に **16x16, 445B の dummy PNG** で配置されている 2 件の screenshot を、authenticated admin context で取得した本物 PNG に置換する。あわせて親 workflow の Phase 11 / Phase 12 main.md と unassigned-task-detection.md を `runtime_completed` に更新し、本サイクル内で runtime evidence capture を完了させる。

## 調査サマリ（Issue 819 が現在も必要な根拠）

| 確認項目 | 結果 |
|---|---|
| Issue state | closed (2026-05-20) ※実体は未完了 |
| `admin-dashboard-chart.png` の実体 | PNG 16x16 / 445B のダミー（`file` コマンドで確認） |
| `admin-dashboard-placeholder.png` の実体 | PNG 16x16 / 445B のダミー（同上） |
| `StatusDistribution.tsx` 実装 | 最新 dev (commit 0c9ef3152) に存在・現行 spec と整合 |
| 別タスクで evidence 取得済みか | 否（直近 commit #820/#821/#826/#830/#831 いずれも本件未対応） |

→ Issue は close 済みだが evidence completion 作業は別 PR で実施されていない。タスク仕様書作成と実装フローの実行が必要。

## 親 workflow との関係

- 親タスク状態: `implemented_local_evidence_captured`
- 親 user-gated boundary（changelog より）: **authenticated runtime screenshots, commit, push, PR**
- 本タスクは「authenticated runtime screenshots」境界を消し込み、親 workflow を `implemented_runtime_evidence_captured` に進める

## 不変条件（CLAUDE.md UI prototype alignment / MVP recovery 準拠）

1. 既存 API endpoint surface (`GET /admin/dashboard`) のみ利用。新規 endpoint 追加禁止
2. `apps/web/src/styles/tokens.css` の OKLch token 正本。HEX 直書き禁止
3. chart dependency (recharts / visx 等) 追加禁止。SVG 直書きを維持
4. `apps/web` → D1 直接アクセス禁止
5. `StatusDistribution.tsx` のロジック変更禁止（既存実装をそのまま使う）
6. 一時 fixture 注入は許容するが、同 phase 内で必ず revert し `git status` クリーンを AC-4 で確認

## Phase 一覧

| Phase | File | 内容 |
|---|---|---|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義 |
| 2 | [phase-2-design.md](phase-2-design.md) | 設計（fixture 注入戦略） |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | テスト計画 |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装手順（fixture 注入 / screenshot 取得 / revert） |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | テスト追加（差分なし判定） |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | カバレッジ（既存維持確認） |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタ（差分なし判定） |
| 9 | [phase-9-qa.md](phase-9-qa.md) | QA |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動テスト（screenshot 取得本体） |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | ドキュメント（中学生レベル概念説明含む） |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成 |

## 変更対象ファイル

| パス | 変更種別 | 備考 |
|---|---|---|
| `docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-11/screenshots/admin-dashboard-placeholder.png` | 置換 | dummy → 本物 PNG |
| `docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-11/screenshots/admin-dashboard-chart.png` | 置換 | dummy → 本物 PNG |
| `docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-11/main.md` | 編集 | screenshot section の status 行 `runtime_pending` → `runtime_completed` |
| `docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-12/main.md` | 編集 | §6 残課題から authenticated runtime screenshot 項目を consumed に更新 |
| `docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-12/unassigned-task-detection.md` | 編集 | 本 followup の consumed 行追記 |
| `docs/30-workflows/unassigned-task/step-05-followup-001-admin-dashboard-runtime-screenshot-capture.md` | 削除 or status 更新 | consumed として親 completed-tasks 配下に移管 or status 行を `consumed_by: issue-819-admin-dashboard-runtime-screenshot` に更新 |
| `apps/web/src/app/(admin)/admin/page.tsx`（または `StatusDistribution` caller） | 一時編集 → 必ず revert | populated 状態 screenshot 取得のためのプロパティ固定値注入（Phase 5 で詳述）|

## スコープ外 (CONST_007 例外なし)

- `StatusDistribution.tsx` の恒久的ロジック変更 → 対象外（既存実装維持）
- `apps/api/src/routes/admin/dashboard.ts` への新規 producer 追加 → 既に親 workflow で完了済み
- 新規 design token 追加 → 不変条件 2 に反するため対象外
- task-18 visual regression baseline への登録 → 別 workflow (task-18) のスコープ

すべて今サイクル内で完了するスコープ（先送りなし）。commit / push / PR は user-gated。
