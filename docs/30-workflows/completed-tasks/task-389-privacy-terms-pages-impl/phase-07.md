# Phase 7: gate / quality check — task-389-privacy-terms-pages-impl

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 7 / 13 |
| 作成日 | 2026-05-03 |
| taskType | implementation |

## 目的

各 gate の判定条件と、PASS/FAIL/COVERED_BY_PLANNED_TEST のラベル付けを定義する。

## Gate 一覧

| Gate ID | 内容 | 判定基準 | 確認方法 |
| --- | --- | --- | --- |
| G-LINT | lint pass | exit 0 | `mise exec -- pnpm --filter @ubm-hyogo/web lint` |
| G-TYPE | typecheck pass | exit 0 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` |
| G-UNIT | unit test pass (privacy/terms) | UT-PRIV-1〜4, UT-TERMS-1〜4 全 PASS | `pnpm --filter @ubm-hyogo/web test -- privacy terms` |
| G-BUILD | Next build success | exit 0 | `pnpm --filter @ubm-hyogo/web build` |
| G-DEP | #385 regression non-repro / web build unblocked | `pnpm --filter @ubm-hyogo/web build` exits 0; Issue state alone is not sufficient | `mise exec -- pnpm --filter @ubm-hyogo/web build` |
| G-STAGING-200 | staging /privacy /terms 200 | curl `%{http_code}` == 200 | Phase 5 Step 6 |
| G-PROD-200 | production /privacy /terms 200 | curl `%{http_code}` == 200 | Phase 5 Step 8 |
| G-OAUTH-URL | OAuth consent screen URL 設定済 | screenshot + 設定一致 | Phase 11 evidence |
| G-LEGAL | 法務承認 | reviewer + date 記載 | `outputs/phase-11/legal-review-note.md` |

## CI gate 影響

- `verify-indexes-up-to-date` (.github/workflows/verify-indexes.yml) — **影響なし**（skill indexes 未変更）
- `pnpm typecheck` `pnpm lint` `pnpm test` — 標準 PR gate に乗る

## 失敗時のアクション

| 失敗 gate | 一次対応 |
| --- | --- |
| G-DEP FAIL | 本タスクを blocked として停止し、#385 完了を待つ |
| G-BUILD FAIL | `useContext` 等 client-only hook が混入していないか確認（layout/Provider 影響） |
| G-STAGING-200 != 200 | `.open-next/` artifact に `app/privacy/page.tsx` `app/terms/page.tsx` が含まれているか確認 |
| G-OAUTH-URL FAIL | Cloud Console 編集権限を確認 |

## 完了条件

- [ ] 全 gate に判定基準と確認方法が紐付いている
- [ ] 失敗時アクションが明示されている
- [ ] `outputs/phase-07/main.md` を作成する

## 統合テスト連携

- local gate は focused page tests + web typecheck/build。
- runtime gate は `VISUAL_ON_EXECUTION` のため `COVERED_BY_PLANNED_TEST / pending user approval` として Phase 11 へ委譲する。
