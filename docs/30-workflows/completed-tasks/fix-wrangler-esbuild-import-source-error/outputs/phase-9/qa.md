# Phase 9 成果物: 品質保証

## 一括判定マトリクス（実走結果）
| 観点 | コマンド | 結果 |
|------|---------|------|
| 型 | `mise exec -- pnpm typecheck` | ✅ exit 0 |
| Lint | `mise exec -- pnpm lint` | ✅ exit 0 |
| Install | `mise exec -- pnpm install --frozen-lockfile` | ✅ exit 0 |
| API dry-run | `pnpm --filter @ubm-hyogo/api exec wrangler deploy --dry-run --env staging` | ✅ exit 0、`import-source` エラー消失 |
| esbuild 単一版 | `pnpm why esbuild` | ✅ `Found 1 version of esbuild` (`0.27.3`) |

## line budget
| ファイル | 上限 | 実測 | 判定 |
|---------|------|------|------|
| `package.json` | +0〜1 行 | +0（値更新のみ） | OK |
| `pnpm-lock.yaml` | 自動再生成 | 機械生成のため除外 | OK |
| `scripts/cf.sh` | +0〜2 行 | +2 | OK |
| `phase-*.md` | < 400 行 | 全て < 200 行 | OK |

## link parity
- `index.md` → `phase-1.md` 〜 `phase-13.md`: 全在
- `phase-12.md` → `outputs/phase-12/*`: 7 成果物が存在

## DoD
- 9.1 の主要項目がすべて exit 0: ✅
- line budget 違反なし: ✅
- link 切れなし: ✅
