# Phase 7: AC マトリクス — トレーサビリティ確定版

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 30+ worktree への lefthook 一括再インストール runbook 運用化 |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 作成日 | 2026-04-28 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化・整合性) |
| 状態 | spec_created |
| タスク分類 | docs-only / runbook-spec / NON_VISUAL |
| 判定 | AC-1〜AC-10 全件 PASS |

## 1. 目的

`index.md` で定義した受入条件 AC-1〜AC-10 を、以下 4 軸で 1 対多にトレースし、
Phase 10（最終レビュー）が GO 判定を下すために必要な根拠を一枚で示す。

1. 仕様書セクション（phase-01〜phase-12 / index.md / artifacts.json）
2. テスト階層（Phase 4 で定義: dry-run / 単 worktree smoke / 全件 smoke / NON_VISUAL evidence）
3. 異常系ケース（Phase 6 の F-01〜F-10）
4. Phase 11 で残す検証手順 / evidence（NON_VISUAL タスクの代替証跡）

未トレース AC が 0 件であること、および AC-1〜AC-10 が全件 PASS と判定されることを
確認する。

## 2. 5 列マトリクス（AC × 仕様書 × テスト × 異常系 × Evidence）

| AC | 内容（要旨） | 仕様書セクション | テスト階層（Phase 4） | 異常系ケース（Phase 6） | 検証手順 / Evidence (Phase 11) | 判定 |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1 | 有効 worktree 抽出（prunable 除外）の手順が runbook に明記 | `phase-02.md §4.1`「有効 worktree 抽出」 / `phase-02.md §5` awk parser / `phase-05.md`「擬似実装」 / `index.md`「スコープ」 | dry-run / 全件 smoke | F-03 (prunable 残存) / F-09 (`git worktree list` 失敗) | `outputs/phase-11/manual-smoke-log.md` に prunable 以外の path のみが記録されている | PASS |
| AC-2 | 逐次 install の手順と並列禁止理由（pnpm store 競合）の明記 | `phase-02.md §4.2`「逐次 install ループ」 / `phase-02.md §7 ADR-01` / `phase-05.md`「重要な注意事項」第 1 項 / `index.md`「苦戦箇所 1」 | dry-run / 全件 smoke | F-01 (pnpm store 競合) | runbook 冒頭ガードで並列禁止が明記され、ログに 1 worktree ずつ追記されていること | PASS |
| AC-3 | 各 worktree で `mise exec -- pnpm exec lefthook version` が PASS する検証手順 | `phase-02.md §4.3`「検証フェーズ」 / `phase-05.md`「擬似実装」(2) ブロック | 単 worktree smoke / 全件 smoke | F-04 (Apple Silicon binary mismatch) / F-05 (rebuild 後も FAIL) | `manual-smoke-log.md` の `lefthook version` カラムが semver で埋まる（または `OK_AFTER_REBUILD`） | PASS |
| AC-4 | `.git/hooks/post-merge` 等の旧 hook 残存点検手順 | `phase-02.md §4.4`「旧 hook 残存点検」 / `phase-02.md §7 ADR-03` / `phase-05.md`「擬似実装」(3) ブロック / `index.md`「苦戦箇所 4」 | dry-run / 全件 smoke | F-06 (STALE hook 残存) / F-07 (.git 欠損) | `hygiene` カラムに `OK` / `STALE` / `ABSENT` のいずれかが記録され、STALE は runbook 末尾に集約 | PASS |
| AC-5 | 実行ログを `outputs/phase-11/manual-smoke-log.md` に記録する書式の定義 | `phase-02.md §4.5`「ログ書式」 / `phase-02.md §7 ADR-05` / `phase-05.md`「ログ書式（M-01 吸収）」 / `phase-04.md` 階層 4 | NON_VISUAL evidence | F-08 (ログ書き込み失敗) | `outputs/phase-11/manual-smoke-log.md` のヘッダが ISO8601 UTC（例: `2026-04-28T10:00Z`）で確定し、表形式で記録されている | PASS |
| AC-6 | `doc/00-getting-started-manual/lefthook-operations.md` への差分追記内容の specify | `phase-02.md §10`「既存ドキュメント差分仕様」 / `phase-12.md`（一括再 install runbook へのリンク章追記） / `phase-05.md`「責務境界」 | dry-run | - | `outputs/phase-12/documentation-changelog.md` に追記内容が列挙され、`lefthook-operations.md` から本 runbook への相互リンクが Phase 12 で確認される | PASS |
| AC-7 | 新規 worktree 自動 install（`scripts/new-worktree.sh`）と一括再 install runbook の責務境界の明記 | `phase-02.md §6`「責務境界」 / `phase-05.md`「責務境界（再掲）」 / `index.md`「依存関係」 | dry-run | - | 責務境界表が phase-02 / phase-05 の双方で同一であり、`scripts/new-worktree.sh` の動作と矛盾しない | PASS |
| AC-8 | 4 条件（価値性 / 実現性 / 整合性 / 運用性）全 PASS | `index.md §4 条件評価` / `phase-01.md` / `phase-03.md §6`「4 条件再評価」 / `phase-10.md`（go-no-go） | dry-run | - | Phase 10 `outputs/phase-10/go-no-go.md` で 4 条件全 PASS が再確認される | PASS |
| AC-9 | 苦戦箇所 4 件以上（pnpm store 並列禁止 / detached HEAD / prunable / Apple Silicon rebuild を含む） | `index.md`「苦戦箇所・知見（事前棚卸し）」5 件 / `phase-06.md`「苦戦箇所カバレッジ」 | dry-run | F-01, F-02, F-03, F-04, F-05, F-06, F-07 | 苦戦箇所が 5 件、異常系が 10 件記載済み（4 件以上の閾値を充足） | PASS |
| AC-10 | Phase 12 で必須 5 種を全件出力（0 件でも出力必須） | `phase-12.md` / `artifacts.json` / `index.md`「主要成果物」 | NON_VISUAL evidence | - | `outputs/phase-12/` 配下に implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md の 5 ファイルが揃う | PASS |

## 3. 1 対多トレーサビリティ詳細

### 3.1 AC ごとの主従関係

| AC | 主たる仕様書 | 補完する仕様書 |
| --- | --- | --- |
| AC-1 | `phase-05.md`（擬似実装の awk parser） | `phase-02.md §4.1, §5` / `phase-06.md` (F-03, F-09) |
| AC-2 | `phase-05.md`（重要な注意事項） | `phase-02.md §4.2, §7 ADR-01` / `phase-06.md` (F-01) |
| AC-3 | `phase-05.md`（擬似実装 (2)） | `phase-02.md §4.3` / `phase-06.md` (F-04, F-05) |
| AC-4 | `phase-05.md`（擬似実装 (3)） | `phase-02.md §4.4, §7 ADR-03` / `phase-06.md` (F-06, F-07) |
| AC-5 | `phase-05.md`（ログ書式 / M-01 吸収） | `phase-02.md §4.5, §7 ADR-05` / `phase-04.md` 階層 4 / `phase-11.md` |
| AC-6 | `phase-12.md`（差分追記計画） | `phase-02.md §10` / `phase-05.md`（責務境界） |
| AC-7 | `phase-02.md §6` / `phase-05.md`（責務境界） | `index.md` / `scripts/new-worktree.sh` |
| AC-8 | `index.md` / `phase-03.md §6` | `phase-01.md` / `phase-10.md` |
| AC-9 | `phase-06.md`（苦戦箇所カバレッジ） | `index.md`「苦戦箇所」 |
| AC-10 | `phase-12.md` | `artifacts.json` |

### 3.2 仕様書セクションごとに被覆される AC

| 仕様書セクション | 被覆 AC |
| --- | --- |
| `phase-02.md §4.1`「有効 worktree 抽出」 | AC-1 |
| `phase-02.md §4.2`「逐次 install ループ」 | AC-2 |
| `phase-02.md §4.3`「検証フェーズ」 | AC-3 |
| `phase-02.md §4.4`「旧 hook 残存点検」 | AC-4 |
| `phase-02.md §4.5`「ログ書式」 | AC-5 |
| `phase-02.md §6`「責務境界」 | AC-7 |
| `phase-02.md §7` ADR-01〜05 | AC-2, AC-3, AC-4, AC-5, AC-8 |
| `phase-02.md §10`「ドキュメント差分仕様」 | AC-6 |
| `phase-05.md`「擬似実装」 | AC-1, AC-2, AC-3, AC-4, AC-5 |
| `phase-05.md`「重要な注意事項」 | AC-2 |
| `phase-05.md`「ログ書式（M-01 吸収）」 | AC-5 |
| `phase-05.md`「責務境界（再掲）」 | AC-6, AC-7 |
| `phase-06.md` F-01〜F-10 | AC-1, AC-2, AC-3, AC-4, AC-5, AC-9 |
| `phase-12.md`（差分追記計画 / 必須 5 種出力） | AC-6, AC-10 |
| `index.md` / `phase-03.md`（4 条件） | AC-8 |
| `index.md`「苦戦箇所」 | AC-9 |

### 3.3 異常系（Phase 6 F-01〜F-10）と AC の対応

| 異常系 ID | 異常事象 | 紐づく AC |
| --- | --- | --- |
| F-01 | pnpm store 同時書き込み競合 | AC-2, AC-9 |
| F-02 | detached HEAD worktree | AC-9 |
| F-03 | prunable worktree 混入 | AC-1, AC-9 |
| F-04 | Apple Silicon binary mismatch | AC-3, AC-9 |
| F-05 | rebuild 後も `lefthook version` 失敗 | AC-3, AC-9 |
| F-06 | 旧 `.git/hooks/post-merge` 残存（STALE） | AC-4, AC-9 |
| F-07 | `.git` ディレクトリ欠損 / linked worktree 破損 | AC-4, AC-9 |
| F-08 | ログファイル書き込み失敗 | AC-5 |
| F-09 | `git worktree list` 自体の失敗 | AC-1 |
| F-10 | `mise` / `pnpm` PATH 解決失敗 | AC-2, AC-3 |

## 4. ギャップ分析

| 観点 | 結果 | 補足 |
| --- | --- | --- |
| 未トレース AC | 0 件 | AC-1〜AC-10 すべてが 1 つ以上の仕様書セクションに紐づく |
| 単一仕様書のみで支えている AC | AC-8 のみ | `index.md` / `phase-03.md §6` の 4 条件再評価のみ。Phase 10 `go-no-go.md` で再確認するため許容 |
| 異常系で支援不要な AC | AC-6, AC-7, AC-8, AC-10 | 運用境界 / 条件判定 / 必須出力系であり、異常系経路に依存しない設計 |
| Phase 11 evidence 必須 AC | AC-1, AC-2, AC-3, AC-4, AC-5, AC-10 | NON_VISUAL タスクのため `manual-smoke-log.md` と `outputs/phase-12/` 5 ファイルが evidence 本体 |
| テスト階層に紐づかない AC | AC-6, AC-7, AC-8 | 仕様 / 境界 / 4 条件評価の論理判定であり、test 不要 |

## 5. 最終判定

| AC | 判定 | 根拠サマリー |
| --- | --- | --- |
| AC-1 | PASS | phase-02 §4.1 + phase-05 awk parser + F-03/F-09 異常系 + Phase 11 ログで完全トレース |
| AC-2 | PASS | phase-02 §4.2 + ADR-01 + phase-05 注意事項 + F-01 で完全トレース |
| AC-3 | PASS | phase-02 §4.3 + phase-05 擬似実装 (2) + F-04/F-05 で完全トレース |
| AC-4 | PASS | phase-02 §4.4 + ADR-03 + phase-05 擬似実装 (3) + F-06/F-07 で完全トレース |
| AC-5 | PASS | phase-02 §4.5 + ADR-05 + phase-05 ログ書式（M-01 吸収）+ F-08 + ISO8601 UTC で完全トレース |
| AC-6 | PASS | phase-02 §10 + phase-12 差分追記計画 + documentation-changelog.md で完全トレース |
| AC-7 | PASS | phase-02 §6 + phase-05 責務境界（再掲）+ scripts/new-worktree.sh と整合 |
| AC-8 | PASS | index.md 4 条件評価 + phase-03 §6 再評価 + phase-10 go-no-go で再確認予定 |
| AC-9 | PASS | index.md 苦戦 5 件（要件 4 件以上を充足）+ phase-06 異常系 10 件 |
| AC-10 | PASS | phase-12 で 5 種必須出力（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report）が固定 |

**総合判定: PASS（AC-1〜AC-10 全 10 件 PASS / 未トレース 0 件 / MAJOR 指摘 0 件）**

## 6. 実行タスク（本 Phase の責務）

1. AC-1〜AC-10 を 4 軸（仕様書 / テスト階層 / 異常系 / Phase 11 evidence）にトレースする。【done: §2】
2. 1 対多関係を主従関係表で固定する。【done: §3.1】
3. 仕様書セクション → AC の逆引き表で被覆漏れを点検する。【done: §3.2】
4. 異常系（F-01〜F-10）と AC の対応表を確定する。【done: §3.3】
5. ギャップ分析で未トレース AC が 0 件であることを確認する。【done: §4】
6. AC-1〜AC-10 全件 PASS 判定を確定する。【done: §5】

## 7. 成果物

- 本ファイル `outputs/phase-07/ac-matrix.md`
- 5 列マトリクス（AC × 仕様書 × テスト階層 × 異常系 × evidence）
- 主従関係表（AC → 主従仕様書）
- 逆引き表（仕様書 → AC）
- 異常系 → AC 対応表
- ギャップ分析（未トレース 0 件）
- 最終判定表（全 10 件 PASS）

## 8. 完了条件

- AC-1〜AC-10 が全て 1 つ以上の仕様書セクションにトレースされている → 達成
- AC-1〜AC-5 が Phase 6 異常系ケースにも紐づいている → 達成
- AC-10 が Phase 12 必須 5 種出力にトレースされている → 達成
- ギャップ分析で未トレース AC = 0 → 達成
- AC-1〜AC-10 が全件 PASS と判定されている → 達成

## 9. Phase 8 への引き渡し事項

- 主従関係表（§3.1）を DRY 化対象として Phase 8 で重複検出に利用する
- 単一仕様書のみで支える AC（AC-8）が Phase 10 `go-no-go.md` で再評価される旨を共有する
- 仕様書セクション逆引き（§3.2）を Phase 8 の line budget 配分根拠として活用する
- 異常系 → AC 対応表（§3.3）を Phase 9 の品質ゲート（mirror parity）で参照する
