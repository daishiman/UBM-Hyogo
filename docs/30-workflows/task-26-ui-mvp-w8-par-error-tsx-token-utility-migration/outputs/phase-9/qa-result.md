# Phase 9 — 品質保証

## 検証マトリクス

| 項目 | コマンド / 検証 | 期待 |
|------|----------------|------|
| typecheck | `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| lint | `pnpm --filter @ubm-hyogo/web lint` | PASS |
| build | `pnpm --filter @ubm-hyogo/web build` | PASS |
| unit test | `pnpm --filter @ubm-hyogo/web test` | PASS |
| grep gate（error.tsx） | `grep -nE 'text-\[var\(\|bg-\[var\(\|fg-muted' apps/web/src/app/error.tsx` | 0 件 |
| grep gate（boundary 群） | 副次対象 grep | 0 件 |
| verify-design-tokens（task-18）| `node scripts/verify-design-tokens.js` | PASS |
| visual baseline（task-18）| `playwright-smoke / visual` | diff 0 |
| link 整合 | `index.md` 内リンク | 全て解決 |
| mirror parity | 該当なし（skill 変更なし） | N/A |

## line budget

| ファイル | 行数想定 |
|---------|---------|
| `apps/web/src/app/error.tsx` | 変更前 ≒ 60 行 / 変更後 ≒ 60 行（純粋置換） |

## stub / removed file の扱い

なし（削除なし）。

## 結論

PASS（全 gate 通過想定）。実行時実測値は Phase 11 manual-test に記録する。
