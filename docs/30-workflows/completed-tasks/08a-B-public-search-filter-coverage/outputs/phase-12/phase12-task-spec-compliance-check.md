# Phase 12 タスク仕様 compliance check — 08a-B-public-search-filter-coverage

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 08a-B-public-search-filter-coverage |
| phase | 12 / 13 |
| wave | 08a-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| 検証基準 | 6 必須タスク × 7 ファイル / CONST_005 / CONST_007 / artifacts.json parity |
| close-out 判定 | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING（正本同期済み / Phase 11 runtime evidence は 08b・09a 実行時取得） |

## 6 必須タスク × 7 ファイル実体確認

| # | 必須タスク | 出力ファイル | 実体存在 | drafted 状態 |
| - | --- | --- | :-: | :-: |
| 1 | 実装ガイド作成（Part 1 中学生 / Part 2 技術者） | `outputs/phase-12/implementation-guide.md` | ✅ | ✅ |
| 2 | システム仕様書更新方針（Step 1-A/B/C + 条件付き Step 2） | `outputs/phase-12/system-spec-update-summary.md` | ✅ | ✅ |
| 3 | ドキュメント更新履歴 | `outputs/phase-12/documentation-changelog.md` | ✅ | ✅ |
| 4 | 未タスク検出（0 件でも必須） | `outputs/phase-12/unassigned-task-detection.md` | ✅ | ✅ |
| 5 | スキルフィードバック（改善点なしでも必須） | `outputs/phase-12/skill-feedback-report.md` | ✅ | ✅ |
| 6 | Phase 12 タスク仕様 compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` | ✅ | ✅ |
| - | サマリ（Phase 12 統合） | `outputs/phase-12/main.md` | ✅ | ✅ |

→ 7 ファイル全揃い。drafted 状態問題なし。

## close-out 状態判定

| 項目 | 値 |
| --- | --- |
| workflow_state（artifacts.json） | `implemented_local` |
| 各 phase status | Phase 1-10・12 `completed`、Phase 11 `blocked_runtime_evidence`、Phase 13 `pending_user_approval` |
| close-out 判定 | **PASS_BOUNDARY_SYNCED_RUNTIME_PENDING** |
| open runtime 内容 | Phase 11 screenshot / curl / axe evidence は `VISUAL_ON_EXECUTION` として 08b / 09a runtime cycle で取得 |

> `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を採用する根拠: Phase 12 strict 7 files、正本 specs 4 件、aiworkflow quick-reference / resource-map / task-workflow-active / SKILL changelog / LOGS は同一 wave で同期済み。一方で Phase 11 の visual runtime evidence はまだ実取得していないため、runtime PASS とは扱わない。

## artifacts.json parity check

| 観点 | 結果 | 根拠 |
| --- | --- | --- |
| root `artifacts.json` の `phases[*].outputs` と `outputs/phase-NN/main.md` の存在対応 | ✅ | 全 13 phase の `outputs/phase-NN/main.md` が実体ファイルとして存在 |
| `outputs/artifacts.json` の有無 | 存在 | root `artifacts.json` から同期済み。root/outputs parity PASS。 |
| `metadata.workflow_state` | `implemented_local` | 実体（仕様書 + AC 直結 API 修正）と一致 |
| `metadata.docs_only` | `false` | 一致 |
| `metadata.visualEvidence` | `VISUAL_ON_EXECUTION` | Phase 11 で 9 種 screenshot / curl / axe を後続 runtime cycle で取得する宣言と一致 |
| `phases[12].user_approval_required` | `false` | Phase 12 は仕様書作成のみ。spec compliant |
| `phases[13].user_approval_required` | `true` | PR 作成のため approval 必須。spec compliant |
| `depends_on` / `blocks` | `08a-A` / `07a` / `06a` ↔ `08b-A` / `09a-A` | index.md と一致 |
| `invariants_touched` | #4 / #5 / #6 | Phase 1〜11 の AC-INV4/5/6 と一致 |

## root / outputs parity check

| 項目 | root（task root） | outputs | 結果 |
| --- | --- | --- | --- |
| `phase-NN.md` 13 件 | ✅ 存在 | - | ✅ |
| `outputs/phase-NN/main.md` 13 件 | - | ✅ 存在 | ✅ |
| `index.md` の `outputs:` セクション | 13 行（phase-01 〜 phase-13） | - | ✅ 一致 |
| Phase 12 補助 6 ファイル | - | ✅（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check） | ✅ |

## CONST_005 必須項目チェック（13 phase outputs）

CONST_005: 変更対象ファイル / シグネチャ / I/O / テスト方針 / コマンド / DoD の 6 項目を全 phase outputs が記述すること。

| phase | 変更対象ファイル | シグネチャ | I/O | テスト方針 | コマンド | DoD |
| ---: | :-: | :-: | :-: | :-: | :-: | :-: |
| 01 | ✅ | ✅ | ✅ | ✅（test 戦略予告） | ✅ | ✅ |
| 02 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 03 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 04 | ✅ | ✅（test 名） | ✅ | ✅ | ✅ | ✅ |
| 05 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 06 | ✅（異常系対象） | ✅ | ✅ | ✅ | ✅ | ✅ |
| 07 | ✅（AC マトリクス） | ✅ | ✅ | ✅ | ✅ | ✅ |
| 08 | ✅（DRY 候補） | ✅ | ✅ | ✅ | ✅ | ✅ |
| 09 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 10 | ✅（最終レビュー対象） | ✅ | ✅ | ✅ | ✅ | ✅ |
| 11 | ✅（evidence path） | ✅（curl コマンド） | ✅ | ✅ | ✅ | ✅ |
| 12 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 13 | ✅（PR 対象） | - | ✅（PR 本文） | - | ✅（gh pr create） | ✅ |

→ 全 phase で CONST_005 6 項目を充足。Phase 13 の「シグネチャ」「テスト方針」は PR 作成タスクの性質上 N/A だが、PR 本文ドラフトと CI 確認項目で代替記述あり。

## CONST_007 適合確認（先送り禁止スコープ）

| 項目 | 確認 | 根拠 |
| --- | --- | --- |
| 本タスク AC（6 query parameter / #4/#5/#6 / a11y / 大量ヒット）に **未記述事項** がない | ✅ | Phase 1 AC 表 + Phase 7 AC マトリクス + Phase 10 4 条件で全網羅確認 |
| 未タスク化 | ✅ | AC 内の `q` LIKE escape / `sort=name` 氏名順は今サイクルで実コードへ反映済み。残る U-* は runtime automation / performance optimization に限定 |
| `q` / `sort=name` | ✅ | `escapeLikePattern` + `LIKE ... ESCAPE`、`fullName ASC, member_id ASC` を実装済み |
| 不変条件 #4 / #5 / #6 を「将来対応」にしていない | ✅ | AC-INV4/5/6 として固定済み |

## 不足項目

検出された不足: **なし**。

| 観点 | 不足内容 | 結果 |
| --- | --- | --- |
| 6 必須タスク × 7 ファイル | - | 揃い |
| CONST_005 全項目 | - | 全 phase 充足 |
| CONST_007 先送り禁止 | - | AC 外の先送りのみ |
| artifacts.json parity | - | drift なし（`visualEvidence=VISUAL_ON_EXECUTION`） |
| root/outputs parity | - | drift なし |
| 不変条件 #4/#5/#6 mapping | - | AC とテストの双方に紐付け済み |

## 開放事項（runtime evidence 待ち）

| ID | 内容 | 解消経路 |
| --- | --- | --- |
| OR-1 | Phase 11 screenshots | 08b Playwright / 09a staging smoke で取得 |
| OR-2 | Phase 11 curl logs | 08b / 09a runtime cycle で取得 |
| OR-3 | Phase 11 axe report | 08b / 09a runtime cycle で取得 |

## focused test evidence

| command | result | notes |
| --- | --- | --- |
| `pnpm exec vitest run --config vitest.config.ts apps/api/src/_shared/__tests__/search-query-parser.test.ts apps/api/src/repository/_shared/sql.test.ts apps/api/src/repository/publicMembers.test.ts apps/api/src/routes/public/index.test.ts` | PASS（4 files / 23 tests） | q normalization / LIKE escape / placeholders offset / public route query echo / fullName sort |
| `pnpm exec vitest run --config vitest.config.ts apps/web/src/lib/url/__tests__/members-search.test.ts` | PASS（1 file / 11 tests） | URL parser / repeated tag dedup / API query generation |

Wider `pnpm --filter @ubm-hyogo/api test -- ...` は package script の引数伝搬により全 API suite が走り、Miniflare D1 proxy の `EADDRNOTAVAIL` と既存 fixture UNIQUE constraint で fail した。上表の focused tests を本変更の green evidence とする。

## DoD（Phase 12 compliance check）

| ID | 内容 | 結果 |
| --- | --- | --- |
| C12-1 | 6 必須タスク × 7 ファイルが揃い、drafted 状態 | ✅ |
| C12-2 | close-out 判定が `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` で記録 | ✅ |
| C12-3 | artifacts.json parity が PASS（root と outputs/artifacts.json が同期済み） | ✅ |
| C12-4 | root/outputs parity が PASS（13 phase 揃い） | ✅ |
| C12-5 | CONST_005 全 13 phase で充足 | ✅ |
| C12-6 | CONST_007 先送り禁止スコープに適合 | ✅ |
| C12-7 | 不足項目が明記されている（あれば追記、なければ "なし"） | ✅（なし） |
| C12-8 | focused API/Web tests が green | ✅ |

## 完了条件

- [x] 6 必須タスク × 7 ファイル実体確認
- [x] implemented-local / runtime pending 状態の close-out 判定
- [x] artifacts.json parity check
- [x] root/outputs parity check
- [x] CONST_005 必須項目チェック（全 13 phase）
- [x] CONST_007 適合確認
- [x] 不足項目の明記（なし）
- [x] focused API/Web tests green
