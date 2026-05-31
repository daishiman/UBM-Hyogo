# Phase 5: 実装

Phase 4 で RED にしたテストを GREEN にするための実装フェーズ。
`IdentityConflictRow.tsx` に optimistic update を追加する。**merge 経路のみ**変更し、
dismiss / hook（`useAdminMutation`）は一切変更しない。

---

## 5.1 新規作成 / 修正ファイル一覧（Feedback RT-03）

| 区分 | パス | 内容 |
|------|------|------|
| 修正 | `apps/web/src/components/admin/IdentityConflictRow.tsx` | `optimisticMerged` state 追加・`onMerge` 差し替え・`return null` 分岐挿入 |

> **新規作成ファイルなし**。本タスクは既存 1 ファイルの修正のみ。
> `useAdminMutation`（`apps/web/src/features/admin/hooks/useAdminMutation.ts`）は変更しない（不変条件 #10 維持）。
> Server Component `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` は参照のみ・変更しない。

---

## 5.2 canUseTool / SDK callback

**N/A**。本タスクは Next.js client component の state 追加であり、Claude Agent SDK の
`canUseTool` / callback とは無関係。

---

## 5.3 差分方針（具体的な挿入位置）

実コードの行番号を基準にする（編集前の `IdentityConflictRow.tsx`）。

### (1) `useState` 追加（既存 `stage` state の近く・line 15 付近）

`stage` state 宣言の直後に optimistic state を追加する。

```tsx
const [stage, setStage] = useState<"idle" | "merge-confirm" | "merge-final" | "dismiss">("idle");
const [optimisticMerged, setOptimisticMerged] = useState(false); // ← 追加
const [mergeReason, setMergeReason] = useState("");
```

### (2) `onMerge` 差し替え（line 50-59）

既存の `onMerge` を以下の確定コードに置き換える。

```tsx
const onMerge = () => {
  setOptimisticMerged(true); // optimistic: 即座に row を消す
  void mergeMutation
    .trigger({
      targetMemberId: item.candidateTargetMemberId,
      reason: mergeReason.trim(),
    })
    .catch(() => {
      setOptimisticMerged(false); // rollback。mergeError は hook が surface 済
    });
};
```

| 変更点 | 内容 |
|--------|------|
| 追加 | 関数先頭で `setOptimisticMerged(true)`（同期的に row を消す） |
| 変更 | `.catch` の中身を空コメントから `setOptimisticMerged(false)` に変更 |
| 不変 | `trigger` の payload（`targetMemberId` / `reason`）は変えない |

### (3) `return null` 分岐の挿入（line 76 の `return (` の直前）

JSX を返す `return (` の**直前**に early return を挿入する。

```tsx
if (optimisticMerged) {
  return null; // optimistic / success 中は row を DOM から消す
}

return (
  <div className="flex flex-col gap-3 rounded ...">
    ...
  </div>
);
```

> `if (optimisticMerged) return null;` は **すべての hook 呼び出し（`useId` / `useState` / `useAdminMutation`）より後**に
> 置くこと（React hooks ルール: 条件付き early return より前に hook を呼び終えている必要がある）。
> line 76 直前ならこの条件を満たす。

---

## 5.4 入力・出力・副作用の定義

### `optimisticMerged: boolean`（internal state）

| 項目 | 内容 |
|------|------|
| 初期値 | `false` |
| true になる契機 | `onMerge` 呼び出し（merge 実行 click） |
| false に戻る契機 | `trigger` reject 時の `.catch`（rollback のみ） |
| 公開範囲 | internal state（props として外部に露出しない / VSCPKR-03） |

### `onMerge`（merge 実行 click ハンドラ）

| 項目 | 内容 |
|------|------|
| 入力 | なし（component scope の `item` / `mergeReason` を参照） |
| 出力 | なし（`void`） |
| 副作用 1 | `setOptimisticMerged(true)`（同期的に row 非表示化） |
| 副作用 2 | `mergeMutation.trigger({ targetMemberId, reason })` 発火（async） |
| 副作用 3（success） | hook の `onSuccess` が `setStage("idle")` / `setMergeReason("")` を実行。`optimisticMerged` は true 維持。`router.refresh()`（hook 既存挙動）が server list を後追い整合 |
| 副作用 4（failure） | `.catch` で `setOptimisticMerged(false)`（row 復元）。`mergeError` は hook が surface 済で inline 表示。stage は `merge-final` のまま |

### dismiss 経路

**副作用変更なし**。`onDismiss` / `dismissMutation` / dismiss の JSX は一切触らない。

---

## 5.5 ローカル実行コマンド

```bash
# 型チェック（ルートで全 package）
pnpm typecheck

# lint（web package 限定）
pnpm --filter web lint

# Phase 4 で書いたテストが GREEN になることを確認
pnpm --filter web exec vitest run src/components/admin/__tests__/IdentityConflictRow.spec.tsx
```

> この時点では既存 happy ケース（success 後 merge ボタン再表示）が FAIL する可能性がある。
> その更新は Phase 6 で行う。Phase 5 の完了条件は「TC-OPT-1/2/3 が GREEN」「typecheck / lint green」。

---

## 5.6 不変条件チェック（AC-7 / AC-8）

| 条件 | 確認 |
|------|------|
| AC-4 dismiss 不変 | dismiss 関連の差分が 0 であること |
| AC-7 typecheck + lint green | 上記コマンドが green |
| AC-8 legacy 未参照 | `@/lib/useAdminMutation` を import しない（既存どおり `../../features/admin/hooks` 経由を維持） |
| 不変条件 #2（OKLch token） | HEX 直書き / `bg-[#xxx]` を追加しない（本変更は JSX 構造に色を追加しないため自動的に満たす） |
