# Phase 1: 要件定義 — 06b-C-profile-logged-in-visual-evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-C-profile-logged-in-visual-evidence |
| phase | 1 / 13 |
| wave | 6b-fu |
| mode | parallel（実依存は serial: 06b-A → 06b-B → 06b-C） |
| 作成日 | 2026-05-03 |
| taskType | implementation-spec |
| 実装区分判定根拠 | Playwright spec (`apps/web/playwright/tests/profile-readonly.spec.ts`) と evidence capture wrapper (`scripts/capture-profile-evidence.sh`) の新規追加を伴うため、CONST_004 に基づき docs-only ではなく実装仕様書扱い |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

logged-in 状態の `/profile` 画面に対して、編集 UI が存在しない（read-only 境界）ことを画面と DOM で実測し、M-08 / M-09 / M-10 / M-14 / M-15 / M-16 の visual evidence を取得するための前提・成功条件を確定する。本 Phase ではアプリ本体の機能追加は行わない。実測再現性確保のための Playwright spec と capture script の必要性を Phase 5 に引き渡す。

## 実行タスク

1. 親タスク 06b の visual evidence 状況（既取得 / 未取得）の境界を確定する。完了条件: M-08〜M-10、M-14〜M-16 の現在の status が表で記録される。
2. AC 表（マーカー × evidence path × 検証手段）を確定する。完了条件: 各 AC が 1 つ以上の evidence file path に対応している。
3. user approval gate を分離する。完了条件: staging アクセス、Magic Link 取得、screenshot redaction が approval 必要操作として明記される。
4. Out-of-Scope を確定する。完了条件: 「profile 編集 UI 追加」「API 仕様変更」「production deploy」が含まれていない。

## 参照資料

| 資料 | パス |
| --- | --- |
| 親タスク完了記録 | `docs/30-workflows/completed-tasks/UT-06B-PROFILE-VISUAL-EVIDENCE.md` |
| 親タスク本体 | `docs/30-workflows/completed-tasks/06b-parallel-member-login-and-profile-pages/` |
| 直近同 wave | `docs/30-workflows/completed-tasks/06b-B-profile-self-service-request-ui/` |
| Member 認証 | `docs/00-getting-started-manual/specs/06-member-auth.md` |
| Edit/Delete 仕様 | `docs/00-getting-started-manual/specs/07-edit-delete.md` |
| 全体概要 | `docs/00-getting-started-manual/specs/00-overview.md` |

## 実行手順

1. `docs/30-workflows/completed-tasks/UT-06B-PROFILE-VISUAL-EVIDENCE.md` を読み、既取得 evidence と未取得 evidence を分離する。
2. M-08 / M-09 / M-10 / M-14 / M-15 / M-16 を以下表で確定する。

| Marker | 内容 | 取得方法 | evidence path（実測時） |
| --- | --- | --- | --- |
| M-08 | logged-in `/profile` の screenshot | Playwright headless + storageState | `outputs/phase-11/screenshots/M-08-desktop-{date}.png` / `M-08-mobile-{date}.png` |
| M-09 | 本文編集 form / input / textarea / submit が 0 件 | Playwright DOM count assert + JSON dump | `outputs/phase-11/dom/M-09-no-form-{desktop,mobile}.json` |
| M-10 | `/profile?edit=true` でも read-only | Playwright で query 付きで再アクセスし同一 assert | `outputs/phase-11/dom/M-10-edit-query-ignored-{desktop,mobile}.json` + `outputs/phase-11/screenshots/M-10-desktop-{date}.png` |
| M-14 | staging Magic Link → callback → /profile 一連の visual | manual + capture script | `outputs/phase-11/screenshots/M-14-flow-{date}.png` |
| M-15 | staging Google OAuth → /profile | manual + capture script | `outputs/phase-11/screenshots/M-15-flow-{date}.png` |
| M-16 | staging logout → /profile redirect to /login | Playwright | `outputs/phase-11/screenshots/M-16-redirect-{date}.png` |

3. 上記表の更新差分を `outputs/phase-11/manual-smoke-evidence.md`（既存があれば update / なければ新規）に反映する手順を Phase 11 に渡す。

## 統合テスト連携

- 上流: 06b-A-me-api-authjs-session-resolver（production session 解決）/ 06b-B-profile-self-service-request-ui（申請 UI が反映済み）/ 04b /me /me/profile API / 05a/05b auth 経路。
- 下流: 08b Playwright profile scenario / 09a staging visual smoke。

## 多角的チェック観点

- invariant #4: 編集 form が 0 件であることを DOM レベルで実測。
- invariant #5: `/profile` が member 境界に閉じている（unauth は /login redirect）。
- invariant #8: GAS prototype の screenshot を M-08 evidence にしない。
- invariant #11: 管理者操作で他人 profile を編集できる UI が一切ないこと（負の存在確認）。
- 未実装 / 未実測を PASS と扱わない。
- screenshot 内のメールアドレス / session token / Magic Link URL の redaction を Phase 11 で確実に行う。

## サブタスク管理

- [ ] 親タスク evidence 状況の境界記録
- [ ] AC × evidence path 表の確定
- [ ] user approval gate の分離
- [ ] Out-of-Scope の確定
- [ ] outputs/phase-01/main.md に要件定義サマリを記載

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| 要件定義 | `outputs/phase-01/main.md` | AC 表、Scope In/Out、approval gate、依存タスク |

## 完了条件 (DoD)

- [ ] M-08〜M-10 / M-14〜M-16 が evidence path とセットで定義されている
- [ ] approval gate（staging アクセス / Magic Link / redaction）が明記されている
- [ ] Out-of-Scope（profile 編集 UI 追加 / API 変更 / production deploy）が記録されている
- [ ] 実装区分が implementation-spec として根拠付きで合意されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく未取得 evidence の follow-up gate である
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 2 へ、AC × evidence path 表、approval gate、Playwright + capture script を採る方針、redaction 要件を渡す。
