# Phase 6 成果物: fail path / 回帰テスト一覧（NOT EXECUTED）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| 種別 | 仕様（NOT EXECUTED — docs-only / spec_created） |
| 作成日 | 2026-04-28 |

> **NOT EXECUTED**: 本ワークフローは仕様化に閉じる。T6〜T10 の実走は実装担当者が別 PR で実施する。

## 適用範囲

- 前段: Phase 4 T1〜T5（happy path）
- 本 Phase: T6〜T10（fail path / 回帰 / rollback / nested / 正本配置）

## fail path / 回帰テスト一覧（T6〜T10）

| ID | 観点 | シナリオ | 検証コマンド | 期待値 | Red 仕掛け |
| --- | --- | --- | --- | --- | --- |
| T6 | regression | hook が canonical を再追加してしまう | `pnpm indexes:rebuild && git ls-files .claude/skills \| rg ... \| wc -l` | `0` | hook ガード行を削除して再走 → 増えれば検出 |
| T7 | rollback | `git add -f` 再追跡 → 2 回 revert | `git diff <pre-A-1>..HEAD -- .gitignore` 空 | A-1 適用前と一致 | revert が 3 コミット以上要求される |
| T8 | nested / submodule | nested ledger / submodule 配下も glob hit | `find ... \| xargs git check-ignore -v` | 全パス hit | nested が hit せず tracked 残存 |
| T9 | A-2 境界 | `LOGS.md` 本体が誤巻き込みされない | `git check-ignore -v .claude/skills/<skill>/LOGS.md` | exit 1（hit しない） | broaden glob で hit する |
| T10 | 正本配置 | `.git/info/exclude` ではなく `.gitignore` に記述 | `! grep ... .git/info/exclude && grep ... .gitignore` | OK | `.git/info/exclude` のみに記述 |

## fail path × 対応 lane / Phase 早見表

| ID | 検出 lane | 対応 Phase |
| --- | --- | --- |
| T6 | lane 3 | Phase 5 Step 4 / CI gate |
| T7 | lane 1 + lane 2 | Phase 5 ロールバック / Phase 11 |
| T8 | lane 1 | Phase 5 Step 1 glob 設計 / B-1 申し送り |
| T9 | lane 1 | Phase 5 Step 1 / A-2 境界 |
| T10 | lane 1 | Phase 5 Step 1 |

## 実走結果（NOT EXECUTED）

| ID | 実走日時 | 実走結果 | 備考 |
| --- | --- | --- | --- |
| T6 | _NOT EXECUTED_ | _NOT EXECUTED_ | 実装担当者が別 PR で記入 |
| T7 | _NOT EXECUTED_ | _NOT EXECUTED_ | 一時 worktree で実走推奨 |
| T8 | _NOT EXECUTED_ | _NOT EXECUTED_ | 現時点で nested ledger 無し |
| T9 | _NOT EXECUTED_ | _NOT EXECUTED_ | A-2 完了後に必須実走 |
| T10 | _NOT EXECUTED_ | _NOT EXECUTED_ | Step 1 完了直後に実走 |

## 完了確認（仕様レベル）

- [x] T6〜T10 が表化されている（5 件）
- [x] regression / rollback / nested / A-2 境界 / 正本配置の 5 観点をカバー
- [x] 各テストにシナリオ / 検証コマンド / 期待値 / Red 仕掛けが記述
- [x] NOT EXECUTED が明示されている

## 申し送り

- T6 / T9 を CI gate 候補として Phase 12 unassigned-task-detection.md に登録
- T8 nested 強化（`**/indexes/*.json` glob 化）は B-1 で再評価
- T7 rollback は実環境を汚さないため一時 worktree で実走
- 実走結果記入は実装担当者が別 PR で対応
