# documentation-changelog.md

> Task 12-3: ドキュメント更新履歴。本タスクで追加・更新したファイル一覧 + MINOR 解決状況。

## 追加・更新ファイル一覧

| 変更ファイル | 種別 | 変更内容 |
| --- | --- | --- |
| `docs/30-workflows/ut-01-sheets-d1-sync-design/index.md` | 新規 | UT-01 タスク仕様 index（メタ・スコープ・AC-1〜10・依存関係） |
| `docs/30-workflows/ut-01-sheets-d1-sync-design/artifacts.json` | 新規 | Phase 1〜13 機械可読サマリー（visualEvidence=NON_VISUAL / taskType=docs-only） |
| `docs/30-workflows/ut-01-sheets-d1-sync-design/phase-01.md` | 新規 | 要件定義 |
| `docs/30-workflows/ut-01-sheets-d1-sync-design/phase-02.md` | 新規 | 設計（採択方式 / フロー図 / sync_log 論理スキーマ） |
| `docs/30-workflows/ut-01-sheets-d1-sync-design/phase-03.md` | 新規 | 設計レビュー（A/B/C/D 比較 / PASS / MINOR / リスク R-1〜R-7） |
| `docs/30-workflows/ut-01-sheets-d1-sync-design/phase-04.md` | 新規 | テスト戦略（設計検証戦略） |
| `docs/30-workflows/ut-01-sheets-d1-sync-design/phase-05.md` | 新規 | 実装ランブック（spec walkthrough） |
| `docs/30-workflows/ut-01-sheets-d1-sync-design/phase-06.md` | 新規 | 異常系検証 |
| `docs/30-workflows/ut-01-sheets-d1-sync-design/phase-07.md` | 新規 | AC マトリクス |
| `docs/30-workflows/ut-01-sheets-d1-sync-design/phase-08.md` | 新規 | DRY 化 |
| `docs/30-workflows/ut-01-sheets-d1-sync-design/phase-09.md` | 新規 | 品質保証 |
| `docs/30-workflows/ut-01-sheets-d1-sync-design/phase-10.md` | 新規 | 最終レビュー |
| `docs/30-workflows/ut-01-sheets-d1-sync-design/phase-11.md` | 新規 | 手動 smoke（docs-only / NON_VISUAL 縮約テンプレ） |
| `docs/30-workflows/ut-01-sheets-d1-sync-design/phase-12.md` | 新規 | ドキュメント更新（本 Phase） |
| `docs/30-workflows/ut-01-sheets-d1-sync-design/phase-13.md` | 新規 | PR 作成（user_approval_required: true） |
| `docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-01/`〜`phase-13/` | 新規 | 各 Phase outputs |

## 影響範囲

- `apps/api` / `apps/web` ランタイムコード: 変更なし
- D1 schema / migrations: 変更なし（論理設計のみ。物理化は UT-04）
- `.claude/skills/*` / `.agents/skills/*` の skill 本体仕様: 変更なし
- aiworkflow-requirements domain spec: 変更なし
- aiworkflow-requirements tracking / index / LOGS: 更新済み（`task-workflow-completed*` / `task-workflow-active.md` / `quick-reference.md` / `topic-map.md` / `LOGS/_legacy.md`）
- task-specification-creator LOGS: 更新済み（Phase 12 review hardening 記録）
- Cloudflare Secrets / 1Password Environments: 変更なし

## MINOR 解決状況（Phase 3 / 8 / 9 / 10 由来）

| MINOR ID | 指摘内容 | 解決状況 | 解決 Phase |
| --- | --- | --- | --- |
| TECH-M-01 | hybrid（D 案）の将来オプションを記録 | RECORDED → Task 12-4 unassigned-task-detection の U-1 | Phase 12 |
| TECH-M-02 | Cron 間隔（6h / 1h / 5min）の最終確定は UT-09 staging で測定 | DEFERRED → U-2 | UT-09 |
| TECH-M-03 | partial index の D1 サポート確認 | DEFERRED → U-3 | Phase 4 / UT-04 |
| TECH-M-04 | sync_log 保持期間の運用調整余地 | DEFERRED → U-4 | Phase 12 / UT-08 |
| TECH-M-DRY-01 | DRY 構造化解消 | RESOLVED → Phase 8 で吸収済み、U-5 として記録 | Phase 8 / Phase 12 |
| MINOR-M-Q-01 | GCP quota 配分申し送り | DEFERRED → U-6 として UT-03 へ申し送り | UT-03 |

## 既存実装差分の追補（30種思考法レビュー由来）

| 差分 | 現行仕様 | 既存実装 | 処遇 |
| --- | --- | --- | --- |
| sync ledger 物理名 | `sync_log` | `sync_job_logs` + `sync_locks` | U-7。`sync_log` は概念名として扱い、既存物理実装との対応表を `outputs/phase-02/sync-log-schema.md` に追記 |
| status enum | `pending` / `in_progress` / `completed` / `failed` | `running` / `success` / `failed` / `skipped` | U-8。canonical enum を後続で統一 |
| trigger enum | `manual` / `cron` / `backfill` | `admin` / `cron` / `backfill` | U-8。manual/admin 正規化を後続で統一 |
| retry / offset | 最大 3 回 / `processed_offset` | `DEFAULT_MAX_RETRIES=5` / offset カラムなし | U-9。実装追補または仕様追補で決定 |
| shared 契約 | 未定義 | `packages/shared` に sync 契約型なし | U-10。shared 型/Zod schema 化を後続化 |

## リスク対応引き継ぎ（Phase 3 由来）

| リスク | 引き継ぎ先 |
| --- | --- |
| R-1 Cron 即時性不足 | UT-09 staging で間隔調整 |
| R-2 Sheets API quota 超過 | 本仕様書のバッチサイズ + Backoff 戦略を UT-09 が継承 |
| R-3 D1 SQLITE_BUSY | UT-02 / UT-09 |
| R-4 冪等性破綻 | UT-04（物理スキーマ）+ UT-09 |
| R-5 sync_log 物理化困難 | UT-04 |
| R-6 UT-09 着手時 open question | Phase 10 で 0 件確定済 |
| R-7 workflow_state 誤書換え | 本タスク Phase 12 据え置きで対応 |

## post-merge 後続記録

- merge commit hash: post-merge で記入（Phase 13 完了後の本 PR merge 時に追記）
- merge 日時: post-merge で記入
- 後続別 issue 化（U-1〜U-10）: post-merge で起票 / 本タスクスコープでは候補リストの確定までを担当（`unassigned-task-detection.md` 参照）

> 本タスクは docs-only / `workflow_state=spec_created` 据え置きであり、merge 後の状態書換えは行わない。post-merge 後に新規 issue を起票する場合も U-N → 個別 issue の対応関係を本ファイル末尾に追記する形で記録する。
