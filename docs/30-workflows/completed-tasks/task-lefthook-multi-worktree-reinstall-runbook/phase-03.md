# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 30+ worktree への lefthook 一括再インストール runbook 運用化 |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-28 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | spec_created |

## 目的

Phase 2 設計が Phase 4 以降に進める品質に達しているかを判定する。代替案を最低 3 案検討し、PASS / MINOR / MAJOR で総合判定する。

## レビュー観点

| 観点 | 評価 |
| --- | --- |
| 真の論点との整合 | PASS — 「hook スキップ撲滅と継続保証」を満たす runbook 設計になっている |
| 依存境界 | PASS — new-worktree.sh / verify-indexes-up-to-date-ci との責務分界が明確 |
| 不変条件 | PASS — `lefthook.yml` 正本主義 / `.git/hooks/*` 手書き禁止 / post-merge 廃止と整合 |
| 失敗復帰 | PASS — continue ポリシーと自動 retry（pnpm rebuild lefthook）で運用負荷が低い |
| 監査可能性 | PASS — Markdown 表形式のログにより、後段の差分検証が可能 |
| 安全性 | PASS — 旧 hook 自動削除を行わないため誤削除リスクなし |

## 代替案検討

### 代替案 A: GitHub Actions による全 worktree CI 検証

- 内容: 開発者ローカルで一括再 install するのではなく、CI 側で「indexes 鮮度」「hook 配置」を検出する
- メリット: 開発者の手作業が不要
- デメリット: CI は CI 自身の checkout 環境しか見られず、ローカル worktree の `.git/hooks/` を確認できない。本問題（ローカル hook スキップ）は解決しない
- 採否: **不採用**（解決対象が異なる）

### 代替案 B: `git worktree` を全廃して per-clone モデルへ移行

- 内容: worktree を使わず、機能ごとに独立 clone を持つ
- メリット: 各 clone は独立した `pnpm install` ライフサイクルを持つ
- デメリット: ストレージ増、PR ブランチ切替が遅い、既存ワークフローを破壊する
- 採否: **不採用**（コスト過大）

### 代替案 C: post-merge を復活させて auto re-install

- 内容: post-merge 廃止を撤回して、merge のたびに自動再 install する
- メリット: 自動化される
- デメリット: 上流タスクで意図的に廃止した方針に逆行。indexes 自動再生成と同様の「無関係 PR への diff 混入」問題が再燃する
- 採否: **不採用**（直前タスクの方針と矛盾）

### 結論

採用案（Phase 2 設計の逐次 runbook + 擬似スクリプト仕様）が代替 3 案いずれよりも整合性が高い。

## レビュー結果

### MAJOR

なし。

### MINOR

| ID | 指摘 | 対応 |
| --- | --- | --- |
| M-01 | `outputs/phase-11/manual-smoke-log.md` に "実行日時" カラムを ISO8601 で書く運用が習慣化していない | Phase 11 仕様書に書式例を必ず含める |
| M-02 | `pnpm rebuild lefthook` 後の二度目失敗時、警告メッセージの文面が未定 | Phase 5 runbook で文面を確定する |
| M-03 | detached HEAD worktree は対象に含めるが、コミット行為が runbook 実行者に発生しないことを補足する一文がない | Phase 5 runbook 冒頭で明記する |

### NICE-TO-HAVE

| ID | 内容 |
| --- | --- |
| N-01 | 将来的に `scripts/reinstall-lefthook-all-worktrees.sh` を実装する Wave で、本 runbook をテストする CI smoke を追加できる |

## 総合判定

**PASS（MINOR 3 件は Phase 5 / Phase 11 で吸収）**

Phase 4 以降への進行を承認する。

## 4 条件再評価

| 観点 | 判定 | 備考 |
| --- | --- | --- |
| 価値性 | PASS | 変更なし |
| 実現性 | PASS | 変更なし |
| 整合性 | PASS | 代替 3 案を退け、上流タスクと完全整合 |
| 運用性 | PASS | M-01〜M-03 を Phase 5 / 11 で吸収すれば運用品質が確保される |

## Phase 4 への引き渡し

- MINOR 指摘 3 件（M-01〜M-03）を Phase 4-5-11 で取り込む
- 代替案 A/B/C は Phase 12 unassigned-task-detection で baseline として記録（保留判断の説明責任）
