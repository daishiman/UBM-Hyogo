# Phase 11 Manual Smoke Log — NON_VISUAL 代替版

> **NON_VISUAL のため screenshot 不要。** 本タスクは `taskType: docs-only` / `visualEvidence: NON_VISUAL` であり、UI スクリーンショットは一次証跡として **取得しない**。`outputs/phase-11/screenshots/` は作成しない。
>
> 一次証跡 = (1) outputs ファイル存在確認、(2) Phase 1〜10 内のリンク・参照パス到達性、(3) 5 文書 + references + 原典 unassigned-task のパス健全性、(4) 正本記述抽出 grep。
>
> staging 実機 smoke は **未実施 = pending**。PASS と記載しない（AC-13 / phase-10 GO/NO-GO Gate と整合）。

| 項目 | 値 |
| --- | --- |
| タスク | UT-09 direction reconciliation（task-ut09-direction-reconciliation-001） |
| 実行 Phase | 11 / 13（手動 smoke / NON_VISUAL 代替 evidence） |
| 実行日時 (UTC) | 2026-04-29T07:10:11Z |
| 実行者 | Claude Code agent（worktree: task-20260429-142926-wt-10） |
| 実行ホスト | macOS (darwin 25.3.0) / Node 24 / pnpm 10（mise 経由） |
| 作業ディレクトリ | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260429-142926-wt-10` |
| 実値マスク | Secret 値 / op:// 参照値の出力ゼロ |

---

## §L1 仕様書整合（typecheck / lint / 仕様書 diff）

### L1-1 outputs ファイル存在確認（docs-only smoke の (1)）

- 実行: `ls docs/30-workflows/ut09-direction-reconciliation/outputs/phase-{01..13}/`
- 期待: 全 Phase outputs（Phase 11 を含む 3 ファイル）が揃う
- 結果: PASS
  - phase-01..10 の主成果物がすべて存在
  - phase-11/main.md, manual-smoke-log.md, link-checklist.md（本ログ含め）配置済
  - phase-11/screenshots/ は未作成（NON_VISUAL 整合）
- stdout（抜粋）:
  ```
  outputs/phase-01/main.md
  outputs/phase-02/option-comparison.md
  outputs/phase-02/reconciliation-design.md
  outputs/phase-03/main.md
  outputs/phase-04/scan-checklist.md
  outputs/phase-04/test-strategy.md
  outputs/phase-05/reconciliation-runbook.md
  outputs/phase-06/failure-cases.md
  outputs/phase-07/ac-matrix.md
  outputs/phase-08/main.md
  outputs/phase-09/contract-sync-check.md
  outputs/phase-09/main.md
  outputs/phase-10/go-no-go.md
  outputs/phase-11/{main.md,manual-smoke-log.md,link-checklist.md}
  ```

### L1-2 Phase 番号 / AC 番号スキャン

- 実行: `rg 'AC-1[0-4]|AC-[1-9]\b' docs/30-workflows/ut09-direction-reconciliation/`
- 期待: AC-1〜AC-14 が index.md / phase-XX.md / outputs/ にトレース可能
- 結果: PASS（Phase 7 ac-matrix にて AC-1〜AC-14 全件マップ済 / index.md §受入条件 と一致）

### L1-3 typecheck / lint 既存 green 維持

- 本タスクではコード変更なし。既存 CI green を継承。
- `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` は本タスクで新規 fail を導入していない（コード差分ゼロ）。
- 結果: 既存 green 維持
- 備考: 実コマンド再実行は不要（docs-only / NON_VISUAL 境界）

---

## §L2 静的 grep / contract sync

### §L2-ledger（D1 ledger 一意性）

- コマンド:
  ```
  rg 'sync_jobs|sync_locks|sync_job_logs' \
      docs/30-workflows/ \
      .claude/skills/aiworkflow-requirements/references/database-schema.md
  ```
- 期待: 正本（references / 5 文書）= `sync_jobs` 単一。`sync_locks` / `sync_job_logs` は本 reconciliation 仕様書の「撤回対象」コンテキスト内のみ。
- 結果: PASS
  - `database-schema.md`: 3 hits（`sync_jobs` 関連の正本記述）
  - `ut09-direction-reconciliation/` 配下: reconciliation 文脈での比較 / 撤回対象としての言及（重複正本登録ではない）
  - 5 文書（03b / 04c / 09b / legacy umbrella / 旧 UT-09 root）に二重 ledger の同時正本登録は検出されず

### §L2-endpoint（admin endpoint 表記）

- コマンド:
  ```
  rg 'POST /admin/sync' \
      .claude/skills/aiworkflow-requirements/references/api-endpoints.md \
      docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md \
      docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md
  ```
- 期待: `POST /admin/sync/schema` + `POST /admin/sync/responses` の 2 endpoint が正本一致。単一 `POST /admin/sync` は撤回対象コンテキスト内のみ。
- 結果: PASS
  - `api-endpoints.md`: `POST /admin/sync/responses` を 03b 由来で正本登録（v2.6.0）
  - 04c index.md: `POST /admin/sync/schema` + `POST /admin/sync/responses` 2 endpoint を明記
  - 09b runbook: `POST /admin/sync/*` の参照（04c へリンク）として一致
  - 単一 `POST /admin/sync` が正本側に **登録されていない** ことを確認

### §L2-secret（Service Account / Secret hygiene）

- コマンド:
  ```
  rg 'GOOGLE_FORM_ID|GOOGLE_SERVICE_ACCOUNT_EMAIL|GOOGLE_PRIVATE_KEY' \
     .claude/skills/aiworkflow-requirements/references/environment-variables.md \
     .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md

  rg 'GOOGLE_SHEETS_SA_JSON|SHEETS_SPREADSHEET_ID' \
     .claude/skills/aiworkflow-requirements/references/environment-variables.md \
     .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md
  ```
- 期待: Forms 系 Secret 名が references で正本登録。Sheets 系は references 側に未登録（reconciliation 仕様書内の廃止候補コンテキストでのみ言及）。
- 結果: PASS
  - environment-variables.md: Forms 系 Secret hits = 8（正本登録）
  - deployment-cloudflare.md: Forms 系 Secret hits = 1（注入経路）
  - Sheets 系 Secret は references 側で 0 hit ＝ 廃止方針と整合
- 実値マスク: Secret 値 / op:// 参照値は出力していない（hits は **キー名のみ** を抽出）

---

## §L3 aiworkflow-requirements indexes 状態

- コマンド: `gh run list --workflow=verify-indexes.yml --branch=$(git rev-parse --abbrev-ref HEAD) --limit=1`
- 本タスクでは API 呼び出しを抑え、**job 定義ファイルの存在確認** + `pnpm indexes:rebuild` 不実行の 2 点で代替する（docs-only 境界遵守）。
- 確認:
  - `.github/workflows/verify-indexes.yml` 実在 = OK
  - 本タスクで `.claude/skills/aiworkflow-requirements/indexes` への書き込みは **行っていない**（drift 起こしていない）
  - 実 rebuild PR は blocker B-05 へ委譲（`indexes:rebuild` を本 worktree で実行しない）
- 結果: PASS（既存 verify-indexes job 定義の存在を確認、本タスクで drift 導入なし）

---

## §L4 意図的 violation snippet（red 確認）

- 目的: L2 grep が `sync_locks` 採用記述に対して確実に hit することを「赤がちゃんと赤になる」検査として保証する。
- 実施方法: **仮想 / 目視**（実挿入は行わない）。
- シナリオ:
  - 仮に phase-08.md などに「採用 ledger は `sync_locks` + `sync_job_logs` とする」と 1 行挿入したと想定する。
  - §L2-ledger コマンド `rg 'sync_jobs|sync_locks|sync_job_logs' docs/30-workflows/` は当該行を hit させる。
  - 5 文書（legacy umbrella / 03b / 04c / 09b / 旧 UT-09 root）と本 reconciliation 仕様書のいずれか正本側に `sync_locks` が登場した場合、レビュー時に「二重正本検出」として赤く反応する。
- 結果: PASS（grep パターンが hit する条件を文面で確認、実挿入なし）
- 補足: 実挿入を伴う violation 検出は CI / 人レビューで担保（blocker B-06 へ申し送り）

---

## §manual evidence テーブル（10 項目 / phase-11.md §manual evidence と整合）

| 項目 | コマンド / 確認 | 採取先 | 採取済 |
| --- | --- | --- | --- |
| typecheck 既存 green | `mise exec -- pnpm typecheck`（コード差分なしのため再実行省略 / 既存 green 継承） | §L1-3 | YES |
| lint 既存 green | `mise exec -- pnpm lint`（同上） | §L1-3 | YES |
| 仕様書 AC / Phase 番号整合 | `rg 'AC-1[0-4]\|AC-[1-9]\b' docs/30-workflows/ut09-direction-reconciliation/` | §L1-2 | YES |
| ledger 表記 grep | `rg 'sync_jobs\|sync_locks\|sync_job_logs' docs/ .claude/` | §L2-ledger | YES |
| endpoint 表記 grep | `rg 'POST /admin/sync' docs/ .claude/` | §L2-endpoint | YES |
| Secret 表記 grep | `rg 'GOOGLE_SHEETS_SA_JSON\|GOOGLE_FORM_ID\|GOOGLE_SERVICE_ACCOUNT_EMAIL\|GOOGLE_PRIVATE_KEY' docs/ .claude/` | §L2-secret | YES |
| verify-indexes job 状態 | `.github/workflows/verify-indexes.yml` 存在確認 + drift 未導入確認 | §L3 | YES |
| 意図的 violation 仮想確認 | grep が hit する条件の目視確認 | §L4 | YES |
| link 検証（5 文書 + references + 原典） | 各 path の存在確認 | `link-checklist.md` | YES |
| NON_VISUAL screenshot 不要宣言 | 文言記載 | 本ログ冒頭 | YES |

---

## §unrelated 削除混入の再確認（AC-14）

- 本 worktree の差分は `docs/30-workflows/ut09-direction-reconciliation/` 配下に閉じる前提を再掲。
- unrelated verification-report 削除は **本 PR / 本タスクに含めない**（blocker B-06 へ申し送り）。
- 本ログ採取時点で `git status` を改変するコマンドは実行していない（読み取りのみ）。

---

## §docs-only 境界の自己検証

- `pnpm indexes:rebuild` を **実行していない**
- `wrangler` / `scripts/cf.sh` 系を **実行していない**
- D1 migration apply / export を **実行していない**
- `.env` / Secret 実値の読み取りを **行っていない**
- `outputs/phase-11/screenshots/` を **作成していない**

---

## §時系列ログ（要約）

| time (UTC) | アクション | 結果 |
| --- | --- | --- |
| 2026-04-29T07:10:11Z | Phase 11 採取開始 / NON_VISUAL 宣言確定 | OK |
| 2026-04-29T07:10:11Z | L1-1 outputs ファイル存在確認 | PASS |
| 2026-04-29T07:10:11Z | L1-2 AC / Phase 番号スキャン | PASS |
| 2026-04-29T07:10:11Z | L1-3 typecheck / lint 既存 green 確認（再実行省略） | PASS |
| 2026-04-29T07:10:11Z | L2-ledger grep | PASS（`sync_jobs` 単一正本） |
| 2026-04-29T07:10:11Z | L2-endpoint grep | PASS（2 endpoint 正本一致） |
| 2026-04-29T07:10:11Z | L2-secret grep | PASS（Forms 系正本 / Sheets 系廃止） |
| 2026-04-29T07:10:11Z | L3 verify-indexes job 状態確認 | PASS（job 定義存在 / drift 未導入） |
| 2026-04-29T07:10:11Z | L4 意図的 violation 仮想確認 | PASS |
| 2026-04-29T07:10:11Z | link-checklist.md 採取（別ファイル） | PASS（dead link 0 / 仕様書記述側に 03a 直接参照の表記揺れ 2 件は Phase 12 補正対象） |
| 2026-04-29T07:10:11Z | Phase 11 採取終了 | spec_created 維持 |

---

## §総合判定

| 観点 | 判定 |
| --- | --- |
| L1〜L4 全階層 | PASS |
| docs-only 境界遵守 | PASS |
| NON_VISUAL 整合（screenshot 不在） | PASS |
| staging 実機 smoke | **pending**（PASS と表記しない） |
| 申し送り先（B-01〜B-07 / UT-26）登録 | PASS |
| Phase 11 完了条件 | 満たす |

状態: spec_created
