# Phase 8: リファクタリング

`[実装区分: 実装仕様書]` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION` / `workflow_state: implemented_local_evidence_captured`

## メタ情報

| 項目 | 値 |
| --- | --- |
| Issue | #1042（identity-conflicts dismiss optimistic update / FU-AIDC-006） |
| 対象 component | `apps/web/src/components/admin/IdentityConflictRow.tsx` |
| 兄弟 workflow | #988（merge 側 optimistic update・実装済み） |
| 本フェーズの目的 | dismiss 側 optimistic 化に伴うリファクタ観点の確定。「リファクタ対象は最小（render guard 統合のみ）」を結論づける |

## 8.1 リファクタ方針

本タスクの実装差分は **`IdentityConflictRow.tsx` への `useState` 1個（`optimisticDismissed`）追加 + 既存 render 早期 `return null` 分岐への OR 条件統合 + `onDismiss` ハンドラの optimistic/rollback 差し替え** に限定される。

merge 側（#988）で既に `optimisticMerged` + `if (optimisticMerged) return null;` の row-local optimistic 機構が landed しているため、本タスクは **その対称形を dismiss 側へ追加するだけ**であり、新規抽象化（hook 化・util 切り出し・共通化）は行わない。差分が小さいため、リファクタ対象は最小に保つ。

観点は **(a) render guard の OR 条件統合が duplicate を生まないか / (b) `optimisticMerged` ↔ `optimisticDismissed` の命名対称性 / (c) navigation drift なし** の 3 軸に絞る。

| 観点 | 本タスクでの判定 | 根拠 |
| --- | --- | --- |
| (a) duplicate（重複ロジック） | 新規重複なし | dismiss 用に別 early return を**書かず**、既存 `if (optimisticMerged)` を `if (optimisticMerged \|\| optimisticDismissed)` へ統合。早期 return は 1 箇所のまま |
| (b) 命名対称性 | 対称命名を維持 | merge は `optimisticMerged` / `setOptimisticMerged`、dismiss は `optimisticDismissed` / `setOptimisticDismissed`。動詞過去分詞 + `optimistic` prefix の対称形 |
| (c) navigation drift（責務分散） | row 可視性所有権を row-local に閉じる | page.tsx（Server Component）/ hook（`useAdminMutation`）/ API には触れない。drift を構造的に発生させない |

## 8.2 変更内容（対象 / Before / After / 理由）

> Feedback RT-03 準拠。Before/After をテーブルで明示し、実装者が差分の意図を1行で追えるようにする。

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| state 宣言（`IdentityConflictRow.tsx`・`optimisticMerged` 宣言の直後） | `optimisticMerged` のみ（dismiss 用 optimistic state なし） | `const [optimisticDismissed, setOptimisticDismissed] = useState(false);` を追加 | dismiss row 可視性を row-local state で所有。merge と分離（AC-4） |
| render 冒頭の early return | `if (optimisticMerged) { return null; }` | `if (optimisticMerged \|\| optimisticDismissed) { return null; }` へ統合（**新規 early return を増やさない**） | optimistic に「消えた row」を DOM から除去。merge/dismiss どちらでも 1 guard で消える。duplicate 回避（観点 a） |
| `onDismiss` ハンドラ | `trigger()` 呼び出しのみ。`.catch` は no-op | 先頭で `setOptimisticDismissed(true)` → `trigger({ reason: dismissReason.trim() }).catch(() => setOptimisticDismissed(false))` | dismiss click 直後に即時非表示（AC-1）。server error 時のみ rollback で復元（AC-2） |
| `dismissReason` state | 既存のまま | **変更なし**（rollback 時も保持） | rollback 後に理由入力を失わない（AC-2）。`.catch` では `dismissReason` を一切クリアしない |
| `dismissMutation.onSuccess` | 既存のまま（`setStage("idle")` 等） | **変更なし**（維持） | success 時は `optimisticDismissed` を true のまま保持し row は消えたまま（AC-3）。`router.refresh()`（既存 hook 内）が list を後追い整合 |
| merge 経路（`onMerge` / `optimisticMerged` / merge stage markup） | 既存のまま | **変更なし**（不変・回帰禁止） | merge 非回帰が受け入れ基準（AC-5） |
| dismiss endpoint / payload | `POST /api/admin/identity-conflicts/:id/dismiss` / `{ reason }` | **不変** | 既存 API のみ接続（不変条件 #1） |

### After 想定コード（差分イメージ）

```tsx
// state 追加（optimisticMerged の直後・対称命名）
const [optimisticDismissed, setOptimisticDismissed] = useState(false);

// onDismiss 差し替え
const onDismiss = () => {
  setOptimisticDismissed(true); // optimistic: 即座に row を消す
  void dismissMutation
    .trigger({ reason: dismissReason.trim() })
    .catch(() => {
      setOptimisticDismissed(false); // rollback: server error 時のみ row を復元（dismissReason は保持）
    });
};

// render 冒頭（既存 early return への OR 統合・新規 return を増やさない）
if (optimisticMerged || optimisticDismissed) {
  return null;
}
```

## 8.3 独立 boolean を維持する判断（union 化しないこと）

merge 側（#988 Phase 8.3）と同じ理由で、optimistic state は `stage` union（dialog 表示制御）に **混ぜず独立 boolean** とする。dismiss も同様に `optimisticDismissed: boolean` を独立保持する。

| 案 | 採否 | 理由 |
| --- | --- | --- |
| 独立 `optimisticDismissed: boolean`（確定案） | **採用・維持** | dialog 表示制御（stage）と row 可視性制御（optimistic）の責務を分離。rollback 時に dismiss dialog へ戻すべき stage が曖昧にならない |
| merge と dismiss を 1 つの `optimisticHidden` boolean に統合 | **却下** | success / rollback / cross-state の判別が曖昧になり、AC-4（state 分離）・AC-5（merge 非回帰）の保証が崩れる。どちらの操作で消えたか追跡不能になる |
| `stage` に `"dismissed"` を追加して union 化 | **却下** | stage 遷移と row 消失が結合し、rollback で復元すべき stage が判別不能になる。責務境界を崩す |

> リファクタ時に「state を1つにまとめると綺麗」という誘惑で union 化・merge/dismiss 統合をしないこと。本節を明示的な guard とする。

## 8.4 リファクタ後の不変条件再確認

| 不変条件 | 維持確認 |
| --- | --- |
| #1 既存 API のみ | `IdentityConflictRow.tsx` のみ編集。dismiss endpoint / payload `{ reason }` 不変 |
| #2 OKLch トークン正本 | 新規 markup なし（`return null` の OR 統合のみ）→ HEX 直書きゼロ。rollback error は既存 dismiss error markup（`role="alert"`）を流用 |
| #9 admin form は primitive 経由 | `Button` / `Textarea` / `Badge` 既存 primitive のまま。新規 `<input>` 追加なし |
| #10 legacy hook 不使用 | `useAdminMutation` は `../../features/admin/hooks` 経由のまま。`@/lib/useAdminMutation` 参照を増やさない |

## 8.5 リファクタ判定

**GATE: PASS** — リファクタ対象は最小（render guard の OR 統合のみ + state 1個 + ハンドラ差し替え）。dismiss 用に別 early return を増やさず 1 guard へ統合し duplicate を回避。命名対称性（`optimisticMerged` ↔ `optimisticDismissed`）を維持。merge / page.tsx / hook / API には触れず navigation drift なし。次フェーズ（品質保証）へ進行可。

## 完了条件

- [ ] 変更内容を「対象 / Before / After / 理由」テーブル（§8.2）で明示している（Feedback RT-03）。
- [ ] render guard を新規 early return ではなく既存 `if (optimisticMerged)` への OR 統合（`optimisticMerged || optimisticDismissed`）として記述している（duplicate 回避・観点 a）。
- [ ] `optimisticMerged` ↔ `optimisticDismissed` の命名対称性を確認している（観点 b）。
- [ ] merge / page.tsx / hook / API 不変で navigation drift なしを確認している（観点 c）。
- [ ] union 化・merge/dismiss 統合を行わない guard（§8.3）を明記している。
- [ ] 「リファクタリング対象は最小（render guard 統合のみ）」と結論づけている。
- [ ] 末尾にリファクタ判定（§8.5 GATE）を置いている。
