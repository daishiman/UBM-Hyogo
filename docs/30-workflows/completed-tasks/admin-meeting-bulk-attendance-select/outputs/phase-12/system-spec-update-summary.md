# システム仕様更新サマリ — admin-meeting-bulk-attendance-select

workflow_state: `implemented_local_evidence_captured` / taskType: `implementation` / visualEvidence: `VISUAL`

本タスクは `apps/web` の開催日ドロワー出席追加 UI/UX 是正（複数選択 → 一括追加）に閉じる実装完了タスクである。
既存の一括取込 endpoint を再利用し、新規 API / D1 / shared 型を追加しない。Step 1（ドキュメント反映）を完了記録し、
Step 2（システム仕様更新）は N/A と判定する。

## Step 1: ドキュメント反映（完了記録）

| Step | 内容 | 状況 |
| --- | --- | --- |
| Step 1-A | 完了タスク記録: 本 spec の Phase 1-13 成果物と local evidence を workflow root（`index.md` / `phase-12-documentation.md`）に集約。`implemented_local_evidence_captured` の active workflow として aiworkflow-requirements の workflow inventory / quick-reference / resource-map / task-workflow-active / changelog へ同 wave 同期 | done |
| Step 1-B | 実装状況テーブル: `index.md` / `artifacts.json.metadata.workflow_state` を `implemented_local_evidence_captured` で記録（staging visual・PR は user-gated） | done |
| Step 1-C | 関連タスクテーブル: M-1（CSV アップロード UI）/ M-2（attendance route 二系統統合）を baseline として current facts に反映。current 由来の起票必須未タスクは 0 件（`unassigned-task-detection.md` 参照） | done |
| Step 1-H | `skill-feedback-report.md` の各 item を no-op（観察）として routing。promotion 対象なし（理由は skill-feedback-report.md 参照） | done |

> ドメイン仕様（API response shape / D1 schema / shared 型 / 既存 endpoint 契約）は変更しないため Step 2 は N/A。
> ただし active workflow の正本同期は必要なため、aiworkflow-requirements の workflow inventory /
> quick-reference / resource-map / task-workflow-active / changelog へ追記した。

## Step 2（条件付き）: 新規インターフェース追加時のみ

**判定: N/A**

判定フロー（phase-template-phase12.md「Step 2 = N/A vs BLOCKED 判定基準」）:
「ドメイン仕様（不変条件 #1〜#7）に touch するか？」→ **No** → **N/A**。

理由:

- 本タスクは `apps/web` の出席追加 UI/UX 是正（Checkbox primitive 追加・選択 hook・チェックリスト/モーダル UI・
  Shell 配線・CSS）のみ。新規 API endpoint / D1 migration / Google Form schema / IPC 契約 / shared package 型の
  **追加はない**。
- 既存の一括取込 endpoint `POST /admin/meetings/:sessionId/attendance/import?dryRun=false` を **再利用**するのみで、
  request / response shape・`IMPORT_MAX_ROWS=500`・row status enum・all-or-nothing commit 条件はいずれも不変
  （`apps/api` 非変更・AC-12）。
- 新規 export される識別子は `apps/web` 内に閉じる: web client の `importAttendance` と `ImportAttendance*` 型、
  hook `useBulkAttendanceSelection`、純関数 `bulkFailureMessage`、コンポーネント
  `BulkAttendanceChecklist` / `BulkAttendanceModal`、primitive `Checkbox`。これらは UI レイヤの実装契約であって
  ドメイン契約（横断正本に登録する API / D1 / 認証 / Cloudflare Secret）ではない。

> N/A 判定の根拠を明記することで「Step 2 必要性判定の記録漏れ」を回避する。
> `pending same-wave sync` は残さない（横断正本の更新対象がそもそも発生しないため）。
> planned wording（未確定の保留表現）は本サマリに残さない。横断正本の更新対象がそもそも発生しないため。

## artifacts parity

`outputs/artifacts.json` は root `artifacts.json` の mirror として存在する。
parity check は root / outputs の両方を対象に実施する（`gate-metadata:validate` が両ファイルを検証）。
