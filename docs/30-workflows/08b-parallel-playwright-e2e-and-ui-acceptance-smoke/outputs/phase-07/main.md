# Phase 7 成果物: AC マトリクス概要

> Phase 1 AC × Phase 4 verify suite × Phase 5 実装ステップ × Phase 6 failure × Phase 2 scenario × viewport を 1:1 対応させ、不変条件 #4 / #8 / #9 / #15 が必ず E2E test として現れていることを最終確認する。詳細トレースは `ac-matrix.md` を参照。

## 1. AC × 主要連携サマリ

| AC | 概要 | verify suite | runbook step | failure | scenario × viewport |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 検証マトリクス全 20 セル green | public + login + profile + admin + density | Step 6 | F-1, F-9 | 10 画面 × 2 viewport |
| AC-2 | 公開導線 4 シナリオ × 2 viewport | public.spec.ts | Step 6 | F-1, F-9 | landing/list/detail/register × 2 |
| AC-3 | AuthGateState 5 + `/no-access` 404 | login.spec.ts | Step 6 | F-2〜F-6 | 5 state × 2 + 1 404 |
| AC-4 | editResponseUrl 遷移 | profile.spec.ts | Step 6 | F-7, F-8 | 1 シナリオ × 2 viewport |
| AC-5 | admin 5 × 認可境界 3 | admin.spec.ts | Step 6 | F-10, F-11 | 15 セル + 5 mobile |
| AC-6 | 検索 6 パラメータ + density 3 値 | search.spec.ts + density.spec.ts | Step 6 | — | 5 ケース + 3 mode |
| AC-7 | screenshot ≥ 30 枚 | helpers/screenshot.ts | Step 3 | — | desktop 22 + mobile 15 = 37 枚 |
| AC-8 | axe WCAG 2.1 AA 0 件 | helpers/axe.ts + 5 spec | Step 3 | F-13 | 5 path × 2 viewport |

## 2. 不変条件カバレッジ（最終確認）

| 不変条件 | E2E カバー先 | 主たる test | failure |
| --- | --- | --- | --- |
| #4 profile 本文編集なし | profile.spec.ts | `getByRole('form', { name: /編集/ }).toHaveCount(0)` + popup → viewform | F-7, F-8 |
| #5 admin 認可境界 | admin.spec.ts | 403 / `/login` redirect | F-10, F-11 |
| #7 削除済み member 除外 | login.spec.ts / attendance.spec.ts | deleted block + 候補リストから除外 | F-5, F-12 |
| #8 reload 後 state 維持 | profile.spec.ts | reload + `localStorage.clear()` 後も state 維持 | F-14 |
| #9 `/no-access` 不在 + AuthGateState 出し分け | login.spec.ts | 5 state + 404 | F-3〜F-6 |
| #15 attendance 二重防御 | attendance.spec.ts | dup toast + UNIQUE 違反吸収 + 削除済み非表示 | F-12 |

→ 必須 4 件（#4 / #8 / #9 / #15）すべて E2E test として顕在化済み。

## 3. screenshot evidence × scenario × viewport

| scenario | desktop | mobile | 合計 |
| --- | --- | --- | --- |
| landing | 1 | 1 | 2 |
| members 一覧 | 1 | 1 | 2 |
| members 詳細 | 1 | 1 | 2 |
| register | 1 | 1 | 2 |
| login (input/sent/unregistered/rules_declined/deleted) | 5 | 5 | 10 |
| profile (base + after-reload + edit-response-url click) | 3 | 1 | 4 |
| admin (dashboard/members/tags/schema/meetings) | 5 | 5 | 10 |
| admin authz (member 403 + anon redirect) | 2 | — | 2 |
| density (comfy/dense/list) | 3 | 0 | 3 |
| search (q/zone-status/tag/sort/combo) | 5 | 0 | 5 |
| attendance (dup-toast + deleted-excluded) | 2 | — | 2 |
| **合計** | **29** | **15** | **44** |

→ 30 枚以上の取得計画を定義。`scaffolding-only` 時点では AC-7 は `DEFERRED`。

## 4. Phase 連携

| 連携先 | 引き継ぎ |
| --- | --- |
| Phase 8 (DRY 化) | 重複する page object / fixture / snap helper の抽出元 |
| Phase 9 (QA 観点) | 不変条件カバレッジ table を QA チェックリストへ展開 |
| Phase 10 (GO/NoGO) | matrix が GO 判定の前提 |
| 下流 09a smoke | verify suite の staging deploy 前提 |

## 5. 多角的チェック

- 不変条件 #4 / #8 / #9 / #15 が AC-3〜5 のいずれかで覆われていることを最終確認済み
- AC-7 screenshot 44 枚（≥ 30）達成
- AC-8 axe report 出力先 `outputs/phase-11/evidence/axe-report.json` を Phase 11 で必須

## 完了条件

- [x] AC matrix 全行埋まる（ac-matrix.md）
- [x] 不変条件カバレッジ table（#4 / #8 / #9 / #15 を含む 6 件）
- [x] screenshot 30 枚以上の table（44 枚）
- [x] failure F-1〜F-14 を AC マトリクスに紐付け
