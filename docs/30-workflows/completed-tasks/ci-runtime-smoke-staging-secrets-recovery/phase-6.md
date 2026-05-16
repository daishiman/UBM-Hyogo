# Phase 6: テスト拡充

## 追加カバレッジ

| ID | ケース | 目的 |
|----|--------|------|
| TC-04 | URL と repository-local missing path が同一行に混在 | external URL は除外し local missing は検出 |
| TC-07 | 現リポジトリ実体 | `.github/workflows/` の実参照が current path を指すことを確認 |
| bash syntax | `bash -n` | macOS bash 3.2+ で動作する形式を維持 |

## 回帰 guard

- `runtime-smoke-staging.yml` を修正前の stale path に戻した状態で guard を実行 → exit 1 になることを CI に組み込む regression test を `__tests__` 内 fixture として保持
