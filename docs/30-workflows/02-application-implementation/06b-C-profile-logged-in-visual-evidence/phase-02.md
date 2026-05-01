# Phase 2: 設計 — 06b-C-profile-logged-in-visual-evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-C-profile-logged-in-visual-evidence |
| phase | 2 / 13 |
| wave | 6b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL |

## 目的

実行構造、evidence path、依存 matrix、rollback/skip 条件を設計する。

## 実行タスク

1. 参照資料と親タスクの状態を確認する。完了条件: 未実装・未実測の境界が記録される。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: AC と evidence path が対応する。
3. user approval または上流 gate が必要な操作を分離する。完了条件: 自走禁止操作が明記される。

## 参照資料

- docs/30-workflows/completed-tasks/UT-06B-PROFILE-VISUAL-EVIDENCE.md
- docs/30-workflows/completed-tasks/06b-parallel-member-login-and-profile-pages/
- docs/00-getting-started-manual/specs/06-member-auth.md
- docs/00-getting-started-manual/specs/07-edit-delete.md

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/06b-C-profile-logged-in-visual-evidence/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 04b /me and /me/profile, 05a/05b session establishment, 06b profile page
- 下流: 08b Playwright profile scenario, 09a staging visual smoke

## 多角的チェック観点

- #4 本文更新は Google Form 再回答のみ
- #5 public/member/admin boundary
- #8 localStorage/GAS prototype を正本にしない
- #11 管理者も他人本文を直接編集しない
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] outputs/phase-02/main.md を作成する

## 成果物

- outputs/phase-02/main.md

## 完了条件

- M-08 profile screenshot が保存されている
- M-09 no-form evidence で編集 form/input/textarea/submit が 0 件
- M-10 edit query ignored evidence が保存されている
- manual-smoke-evidence の該当行が captured に更新される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 3 へ、AC、blocker、evidence path、approval gate を渡す。
