# Phase 8: リファクタリング

> **Phase 種別**: リファクタリング（インターフェース不変・挙動同値）
> **対象 issue**: #1078 BulkActionBar tag picker 大規模 catalog UX 改善 + tag master read contract 修正
> **実装区分**: implemented_local_evidence_captured。本 Phase の整理方針は local 実装へ反映済み。
> **前提**: Phase 5-7 完了（全テスト green + カバレッジ確認済み）。
> **次フェーズ**: Phase 9 品質保証

---

## 8.1 このフェーズのゴール

Phase 5 で追加した「検索 / 折りたたみ / 選択中行 chip / pagination ロード」のロジックを、
**公開 props（`BulkActionBarProps`）と挙動を変えずに** 整理し、navigation / 重複（drift）を削減する。
リファクタは挙動同値であり、Phase 6 の全 TC が無改変で green を維持することを必須条件とする。

> **インターフェース不変原則**: `export interface BulkActionBarProps { selectedIds; onComplete }` は変更しない。
> `members.ts` の公開 export（`AdminTagRef` / `MemberTagsResult` / `BulkApplyMemberTagsResult` 等）の型 shape も変えない。

---

## 8.2 リファクタリング項目（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| category grouping ロジック | `groupedTags` を `available` 全件から `useMemo` で直接 Map 化（`BulkActionBar.tsx` 78-86 行） | **検索フィルタ後の `visibleTags` 由来**で grouping する `useMemo` を抽出（`buildGroupedTags(visibleTags)` 純関数 + `useMemo` ラップ）。`available` → `visibleTags`（query 適用後）→ `groupedTags` の単方向データフローに揃える | 検索結果と group 表示の二重ソースを排除（drift 削減）。AC-1（検索折りたたみ）と grouping を 1 本のデータフローに統一する |
| 検索フィルタ debounce | 検索入力ごとに即時 re-render（debounce 無し、または inline setTimeout） | `useDebouncedValue<string>(query, delay)` の小ヘルパに切り出し、`BulkActionBar` は debounced 値のみ参照 | 大規模 catalog で入力ごとの再フィルタによる体感劣化を抑止。debounce ロジックを 1 箇所に集約しテスト可能化 |
| 選択中行 chip 描画 | catalog 内の `TagPill` 描画と選択中 chip 描画が別々のインライン JSX で重複 | `renderTagPill(tag, { selected, onToggle, disabled })` のような描画ヘルパ（同一ファイル内ローカル関数）に共通化し、catalog と chip 行の双方から呼ぶ | AC-4（検索/折りたたみ非表示でも選択タグを chip 行に保持）の描画と catalog 描画の重複を排除。class / token も 1 箇所に集約 |
| `groupedTags` の visible 由来化 | `available` 全件で grouping → 検索は別途 catalog 側でフィルタ（二重判定の可能性） | grouping の入力を `visibleTags`（debounced query 適用後）に統一し、空状態文言（「該当なし」「付与可能なタグがありません」）の判定も `visibleTags.length` / `available.length` で一意化 | 検索結果 0 件と catalog 0 件（contract 修正後も空）の文言分岐を明確化し、二重フィルタ起因の drift を削減 |

---

## 8.3 リファクタリングしないもの（スコープ外）

| 箇所 | 理由 |
|------|------|
| `run()` / `runBulkTags()` / `summarize()` | 本 issue 無改変。挙動を触らない。 |
| `useAdminMutation` 配線（不変条件 #10） | hook 経由を維持。直叩きへ戻さない。 |
| `TagPill` primitive | 新規 primitive を生やさない（不変条件・プロトタイプ正本順位）。再利用のみ。 |
| `fetchTagMaster` の戻り型 shape | Phase 5 の contract 修正後の shape を正とし、本 Phase ではこれ以上変えない。 |
| 公開 props `BulkActionBarProps` | インターフェース不変。 |

---

## 8.4 リファクタ安全性の担保

- Phase 6 の全 TC（既存 TC-BAB-01..05 / TC-BAB-TAG-01..05 + 本 issue 追加分）が **無改変で green** を維持すること。
- リファクタ前後で `BulkActionBar.spec.tsx` / `members.spec.ts` の差分が出ないこと（テストは挙動の固定点）。
- 抽出したヘルパ（`useDebouncedValue` / `buildGroupedTags` / `renderTagPill`）はファイル内ローカル or 既存 util 配置とし、新規公開 API を増やさない。

---

## 8.5 ローカル実行コマンド（CONST_005）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run \
  src/features/admin/components/__tests__/BulkActionBar.spec.tsx \
  src/features/admin/api/__tests__/members.spec.ts
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

---

## 8.6 DoD（Definition of Done）

- [x] 8.2 表の主要項目（visible 由来 grouping / debounce / 選択中 chip / catalog 空状態分岐）を適用した
- [x] 公開 props `BulkActionBarProps` と既存 mutation API shape を変更していない（インターフェース不変）
- [x] Phase 6 の全 TC が green を維持している
- [x] 新規 primitive を増やしていない（TagPill 再利用）
- [x] navigation / 重複（二重フィルタ・選択中表示の見失い）が削減されている
- [x] typecheck / lint が exit 0

> local 実装差分は `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` と `apps/web/src/features/admin/api/members.ts` に反映済み。


## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
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

## 完了条件

- [x] 必須見出しが揃っている。
- [x] 状態語彙が `implemented_local_evidence_captured` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` と整合している。


## 統合テスト連携

- [x] API client contract は `apps/web/src/features/admin/api/__tests__/members.spec.ts`（11 tests PASS）で検証済み。
- [x] BulkActionBar UI / a11y / regression は `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx`（20 tests PASS）で検証済み。
- [x] broader web Vitest run は 216 files / 1587 tests PASS / 1 skipped。
