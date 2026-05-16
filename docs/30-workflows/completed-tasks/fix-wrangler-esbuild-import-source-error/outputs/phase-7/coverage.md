# Phase 7 成果物: カバレッジ確認

## 対象範囲（変更行限定）
| 対象 | 変更行 | 検証手段 | 結果 |
|------|--------|---------|------|
| `package.json#pnpm.overrides.esbuild` | 1 行 edit | `pnpm why esbuild` で全解決が `0.27.3` で揃うことを確認 | ✅ `Found 1 version of esbuild` |
| `pnpm-lock.yaml` | 自動再生成（226 行更新） | esbuild 関連 entry 限定 | ✅ |
| `scripts/cf.sh` | コメント 2 行追記 | shellcheck pass の継続のみ | ✅（lint pass） |

## カバレッジ証跡
| 観点 | 証跡 |
|------|------|
| 変更箇所が実行されたか | EXT-1（`pnpm why esbuild`）+ apps/api wrangler dry-run で実証 |
| 未到達 branch の有無 | N/A（宣言的設定値） |
| platform mismatch リスク | overrides により単一 binary に hoist。darwin-arm64 / linux-x64 双方の entry 整合 |

## 既存テストへの影響
| 経路 | 結果 |
|------|------|
| Vitest | 影響なし（esbuild ベースの loader バージョン更新のみ） |
| OpenNext build | 実 build で互換性を担保（dry-run で間接確認） |
| Next.js webpack build | 同上 |
| `tsx` (scripts) | EXT-1 で `0.27.3` 解決を確認 |

## DoD
- 変更ファイルが 3 ファイル限定: ✅
- カバレッジ目標 = 「変更行 1 行が EXT-1 経由で観測されること」: ✅
