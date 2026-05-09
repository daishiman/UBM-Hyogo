# Phase 7: AC マトリクス

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 7 |
| task | task-11-public-top-and-member-list |
| state | implemented-local / implementation / VISUAL_ON_EXECUTION |

## 目的

index.md §AC を「検証方法 / 検証 phase / evidence path」付きでマトリクス化し、要件→設計→テスト→実装ファイルのトレーサビリティを確保する。

## 実行タスク

- [ ] AC-01〜13 を本 phase の表で reify する
- [ ] FR / AC / 設計 / テスト / 実装ファイルのトレーサビリティ表を埋める

## 参照資料

- index.md §AC
- Phase 1 §機能要件 / 非機能要件
- Phase 2 §変更対象ファイル / Phase 4 §テストケース

## 成果物

- `outputs/phase-07/main.md`

## 統合テスト連携

- AC matrix の各行を Phase 9/11 の evidence path に接続する。
- PR body は Phase 13 でこの matrix の実測済み項目だけを checked にする。

## AC マトリクス

| AC ID | 要件 | 検証方法 | 検証 phase | evidence path |
| --- | --- | --- | --- | --- |
| AC-01 | `/` が 4 セクション + `data-page="home"` | TC-U-H-01〜04 + TC-E-01 | Phase 9 / 11 | `outputs/phase-11/evidence/test.log` + `playwright-report/` |
| AC-02 | `/members` が searchParams parse + Filters + Grid\|Table + Pagination | TC-E-02 | Phase 11 | `outputs/phase-11/evidence/e2e.log` + `playwright-report/` |
| AC-03 | density=list で `<table>`、density=invalid で comfy fallback、tag[] 転送 | TC-E-03 / TC-E-04 / TC-U-S-03 | Phase 9 / 11 | 同上 |
| AC-04 | MemberFilters の URL 書換で F5 復元 | TC-E-02 + 手動 | Phase 11 | smoke 実行 + 手動チェックリスト |
| AC-05 | `items.length === 0` で EmptyState | TC-E-05 | Phase 11 | `playwright-report/` |
| AC-06 | `lib/api/public.ts` が Zod strict parse | TC-U-A-01〜02 | Phase 9 | `outputs/phase-11/evidence/test.log` |
| AC-07 | `apps/web/**` で `D1Database` import 0 件 | grep gate | Phase 9 | `outputs/phase-11/evidence/grep-gate.log` |
| AC-08 | HEX / `bg-[#xxx]` / `text-[#xxx]` 0 件 | grep gate（task-18 整合） | Phase 9 | 同上 |
| AC-09 | revalidate stats=60 / members=30 が page export に明記 | source grep | Phase 9 | `outputs/phase-11/evidence/grep-gate.log` |
| AC-10 | Playwright smoke 5 ケース + axe critical=0 | TC-E-01〜05 | Phase 11 | `playwright-report/` + `axe.json` |
| AC-11 | typecheck / lint / vitest / build 全 pass | local PASS 5 点 | Phase 9 / 11 | `typecheck.log` / `lint.log` / `test.log` / `build.log` |
| AC-12 | `apps/api/src/routes/public/**` への変更 0 件 | `git diff --name-only` | Phase 10 | Phase 10 review log |
| AC-13 | PR 本文に Phase 12 implementation-guide.md 主要見出しが反映 | PR body 目視 | Phase 13 | PR URL |

## トレーサビリティ

| 要件 ID | 設計 | テスト | 実装ファイル |
| --- | --- | --- | --- |
| FR-01 | Phase 2 §変更対象（`app/page.tsx` M） | TC-U-H-01〜04 / TC-E-01 | `apps/web/app/page.tsx` + `components/public/{Hero,Stats,ZoneIntro,Timeline,MemberGrid}.tsx` |
| FR-02 | Phase 2 §変更対象（`app/(public)/members/page.tsx` M） | TC-E-02 | `apps/web/app/(public)/members/page.tsx` + `components/public/{MemberFilters.client,MemberGrid,MemberTable}.tsx` |
| FR-03 | Phase 2 §`lib/api/public.ts` C | TC-U-A-01〜06 | `apps/web/src/lib/api/public.ts` |
| FR-04 | Phase 2 §MemberFilters.client | TC-E-02 + 手動 | `components/public/MemberFilters.client.tsx` + `lib/url/members-search.ts` |
| FR-05 | Phase 2 §MemberGrid / MemberTable | TC-E-03 / TC-E-04 | `MemberGrid.tsx` / `MemberTable.tsx` + `members-search.ts` |
| FR-06 | Phase 5 §3-6 / §3-7 | 手動 a11y | `MemberFilters.client.tsx` / `DensityToggle.client.tsx` |
| FR-07 | task-05 既存 | E2E（task-05 既存）+ TC-E-05 | `app/error.tsx` / `app/loading.tsx` / `EmptyState` |
| FR-08 | Phase 5 §4-2 / §4-3 | source grep | `app/page.tsx` / `app/(public)/members/page.tsx` |
| FR-09 | Phase 2 / 5 全コンポーネント | TC-U-H-04 / TC-U-ST-01 / TC-E-01〜05 | 各コンポーネント `data-...` |
| FR-10 | Phase 4 § | 全 TC | test files |

## 完了条件

- [ ] 全 AC が `検証方法` / `検証 phase` / `evidence path` を持つ
- [ ] 全 FR が design / test / 実装ファイルにトレース可能
