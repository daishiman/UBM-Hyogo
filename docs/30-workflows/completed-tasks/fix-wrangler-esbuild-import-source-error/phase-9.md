# Phase 9: 品質保証

## 9.1 一括判定マトリクス

| 観点 | コマンド | 期待 | 失敗時の措置 |
|------|---------|------|-------------|
| 型 | `mise exec -- pnpm typecheck` | exit 0 | TS バージョンや esbuild loader の host mismatch を疑い、`mise install` → `pnpm install` 再実行 |
| Lint | `mise exec -- pnpm lint` | exit 0 | `pnpm lint --fix` で自動修正、残違反のみ手修正 |
| Build | `mise exec -- pnpm build` | exit 0 | Phase 5 タスク 1 に戻り esbuild バージョン再選定 |
| Test | `mise exec -- pnpm test -- --run` | 既存件数 pass | esbuild 0.25.x の loader 不整合を疑う |
| Script test | `mise exec -- pnpm test:scripts` | exit 0 | shell script 単体の問題切り分け |
| Smoke | `mise exec -- pnpm smoke:test` | exit 0 | 既存 smoke の前提変化を確認 |
| 設計トークン | `mise exec -- pnpm verify:tokens` | exit 0 | 本タスクで影響しないため drift があれば別タスク扱い |
| Phase12 compliance | `mise exec -- pnpm verify:phase12-compliance` | exit 0 | 仕様書のフォーマット違反確認 |
| Static manifest | `mise exec -- pnpm verify:static-manifest` | exit 0 | 影響しない |
| Indexes | `mise exec -- pnpm indexes:rebuild` | drift 0 | `pnpm indexes:rebuild` を再実行 |

## 9.2 line budget

| ファイル | line 上限 | 実測 | 判定 |
|---------|----------|------|------|
| `package.json` | + 0〜1 行 | +0（値更新のみ） | OK |
| `pnpm-lock.yaml` | 自動再生成 | esbuild 関連 entry 数による | OK（機械生成のため除外） |
| `scripts/cf.sh` | + 0〜2 行（任意） | RF-1 実施時のみ | OK |
| 各 `phase-*.md` | < 400 行 | 全て < 200 行を想定 | OK |

## 9.3 link parity

| 内部参照 | 実体 |
|---------|------|
| `index.md` → `phase-1.md` 〜 `phase-13.md` | 全て本ワークフロー直下に存在 |
| `phase-12.md` → `outputs/phase-12/*` | Phase 12 実行時に揃える |

## 9.4 mirror parity

`.agents/` 配下に skill mirror を持つが、本ワークフローは `docs/30-workflows/` のため mirror 対象外。skill 自体（`.claude/skills/task-specification-creator`）は本タスクでは触らない。

## 9.5 DoD

- 9.1 の 10 項目がすべて exit 0。
- 9.2 line budget 違反なし。
- 9.3 link 切れなし。
