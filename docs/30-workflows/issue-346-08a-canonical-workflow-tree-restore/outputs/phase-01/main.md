# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-346-08a-canonical-workflow-tree-restore |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | restore |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |

## 目的

08a workflow の canonical path 欠落に起因した 09a / 09b / 09c の broken link と、`aiworkflow-requirements` 正本（`legacy-ordinal-family-register.md` / `resource-map.md` / `task-workflow-active.md`）の状態 drift を解消するために、本タスクの **真の論点（A / B / C 3 択）** を確定し、AC-1〜AC-7 を quantitative に固定する。本タスクは docs-only / NON_VISUAL のため、観測対象は markdown ファイルの **物理存在 / 内容 grep 整合 / indexes 再生成 drift** のみとする。

## 真の論点 (true issue)

- **論点 1（最重要・状態 3 択）**: 08a workflow の正しい状態は次のいずれか。
  - **A. 復元**: canonical path `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/` を git 履歴から復元し active workflow として継続する。
  - **B. completed-tasks 移動正本化**: 08a は既に完了相当であり `docs/30-workflows/completed-tasks/08a-.../` への移動を正本とする（aiworkflow-requirements 側を completed として整合させる）。
  - **C. current/partial trace 正本化**: 08a は active でも completed でもなく current/partial として trace だけを正本化する。
- **論点 2（決定根拠）**: 物理状態調査の結果、canonical path は本タスクで **復元済み**、completed-tasks 配下の 08a 系列は **不在**、08a-A は `docs/30-workflows/02-application-implementation/08a-A-public-use-case-coverage-hardening/` に存在する **follow-up** であり canonical root の代替ではない。`unassigned-task/` 配下に UT-08A-01〜06 と本タスク起票元が並んでいる。この物理事実により Phase 2 の決定は A に収束する。
- **論点 3（aiworkflow-requirements 反映の最小編集）**: A / B / C のいずれを選んでも、編集対象は `legacy-ordinal-family-register.md` / `resource-map.md` / `task-workflow-active.md` の 3 ファイルに限定し、index 再生成 (`pnpm indexes:rebuild`) を 1 回だけ実行する設計とする。indexes そのものの schema は変更しない。
- **論点 4（09a-c 参照同期方針）**: 09a / 09b / 09c が参照する「上流 contract gate = 08a」表現を、決定状態に応じて (a) canonical path に戻す (b) `completed-tasks/` path に置換 (c) 復元した 08a canonical path に解決、のどれにするかを Phase 2 で確定する。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流参照 | docs/30-workflows/unassigned-task/task-08a-canonical-workflow-tree-restore-001.md | 起票元の AC 一次出典 | 本仕様書 AC-1〜7 |
| 上流参照 | aiworkflow-requirements `legacy-ordinal-family-register.md` | 08a 状態行の現状 | 決定状態 A/B/C の反映差分 |
| 上流参照 | aiworkflow-requirements `resource-map.md` | 08a physical path の現状 | 新 path の正本宣言 |
| 上流参照 | aiworkflow-requirements `task-workflow-active.md` | active workflow リスト | 08a 行の追加・削除・置換 |
| 後続 | 09a / 09b / 09c spec 群 | 上流 contract gate 参照点 | 新 path / 状態語彙 |
| 後続 | unassigned-task UT-08A-01〜06 | 08a workflow への参照 | 新 path への置換 |

## 価値とコスト

- **初回価値**: 09c production release runbook の上流 contract gate trace が回復し、production release 時に「08a が PASS してから 09c に進む」というワークフロー条件が機械的に検証可能になる。aiworkflow-requirements の状態 drift も同時解消される。
- **初回で払わないコスト**: 08a 配下のテスト実装（UT-08A-01〜06 が個別タスクとして既起票済）、production deploy 実行、aiworkflow-requirements indexes schema の改修。
- **トレードオフ**: B / C を選ぶと 08a に新規テストを追加する経路が「派生 dir / 新規 workflow」に変わるため、UT-08A-01〜06 の現状参照を再点検する追加コストが発生する。Phase 4 でこの追加コストをサブタスク T4 として明示分離する。

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 09a-c の broken link を機械的に消滅させ production release gate の trace を回復できるか | PASS | AC-4 / Phase 11 `9a-9b-9c-link-check.log` で gate 化 |
| 実現性 | docs-only / 3 ファイル + 09a-c spec + unassigned 同期で完結できるか | PASS | 物理状態調査により編集対象が有限・列挙可能と確認済 |
| 整合性 | 不変条件 #5 / #6 / #7 と整合するか | PASS | docs-only であり apps/api / apps/web / GAS prototype / Form 経路に触れない |
| 運用性 | indexes 再生成 → CI gate で drift 0 を継続検知できるか | PASS | `verify-indexes-up-to-date` gate が main 取り込み後も継続稼働 |

## Schema / 共有コード Ownership 宣言

| 対象 | 旧 owner | 新 owner | 移管理由 |
| --- | --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/legacy-ordinal-family-register.md` の 08a 行 | aiworkflow-requirements 一般 | issue-346 (本タスク) | 08a 状態正本化の責務を本タスクが引き取る |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` の 08a path 行 | aiworkflow-requirements 一般 | issue-346 (本タスク) | physical path の正本宣言を本タスクが行う |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` の 08a 行 | aiworkflow-requirements 一般 | issue-346 (本タスク) | active 判定の正本宣言を本タスクが行う |
| 09a / 09b / 09c spec の 08a 参照行 | 09c 系列 | 09c 系列のまま | 本タスクは参照同期のみ実施し、09c 系列の owner は変更しない |

## 実行タスク

- [ ] 08a canonical path / completed-tasks / 派生 dir / archived の物理存在を `rg --files docs/30-workflows | rg "08a"` で網羅
- [ ] aiworkflow-requirements 3 ファイルの 08a 関連行を抽出し現状 snapshot を `outputs/phase-01/main.md` に記録
- [ ] AC-1〜7 を quantitative に再記述（成果物単位 / 実行コマンド単位）
- [ ] 4 条件評価の根拠を埋める
- [ ] Phase 2 への open question（A/B/C 決定基準 / 09a-c の参照置換語彙 / unassigned UT-08A-01〜06 の path 置換要否）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/task-08a-canonical-workflow-tree-restore-001.md | 起票元 |
| 必須 | .claude/skills/aiworkflow-requirements/references/legacy-ordinal-family-register.md | 状態正本 |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | path 正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | active 正本 |
| 必須 | docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/ | 復元済み canonical workflow root |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 #5/#6/#7 |

## 多角的チェック観点

- **不変条件 #5**: 本タスクは docs / markdown / json のみ編集し、`apps/web` / `apps/api` / `D1` に触れない。boundary 影響なしを Phase 9 で明記。
- **不変条件 #6**: 08a 状態を整理する過程で GAS prototype 系を canonical workflow に昇格させない。
- **不変条件 #7**: Form 再回答経路に触れない。
- **secret hygiene**: canonical path 名と evidence ログに API token / OAuth secret 等の実値が含まれないことを Phase 9 で grep gate 化。

## 完了条件

- AC-1〜7 が quantitative に表現され、Phase 2 が拾える形で open question が記録されている
- 4 条件評価が PASS で揃い、根拠が表に書かれている
- `outputs/phase-01/main.md` に決定事項サマリと物理状態調査結果が記録されている

## 成果物

- `outputs/phase-01/main.md`
