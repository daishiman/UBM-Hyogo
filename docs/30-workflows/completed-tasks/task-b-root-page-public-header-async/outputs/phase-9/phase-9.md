# Phase 9: 品質保証

| 項目      | 値                          |
| --------- | --------------------------- |
| Phase     | 9 / 13                      |
| 名称      | 品質保証                    |
| 状態      | completed                   |
| 作成日    | 2026-05-28                  |

## 1. QA チェック項目

| #   | 項目                                              | 判定基準                                                    |
| --- | ------------------------------------------------- | ----------------------------------------------------------- |
| 1   | typecheck                                         | `mise exec -- pnpm typecheck` exit 0                        |
| 2   | lint                                              | `mise exec -- pnpm lint` exit 0                             |
| 3   | focused vitest                                    | `app/__tests__/page.spec.tsx` 全 case GREEN                 |
| 4   | OpenNext build                                    | `mise exec -- pnpm --filter @ubm-hyogo/web build` exit 0    |
| 5   | grep gate（旧 `<PublicHeader />` 残存ゼロ）        | `! grep -nE '<PublicHeader\s*/>' apps/web/app/page.tsx`    |
| 6   | grep gate（`await getAuthView()` 1 件）            | `grep -nE 'await\s+getAuthView\(\)' apps/web/app/page.tsx`  |
| 7   | revalidate / connection / generateMetadata 不変    | Phase 6 grep gate と同様                                    |
| 8   | line budget（変更 ~10 行）                         | `git diff apps/web/app/page.tsx` で逸脱なし                 |
| 9   | mirror parity（root と outputs/artifacts.json）     | `diff artifacts.json outputs/artifacts.json` で差分 0       |
| 10  | `data-auth-state` 出力（NON_VISUAL 代替証跡）       | Phase 4 spec で assertion 済                                |

## 2. 完了条件

- 1〜10 全て completed
- `bash scripts/verify-pr-ready.sh` が green（Phase 11 evidence 揃った後）
