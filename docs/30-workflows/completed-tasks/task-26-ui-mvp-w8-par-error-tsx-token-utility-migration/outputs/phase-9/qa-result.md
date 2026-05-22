# Phase 9 — 品質保証

## 検証マトリクス

| 項目 | コマンド / 検証 | 期待 |
|------|----------------|------|
| typecheck | `pnpm --filter @ubm-hyogo/web typecheck` | completed（local command） |
| lint | `pnpm --filter @ubm-hyogo/web lint` | completed（local command） |
| build | `pnpm --filter @ubm-hyogo/web build` | runtime_pending（broad build gate; focused code path covered by unit test） |
| unit test | `pnpm --filter @ubm-hyogo/web test -- apps/web/app/__tests__/error.component.spec.tsx` | completed（focused local command） |
| grep gate（error.tsx） | `grep -nE 'text-\[var\(\|bg-\[var\(\|fg-muted' apps/web/app/error.tsx` | 0 件 |
| grep gate（boundary 群） | 副次対象 grep | 0 件 |
| verify-design-tokens（task-18）| `pnpm --filter @ubm-hyogo/web verify-design-tokens` | completed（local command） |
| visual baseline（task-18）| `playwright-smoke / visual` | runtime_pending（downstream broad regression gate） |
| link 整合 | `index.md` 内リンク | 全て解決 |
| mirror parity | 該当なし（skill 変更なし） | N/A |

## line budget

| ファイル | 行数想定 |
|---------|---------|
| `apps/web/app/error.tsx` | 変更前 ≒ 60 行 / 変更後 ≒ 60 行（純粋置換） |

## stub / removed file の扱い

なし（削除なし）。

## 結論

completed（local evidence captured）。実測値は Phase 11 manual-test と Phase 12 compliance check に記録する。
