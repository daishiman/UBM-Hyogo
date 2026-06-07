# Phase 6: テスト追加（fail path / 回帰 guard / 補助）

issue: #1078 / 親 workflow `issue-1078-bulk-tag-picker-large-catalog-ux`
対象: Phase 4 のハッピーパスに対する fail path・境界・回帰 guard を補完する。
不変条件: test は `*.spec.{ts,tsx}` のみ（#8）。

---

## 1. fail path / 境界 テストケース

| ID | 対象 | 期待 |
| --- | --- | --- |
| TC-BAB-CAT-08 | BulkActionBar.spec.tsx | `fetchAllTagMaster` が reject（fetch 例外）→ `setAvailable([])`、picker 空、クラッシュしない |
| TC-BAB-CAT-09 | BulkActionBar.spec.tsx | 空 catalog（`{ total: 0, items: [] }`）→ 「付与可能なタグがありません」表示維持（L214 文言不変） |
| TC-BAB-CAT-10 | BulkActionBar.spec.tsx | truncated（cap 到達）時、serverSearchMode 案内 + 検索 UI が出る（large catalog 扱い） |
| TC-BAB-CAT-11 | BulkActionBar.spec.tsx | 検索入力後、debounce 後に filter 結果が 1 回反映（多重 fetch しない / client filter のみ） |
| TC-API-TM-10 | members.spec.ts | `fetchTagMaster` で HTTP 500 → `throw new Error("HTTP 500")` |
| TC-API-TM-11 | members.spec.ts | `fetchAllTagMaster` 周回中の 1 ページ目が空（`items: []`）→ available=[]、truncated=false で即停止 |
| TC-API-TM-12 | members.spec.ts | `q` が空文字 / 空白のみ → trim 後 query に `q` を付与しない |

> 補足: 本タスクの client filter は全件取得済みデータに対する in-memory filter のため、検索入力で追加 fetch は発生しない（TC-BAB-CAT-11 の「多重 fetch しない」を担保）。`serverSearchMode` は将来の server re-fetch 拡張点で、MVP では案内表示のみ。

---

## 2. 回帰 guard（既存テスト維持）

| 既存ケース | 維持確認 |
| --- | --- |
| TC-BAB-01 | selectedIds=[] で render しない |
| TC-BAB-02 | publish click でシリアル呼出（3 回） |
| TC-BAB-03 | hide click |
| TC-BAB-04 | soft-delete click |
| TC-BAB-TAG-01 | tag master 初回ロードして picker 描画（mock 是正後も GREEN） |
| TC-BAB-TAG-02 | tag 選択 + 実行で bulk trigger（memberIds×tagIds×op） |
| TC-BAB-TAG-03 | 部分失敗集計表示（skip / not_found） |
| TC-BAB-TAG-04 | 解除モードで op=unassign |
| TC-BAB-TAG-05 | tag 未選択で実行ボタン disabled |
| a11y violations 0 | axe 0（large catalog でも検索 input の aria-label / 折りたたみ button で a11y 維持） |

> mock 是正（`{ available }` → `{ total, items }`）後、上記既存ケースが全て GREEN のままであることが回帰 guard の核心。

---

## 3. 完了条件

- [ ] fail path（fetch reject / 空 catalog / truncated / HTTP 500 / 空 items / 空 q）が網羅されている。
- [ ] debounce 後 client filter が 1 回反映し追加 fetch しないことを検証。
- [ ] 既存 TC-BAB-01..04 / TC-BAB-TAG-01..05 / a11y 0 が GREEN 維持（回帰 0）。
- [ ] `*.spec.{ts,tsx}` のみ。
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test --run src/features/admin/...`（両 spec）緑。


## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| workflow | issue-1078-bulk-tag-picker-large-catalog-ux |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |
| verdict | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |

## 目的

本 Phase の既存本文で定義した目的に従い、issue #1078 の tag master contract 修正と BulkActionBar large catalog UX を検証可能な単位で扱う。

## 実行タスク

- [x] Phase 本文の設計・実装・検証項目を issue #1078 の実装結果に同期する。
- [x] 実コード差分、focused tests、typecheck、lint の local evidence と矛盾しない状態語彙へ更新する。

## 参照資料

- `docs/30-workflows/completed-tasks/issue-1078-bulk-tag-picker-large-catalog-ux/index.md`
- `docs/30-workflows/completed-tasks/issue-1078-bulk-tag-picker-large-catalog-ux/artifacts.json`
- `.claude/skills/task-specification-creator/references/workflow-state-vocabulary.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本 Phase ファイル
- `outputs/phase-11/manual-test-result.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`



## 統合テスト連携

- [x] API client contract は `apps/web/src/features/admin/api/__tests__/members.spec.ts`（11 tests PASS）で検証済み。
- [x] BulkActionBar UI / a11y / regression は `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx`（20 tests PASS）で検証済み。
- [x] broader web Vitest run は 216 files / 1587 tests PASS / 1 skipped。


## 完了条件

- [x] issue #1078 の実装対象コードと focused tests が存在する。
- [x] local deterministic evidence が取得済み。
