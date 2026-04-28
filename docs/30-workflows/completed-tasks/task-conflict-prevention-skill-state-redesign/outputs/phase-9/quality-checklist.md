# Phase 9: 品質チェックリスト

## §1. 構造チェック

| # | 項目 | 状態 |
| --- | --- | --- |
| S-01 | index.md / artifacts.json / phase-01.md 〜 phase-13.md が存在 | [x] PASS |
| S-02 | outputs/phase-1 〜 phase-13/ に成果物または .gitkeep が存在 | [x] PASS |
| S-03 | artifacts.json が task-definition.json schema に概ね準拠 | [x] PASS |
| S-04 | artifacts.json の outputs 配列 と 各 phase 「成果物」表が一致 | [x] PASS |
| S-05 | 全 phase ファイルがメタ情報・目的・実行タスク・参照資料・成果物・完了条件・次 Phase を持つ | [x] PASS |

## §2. AC-1〜AC-9 トレース表

| AC | 内容 | 確認 phase | 主 output | 状態 |
| --- | --- | --- | --- | --- |
| AC-1 | A-1/A-2/A-3/B-1 各施策の対象パスと変更後形式が Phase 2 で明記 | phase-02 | outputs/phase-2/file-layout.md | [x] PASS |
| AC-2 | A-2 fragment 命名規約が正規表現レベルで一意 | phase-02 | outputs/phase-2/fragment-schema.md | [x] PASS |
| AC-3 | A-3 で SKILL.md が 200 行未満になる分割案 | phase-07 | outputs/phase-7/skill-split-runbook.md | [x] PASS |
| AC-4 | B-1 の .gitattributes パターンが行レベル独立性を満たす対象に限定 | phase-03 | outputs/phase-3/impact-matrix.md | [x] PASS |
| AC-5 | Phase 4 で 4 worktree 並列 commit シミュレーション再現手順 | phase-04 | outputs/phase-4/parallel-commit-sim.md | [x] PASS |
| AC-6 | Phase 11 で 4 worktree 並列マージ衝突 0 件 検証手順と証跡形式 | phase-11 | outputs/phase-11/manual-smoke-log.md | [x] PASS |
| AC-7 | Phase 12 で specs に skill ledger 仕様を追記する契約・配置先・検証手順が changelog と整合 | phase-12 | outputs/phase-12/documentation-changelog.md / system-spec-update-summary.md | [x] PASS |
| AC-8 | 既存 LOGS.md history 保持方針が Phase 3 で評価済 | phase-03 | outputs/phase-3/backward-compat.md | [x] PASS |
| AC-9 | 生成物が Markdown / JSON / .gitkeep のみ | phase-09 | quality-checklist.md §4 | [x] PASS |

## §3. 内容チェック

| # | 項目 | 状態 |
| --- | --- | --- |
| C-01 | FR / NFR が phase-01 で確定 | [x] PASS |
| C-02 | A-1 / A-2 / A-3 / B-1 の各施策が Phase 5/6/7 でランブック化 | [x] PASS |
| C-03 | Phase 4 に並列 commit シミュレーション手順がある | [x] PASS |
| C-04 | Phase 11 に 4 worktree 手動検証手順がある | [x] PASS |
| C-05 | Phase 12 に specs 追記契約と changelog がある | [x] PASS |

## §4. コード非実装 / Secret 衛生

| # | 項目 | 状態 |
| --- | --- | --- |
| N-01 | 生成物が Markdown / JSON / .gitkeep のみ | [x] PASS |
| N-02 | 実装コード（.ts / .js / .sh 等）が含まれない | [x] PASS |
| N-03 | git status で意図しないファイル変更がない | [x] PASS |
| N-04 | API トークン / OAuth トークン / .env 実値の混入なし | [x] PASS |
| N-05 | op:// 参照は必要箇所のみ（本タスクは該当なし） | [x] PASS |

## §5. 整合 / リンク健全性

| # | 項目 | 状態 |
| --- | --- | --- |
| L-01 | 全 phase の outputs/ が成果物（.md or .gitkeep）を持つ | [x] PASS |
| L-02 | artifacts.json の phases[].outputs と実ファイルの差異 0 件 | [x] PASS |
| L-03 | 用語ぶれなし（phase-08 before-after.md §1 準拠） | [x] PASS |
| L-04 | リンク切れなし（phase-08 §3 リンク整備で確認） | [x] PASS |
| L-05 | 4 worktree 並列シナリオが phase-04 / phase-11 で利用可能 | [x] PASS |

## 総合判定

全 25 項目 PASS / NG 0 件 → **品質ゲート PASS**
