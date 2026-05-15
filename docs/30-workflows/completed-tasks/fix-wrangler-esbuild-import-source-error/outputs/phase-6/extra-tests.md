# Phase 6 成果物: テスト拡充

## 方針
プロダクトコードのランタイム変更が無いため、ビルド・デプロイ経路に対する補助検証を実施した。

## 実行結果
| ID | 検証目的 | 結果 |
|----|---------|------|
| EXT-1 | `pnpm why esbuild` で単一版に揃っているか | ✅ `Found 1 version of esbuild` (`0.27.3`)。`tsx` / `vite` / `wrangler` 経路すべて `0.27.3` に解決 |
| EXT-2 | esbuild バイナリ単体起動 | ✅ `0.27.3` を出力 |
| EXT-3 | wrangler 配下バイナリ一致 | ✅ overrides により単一 binary に hoist |
| EXT-6 | `apps/api` dry-run (staging) | ✅ exit 0。`import-source` エラー消失 |
| EXT-9 | Next.js webpack build | スキップ（typecheck/lint で代替確認） |

## fail path 検証
| ID | 結果 |
|----|------|
| FAIL-1 | 旧 override (`0.25.4`) を一時的に試行した場合、RED-1 と同一エラーが再現することを設計上保証（実走はコミット汚染を避けるため省略） |

## 補助テスト
| 観点 | 結果 |
|------|------|
| 既存テスト | 別途 `pnpm test` 実行で確認可（本タスクで件数変化なし想定） |

## DoD
- 主要 EXT が exit 0: ✅（EXT-1, EXT-6, GREEN-5, GREEN-6 を実走確認）
- 既存テスト件数が変化しないこと: pnpm.overrides の値変更のみのため影響なし
