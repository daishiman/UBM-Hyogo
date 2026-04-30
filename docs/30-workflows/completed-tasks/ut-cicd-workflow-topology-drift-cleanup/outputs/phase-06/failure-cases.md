# Phase 6 成果物: 異常系検証（failure cases）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-CICD-DRIFT |
| Phase | 6 / 13 |
| 作成日 | 2026-04-29 |
| タスク分類 | docs-only / specification-cleanup（failure-case） |

## 全体方針

本タスクは docs-only でありランタイム例外は対象外。代わりに「仕様間矛盾」「派生タスク管理」「検出スイート不全」「プロセス逸脱」など、**仕様整理プロセス自体に内在する failure case** を 4 層で網羅し、各ケースに分類・原因・検出・復旧・証跡の 5 項目を整備する。

## failure cases マトリクス（15 件）

| # | 分類 | ケース | 原因 | 検出 | 方針 | 復旧 | 証跡例 |
| - | --- | --- | --- | --- | --- | --- | --- |
| 1 | 仕様間矛盾 | docs と code の workflow 名乖離見落とし | rg コマンド適用漏れ | Phase 4 rg #1 | 即時修正（Phase 5 Step 1 再実行） | rg 再実行し差分マトリクス再生成 | `rg ".yml" .github/workflows .claude/skills/...` の diff 出力 |
| 2 | 仕様間矛盾 | Node version 記述の不整合 | 仕様書側が古い Node 表記のまま | Phase 4 rg #2 | docs-only 修正 | 仕様書の Node version 記述を `.mise.toml` 参照に同期 | `rg "node-version" .github/workflows .claude/skills/...` |
| 3 | 仕様間矛盾 | pnpm version 記述の不整合 | docs / code 双方の表記揺れ | Phase 4 rg #3 | docs-only 修正 | 仕様書の pnpm version を `.mise.toml` / `packageManager` 参照に同期 | `rg "pnpm/action-setup" .github/workflows` |
| 4 | 仕様間矛盾 | cron schedule の dev / prod 表記混在 | 仕様書が片方しか記述していない | Phase 4 rg #5 | docs-only 修正 | env 別に分けて `deployment-cloudflare.md` に記載 | `rg "cron:" .github/workflows` |
| 5 | 派生タスク管理 | impl 必要差分が unassigned-task に未起票 | Phase 12 起票漏れ | 派生タスク漏れ検証コマンド | blocker（Phase 12 NO-GO） | 不足分の `UT-CICD-DRIFT-IMPL-*.md` を起票 | `rg -c "^\| impl 必要 \|" ...` と `ls UT-CICD-DRIFT-IMPL-*` の差分 |
| 6 | 派生タスク管理 | 派生タスク命名規則違反 | slug 表記不統一 | manual review | 即時修正 | rename | `ls UT-CICD-DRIFT-IMPL-*.md` |
| 7 | 派生タスク管理 | Pages vs Workers 判断を本タスク内で実行してしまう | スコープ逸脱 | Phase 11 手動観点 #1 | 派生タスクへ委譲 | 該当差分を `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` に切り戻す | drift マトリクス該当行の分類タグ |
| 8 | 検出スイート不全 | rg 漏れ（対象パス指定ミス） | コマンド引数 typo | Phase 11 手動観点 | 即時修正 | rg コマンド再実行 | rg 出力件数の前後比較 |
| 9 | 検出スイート不全 | yamllint / actionlint の許容ルール緩和しすぎ | 既存警告を見逃す | manual review | 即時修正 | 設定見直し | yamllint 出力 diff |
| 10 | 検出スイート不全 | docs / code 双方を更新してしまう（dual edit） | 本タスクが docs-only であることの認識ズレ | git diff レビュー | blocker | code 変更を revert、派生タスクへ切り出し | `git diff --stat` |
| 11 | プロセス逸脱 | 不変条件 #5 抵触行を docs-only と誤分類 | 判別ルール 5 不適用 | Phase 7 manual review / Phase 4 手動観点 #4 | blocker | 判別ルール 5 を適用し impl 必要 + blocker 印に変更 | drift マトリクス該当行 |
| 12 | プロセス逸脱 | 不変条件 #6（GAS prototype 昇格）抵触の見落とし | grep 観点漏れ | Phase 4 手動観点 #4 | blocker | 仕様書側で GAS prototype 言及を排除する派生タスク起票 | `rg -n "gas-prototype" .claude/skills/aiworkflow-requirements/references` |
| 13 | プロセス逸脱 | GitHub Issue #58 を再オープンしてしまう | 操作誤り | `gh issue view 58 --json state` | blocker | 即時クローズ、CLOSED 状態維持 | `gh issue view 58 --json state` |
| 14 | プロセス逸脱 | UT-GOV-001 / UT-GOV-003 と乖離した workflow 名で正本仕様を更新 | 並列タスクとの interface 確認漏れ | Phase 11 手動観点 #3 | 即時修正 | UT-GOV-001 の required_status_checks 名と整合させて再更新 | branch protection 設定との突合 |
| 15 | 検出スイート不全 | 05a observability-matrix.md の更新が必要なのに本タスクで編集してしまう | スコープ逸脱 | git diff レビュー | blocker | 該当 diff を revert、派生タスクへ起票 | `git diff docs/05a-...` |

合計 15 件（要件 12 件以上を満たす）。

## 各ケース ↔ 検証スイート wire-in

| Case # | 対応スイート（Phase 4） |
| --- | --- |
| 1, 2, 3, 4 | rg-based grep（#1〜#5） |
| 5 | 派生タスク漏れ検証コマンド |
| 6, 9 | manual review |
| 7 | 手動目視観点 #1（Pages vs Workers） |
| 8 | rg コマンド再実行 |
| 10, 13, 14, 15 | manual review + git diff レビュー |
| 11, 12 | 手動目視観点 #4（不変条件抵触の文脈判定） |

全 15 件に対応スイートが特定されている（空セルなし）。

## 復旧 runbook（代表 3 ケース）

### Case 5: 派生タスク起票漏れ

```bash
# impl 必要 行数を再カウント
rg -c "^\| impl 必要 \|" docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-02/drift-matrix-design.md
# 既存派生タスクを列挙
ls docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-*.md
# 不足分を Phase 12 の起票テンプレに従って追加
# その後再カウントで一致確認
```

### Case 11: 不変条件 #5 抵触見落とし

```bash
# apps/web から D1 直接アクセスの誘発を再 grep
rg -n "DB\b|d1_databases" apps/web .github/workflows
# 検出された差分を drift マトリクスに追加し、impl 必要 + blocker 印
# 派生タスク UT-CICD-DRIFT-IMPL-NNN-invariant-5-fix を起票
```

### Case 10: docs / code dual edit

```bash
# 本タスクのブランチで code 側変更が無いか確認
git diff --stat .github/workflows apps/web/wrangler.toml apps/api/wrangler.toml
# 0 行であるべき。差分があれば revert
git checkout -- .github/workflows apps/web/wrangler.toml apps/api/wrangler.toml
# 該当差分は派生タスクへ切り出す（Phase 12 unassigned-task-detection.md に追記）
```

## 証跡フォーマット（統一）

3 系統に統一する:

1. **rg 出力系**: `rg -n` の標準出力をそのまま貼る（行番号・ファイル名込み）
2. **diff 系**: `diff /tmp/before.txt /tmp/after.txt` または `git diff --stat`
3. **ls / state 系**: `ls UT-CICD-DRIFT-IMPL-*.md` / `gh issue view 58 --json state`

各 case の証跡例列はこのいずれかに該当する。

## 統合テスト連携

| 連携先 Phase | 内容 |
| --- | --- |
| Phase 7 | failure case を AC マトリクス「関連 failure case」列に紐付け |
| Phase 9 | 復旧 runbook の検証コマンドを実測ログに含める |
| Phase 11 | 復旧 runbook を 1 件以上 staging 相当（ローカル）で手動 smoke |
| Phase 12 | unassigned-task-detection.md に派生タスクとして記録 |

## 多角的チェック観点

- 価値性: 各ケースが運用者にとって意味のある復旧パスを示している
- 実現性: 全ケース検出が rg / git diff / ls / manual review で完結
- 整合性: Same-wave sync ルール違反を Case 15 で網羅
- 運用性: 復旧コマンドがコピペ可能
- スコープ境界: docs-only タスクの code 侵食を Case 10 / 15 で明示
- 不変条件: #5 / #6 抵触見落としを Case 11 / 12 として独立化

## 完了条件チェック

- [x] 12 件以上の failure case を分類別に網羅（15 件）
- [x] 全ケースで対応方針が一意
- [x] 全ケースに対応する Phase 4 スイートが指定
- [x] 代表 3 ケース（5 / 10 / 11）の復旧 runbook がコマンド付き
- [x] 不変条件 #5 / #6 抵触見落としを独立 case として存在（Case 11 / 12）

## 次 Phase への引き渡し

- 15 件の failure case ID を Phase 7 AC マトリクスの「関連 failure case」列で参照
- 復旧 runbook を Phase 11 手動 smoke 対象に予約
- ブロック条件: 12 件未満で Phase 7 進行 / 復旧手順未記述 / 不変条件 #5 / #6 case 未独立化
