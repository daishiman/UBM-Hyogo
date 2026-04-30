# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 作成日 | 2026-04-26 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | pending |

## 目的

Phase 1 AC × Phase 4 verify suite × Phase 5 実装ステップ × Phase 6 failure を 1:1 で対応させる matrix を作る。不変条件 #4/#8/#9/#15 が必ず E2E test として現れているかを最終確認する。

## 実行タスク

- [ ] AC × verify × runbook step × failure × scenario × viewport の matrix を `outputs/phase-07/ac-matrix.md`
- [ ] 不変条件カバレッジ table（#4/#8/#9/#15）
- [ ] screenshot evidence × scenario × viewport の対応

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC |
| 必須 | outputs/phase-04/verify-matrix.md | suite |
| 必須 | outputs/phase-05/main.md | runbook |
| 必須 | outputs/phase-06/main.md | failure |

## AC マトリクス

| AC | 概要 | verify suite | runbook step | failure cases | scenario × viewport |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 検証マトリクス全 20 セル green | public + login + profile + admin + density | Step 6 | F-1, F-9 | 10 画面 × 2 viewport |
| AC-2 | 公開導線 4 シナリオ × 2 viewport | public.spec.ts | Step 6 | F-1, F-9 | landing/members/detail/register × 2 |
| AC-3 | AuthGateState 5 状態 + `/no-access` 404 | login.spec.ts | Step 6 | F-3, F-4, F-5, F-6 | 5 state × 2 viewport + 1 404 |
| AC-4 | editResponseUrl 遷移 | profile.spec.ts | Step 6 | F-8 | 1 シナリオ × 2 viewport |
| AC-5 | admin 5 × 認可境界 3 (admin/member/anon) | admin.spec.ts | Step 6 | F-10, F-11 | 15 セル × 2 viewport |
| AC-6 | 検索 6 パラメータ + density 3 値 | search.spec.ts + density.spec.ts | Step 6 | — | 5 ケース + 3 mode |
| AC-7 | screenshot ≥ 30 枚 | (helpers/screenshot.ts) | Step 3 | — | desktop 19 + mobile 17 |
| AC-8 | axe WCAG 2.1 AA 0 件 | (helpers/axe.ts + 5 spec) | Step 3 | F-13 | 5 path × 2 viewport |

## 不変条件カバレッジ

| 不変条件 | test 種別 | test ファイル / ケース | failure 関連 |
| --- | --- | --- | --- |
| #4 profile 本文編集なし | E2E | `profile.spec.ts` の `assertNoEditFormVisible()` + `clickEditResponseUrl → forms` | F-7, F-8 |
| #8 localStorage 不正利用なし | E2E | `profile.spec.ts` の reload 後 state 維持、`localStorage.clear()` 後も維持 | F-14 |
| #9 `/no-access` 不在 / AuthGateState 出し分け | E2E | `login.spec.ts` の 5 state + `/no-access` 404 | F-3〜F-6 |
| #15 attendance 二重防御 + 削除済み除外 | E2E | `attendance.spec.ts` の dup toast + 削除済み非表示 | F-12 |

## screenshot evidence × scenario × viewport

| scenario | desktop | mobile | 合計 |
| --- | --- | --- | --- |
| landing | 1 | 1 | 2 |
| members 一覧 | 1 | 1 | 2 |
| members 詳細 | 1 | 1 | 2 |
| register | 1 | 1 | 2 |
| login (input/sent/unregistered/rules_declined/deleted) | 5 | 5 | 10 |
| profile | 1 | 1 | 2 |
| admin (dashboard/members/tags/schema/meetings) | 5 | 5 | 10 |
| density (comfy/dense/list) | 3 | 0 | 3 |
| attendance dup toast | 1 | 0 | 1 |
| 検索 5 ケース | 0 | 0 | 0 (URL only) |
| **合計** | **19** | **15** | **34** |

→ 30 枚以上の取得計画を定義。`scaffolding-only` 時点では AC-7 は `DEFERRED`。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | matrix から重複 page object / fixture / helper を抽出 |
| Phase 9 | 不変条件カバレッジ → QA 観点 |
| Phase 10 | matrix が GO 前提 |
| 下流 09a | matrix の verify suite を staging deploy 前提 |

## 多角的チェック観点

- 不変条件 **#4 / #8 / #9 / #15** が AC-3〜5 のいずれかで覆われていることを最終確認
- AC-7 screenshot 30 枚以上達成のため Phase 8 で snap helper の DRY 化が前提
- AC-8 axe report が outputs/phase-11/evidence/axe-report.json に存在

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC matrix | 7 | pending | ac-matrix.md |
| 2 | 不変条件カバレッジ table | 7 | pending | #4/#8/#9/#15 |
| 3 | failure 紐付け | 7 | pending | F-1〜F-14 |
| 4 | screenshot evidence table | 7 | pending | 34 枚 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | AC matrix 本文 |
| matrix | outputs/phase-07/ac-matrix.md | 詳細 |
| メタ | artifacts.json | phase 7 status |

## 完了条件

- [ ] AC matrix 全行埋まる
- [ ] 不変条件カバレッジ table
- [ ] screenshot 30 枚以上の table

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] 不変条件 #4/#8/#9/#15 すべてカバー
- [ ] artifacts.json の phase 7 を completed

## 次 Phase

- 次: Phase 8 (DRY 化)
- 引き継ぎ: 共通化候補（page object / fixture / helper / snap / axe）
- ブロック条件: matrix 未完なら Phase 8 不可
