# Phase 10 — go-no-go.md

## Status

completed

## 判定対象

`docs/30-workflows/task-git-hooks-lefthook-and-post-merge/artifacts.json :: acceptance_criteria`

```json
[
  "lefthook.yml design",
  "post-merge regeneration stop",
  "existing worktree reinstall runbook",
  "NON_VISUAL evidence"
]
```

## 判定マトリクス

### AC-1: `lefthook.yml` design

| 項目 | 内容 |
| --- | --- |
| 証跡 | `outputs/phase-2/design.md` §1（完全な yaml 案）/ §2（trace matrix） |
| 評価 | 2 lane × commands × `output` セクション × `min_version` × `parallel` の全要素を網羅 |
| 判定 | **PASS / GO** |

### AC-2: post-merge regeneration stop

| 項目 | 内容 |
| --- | --- |
| 期待 | post-merge から `indexes/*.json` 再生成を削除し、代替経路（明示コマンド + CI gate）を提示 |
| 証跡 | `outputs/phase-2/design.md` §3（廃止根拠と代替）/ `outputs/phase-8/before-after.md` §3（削除と CI 化） |
| 評価 | 観測された事実（PR #125 / #127 で diff 600 行混入）に基づき、削除・代替・CI 検証の 3 段が定義済み |
| 判定 | **PASS / GO** |

### AC-3: existing worktree reinstall runbook

| 項目 | 内容 |
| --- | --- |
| 期待 | 既存 30+ worktree への lefthook 再 install 手順が runbook 化されている |
| 証跡 | `outputs/phase-2/design.md` §4（骨子）/ Phase 5 runbook（一括 for ループ + prunable / detached HEAD スキップ） |
| 評価 | `pnpm install` 由来の `prepare` 自動化 + 既存 worktree 一括スクリプトの両方を提示 |
| 判定 | **PASS / GO** |

### AC-4: NON_VISUAL evidence

| 項目 | 内容 |
| --- | --- |
| 期待 | NON_VISUAL タスクとして screenshot 不要を明示し、代替の証跡（手動 smoke ログ等）が定義されている |
| 証跡 | `outputs/phase-11/manual-smoke-log.md`（手動 smoke 手順 + 期待出力）/ `outputs/phase-11/main.md`（screenshot を作らない理由・自動テスト 0 件の理由） |
| 評価 | hook 系は副作用がローカル `.git/` 配下に集中し UI を持たないため、視覚証跡では検証できない。代替として CLI 出力ログを採取 |
| 判定 | **PASS / GO** |

## 総合判定

| 集計 | 件数 |
| --- | --- |
| GO | 4 |
| NO-GO | 0 |
| BLOCKER | 0 |

**結論: GO**。Phase 11 へ進行可。

## ブロッカー / 保留

なし。

## ロールバック条件

実装タスク（後続 `feat/*`）にて以下のいずれかが発生した場合、本仕様書を Phase 2 design に差し戻し再設計する:

1. `lefthook validate` が構造的に失敗し yaml 案で表現できない
2. `pnpm indexes:rebuild` が CI で安定動作しない（generate-index.js 側の不具合）
3. 30+ worktree 一括再 install スクリプトが特定 worktree で再現的に失敗

いずれも本 docs タスクでは検出されず、Phase 11 manual smoke でも該当事象は想定されない（仕様書段階）。
