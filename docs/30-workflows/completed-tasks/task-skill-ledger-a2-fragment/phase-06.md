# Phase 06: テスト拡充

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-skill-ledger-a2-fragment |
| Phase | 6 |
| タスク種別 | implementation（refactoring） |
| visualEvidence | NON_VISUAL |
| workflow | implementation |

## 目的

Phase 4 の Happy path を超えた **fail path / 回帰 guard / 補助コマンド** のテストを追加し、本番運用相当の堅牢性を担保する。Phase 6 は Phase 5 実装後に着手する。

## 拡充対象

### F 系統（Fail path）

| ID | テスト内容 | 期待結果 |
| -- | ---------- | -------- |
| F-1 | 同秒・同 branch・nonce 3 回連続衝突（人工注入） | 3 回 retry → 4 回目で exit 1 |
| F-2 | front matter `timestamp` 欠損 | stderr に path 出力 + exit 1 |
| F-3 | front matter `branch` 欠損 | 同上 |
| F-4 | front matter `author` 欠損 | 同上 |
| F-5 | front matter `type` 欠損 | 同上 |
| F-6 | front matter YAML parse error | 同上 |
| F-7 | path が 240 byte を超える生成試行 | append helper が事前 reject + exit 1 |
| F-8 | escaped-branch が 64 文字を超える | trailing trim で 64 文字に収束し append 続行 |
| F-9 | `--out` が `LOGS.md` を指す | exit 2（誤上書き防止） |
| F-10 | `--out` が `SKILL-changelog.md` を指す | exit 2 |
| F-11 | `--since` に不正 ISO8601 | exit 1 + stderr エラー |

### R 系統（回帰 guard）

| ID | 観点 | 検証方法 |
| -- | ---- | -------- |
| R-1 | writer 経路に `LOGS.md` 直接追記が再混入していない | `rg -n "appendFileSync|writeFileSync\([^\n]*(LOGS\.md|logsPath|LOGS_PATH)|const LOGS_PATH|const logsPath = .*LOGS\.md" .claude/skills scripts` writer ヒット 0 件 |
| R-2 | writer 経路に `SKILL-changelog.md` 直接追記が再混入していない | `git grep -n 'SKILL-changelog\.md' .claude/skills/` 0 件 |
| R-3 | `_legacy.md` 削除がない | `git log --diff-filter=D` で `_legacy.md` 削除 commit 0 件 |
| R-4 | render 出力降順崩れの再発 | C-6 を CI 必須化 |
| R-5 | nonce 衝突回避ロジック削除の再発 | append helper の事前存在チェック分岐を必須テスト化 |

### S 系統（補助コマンド）

| ID | コマンド | 用途 |
| -- | -------- | ---- |
| S-1 | `pnpm skill:logs:render --skill aiworkflow-requirements` | 単一 skill render |
| S-2 | `pnpm skill:logs:render --skill task-specification-creator --include-legacy` | legacy 含む render |
| S-3 | `pnpm skill:logs:append --skill <name> --type log` | fragment 生成 |
| S-4 | `pnpm skill:logs:render --since 2026-01-01T00:00:00Z` | since filter |

## 実行タスク

- F-1 〜 F-11 の fail path テストを `scripts/skill-logs-render.test.ts` / `scripts/skill-logs-append.test.ts` に追加する。
- R-1 〜 R-5 の回帰 guard を CI 必須テストとして登録する（CI 設定は本タスクスコープ外。Issue / 後続タスク登録のみ）。
- S-1 〜 S-4 の補助コマンドの動作 evidence を `outputs/phase-6/main.md` に貼る。
- fragment 運用 runbook を `outputs/phase-6/fragment-runbook.md` に書き起こす（実装者向け / レビュアー向けの 2 視点）。
- 失敗ケースを `outputs/phase-6/failure-cases.md` にまとめ、Phase 7 coverage の対象範囲を明示する。

## 参照資料

- Phase 4 `outputs/phase-4/test-matrix.md`
- Phase 5 `outputs/phase-5/runbook.md`
- 既存仕様書 §6 / §7 リスクと対策

## 成果物

- `outputs/phase-6/main.md`（拡充サマリー・補助コマンド evidence）
- `outputs/phase-6/failure-cases.md`（F-1〜F-11 の詳細）
- `outputs/phase-6/fragment-runbook.md`（実装者・レビュアー向け運用 runbook）

## 統合テスト連携

F / R / S 系統は単体テストレベル。4 worktree smoke は Phase 11 で実施する。

## 完了条件

- [ ] F-1 〜 F-11 が test に追加され Green。
- [ ] R-1 〜 R-5 の CI 必須化方針が main.md に記載されている（実 CI 設定は本タスク外）。
- [ ] S-1 〜 S-4 の動作 evidence が main.md に貼られている。
- [ ] fragment-runbook.md が実装者・レビュアー視点で 2 セクション構成。
- [ ] artifacts.json の Phase 6 status と整合。
