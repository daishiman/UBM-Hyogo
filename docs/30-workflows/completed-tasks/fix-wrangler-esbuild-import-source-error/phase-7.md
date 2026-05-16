# Phase 7: カバレッジ確認

## 7.1 対象範囲（変更行限定）

プロダクトソースコード変更が無いため、line / branch coverage の測定対象は **ビルド構成ファイル** に限定する。

| 対象 | 変更行 | 検証手段 |
|------|--------|---------|
| `package.json` の `pnpm.overrides.esbuild` 1 行 | 1 行 edit | EXT-1（`pnpm why esbuild`）で全解決が新版で揃うことを確認 |
| `pnpm-lock.yaml` の esbuild 関連 entry | 自動再生成 | `git diff pnpm-lock.yaml \| grep -c '@esbuild'` で差分件数を記録 |
| `scripts/cf.sh` のコメント | 任意・コメント行 | shellcheck pass の継続のみ |

## 7.2 カバレッジ証跡

| 観点 | 証跡 | 備考 |
|------|------|------|
| 変更箇所が実行されたか | EXT-2（esbuild 直接起動）+ EXT-4..7（wrangler dry-run） | 変更 override の効力をビルド経路全体で実証 |
| 未到達 branch の有無 | N/A（変更は宣言的設定値） | branch coverage 概念は適用外 |
| platform mismatch リスク | EXT-3 で wrangler 配下バイナリも揃うことを確認 | darwin-arm64 / linux-x64 双方の lockfile entry を目視 |

## 7.3 既存テストへの影響範囲

`pnpm.overrides.esbuild` は monorepo 全パッケージに波及するため、esbuild を内部利用する以下経路の coverage を確認する:

| 経路 | 確認コマンド | 期待 |
|------|-------------|------|
| Vitest（`scripts/with-env.sh` 経由） | `mise exec -- pnpm test -- --run` | 既存件数で pass |
| OpenNext build | EXT-8 | exit 0 |
| Next.js webpack build | EXT-9 | exit 0 |
| `tsx`（esbuild ベース、scripts 実行）| `mise exec -- pnpm test:scripts` | exit 0 |

## 7.4 DoD

- 7.1 の 3 ファイル以外に差分が無いことを `git diff --stat` で確認。
- 7.3 の 4 経路がすべて exit 0。
- カバレッジ目標は「広域 X%」ではなく **変更行 1 行が EXT-1 経由で観測される** ことを以て達成（[Feedback 5] 対応）。
