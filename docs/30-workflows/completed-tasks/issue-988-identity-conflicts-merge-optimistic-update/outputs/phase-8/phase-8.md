# Phase 8: リファクタリング

`[実装区分: 実装仕様書]` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

## 8.1 リファクタ方針

本タスクの実装差分は **`IdentityConflictRow.tsx` への `useState` 1個（`optimisticMerged`）追加 + render 早期 `return null` 分岐 + `onMerge` ハンドラの optimistic/rollback 差し替え** に限定される。差分が小さいため、リファクタ対象は最小に保ち、過剰な抽象化（hook 化・util 切り出し）は行わない。

観点は **duplicate 削減 / navigation drift（責務の漏れ・分散）削減** の 2 軸のみに絞る。

| 観点 | 本タスクでの判定 | 根拠 |
| --- | --- | --- |
| duplicate（重複ロジック） | 新規重複なし | optimistic 分岐は 1 箇所（render 冒頭の `return null`）。`onMerge` の rollback は `catch` 1 経路のみ |
| navigation drift（責務分散） | row 可視性所有権を row-local に閉じる | Phase 2.1 確定。page.tsx / hook / API には触れない（drift を構造的に発生させない） |

## 8.2 変更内容（対象 / Before / After / 理由）

> Feedback RT-03 準拠。Before/After をテーブルで明示し、実装者が差分の意図を1行で追えるようにする。

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| state 宣言（`IdentityConflictRow.tsx` L15 付近） | `stage` / `mergeReason` / `dismissReason` の 3 state のみ | 末尾に `const [optimisticMerged, setOptimisticMerged] = useState(false);` を追加 | row 可視性を row-local state で所有（Phase 2.1）。stage union には混ぜない |
| render 冒頭 | 早期 return なし（常にルート `<div>` を描画） | `if (optimisticMerged) { return null; }` を `return (` の直前に追加 | optimistic に「消えた row」を DOM から除去。Playwright の `toHaveCount(0)` で検証可能（Phase 2.2 採用判断） |
| `onMerge`（L50-59） | `trigger()` 呼び出しのみ。`.catch` は no-op コメント | 先頭で `setOptimisticMerged(true)` → `trigger().catch(() => setOptimisticMerged(false))` | merge click 直後に即時非表示。server error 時のみ rollback で復元 |
| `mergeMutation.onSuccess`（L28-31） | `setStage("idle")` / `setMergeReason("")` | **変更なし**（維持） | success 時は `optimisticMerged` を true のまま保持し row は消えたまま。`router.refresh()`（既存 hook 内）が list を後追い整合 |
| dismiss 経路（`onDismiss` / `cancelDismiss` / dismiss stage markup） | 既存のまま | **変更なし**（不変） | Issue #988 スコープ外。dismiss 不変が受け入れ基準（Phase 1.2） |

### After 想定コード（差分イメージ）

```tsx
// state 追加
const [optimisticMerged, setOptimisticMerged] = useState(false);

// onMerge 差し替え
const onMerge = () => {
  setOptimisticMerged(true); // optimistic: 即座に row を消す
  void mergeMutation
    .trigger({
      targetMemberId: item.candidateTargetMemberId,
      reason: mergeReason.trim(),
    })
    .catch(() => {
      setOptimisticMerged(false); // rollback: server error 時のみ row を復元
    });
};

// render 冒頭（return ( の直前）
if (optimisticMerged) {
  return null;
}
```

## 8.3 独立 boolean を維持する判断（リファクタで union に戻さないこと）

Phase 2.1 / Phase 1.3 で、optimistic state は `stage` union（`"idle" | "merge-confirm" | "merge-final" | "dismiss"`）に **混ぜず独立 boolean** とすることが確定済み。

| 案 | 採否 | 理由 |
| --- | --- | --- |
| 独立 `optimisticMerged: boolean`（確定案） | **採用・維持** | dialog 表示制御（stage）と row 可視性制御（optimistic）の責務を分離。rollback 時の復元先 stage（`merge-final`）が曖昧にならない |
| `stage` に `"merged"` を追加して union 化 | **却下（リファクタで戻さない）** | stage 遷移と row 消失が結合し、rollback で復元すべき stage が判別不能になる。責務境界を崩す |

> リファクタ時に「state を1つにまとめると綺麗」という誘惑で union 化しないこと。本節を明示的な guard とする。

## 8.4 リファクタ後の不変条件再確認

| 不変条件 | 維持確認 |
| --- | --- |
| #1 既存 API のみ | `IdentityConflictRow.tsx` のみ編集。endpoint / contract 不変 |
| #2 OKLch トークン正本 | 新規 markup なし（`return null` のみ）→ HEX 直書きゼロ |
| #9 admin form は primitive 経由 | `Button` / `Textarea` / `Badge` 既存 primitive のまま。新規 `<input>` 追加なし |
| #10 legacy hook 不使用 | `useAdminMutation` は `../../features/admin/hooks` 経由のまま。`@/lib/useAdminMutation` 参照を増やさない |

## 8.5 リファクタ判定

**GATE: PASS** — リファクタ対象は最小（state 1個 + 分岐 + ハンドラ差し替え）。duplicate / drift の新規発生なし。独立 boolean を維持。次フェーズ（品質保証）へ進行可。
