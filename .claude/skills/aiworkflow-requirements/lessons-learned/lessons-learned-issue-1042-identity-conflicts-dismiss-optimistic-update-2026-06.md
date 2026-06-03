---
task: issue-1042-identity-conflicts-dismiss-optimistic-update
recorded: 2026-06-02
topics: [optimistic-update, rollback, react-state, component-local, render-guard, accessibility, live-region, focus-handoff, sibling-task-reuse, admin-identity-conflicts, visual-on-execution, screenshot-canonical]
related-references:
  - references/workflow-issue-1042-identity-conflicts-dismiss-optimistic-update-artifact-inventory.md
  - references/task-workflow-active.md
  - indexes/resource-map.md
  - indexes/quick-reference.md
  - docs/30-workflows/completed-tasks/issue-1042-identity-conflicts-dismiss-optimistic-update/outputs/phase-12/implementation-guide.md
  - docs/30-workflows/completed-tasks/issue-1042-identity-conflicts-dismiss-optimistic-update/outputs/phase-12/skill-feedback-report.md
  - docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/
  - apps/web/src/components/admin/IdentityConflictRow.tsx
  - apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx
  - apps/web/playwright/tests/admin-identity-conflicts.spec.ts
classification:
  - design/sibling-task-symmetric-reuse
  - design/optimistic-state-separation
  - design/rollback-input-preservation
  - accessibility/optimistic-live-region-focus-handoff
  - workflow/visual-on-execution-screenshot-captured
---

# Lessons Learned — Issue #1042 Identity Conflicts Dismiss Optimistic Update (2026-06)

`/admin/identity-conflicts` の dismiss（別人マーク）confirm 完了後、server round-trip を待たず該当 row を optimistic に非表示化し、server error 時のみ rollback（`dismissReason` 保持）する実装で得た 5 教訓を classification-first で整理する。親 `issue-988-identity-conflicts-merge-optimistic-update`（merge 側 / 実装済み）の確定コードを正本として対称適用した。出典は `docs/30-workflows/completed-tasks/issue-1042-identity-conflicts-dismiss-optimistic-update/outputs/phase-12/{implementation-guide,skill-feedback-report}.md` と実装差分（`apps/web/src/components/admin/IdentityConflictRow.tsx` 他）。

---

## L-I1042-001. design / 兄弟タスクの確定コードを対称写像して設計コストを最小化

### 状況
dismiss 経路の optimistic 化が必要だったが、親 #988 で merge 経路の optimistic 化（`optimisticMerged` / `onMerge` / rollback）が既に実装・正本化されていた。

### 何が起きたか
ゼロから dismiss optimistic を設計するのではなく、`onMerge`→`onDismiss`、`optimisticMerged`→`optimisticDismissed` の 1:1 写像で対称適用できた。命名は既存 camelCase 規則を踏襲し、merge 側と対称命名にすることで grep / レビューの認知負荷を下げた。

### 対応
- 親 #988 の Phase 12 フォーマットと確定コードを正本として参照（新規 skill 変更は no-op）。
- 識別子 drift を防ぐため、implementation-guide の確定コードを Phase 1 設計と一致させ、実装時に `grep "optimisticDismiss" apps/web/src` で写像漏れを検証（事前調査で 0 件 → 未実装確定）。

### 教訓
兄弟タスクに対称な正本実装がある場合、フォーマット・命名・rollback 方針を 1:1 写像することが最小複雑性。新規 hook 汎化や reference 追加は過剰。

---

## L-I1042-002. design / optimistic state は操作種別ごとに分離し render guard でのみ合流

### 状況
1 つの row component（`IdentityConflictRow`）が merge と dismiss の 2 操作を持ち、両方が optimistic hide + rollback を必要とした。

### 何が起きたか
`optimisticMerged` と `optimisticDismissed` を 1 つの state（例: `||` 共有や union stage への混入）にまとめると、片方の rollback が他方の可視性に波及するリスクがあった。

### 対応
- `optimisticMerged` / `optimisticDismissed` を**独立 boolean** として持ち、rollback 責務を分離。
- `stage` union（`"idle" | "merge-confirm" | "merge-final" | "dismiss"`）にも混ぜない（`stage` は dialog 表示制御、optimistic flag は row 可視性制御という責務分離）。
- 可視性判定だけを合流させる（実装は単純な `if (optimisticMerged || optimisticDismissed) return null;` ではなく、両 flag から導出した `optimisticStatus` で合流。L-I1042-004 参照）。

### 教訓
複数操作が同一 component 内で optimistic + rollback を持つ場合、state は操作種別ごとに分離し、合流点を render guard 1 箇所に限定する。cross-operation の rollback race を構造的に排除できる。

---

## L-I1042-003. design / rollback では入力（dismissReason）を保持し再入力を不要にする

### 状況
dismiss confirm では管理者が「別人と判断した理由」を textarea に入力してから実行する。server error 時に row を復元する rollback が必要だった。

### 何が起きたか
rollback で `dismissReason` も同時に clear してしまうと、失敗のたびに管理者が理由を入力し直す UX 劣化が生じる。

### 対応
- success（`onSuccess`）でのみ `setDismissReason("")` で clear。
- error rollback（`.catch(() => setOptimisticDismissed(false))`）では `dismissReason` を**触らない（保持）**。
- rollback 後は既存の inline error（`role="alert"`）が再び見える状態に戻るため、新規 error markup は追加しない。

### 教訓
optimistic rollback は「可視性の復元」と「入力値の保持」を分けて設計する。clear タイミングは success/error で非対称にする（success=clear、error=保持）のが正しい。

---

## L-I1042-004. accessibility / optimistic 非表示は単純 `return null` でなく sr-only live region + focus handoff へ統合

### 状況
optimistic に row を消すと、視覚利用者には「消えた」とわかるが、支援技術（スクリーンリーダー）には変化が通知されない。implementation-guide の使用例は簡略化して `if (optimisticMerged || optimisticDismissed) return null;` と書いていた。

### 何が起きたか
実装では merge / dismiss の両 flag から `optimisticStatus`（文言を出し分ける derived value）を導出し、`return null` の代わりに `role="status" aria-live="polite" tabIndex={-1}` の sr-only `<p>` を残して `useEffect` で focus を移譲した。merge と dismiss はこの live region で合流する（flag 分離は維持）。

### 対応
- optimistic 中は row 本体を DOM から外しつつ、sr-only status node を残し、`optimisticStatusRef.current?.focus()` で focus を移譲。
- 操作種別ごとに文言を出し分け（dismiss=「別人として確定しました。候補を一覧から非表示にしました。」/ merge=「merge を実行しました。…」）。

### 教訓
optimistic 非表示の合流点は「可視性」だけでなく「支援技術通知 + focus 復帰」の責務も持つ。`return null` で済ませず、live region + focus handoff を共有合流点として設計する。implementation-guide の簡略コードと実装の差分はこの a11y 強化に由来（drift ではなく意図的昇格）。

---

## L-I1042-005. workflow / implemented VISUAL は canonical 名を維持したまま同一サイクルで screenshot captured へ昇格

### 状況
本タスクは VISUAL_ON_EXECUTION（dismiss 押下直後に row が消える視覚変化）。親 #988 は implemented・screenshot present だった。

### 何が起きたか
screenshot canonical 名（`identity-conflict-row-dismiss-confirm` / `-dismiss-optimistic-removed` / `-dismiss-rollback-error`）を Phase 1 spec で先に確定し、implementation-guide と phase11-capture-metadata.json でも同名参照したため、Phase 11 実行時の名前 drift を予防できた。実コード wave で 3 PNG を status=captured へ昇格した。

### 対応
- canonical 名を Phase 1 spec → implementation-guide → capture metadata で一致させる（FB-VISUAL-CAP-001）。
- 親タスクが present でも、本タスクは同一サイクルで captured を取得し compliance §4 で差分を明示。

### 教訓
VISUAL_ON_EXECUTION では screenshot canonical 名を Phase 1 で早期固定し、複数 artifact で同名参照することで name drift を構造的に防ぐ。実装同一サイクルで present→captured へ昇格できる。
