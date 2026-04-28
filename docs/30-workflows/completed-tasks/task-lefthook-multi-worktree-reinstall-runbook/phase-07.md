# Phase 7: AC マトリクス

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
| タスク分類 | docs-only / runbook-spec |

## 目的

AC-1〜AC-10 を、(a) 仕様書セクション、(b) Phase 4 で定義したテスト階層、(c) Phase 6 の異常系ケース、(d) Phase 11 で残す検証手順 / evidence の 4 軸で 1 対多にトレースする。Phase 10 最終ゲートが本マトリクスを根拠に GO 判定できる粒度に揃える。

## AC × 仕様書セクション × 検証手順 マトリクス

| AC | 内容（要旨） | 仕様書セクション | テスト階層（Phase 4） | 異常系ケース（Phase 6） | 検証手順 / Evidence (Phase 11) |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 有効 worktree 抽出（prunable 除外） | phase-02.md「有効 worktree 抽出」/ phase-05.md「擬似実装」awk parser | dry-run / 全件 smoke | F-03 (prunable), F-09 (`git worktree list` 失敗) | `manual-smoke-log.md` に prunable 以外の path のみ記録されていること |
| AC-2 | 逐次 install と並列禁止理由 | phase-02.md「逐次 install ループ」/ phase-05.md「重要な注意事項」第 1 項 / ADR-01 | dry-run / 全件 smoke | F-01 (pnpm store 競合) | runbook 冒頭ガードに並列禁止が明記され、ログに 1 worktree ずつ追記されていること |
| AC-3 | 各 worktree で `lefthook version` PASS 検証 | phase-02.md「検証フェーズ」/ phase-05.md「擬似実装」(2) ブロック | 単 worktree smoke / 全件 smoke | F-04 (Apple Silicon mismatch), F-05 (rebuild 後も失敗) | `manual-smoke-log.md` の lefthook version カラムが semver で埋まる |
| AC-4 | 旧 hook 残存点検手順 | phase-02.md「旧 hook 残存点検」/ phase-05.md「擬似実装」(3) ブロック / ADR-03 | dry-run / 全件 smoke | F-06 (STALE), F-07 (.git 欠損) | `hygiene` カラムに `OK` / `STALE` / `ABSENT` / `OK_AFTER_REBUILD` のいずれかが記録されている |
| AC-5 | 実行ログ書式の定義 | phase-02.md「ログ書式」/ phase-05.md「ログ書式（M-01 吸収）」/ phase-04.md 階層 4 | NON_VISUAL evidence | F-08 (ログ書き込み失敗) | `outputs/phase-11/manual-smoke-log.md` のヘッダが ISO8601 UTC 表記で確定し、表形式で記録されている |
| AC-6 | `doc/00-getting-started-manual/lefthook-operations.md` 差分追記の specify | phase-12.md（一括再 install runbook へのリンク章を追記）/ phase-05.md「責務境界」 | dry-run | - | `documentation-changelog.md` に追記内容が記載され、`lefthook-operations.md` から本 runbook への相互リンクが Phase 12 で確認される |
| AC-7 | 新規 worktree 自動 install と一括再 install の責務境界 | phase-02.md「責務境界」/ phase-05.md「責務境界（再掲）」 | dry-run | - | 責務境界表が両 Phase で同一であり、`scripts/new-worktree.sh` と矛盾しない |
| AC-8 | 4 条件全 PASS | index.md / phase-01.md / phase-03.md 4 条件再評価 | dry-run | - | Phase 10 go-no-go.md で 4 条件全 PASS が再確認される |
| AC-9 | 苦戦箇所 4 件以上 | index.md「苦戦箇所」/ phase-06.md「苦戦箇所カバレッジ」 | dry-run | F-01, F-02, F-03, F-04, F-05, F-06, F-07 | 苦戦箇所が 5 件、異常系が 10 件記載済み（AC-9 充足） |
| AC-10 | Phase 12 必須 5 種出力 | phase-12.md / artifacts.json | NON_VISUAL evidence | - | `outputs/phase-12/` 配下に implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md の 5 ファイルが揃う |

## 1 対多トレーサビリティ詳細

### AC ごとの主従関係

| AC | 主たる仕様書 | 補完する仕様書 |
| --- | --- | --- |
| AC-1 | phase-05.md | phase-02.md / phase-06.md (F-03, F-09) |
| AC-2 | phase-05.md | phase-02.md / ADR-01 / phase-06.md (F-01) |
| AC-3 | phase-05.md | phase-02.md / phase-06.md (F-04, F-05) |
| AC-4 | phase-05.md | phase-02.md / ADR-03 / phase-06.md (F-06, F-07) |
| AC-5 | phase-05.md | phase-02.md / phase-04.md / phase-11.md |
| AC-6 | phase-12.md | phase-05.md（責務境界）|
| AC-7 | phase-02.md / phase-05.md | index.md / scripts/new-worktree.sh |
| AC-8 | index.md / phase-03.md | phase-01.md / phase-10.md |
| AC-9 | phase-06.md | index.md「苦戦箇所」 |
| AC-10 | phase-12.md | artifacts.json |

### 仕様書セクションごとに被覆される AC

| 仕様書セクション | 被覆 AC |
| --- | --- |
| phase-02.md「有効 worktree 抽出」 | AC-1 |
| phase-02.md「逐次 install ループ」 | AC-2 |
| phase-02.md「検証フェーズ」 | AC-3 |
| phase-02.md「旧 hook 残存点検」 | AC-4 |
| phase-02.md「ログ書式」 | AC-5 |
| phase-02.md「責務境界」 | AC-7 |
| phase-05.md「重要な注意事項」 | AC-2 |
| phase-05.md「擬似実装」 | AC-1, AC-2, AC-3, AC-4, AC-5 |
| phase-05.md「ログ書式（M-01 吸収）」 | AC-5 |
| phase-06.md F-01〜F-10 | AC-1, AC-2, AC-3, AC-4, AC-5, AC-9 |
| phase-12.md（差分追記計画） | AC-6, AC-10 |
| index.md / phase-03.md（4 条件） | AC-8 |

## ギャップ分析

| 観点 | 結果 |
| --- | --- |
| 未トレース AC | なし（10/10 トレース済み） |
| 単一仕様書のみで支えている AC | AC-8（index.md / phase-03.md の 4 条件再評価のみ）→ Phase 10 で再確認済みのため許容 |
| 異常系で支援不要な AC | AC-6, AC-7, AC-8, AC-10（運用境界・条件判定系であり異常系に依存しない）|
| Phase 11 evidence 必須 AC | AC-1, AC-2, AC-3, AC-4, AC-5, AC-10 |

## 実行タスク

1. AC-1〜AC-10 を 4 軸（仕様書 / テスト階層 / 異常系 / Phase 11 evidence）にトレースする。
2. 1 対多関係を主従関係表で固定する。
3. ギャップ分析で未トレース AC が 0 であることを確認する。
4. `outputs/phase-07/ac-matrix.md` に最終化版を書き出す。

## 成果物

- `outputs/phase-07/ac-matrix.md`（本 Phase の本体）
- AC × 仕様書 × テスト階層 × 異常系 × evidence の 5 列マトリクス
- 主従関係表
- ギャップ分析

## 完了条件

- AC-1〜AC-10 が全て 1 つ以上の仕様書セクションにトレースされている
- AC-1〜AC-5 が Phase 6 異常系ケースにも紐づいている
- AC-10 が Phase 12 必須 5 種出力にトレースされている
- ギャップ分析で未トレース AC = 0

## Phase 8 への引き渡し

- 主従関係表を DRY 化対象として Phase 8 で重複検出に利用する
- 単一仕様書のみで支える AC（AC-8）が Phase 10 で再評価される旨を共有する
