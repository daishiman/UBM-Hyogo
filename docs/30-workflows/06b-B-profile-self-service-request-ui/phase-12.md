# Phase 12: ドキュメント更新 — 06b-B-profile-self-service-request-ui

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-B-profile-self-service-request-ui |
| phase | 12 / 13 |
| wave | 06b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

正本仕様、runbook、lessons learned の同期を定義する。

## 実行タスク

1. Phase 12 strict 7 files を作成する。完了条件: `outputs/phase-12/` に7ファイルが揃う。
2. aiworkflow-requirements の索引へ current canonical を同期する。完了条件: resource-map / quick-reference / task-workflow-active / legacy register に登録される。
3. skill feedback の要否を判定する。完了条件: no-op の場合も根拠を `skill-feedback-report.md` に記録する。
4. runtime evidence と spec evidence を分離する。完了条件: Phase 11 未実行を PASS と書かない。

## sync checklist

| Target | Action |
| --- | --- |
| `outputs/phase-12/implementation-guide.md` | Part 1 / Part 2 を作成 |
| `outputs/phase-12/system-spec-update-summary.md` | Step 1-A/B/C/H と Step 2 判定を記録 |
| `outputs/phase-12/documentation-changelog.md` | 同一 wave の変更履歴を記録 |
| `outputs/phase-12/unassigned-task-detection.md` | 0件でも出力 |
| `outputs/phase-12/skill-feedback-report.md` | 改善なしでも出力 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 4条件と artifacts parity を検証 |
| aiworkflow-requirements indexes | current canonical / active workflow / legacy root mapping を同期 |

## 参照資料

- docs/00-getting-started-manual/specs/05-pages.md
- docs/00-getting-started-manual/specs/07-edit-delete.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- apps/web/app/profile/page.tsx
- apps/web/app/profile/_components/EditCta.tsx
- apps/api/src/routes/me/index.ts

## 実行手順

- 対象 directory: docs/30-workflows/06b-B-profile-self-service-request-ui/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 04b /me self-service API, 06b profile page, 06b Auth.js session resolver follow-up
- 下流: 06b logged-in profile visual evidence, 08b profile E2E full execution

## 多角的チェック観点

- #4 profile body edit forbidden
- #5 apps/web D1 direct access forbidden
- #11 member self-service boundary
- 未実装/未実測を PASS と扱わない。
- プロトタイプと仕様書の採用/不採用を混同しない。

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] outputs/phase-12/main.md を作成する

## 成果物

- outputs/phase-12/main.md

## 完了条件

- マイページから公開停止/再公開申請を送れる
- マイページから退会申請を送れる
- 二重申請 409 をユーザーに分かる形で表示する
- 本文編集 UI は追加しない
- 申請 UI のスクリーンショット/E2E が保存される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 13 へ、AC、blocker、evidence path、approval gate を渡す。
