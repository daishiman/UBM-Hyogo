# Documentation Changelog

## 2026-05-03（実装仕様書化）

### 旧仕様 → 新仕様 書き換え差分

旧（runbook 文書のみ）→ 新（実装仕様書、F1〜F9 + CI gate + bats）:

- **index.md**:
  - 実装区分行を追加（`[実装仕様書]`、CONST_004 例外判定根拠付き）
  - タスク種別を `requirements / operations / runbook` → `implementation / operations / runbook + scripts`
  - スコープ「含む」に F1〜F9 とコード変更を追加
  - スコープ「含まない」から「runbook 作成のみ」を削除し production 実 apply のみ残す
  - AC を AC-1〜AC-12 → AC-1〜AC-20 に拡張（実装ファイル / bats / CI gate / exit code / redaction を追加）
  - 主要成果物に `scripts/d1/*.sh`、`.github/workflows/d1-migration-verify.yml`、`scripts/d1/__tests__/*.bats`、`package.json` を追加
  - 状態語彙に `implemented` / `verified` を追加
  - Secrets / Variables に `CLOUDFLARE_API_TOKEN_STAGING`（CI gate 用）追記
- **artifacts.json**: `implementation_artifacts` / `test_strategy` / `local_commands` / `definition_of_done` を追加。JSON 構文 PASS
- **phase-01.md / outputs/phase-01/main.md**: F1〜F5 の要件、実装区分判定根拠を冒頭明記
- **phase-02.md / outputs/phase-02/main.md**: 引数仕様 / exit code 規約 / データフロー / CI gate 構成
- **phase-03.md / outputs/phase-03/main.md**: 代替案 4 件（shell only / Node CLI / cf.sh 内拡張のみ / 現案）比較、PASS 判定
- **phase-04.md / outputs/phase-04/main.md**: bats ケース 19 件設計、mock wrangler 戦略、CI gate 4 ジョブ詳細
- **phase-05.md / outputs/phase-05/main.md**: Part A コード実装手順 + Part B 運用 runbook の 2 部構成に刷新
- **phase-06.md / outputs/phase-06/main.md**: failure handling 4 ケース exit code（10/30/40/80）と CI gate 失敗時の PR block 機構
- **phase-07.md / outputs/phase-07/main.md**: AC-1〜AC-20 を「検証方法 × 実装ファイル × 仕様書セクション × 状態」4 軸でトレース
- **phase-08.md / outputs/phase-08/main.md**: cf.sh 既存ロジック（op run / esbuild / mise）を `source` で再利用する DRY 設計、UT-07B Phase 5 runbook との差分参照
- **phase-09.md / outputs/phase-09/main.md**: 4 条件評価 PASS、CONST_005 必須 9 項目チェック表
- **phase-10.md / outputs/phase-10/main.md**: blocking 判定（bats / CI gate / staging dry-run）
- **phase-11.md / outputs/phase-11/main.md** + 補助 7 ファイル: NON_VISUAL evidence を bats / staging dry-run / CI gate / grep / redaction の 5 系統に整理
- **phase-12.md / outputs/phase-12/\*.md**: 実装仕様書化に対応した 7 ファイル（本ファイル含む）
- **phase-13.md / outputs/phase-13/main.md**: PR タイトル `feat(d1): production migration apply orchestrator scripts + runbook (#363)`、コミット分割 5 単位、Test plan に bats / CI gate / redaction を追加

## 2026-05-02（旧仕様）

- Materialized `outputs/artifacts.json` from root `artifacts.json`.
- Materialized `outputs/phase-01/main.md` through `outputs/phase-13/main.md` from the root phase specifications.
- Added Phase 11 NON_VISUAL evidence placeholders for structure, grep, staging dry-run, and redaction checks.
- Added Phase 12 strict output set: implementation guide, system spec update summary, documentation changelog, unassigned task detection, skill feedback report, and compliance check.

## Boundary

- 本タスクで production への実 migration apply は実行しない（UT-07B-FU-04 に委譲）。
- 仕様書 / changelog に Token / Account ID / production 実 apply 結果値（適用行数 / hash / 時刻）を記録しない。
- `Refs #363` 採用、`Closes #363` 不採用。

## Workflow-local sync

- `index.md` / `artifacts.json` / `outputs/artifacts.json`（存在時）の parity を Phase 12 完了条件で検証。

## Global skill sync（候補）

- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` と indexes / task-workflow / artifact inventory に scripts/d1 + CI gate 所在を同期
- `.claude/skills/task-specification-creator/SKILL.md` は UT-07B-FU-03 runbook evidence pattern を既に同期済みで、本差分では追加編集なし
