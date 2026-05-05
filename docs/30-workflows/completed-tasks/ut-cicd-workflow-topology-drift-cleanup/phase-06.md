# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | CI/CD workflow topology and deployment spec drift cleanup (UT-CICD-DRIFT) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-29 |
| 前 Phase | 5 (実装ランブック：仕様更新手順) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup（failure-case） |

## 目的

本タスクは docs-only であり、ランタイム例外は対象としない。代わりに「仕様間矛盾」「派生タスク漏れ」「workflow 実体追加時の sync 漏れ」「分類誤り」「不変条件抵触見落とし」「Pages vs Workers 取り扱い誤り」など、**仕様整理プロセス自体に内在する failure case** を網羅し、各ケースに対する検出方法・復旧手順・ログ（証跡）例を Phase 7 の AC マトリクスへ紐付ける。

## 実行タスク

1. 異常系を 4 層（仕様間矛盾 / 派生タスク管理 / 検出スイート不全 / プロセス逸脱）別に列挙し、12 件以上のマトリクスを完成する（完了条件: 各ケースに分類・原因・検出・復旧・証跡例の 5 項目が埋まる）。
2. 各ケースの対応方針（即時修正 / Phase 12 でリトライ / 派生タスクで委譲 / blocker）を明示する（完了条件: 全件で方針が一意）。
3. 証跡（rg / diff の実出力例）のフォーマットを提示する（完了条件: 後段の Phase 9 / Phase 11 が読める形式）。
4. failure case ごとに Phase 4 の検証スイートへ wire-in を割り当てる（完了条件: 全件で対応する検証手段が特定）。
5. 復旧 runbook を整備する（完了条件: 派生タスク漏れ / 不変条件抵触見落とし / Pages vs Workers 誤統合 の 3 件で手順が完結）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/phase-05.md | runbook 上の例外パスを起点 |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/phase-04.md | 検証スイート対応 |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/phase-02.md | 判別ルール（分類誤り検出の基準） |
| 参考 | CLAUDE.md `不変条件 #5 / #6` | 抵触見落としの定義 |

## failure cases マトリクス

| # | 分類 | ケース | 原因 | 検出 | 方針 | 復旧 | 証跡例 |
| - | --- | --- | --- | --- | --- | --- | --- |
| 1 | 仕様間矛盾 | docs と code の workflow 名乖離見落とし | rg コマンド適用漏れ | Phase 4 rg 行 1 | 即時修正（Phase 5 Step 1 再実行） | rg を再実行し差分マトリクス再生成 | `rg ".yml" .github/workflows .claude/skills/...` の diff 出力 |
| 2 | 仕様間矛盾 | Node バージョン記述の不整合 | 仕様書側が古い Node 表記のまま | Phase 4 rg 行 2 | docs-only 修正 | 仕様書の Node バージョン記述を yaml に同期 | `rg "node-version" .github/workflows .claude/skills/...` |
| 3 | 仕様間矛盾 | pnpm バージョン記述の不整合 | docs / code 双方の表記揺れ | Phase 4 rg 行 3 | docs-only 修正 | 仕様書の pnpm バージョン記述を yaml に同期 | `rg "pnpm/action-setup" .github/workflows` |
| 4 | 仕様間矛盾 | cron schedule の dev / prod 表記混在 | 仕様書が片方しか記述していない | Phase 4 rg 行 5 | docs-only 修正 | env 別に分けて記載 | `rg "cron:" .github/workflows` |
| 5 | 派生タスク管理 | impl 必要差分が unassigned-task に未起票 | Phase 12 で起票漏れ | 派生タスク漏れ検証コマンド（Phase 4 Step 5） | blocker（Phase 12 NO-GO） | 不足分の `UT-CICD-DRIFT-IMPL-*.md` を起票 | `rg -c "^\\| impl 必要 \\|" ...` と `ls UT-CICD-DRIFT-IMPL-*` の差分 |
| 6 | 派生タスク管理 | 派生タスク命名規則違反 | slug 表記不統一 | manual review | 即時修正 | rename | `ls UT-CICD-DRIFT-IMPL-*.md` |
| 7 | 派生タスク管理 | Pages vs Workers 判断を本タスク内で実行してしまう | スコープ逸脱 | Phase 11 手動観点 | 派生タスクへ委譲 | 該当差分を `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` に切り戻す | drift マトリクス該当行の分類タグ |
| 8 | 検出スイート不全 | rg 漏れ（対象パス指定ミス） | コマンド引数 typo | Phase 11 手動観点 | 即時修正 | rg コマンド再実行 | rg 出力件数の前後比較 |
| 9 | 検出スイート不全 | yamllint / actionlint の許容ルール緩和しすぎ | 既存 警告を見逃す | manual review | 即時修正 | 設定見直し | yamllint 出力 diff |
| 10 | 検出スイート不全 | docs / code 双方を更新してしまう（dual edit） | 本タスクが docs-only であることの認識ズレ | git diff レビュー | blocker | code 変更を revert、派生タスクへ切り出し | `git diff --stat` |
| 11 | プロセス逸脱 | 不変条件 #5 抵触行を docs-only と誤分類 | 判別ルール 5 不適用 | Phase 7 manual review | blocker | 判別ルール 5 を適用し impl 必要 + blocker 印に変更 | drift マトリクス該当行 |
| 12 | プロセス逸脱 | 不変条件 #6（GAS prototype 昇格）抵触の見落とし | grep 観点漏れ | Phase 4 手動観点 | blocker | 仕様書側で GAS prototype 言及を排除する派生タスク起票 | `rg -n "gas-prototype" .claude/skills/aiworkflow-requirements/references` |
| 13 | プロセス逸脱 | GitHub Issue #58 を再オープンしてしまう | 操作誤り | gh issue view | blocker | 即時クローズ、CLOSED 状態を維持 | `gh issue view 58 --json state` |
| 14 | プロセス逸脱 | UT-GOV-001 / UT-GOV-003 と乖離した workflow 名で正本仕様を更新 | 並列タスクとの interface 確認漏れ | Phase 11 手動観点（並列タスク参照） | 即時修正 | UT-GOV-001 の required_status_checks 名と整合させて再更新 | branch protection 設定との突合 |
| 15 | 検出スイート不全 | 05a observability-matrix.md の更新が必要なのに本タスクで編集してしまう | スコープ逸脱 | git diff レビュー | blocker | 該当 diff を revert、派生タスクへ起票 | `git diff docs/05a-...` |

合計: 15 件（要件 12 件以上を満たす）。

## 各ケース ↔ 検証スイート wire-in

| Case # | 対応スイート（Phase 4） |
| --- | --- |
| 1, 2, 3, 4 | rg-based grep（行 1〜5） |
| 5 | 派生タスク漏れ検証コマンド |
| 6, 9 | manual review |
| 7 | 手動目視観点 1（Pages vs Workers） |
| 8 | rg コマンド再実行 |
| 10, 13, 14, 15 | manual review + git diff レビュー |
| 11, 12 | 手動目視観点 4（不変条件抵触の文脈判定） |

## 復旧 runbook（代表 3 ケース）

### Case 5: 派生タスク起票漏れ

```bash
# impl 必要 行数を再カウント
rg -c "^\\| impl 必要 \\|" docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-02/drift-matrix-design.md
# 既存派生タスクを列挙
ls docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-*.md
# 不足分を Phase 12 の起票テンプレに従って追加
```

### Case 11: 不変条件 #5 抵触見落とし

```bash
# apps/web から D1 直接アクセスの誘発を再 grep
rg -n "DB\\b|d1_databases" apps/web .github/workflows
# 検出された差分を drift マトリクスに追加し、impl 必要 + blocker 印
# 派生タスク UT-CICD-DRIFT-IMPL-NNN-invariant-5-fix を起票
```

### Case 10: docs / code dual edit

```bash
# 本タスクのブランチで code 側変更が無いか確認
git diff --stat .github/workflows apps/web/wrangler.toml apps/api/wrangler.toml
# 0 行であるべき。差分があれば revert
git checkout -- .github/workflows apps/web/wrangler.toml apps/api/wrangler.toml
# 該当差分は派生タスクへ切り出す
```

## 実行手順

1. 15 件のマトリクスを `outputs/phase-06/failure-cases.md` に転記。
2. 各ケースの証跡フォーマットを統一（rg 出力 / diff / ls の 3 系統）。
3. 検証スイート wire-in を Phase 4 の行番号と相互参照。
4. 代表 3 ケースの復旧 runbook をコマンドベースで記述。
5. 派生タスクへ送る open question を Phase 12 unassigned-task-detection に予約。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | failure case を AC マトリクスの「関連 failure case」列に紐付け |
| Phase 9 | 復旧 runbook の検証コマンドを実測ログに含める |
| Phase 11 | 復旧 runbook を 1 件以上 staging 相当（ローカル）で手動 smoke |
| Phase 12 | unassigned-task-detection.md に派生タスクとして記録 |

## 多角的チェック観点

- 価値性: 各ケースが運用者にとって意味のある復旧パスを示しているか。
- 実現性: 全ケースの検出が rg / git diff / ls / manual review のみで完結するか。
- 整合性: 既存 aiworkflow-requirements skill の Same-wave sync ルールに違反する failure case が網羅されているか。
- 運用性: 復旧コマンドがコピペで完結するか。
- スコープ境界: docs-only タスクがコード変更へ侵食する failure（Case 10 / 15）が明示されているか。
- 不変条件: #5 / #6 抵触見落としが独立した failure case として存在するか（Case 11 / 12）。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 15 件の failure case マトリクス | spec_created |
| 2 | 対応方針付与（即時 / Phase 12 / 派生 / blocker） | spec_created |
| 3 | 証跡フォーマット統一 | spec_created |
| 4 | Phase 4 スイートへの wire-in | spec_created |
| 5 | 代表 3 ケースの復旧 runbook | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/failure-cases.md | 15 件マトリクス + 復旧 runbook + 証跡例 |
| メタ | artifacts.json | Phase 6 状態更新 |

## 完了条件

- [ ] 12 件以上の failure case が分類別に網羅
- [ ] 全ケースで対応方針が一意
- [ ] 全ケースに対応する Phase 4 スイートが指定
- [ ] 代表 3 ケースの復旧 runbook がコマンド付き
- [ ] 不変条件 #5 / #6 抵触見落としが独立 case として存在

## タスク100%実行確認【必須】

- 実行タスク 5 件すべて `spec_created`
- 成果物が `outputs/phase-06/failure-cases.md` に配置予定
- 15 件全てに 5 項目（分類・原因・検出・復旧・証跡例）が記入
- Phase 5 runbook の Step 1〜6 で発生し得る逸脱が網羅
- docs-only スコープ逸脱（Case 10 / 15）が blocker として明記

## 次 Phase への引き渡し

- 次 Phase: 7 (AC マトリクス)
- 引き継ぎ事項:
  - 15 件の failure case ID を AC マトリクスの「関連 failure case」列で参照
  - 復旧 runbook を Phase 11 手動 smoke の対象に予約
- ブロック条件:
  - 12 件未満で Phase 7 へ進む
  - 復旧手順が記述されないケースが残る
  - 不変条件 #5 / #6 抵触見落としが failure case 化されていない
