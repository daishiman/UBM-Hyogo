# Phase 7 — カバレッジ確認

## 1. 判定

**カバレッジ計測 N/A**（workflow-only 変更 / runbook / SSOT 改定のため）。

## 2. Skip 根拠

| 観点                | 内容                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------- |
| 対象ファイル        | `.github/workflows/*.yml` / `docs/**/*.md` のみ（vitest coverage 対象外）            |
| 新規 TS / TSX コード | なし                                                                                  |
| 新規 vitest spec    | なし（Phase 6 で判定）                                                                |
| 既存 coverage 影響  | なし。`pnpm test:coverage:*` の対象 source は変更しない                              |
| coverage-guard hook | push 範囲に対象 source 変更が含まれないため `--changed` モードでも閾値判定は noop    |

## 3. 代替検証

| 代替              | 内容                                                            |
| ----------------- | --------------------------------------------------------------- |
| grep gate         | Phase 4 § 2 で 0 件 / 1 件以上を assert（4 patterns）           |
| actionlint        | workflow YAML 構文整合                                          |
| runtime evidence  | merge 後 1 回の mint-only smoke green（user-gated, Phase 11）  |
