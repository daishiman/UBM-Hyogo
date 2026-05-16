# Phase 9: 品質検証

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SERIAL-05-STEP-01 members-note mutation UI |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質検証 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 8 (統合テスト) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | pending |

## 目的

Phase 1-8 の成果を以下の品質 gate で総合検証する。

## 検証 gate

| Gate | コマンド | 合格条件 |
| --- | --- | --- |
| G-1 typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| G-2 lint | `mise exec -- pnpm lint` | exit 0 |
| G-3 unit + integration | `mise exec -- pnpm --filter @ubm-hyogo/web test` | all green |
| G-4 coverage | `bash scripts/coverage-guard.sh` | exit 0 / 4 指標 >=80% |
| G-5 build | `mise exec -- pnpm build` | exit 0 |
| G-6 design-token | grep `bg-\[#\|text-\[#\|border-\[#` apps/web/src/features/admin | 0 件 |
| G-7 test suffix | `find apps/web -name "*.test.tsx" -o -name "*.test.ts"` | 新規 0 件 |
| G-8 D1 binding ガード | grep `c.env.DB\|d1` apps/web/src/features/admin | 0 件 |
| G-9 env 直接参照 | grep `process.env.` apps/web/src/features/admin | 0 件 |

## 実行手順

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test
bash scripts/coverage-guard.sh
mise exec -- pnpm build
# G-6: design-token violation
rg 'bg-\[#|text-\[#|border-\[#' apps/web/src/features/admin
# G-7: test suffix
find apps/web/src/features/admin -name '*.test.ts*'
# G-8: D1 binding leak
rg 'c\.env\.DB|d1' apps/web/src/features/admin
# G-9: env 直接参照
rg 'process\.env\.' apps/web/src/features/admin
```

## 不合格時の戻り

| 不合格 gate | 戻り先 |
| --- | --- |
| G-1, G-2 | Phase 6 / 7 |
| G-3 | Phase 6 / 8 |
| G-4 | Phase 6 (テスト追加) |
| G-5 | Phase 6 |
| G-6 | Phase 6 (token 置換) |
| G-7 | Phase 6 (rename) |
| G-8, G-9 | Phase 1 / 2 (再設計) |

## 完了条件

- [ ] G-1..G-9 すべて pass
- [ ] coverage report を `outputs/phase-09/coverage-report.txt` に保存
- [ ] gate 結果を `outputs/phase-09/quality-gate-result.md` に記録

## タスク100%実行確認【必須】

- [ ] 9 gate 全件証跡を保存

## 次Phase

Phase 10 (最終レビュー): AC 充足 / 不変条件 / docs 整合の最終確認。
