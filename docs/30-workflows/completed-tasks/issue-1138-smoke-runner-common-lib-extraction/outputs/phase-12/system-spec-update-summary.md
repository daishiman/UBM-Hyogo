# System Spec Update Summary — issue-1138-smoke-runner-common-lib-extraction

## Step 1: 本タスクで触れた docs / skill

### Step 1-A: タスク記録

- 本タスク root（`docs/30-workflows/completed-tasks/issue-1138-smoke-runner-common-lib-extraction/`）を作成し、`implemented_local_evidence_captured`（Phase 1-13 実装仕様書の作成のみ完了）で記録。
- 親タスク `docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/`（runner 3 本目 = `runtime-tag-bulk.sh` の追加元）の重複構造を SSOT 化する refactoring の後続として位置付け。
- 消費した未タスク: `docs/30-workflows/unassigned-task/task-issue-1036-followup-007-smoke-runner-common-lib-extraction.md`（存在する場合・本仕様書で phase1-13 化）。

### Step 1-B: 実装状況テーブル

| 項目 | 状態 |
| ---- | ---- |
| 仕様書 | Phase 1-12 completed / `workflow_state=implemented_local_evidence_captured` |
| 実装コード（共通 lib / 3 runner 移行 / lib test） | **実装済み・検証 PASS**（本サイクル完了・Gate-B passed） |
| local 検証（lib test / 3 runner 非退化 test / shellcheck） | present（本サイクル取得済み・Gate-B passed） |
| commit / push / PR | pending（Gate-C / user-gated・Phase 13） |

### Step 1-C: 関連タスクテーブル

| 関連 | 関係 / 更新後ステータス |
| ---- | ----------------------- |
| `issue-1081-bulk-tag-real-d1-runtime-smoke/`（3 本目 runner 追加元） | runner 雛形。本タスクの共通化対象だが contract / 挙動は変更しない（非退化が完了条件） |
| `unassigned-task/task-issue-1036-followup-007-...`（存在する場合） | 本タスクで formalize（phase1-13 化）。consumed trace として `unassigned-task/` に残置し、移動は close-out 時 user-gated |
| issue-1137（bulk tag production runtime smoke 拡張） | 4 本目 runner（production tag-bulk 経路）追加候補。実装されれば本 lib の SSOT 価値が増す。YAGNI 解除トリガの一部 |
| 既存 3 runner（`runtime-attendance-provider.sh` / `runtime-admin-web.sh` / `runtime-tag-bulk.sh`） | 共通化対象。lib を source する薄ラッパーへ移行。固有契約は runner 残置（MECE） |
| `scripts/smoke/redact.sh` / `scripts/cf.sh` | 再利用（変更しない）。lib は redact.sh を参照（SSOT 維持・AC-8）、`smoke_run_d1` は cf.sh をラップ |

## Step 2: aiworkflow-requirements 正本更新

判定: **task-workflow / index 同期あり、aiworkflow-requirements ドメイン正本（API/DB/UI）への変更は N/A**。

| ドメイン正本 | 本タスクの影響 | 判定 |
| ------------ | -------------- | ---- |
| API endpoint schema | smoke runner は既存 endpoint を叩くのみ。新 endpoint / request・response shape 変更なし。本タスクは runner の内部リファクタで HTTP 呼び出し自体に触れない | 影響なし（N/A） |
| D1 schema | `smoke_run_d1` は既存 `cf.sh d1 execute` をラップするのみ。`ALTER` / migration / index 追加なし。Google Form 仕様変更なし | 影響なし（N/A） |
| IPC / preload bridge | 該当なし（CLI / CI shell。Electron IPC 層なし） | 影響なし（N/A） |
| UI route | UI route 追加・変更なし（NON_VISUAL・`ui_routes` 空） | 影響なし（N/A） |
| auth 設計 | 認証境界・token 方式の変更なし。runner の bearer 解決ロジックは runner 固有として残置 | 影響なし（N/A） |
| Cloudflare Secret | 新規 secret の追加・正本登録なし | 影響なし（N/A） |

### Step 2 判定の理由（公開インターフェース追加だが正本変更 N/A）

- 本タスクは新規 public インターフェース（`smoke_*` 9 関数 + `SMOKE_*` 3 変数）を追加するが、これは **「内部開発者向けの bash lib 契約」** であり、aiworkflow-requirements が正本とする **API / DB / UI のドメイン契約ではない**。
- したがって aiworkflow-requirements 正本（API endpoint schema / D1 schema / UI route）への変更は **N/A** と判定する。
- ただし共通 lib の公開 surface（9 関数のシグネチャ・3 公開変数・array_key 分岐契約）は後続実装者・4 本目 runner 追加担当が依存する内部契約であるため、**本 workflow 内（`outputs/phase-2/phase-2.md` の関数仕様表 + 本 phase-12 implementation-guide.md の Part 2）に記録**する。aiworkflow-requirements 台帳へは workflow registration / `task-workflow-active.md` のみ同期し、ドメイン spec ファイルは更新しない。
