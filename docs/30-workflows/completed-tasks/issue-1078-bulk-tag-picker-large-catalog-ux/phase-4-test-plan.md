# Phase 4: テスト作成（TDD）

issue: #1078 / 親 workflow `issue-1078-bulk-tag-picker-large-catalog-ux`
対象: task-A（`members.ts`）+ task-B（`BulkActionBar.tsx`）の TDD テスト。
不変条件: test は `*.spec.{ts,tsx}` のみ（#8）。

---

## 1. テストケース一覧表

| ID | 対象ファイル | 期待 | AC 対応 |
| --- | --- | --- | --- |
| TC-API-TM-01 | members.spec.ts | query 組み立て（q trim / page / pageSize） | AC-3 |
| TC-API-TM-02 | members.spec.ts | 既定 page=1 / pageSize=100 / q なし | AC-3 |
| TC-API-TM-03 | members.spec.ts | `{ total, items }` → `{ available, total }` 変換 | AC-0 |
| TC-API-TM-04 | members.spec.ts | total 欠落 → items.length fallback | AC-0 |
| TC-API-TM-05 | members.spec.ts | items 欠落 → available=[] | AC-0 |
| TC-API-TM-06 | members.spec.ts | HTTP !ok → throw | AC-0 |
| TC-API-TM-07 | members.spec.ts | fetchAllTagMaster ページ周回（最終ページ判定） | AC-3 |
| TC-API-TM-08 | members.spec.ts | cap で slice + truncated=true | AC-3 |
| TC-API-TM-09 | members.spec.ts | total ≤ 取得件数で truncated=false | AC-3 |
| TC-BAB-CAT-01 | BulkActionBar.spec.tsx | `{ total, items }` mock で picker 描画（contract） | AC-0 |
| TC-BAB-CAT-02 | BulkActionBar.spec.tsx | 検索 input で client filter | AC-1 |
| TC-BAB-CAT-03 | BulkActionBar.spec.tsx | category 折りたたみ（aria-expanded トグル） | AC-1 |
| TC-BAB-CAT-04 | BulkActionBar.spec.tsx | 選択中固定行 persistence（検索結果外でも解除可能） | AC-4 |
| TC-BAB-CAT-05 | BulkActionBar.spec.tsx | pageSize=100 送信 | AC-3 |
| TC-BAB-CAT-06 | BulkActionBar.spec.tsx | truncated → serverSearchMode UI | AC-3 |
| TC-BAB-CAT-07 | BulkActionBar.spec.tsx | keyboard / aria-pressed regression（large catalog） | AC-2 |

---

## 2. RED の前提（mock 是正で AC-0 が RED→GREEN になる順序）

1. まず `BulkActionBar.spec.tsx` の fetch mock を `{ available: AVAILABLE }` → `{ total: AVAILABLE.length, items: AVAILABLE }` へ是正する。
2. この時点で `fetchTagMaster` 未修正なら `r.available === undefined` → picker 空 → TC-BAB-CAT-01 / 既存 TC-BAB-TAG-01 が **RED**。
3. task-A で `fetchTagMaster` を contract 是正（`items` → `available` 変換）→ **GREEN**。
4. task-B で large catalog UI（検索/折りたたみ/固定行）を実装 → TC-BAB-CAT-02..07 が GREEN。

> AC-0 は「テスト mock を実 API 形へ是正したことで初めて検出できるようになる contract 回帰」を担保する。mock 是正 = 回帰防止の最重要点。

---

## 3. verify_existing 分（既存挙動の regression ケース）

| 観点 | ケース | 内容 |
| --- | --- | --- |
| AC-2 aria-pressed | TC-BAB-CAT-07 + 既存 TC-BAB-TAG-01/02/04 | TagPill が `button` + `aria-pressed`、fireEvent.click で toggle。付与/解除モードトグル（`aria-pressed`）が large catalog でも維持 |
| AC-4 既存 Set 保持 | TC-BAB-CAT-04 | `selectedTagIds: Set<string>` が検索/折りたたみ/別ページに依存せず保持。固定行から解除可能 |
| 既存集計 | 既存 TC-BAB-TAG-03 | 部分失敗（skip / not_found）集計表示が不変 |
| 小規模維持 | TC-BAB-CAT-02 補助 assert | 閾値以下 fixture では検索 input が出ず、従来の全件 category 描画 |

---

## 4. private/internal state の扱い（VSCPKR-03）

- `query` / `debouncedQuery` / `collapsed` / `knownTagsRef` は component 内部状態であり props 公開しない。
- テストは props 注入ではなく **DOM 観測経由**で検証する:
  - 検索: `aria-label="タグを検索"` の input の value / 入力。
  - 折りたたみ: category button の `aria-expanded` 属性と配下 pill の表示有無。
  - 固定行: `role="group" name="選択中のタグ"` 内の selected chip。
- internal state を直接 assert しない（実装詳細への結合を避ける）。

---

## 5. 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/features/admin/api/__tests__/members.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/features/admin/components/__tests__/BulkActionBar.spec.tsx
```

---

## 6. 完了条件

- [ ] 上記 16 ケースが定義され、mock 是正後に AC-0 が RED→GREEN で確認できる。
- [ ] verify_existing 分（AC-2 / AC-4 / 既存集計 / 小規模維持）が regression ケースとして含まれる。
- [ ] internal state は DOM 観測経由のみで検証（VSCPKR-03）。
- [ ] `*.spec.{ts,tsx}` のみ。


## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
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
