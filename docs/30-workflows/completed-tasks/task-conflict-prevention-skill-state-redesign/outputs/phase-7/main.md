# Phase 7 成果物 — A-3 / B-1 実装ランブック総括

## なぜ A-3 と B-1 を 1 Phase に束ねるか

| 観点 | A-3 (Progressive Disclosure) | B-1 (merge=union) |
| --- | --- | --- |
| 変更単位 | 既存ファイルの分割 / 局所変更 | リポジトリ ルート 1 ファイル追記 |
| 影響範囲 | 各 skill 内 references 構造 | git merge driver のみ |
| A-2 との関係 | A-2 と独立 | A-2 完了で削除予定の暫定策 |
| 構造転換規模 | 小〜中（A-2 ほどの大規模 IO 変更を伴わない） | 小（attribute 追加のみ） |

両者とも「既存ファイルへの局所追加で完結」「破壊的でない」「rollback がほぼ即時」
という性質を共有するため、レビュー単位を統一したほうが効率的。
ただし **runbook ファイルは別ファイル** に分け、実装タスクが個別に着手できる構造とする。

## 成果物 index

| ファイル | 役割 | AC |
| --- | --- | --- |
| `skill-split-runbook.md` | A-3 実装手順 | AC-3 |
| `gitattributes-runbook.md` | B-1 実装手順 | AC-4 |
| `main.md` (本ファイル) | 統括 / AC マトリクス | — |

## 分割理由まとめ

- A-3 は skill ごとに `references/` を増やすため **着手順序が独立**
- B-1 は 1 commit で完結するため **着手粒度が極小**
- 別 PR にすることで rollback コストを最小化

## AC トレース（Phase 7 で完了させる範囲）

| AC | 確認観点 | 確認ファイル |
| --- | --- | --- |
| AC-1 | A-1〜B-1 の対象 / 形式が明示 | Phase 2 file-layout.md / 本フェーズ runbook |
| AC-2 | fragment 命名一意 | Phase 2 fragment-schema.md |
| AC-3 | SKILL.md 200 行未満分割案 | `skill-split-runbook.md` |
| AC-4 | merge=union が「行レベル独立」のみに限定 | `gitattributes-runbook.md` |
| AC-5 | 並列 commit シナリオ | Phase 4 parallel-commit-sim.md |
| AC-6 | 並列 fragment merge 0 件 | Phase 11 manual-smoke-log.md |
| AC-7 | specs 反映 | Phase 12 |
| AC-8 | 後方互換 | Phase 3 backward-compat.md |
| AC-9 | コード非実装 | Phase 1〜13 通し |

## ゲート条件

`SKILL.md` が entrypoint として機能しつづけ、JSON / YAML / lockfile に
`merge=union` が **誤適用されていない** ことを確認した時点で Phase 8 に進む。

## 後続 Phase との関係

- Phase 8: 本フェーズで分割した references の冗長性を整理
- Phase 9: 行数 / 重複の品質ゲート
- Phase 11: C-4 / C-5 を手動検証
