# Phase 5: 実装

issue: #1078 / 親 workflow `issue-1078-bulk-tag-picker-large-catalog-ux`
注意: 本フェーズは手順のみ記述。**実コードはここに書かない**（実装は task-A/B/C の仕様に従って別途行う）。

---

## 1. 新規作成 / 修正 ファイルパス一覧（FB RT-03 必須）

### 新規作成

| パス | 内容 |
| --- | --- |
| `apps/web/src/features/admin/api/__tests__/members.spec.ts` | `fetchTagMaster` / `fetchAllTagMaster` unit テスト（task-C / TC-API-TM-01..09） |

### 修正

| パス | 内容 |
| --- | --- |
| `apps/web/src/features/admin/api/members.ts` | contract 是正 + `fetchAllTagMaster` + 型 + `TAG_PAGE_SIZE_MAX`（task-A） |
| `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` | large catalog UX（検索/折りたたみ/固定行/高さ制御）（task-B） |
| `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` | fetch mock 是正 + TC-BAB-CAT-*（task-C） |

> apps/api は変更しない（接続先 `GET /admin/tags` は #1035 landed）。

---

## 2. 実装手順（task-A → task-B → task-C 順）

### Step 1: task-A（`members.ts`）

1. `TAG_PAGE_SIZE_MAX = 100` と型 `TagMasterPage` / `FetchTagMasterOptions` / `TagMasterFullResult` を追加。
2. `fetchTagMaster(opts?)` を contract 是正:
   - query 組み立て（q trim・page 既定1・pageSize 既定100）。
   - 応答 `{ total, items }` → `{ available: items ?? [], total: total ?? items?.length ?? 0 }`。
3. `fetchAllTagMaster(cap=500)` を追加（最終ページ判定 + cap 二重ガード + truncated）。
4. 既存 export は不変。無引数 `fetchTagMaster()` の後方互換を維持。

### Step 2: task-B（`BulkActionBar.tsx`）

1. import に `fetchAllTagMaster` を追加、`react` の import に `useRef` を追加。
2. state 追加（`tagTotal` / `serverSearchMode` / `query` / `debouncedQuery` / `collapsed` / `knownTagsRef`）+ `COLLAPSE_THRESHOLD=24`。
3. 初回 `useEffect` を `fetchAllTagMaster()` 呼び出しへ差し替え（available / total / truncated / knownTagsRef 蓄積）。
4. debounce `useEffect`（250ms・setTimeout + clearTimeout cleanup）。
5. `visible` / `groupedTags` useMemo（debouncedQuery で client filter）。
6. `selectedRefs` useMemo（knownTagsRef 解決・未取得は code/id フォールバック）。
7. `largeCatalog` ゲートで検索 input / category 折りたたみ button / 固定行 / `max-h-[40vh] overflow-y-auto` を出し分け。small catalog は現行 UI 維持。
8. `toggleCategory` 追加。`toggleTag` / `runBulkTags` / 集計表示 / TagPill props は不変。

### Step 3: task-C（テスト）

1. `BulkActionBar.spec.tsx` の fetch mock を `{ total, items }` へ是正（AC-0）。
2. TC-BAB-CAT-01..07 追加（LARGE fixture 含む）。
3. 新規 `members.spec.ts` に TC-API-TM-01..09 を記述。

---

## 3. design token 遵守

- 追加 UI（検索 input / 折りたたみ button / 固定行）の色は全て `var(--ubm-*)` token。
- HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（CI gate `verify-design-tokens`）。
- `max-h-[40vh]` / `overflow-y-auto` は Tailwind サイズ/overflow ユーティリティで color token 制約の対象外。

---

## 4. debounce cleanup

- 検索 debounce の `useEffect` は `return () => clearTimeout(id)` で必ず cleanup（多重 timer / unmount 後 setState を防止）。
- 初回ロード `useEffect` も既存の `active` フラグ cleanup を維持。

---

## 5. 完了条件

- [ ] 新規/修正ファイルが §1 の一覧と一致。
- [ ] task-A → task-B → task-C の順で実装。
- [ ] `mise exec -- pnpm typecheck` 緑。
- [ ] `mise exec -- pnpm lint` 緑。
- [ ] `members.spec.ts` / `BulkActionBar.spec.tsx` 緑。
- [ ] color HEX 0 / apps/api 差分 0。


## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
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
