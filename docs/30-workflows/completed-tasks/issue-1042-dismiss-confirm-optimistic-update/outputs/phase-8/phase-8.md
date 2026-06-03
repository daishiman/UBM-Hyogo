# Phase 8: リファクタリング

**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

`taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

## 8.1 リファクタ方針

本タスクの実装差分は **`IdentityConflictRow.tsx` への `useState` 1個（`optimisticDismissed`）追加 + render guard の合流（`if (optimisticMerged || optimisticDismissed) return null;`）+ `onDismiss` ハンドラの optimistic/rollback 差し替え** に限定される。merge 側（`optimisticMerged`）は #1046 で実装済みであり、本タスクはその挙動を dismiss 側へ **mirror** するだけである。差分が小さいため、リファクタ対象は最小に保ち、過剰な抽象化（hook 化・共通 util への切り出し）は行わない。

観点は **duplicate 削減 / navigation drift（責務の漏れ・分散）削減** の 2 軸のみに絞る。

| 観点 | 本タスクでの判定 | 根拠 |
| --- | --- | --- |
| duplicate（重複ロジック） | 許容範囲の構造的対称・新規の有害重複なし | optimistic 分岐は render 冒頭の `return null` に 1 箇所で合流。`onDismiss` の rollback は `catch` 1 経路のみ |
| navigation drift（責務分散） | row 可視性所有権を row-local に閉じる | Phase 2.1 / 2.2 確定。page.tsx / hook / API には触れない（drift を構造的に発生させない） |

## 8.2 変更内容（対象 / Before / After / 理由）

> Feedback RT-03 準拠。Before/After をテーブルで明示し、実装者が差分の意図を1行で追えるようにする。

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| state 宣言（`IdentityConflictRow.tsx` L29 付近） | `optimisticMerged` のみ（merge 専用 boolean） | 直後に `const [optimisticDismissed, setOptimisticDismissed] = useState(false);` を追加 | row 可視性を row-local state で所有（Phase 2.1）。merge と独立した boolean とし stage union には混ぜない |
| render guard（L92） | `if (optimisticMerged) return null;` | `if (optimisticMerged || optimisticDismissed) return null;` に **合流** | optimistic に「消えた row」を DOM から除去する条件を merge / dismiss の OR に統合。可視性条件のみ合流させ、state 本体は分離（Phase 2.3） |
| `onDismiss`（L77-81） | `trigger()` 呼び出しのみ。`.catch` は no-op コメント | 先頭で `setOptimisticDismissed(true)` → `trigger().catch(() => setOptimisticDismissed(false))` | dismiss click 直後に即時非表示。server error 時のみ rollback で row を復元 |
| `dismissMutation.onSuccess`（L54-57） | `setStage("idle")` / `setDismissReason("")` | **変更なし**（維持） | success 時は `optimisticDismissed` を true のまま保持し row は消えたまま。`router.refresh()`（既存 hook 内）が list を後追い整合 |
| `cancelDismiss`（L87-90） | `setStage("idle")` / `setDismissReason("")` | **変更なし**（不変） | cancel は `onDismiss` 実行前であり optimistic 化していない。解放漏れリスクが構造的にない（Phase 2.5） |
| merge 経路（`onMerge` / `cancelMerge` / merge stage markup / `optimisticMerged`） | 既存のまま | **変更なし**（不変） | #1046 スコープ。merge 不変（回帰なし）が受け入れ基準（AC-4 系・Phase 3.4） |
| dismiss stage markup（`dismissError` inline / `Textarea` / `Button`） | 既存のまま | **変更なし** | rollback 後の error 表示は既存 `dismissError` markup（`text-[var(--ubm-color-danger)]` / `role="alert"`）を流用 |

### After 想定コード（差分イメージ）

```tsx
// state 追加（optimisticMerged の直後）
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

// render guard（return ( の直前）合流
if (optimisticMerged || optimisticDismissed) return null;
```

## 8.3 merge / dismiss handler の対称構造をあえて共通化しない判断

`onMerge` と `onDismiss` の optimistic handler は構造が対称（`setOptimistic*(true)` → `trigger().catch(() => setOptimistic*(false))`）になる。リファクタの誘惑として「共通の `runOptimistic(setter, trigger)` ヘルパーへ括り出す」案が浮かぶが、本タスクでは **共通化しない**。

| 案 | 採否 | 理由 |
| --- | --- | --- |
| `optimisticMerged` / `optimisticDismissed` を**別々の boolean** に保つ（確定案） | **採用・維持** | merge / dismiss は payload（`targetMemberId` 有無）も error surface（`mergeError` / `dismissError`）も別。rollback の復元責務をそれぞれの state に閉じることで、片方の失敗が他方に波及しない（Phase 2.3 / 3.4） |
| 単一 `optimisticHidden` boolean に統合 | **却下（リファクタで戻さない）** | row 消失の原因が merge / dismiss どちらか判別不能になり、rollback で復元すべき stage（`merge-final` / `dismiss`）も曖昧になる。Issue #1042 苦戦箇所そのもの |
| `runOptimistic(setter, trigger)` 共通ヘルパー化 | **却下** | 抽象1個に対して呼び出し2箇所。間接化の認知コストが重複削減量を上回る。trigger の payload 差を引数で吸収する分、かえって読みにくくなる（新規抽象を作らない方針） |

> **state 分離原則**: optimistic visibility は「操作種別ごとに独立した boolean」とし、可視性条件（render guard）だけを OR で合流させる。これにより handler 構造が対称に見えても、それは「重複」ではなく「対称な責務分離」であり、共通化すべきでない。本節を明示的な guard とする。

## 8.4 render guard 合流による可読性

- merge / dismiss の可視性判定が `if (optimisticMerged || optimisticDismissed) return null;` の 1 行に集約され、「この row が optimistic に消える条件」が 1 箇所で読める。
- 分岐を 2 本（`if (optimisticMerged) ...` と `if (optimisticDismissed) ...`）に分けないことで、早期 return の重複も避ける。
- markup（return 以降）は一切変化しないため、可視性ロジックと描画の境界は維持される。

## 8.5 リファクタ後の不変条件再確認

| 不変条件 | 維持確認 |
| --- | --- |
| #1 既存 API のみ | `IdentityConflictRow.tsx` のみ編集。`/dismiss` endpoint / payload `{ reason }` 不変 |
| #2 OKLch トークン正本 | 新規 markup なし（guard 合流 + state 追加のみ）→ HEX 直書きゼロ。新規色なし |
| #5 `apps/web` から D1 直接アクセス禁止 | UI のみ変更。D1 非接触 |
| #9 admin form は primitive 経由 | `Button` / `Textarea` / `Badge` 既存 primitive のまま。新規 `<input>` 追加なし |
| #10 legacy hook 不使用 | `useAdminMutation` は `../../features/admin/hooks` 経由のまま。`@/lib/useAdminMutation` 参照を増やさない |

## 8.6 リファクタ判定

**GATE: PASS** — リファクタ対象は最小（state 1個 + guard 合流 + handler 差し替え）。duplicate / drift の新規発生なし。独立 boolean を維持し、対称 handler の共通化はあえて行わない。merge 経路は完全不変。次フェーズ（品質保証）へ進行可。
