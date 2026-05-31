# Phase 2: 設計

## 2.1 要件レビュー思考法（3系統）

### 真の論点

> merge 完了を待たずに row を消す optimistic UX を、**API 変更ゼロ・hook 変更ゼロ**で、複数 row 一括処理時の rollback 誤爆なしに実現する。

現象（spinner 待ちで遅い）ではなく、主問題は「**row 可視性の所有権をどこに置くか**」。これを誤ると page.tsx の Client 化（過剰）や hook 拡張（他画面波及）に流れる。

### 因果・責務境界

- **状態所有権**: row の可視性は **row 自身（component-local）** が所有する。親 list（page.tsx Server Component）は所有しない。
  - 強化ループ: 各 row が自身の optimistic state を持つ → row 間で state を共有しない → 1 row の rollback が他 row に波及しない（race 構造排除）。
  - バランスループ: optimistic で消した row は `router.refresh()`（success 経路）で server truth に収束 → 楽観と真実の差分がたまらない。
- **責務分離**: `stage`（dialog 表示）と `optimisticMerged`（row 可視性）を**別 state** にする。両者を1つの union に混ぜると、dialog 遷移と row 消失が結合して rollback 時の復元先 stage が曖昧になる。

### 価値とコスト

- 初回価値: 複数 conflict 一括処理時の体感速度向上（server round-trip 待ちブロック解消）。
- 最大コスト部品: rollback の正確性（誤って別 row を復元しない）。→ component-local state により**コストを構造的に最小化**（hook 拡張・グローバル state 不要）。
- 将来層（混同しない）: dismiss 側 optimistic 化は別 followup。本タスクには含めない。

### 4条件評価

| 条件 | 評価 |
| --- | --- |
| 価値性 | 管理者の一括処理コストを下げる。受け入れ基準 AC-1..4 で定義済 |
| 実現性 | 単一 component の `useState` 1個 + 分岐 render。1サイクルで実装可能な厚み |
| 整合性 | row 可視性の所有権が row に閉じる。API/hook/page 不変。責務境界が矛盾なく閉じる |
| 運用性 | 既存 vitest/playwright スイートに追記。`router.refresh()` で server truth 収束。監査運用破綻なし |

## 2.2 コンポーネント設計

### 状態モデル

```text
既存:
  stage: "idle" | "merge-confirm" | "merge-final" | "dismiss"
  mergeReason: string
  dismissReason: string

新規:
  optimisticMerged: boolean   // true = merge を楽観的に確定し row を非表示
```

### 状態遷移（merge 経路）

```text
[idle] --merge--> [merge-confirm] --次へ--> [merge-final]
   |                                              |
   |                                       merge 実行 click
   |                                              v
   |                          optimisticMerged = true（即時）→ trigger()
   |                                              |
   |              ┌───────────────────────────────┴───────────────┐
   |          success                                          error(catch)
   |              |                                                |
   |     optimisticMerged 維持(true)                    optimisticMerged = false
   |     stage="idle"(既存onSuccess)                    （rollback）+ mergeError surface
   |              |                                       stage は "merge-final" 維持
   |              v                                       （inline error を見せ再操作可能に）
   |        row は非表示のまま                                  row 復元
   |        router.refresh() で list 後追い整合
   v
（render）optimisticMerged === true のとき component は collapsed を返す
```

### render 分岐

```tsx
// component 冒頭の早期 return ではなく、最上位 wrapper の表示制御で実装する。
// 「row を消す」= ルート要素を render しない（null）か、視覚的に collapse する。
// 推奨: ルートで null を返す（DOM から消え、Playwright の getByText が消失を検出できる）。
if (optimisticMerged) {
  return null;
}
```

> **判断**: 早期 `return null` を採用。理由 = (1) Playwright の `toHaveCount(0)` / `not.toBeVisible()` で消失を素直に検証できる、(2) aria 的に「処理済 row」を残す必要は要件にない（server refresh で恒久消失）、(3) アニメーションは要件外（Issue スコープ）。

### merge ハンドラ差し替え

```tsx
const onMerge = () => {
  setOptimisticMerged(true); // optimistic: 即座に row を消す
  void mergeMutation
    .trigger({
      targetMemberId: item.candidateTargetMemberId,
      reason: mergeReason.trim(),
    })
    .catch(() => {
      // rollback: server error 時のみ row を復元。mergeError は hook が surface 済。
      setOptimisticMerged(false);
    });
};
```

> `onSuccess`（既存）の `setStage("idle")` / `setMergeReason("")` は維持。success 時に `optimisticMerged` を true のまま保てば、`return null` により row は消えたまま。`router.refresh()` が list を後追い。

## 2.3 Props vs internal state 確認（VSCPKR-03 対応）

| 操作対象 | 区分 | 備考 |
| --- | --- | --- |
| `optimisticMerged` | **internal state**（`useState`） | 外部 props ではない。テストは UI 操作（「merge 実行」click）経由で driven する |
| `item` | external prop | 不変。row データ |

→ Phase 4 の TDD RED は「`item` を渡して render → UI 操作 → DOM から消える」を internal state 経由で検証する。props 駆動ではない点を Phase 4 に明記。

## 2.4 ロック変数の解放経路（STATE-DETAIL-01 対応）

本タスクは新規 ref ロックを追加しない（`useAdminMutation` 内部の `isSubmittingRef` をそのまま利用）。
`optimisticMerged` は ref ではなく state であり、解放（false 化）経路は **error catch の 1 経路のみ**。success / cancel 経路では true 維持 or 不変で正しい。

| 経路 | optimisticMerged | 妥当性 |
| --- | --- | --- |
| 正常（success） | true 維持 | row 消えたまま → 正 |
| エラー（catch） | false（rollback） | row 復元 → 正 |
| キャンセル（cancelMerge: merge-final 前） | 不変（false のまま） | trigger 未発火 → 正 |

## 2.5 既存コンポーネント再利用可否（FB-SDK-07-1 対応）

- 新規 UI primitive を作らない。`Badge` / `Button` / `Textarea`（既存 admin primitives）と既存 inline error markup をそのまま使う。
- 新規追加は `useState` 1個と `return null` 分岐のみ。HIG / アクセシビリティ既存レベルを維持（既存 `role="alert"` / `aria-live` を rollback 後にも流用）。

## 2.6 SubAgent lane / validation path

- 本タスクは単一 component で並列分割の必要なし。実装は 1 lane（直列）。
- validation lane: `pnpm typecheck` → `pnpm --filter web lint` → vitest（IdentityConflictRow）→ playwright（admin-identity-conflicts）を直列で締める。

## 2.7 設計判断ログ

| 判断 | 採用 | 却下案 | 理由 |
| --- | --- | --- | --- |
| state の所在 | component-local `useState` | hook 拡張（onMutate/rollback option） | hook 拡張は全 admin mutation に波及。要件は row-local で充足。後方互換リスク最小 |
| row の消し方 | 早期 `return null` | page.tsx を Client 化し list から除外 | Server Component 維持（不変条件・最小差分）。Playwright 検証も素直 |
| stage と optimistic | 別 state | stage union に `"merged"` 追加 | 責務分離（dialog 表示 vs row 可視性）。rollback 復元先が明確 |
