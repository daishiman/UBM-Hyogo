# Phase 7 成果物 — AC マトリクス（06b-B-profile-self-service-request-ui）

作成日: 2026-05-02
status: implemented-local（runtime visual evidence は Phase 11 capture 後に書き戻す）

## 1. index AC ↔ Phase 1 拡張 AC マッピング

| index AC | Phase 1 拡張 AC | 備考 |
| --- | --- | --- |
| AC-1 公開停止/再公開申請を送れる | AC-1（停止）/ AC-2（再公開） | endpoint 兼用 / `desiredState` で分岐 |
| AC-2 退会申請を送れる | AC-3 | 二段確認必須 |
| AC-3 二重申請 409 を表示 | AC-4 | duplicate banner + button disabled |
| AC-4 本文編集 UI 追加禁止 | AC-5 / 不変条件 #4 | static grep 0 hit |
| AC-5 SS / E2E 保存 | Phase 11 evidence | `outputs/phase-11/` 配下 |
| (補強) a11y / D1 直接禁止 | AC-6 / AC-7 / 不変条件 #5 | axe + grep |

## 2. AC マトリクス本体

| AC ID | 内容 | 実装箇所（予定パス） | 検証テスト ID | 静的検証 | evidence path | status |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1 | 公開停止申請が 202 後に pending banner を表示 | `apps/web/app/profile/_components/RequestActionPanel.tsx` / `VisibilityRequestDialog.tsx` / `apps/web/src/lib/api/me-requests.ts#requestVisibilityChange` | E2E `e2e/profile.visibility-request.spec.ts::S1-hidden` / unit `me-requests.test.ts::visibility-202` / unit `VisibilityRequestDialog.test.tsx::submit-success` | — | `outputs/phase-11/screenshots/visibility-hidden-202.png` / `outputs/phase-11/e2e/visibility-request.log` | TBD |
| AC-2 | `publishState=hidden` のときだけ「再公開を申請する」ボタンが現れ 202 後 banner | 同上（`desiredState=public`） | E2E `profile.visibility-request.spec.ts::S2-public` / visual diff `RequestActionPanel.{hidden,public}.png` | — | `outputs/phase-11/screenshots/visibility-public-202.png` / `outputs/phase-11/visual-diff/RequestActionPanel-state.png` | TBD |
| AC-3 | 退会申請が二段確認後に送信され 202 後 banner（不可逆性表記あり） | `DeleteRequestDialog.tsx` / `me-requests.ts#requestDelete` | E2E `e2e/profile.delete-request.spec.ts::S3-confirmed` / unit `me-requests.test.ts::delete-202` / unit `DeleteRequestDialog.test.tsx::two-step-confirm` | — | `outputs/phase-11/screenshots/delete-step1.png` / `delete-step2.png` / `delete-202.png` / `outputs/phase-11/e2e/delete-request.log` | TBD |
| AC-4 | 同種 pending 申請存在時の再 submit が 409 → banner + button disabled | `RequestActionPanel.tsx` / `RequestErrorMessage.tsx` | E2E `*::S4-duplicate` / unit `me-requests.test.ts::409-duplicate` | — | `outputs/phase-11/screenshots/duplicate-409-banner.png` / `outputs/phase-11/e2e/duplicate-request.log` | TBD |
| AC-5 (negative) | 本文編集 UI（氏名/メール/かな等の input）が追加されない | `apps/web/app/profile/_components/Request*.tsx` 配下 | static grep（CI / Phase 9） | `rg -n 'name="(displayName\|email\|kana\|phone\|address)"' apps/web/app/profile/_components/Request*.tsx` → 0 hit | `outputs/phase-09/lint-grep-no-body-edit.txt` | TBD |
| AC-6 | SS / E2E が `outputs/phase-11/` に保存される | Phase 11 runbook | Phase 11 完走 | — | `outputs/phase-11/main.md`（evidence 一覧） | TBD |
| AC-7 (補強) | a11y: `role=dialog`+`aria-modal`+focus trap+esc / `role=alert` | 各 Dialog / `RequestErrorMessage.tsx` | unit `*.test.tsx::a11y-roles` / axe `e2e/profile.a11y.spec.ts` | — | `outputs/phase-09/axe-report.json` / `outputs/phase-11/screenshots/dialog-focus-trap.png` | TBD |
| AC-8 (補強) | apps/web から D1 直接 import 0 件（不変条件 #5） | `apps/web/` 配下全域 | static grep gate | `rg -n 'cloudflare:d1\|D1Database' apps/web/` → 0 hit | `outputs/phase-09/lint-grep-no-d1.txt` | TBD |

## 3. ギャップ分析

| 項目 | 状況 | 緩和策 / 追跡先 |
| --- | --- | --- |
| pending banner の reload 永続性 | 自動 E2E 不能（API 側 `pendingRequestTypes` 未提供） | Phase 3 MINOR-1。Phase 12 follow-up（04b 拡張）として起票 |
| 429 RATE_LIMITED の UI 確認 | rate limit 窓値依存で安定再現困難 | Phase 11 で API mock 経由の visual SS のみ取得（手動 evidence） |
| 退会の不可逆性表記の妥当性 | 自動検証外 | Phase 11 SS を Phase 10 で user レビュー |
| `RULES_CONSENT_REQUIRED` panel 非表示 | DB 状態操作が必要 | Phase 4 で fixture 整備、E2E 1 ケースに限定 |

## 4. Phase 10 突入条件 / NO-GO

| 判定 | 条件 | 戻り先 |
| --- | --- | --- |
| GO | AC-1..AC-8 が `PASS` または MINOR で follow-up 起票済み | Phase 10 へ進む |
| NO-GO（設計） | AC-5 / AC-7 / AC-8 が MAJOR または未実測 | Phase 2 |
| NO-GO（テスト） | テスト ID 未実装 / coverage 未達 | Phase 4 |
| NO-GO（実装） | AC-1..AC-4 が再現不能 | Phase 5 |

## 5. approval gate

- 06b-A Auth.js session resolver follow-up 完了が Phase 11 smoke の前提。完了確認なしで Phase 11 へ進まない。
- commit / push / PR / deploy は本仕様書整備タスクの scope 外。Phase 13（PR 作成）は user 明示承認後にのみ起動する。

## 6. 注記

このファイルはタスク仕様書整備時点の AC マトリクスであり、`status` 列は Phase 9 / Phase 11 の実測完了後に `PASS` / `MINOR` / `MAJOR` で更新される。
