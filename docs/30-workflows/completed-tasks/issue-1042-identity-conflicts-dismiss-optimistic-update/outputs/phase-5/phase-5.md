# Phase 5: 実装

## メタ情報

| 項目 | 内容 |
|------|------|
| Issue | #1042（FU-AIDC-006） |
| 主題 | dismiss confirm 後 optimistic update の実装 |
| Phase | 5 / 13（実装 / TDD GREEN 化） |
| 修正対象 | `apps/web/src/components/admin/IdentityConflictRow.tsx`（**このファイルのみ**） |
| 参照のみ | `apps/web/src/features/admin/hooks/useAdminMutation.ts` / `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` |

## 目的

Phase 4 で RED にした dismiss optimistic テスト（TC-DOPT-1/2/3）を GREEN にする。
`IdentityConflictRow.tsx` に `optimisticDismissed` state を追加し、`onDismiss` を optimistic 発火 + rollback に
差し替え、render guard を `optimisticMerged \|\| optimisticDismissed` に統合する。**merge 経路（`optimisticMerged` /
`onMerge` / merge JSX）と hook（`useAdminMutation`）は一切変更しない**。

---

## 5.1 新規作成 / 修正ファイル一覧（Feedback RT-03）

| 区分 | パス | 内容 |
|------|------|------|
| 修正 | `apps/web/src/components/admin/IdentityConflictRow.tsx` | `optimisticDismissed` state 追加・`onDismiss` 差し替え・render guard 統合 |

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

### (1) `useState` 追加（L29 `optimisticMerged` 宣言の直後）

merge の optimistic state 宣言（L29）の**直後**に dismiss 用 state を追加する。merge state とは独立した別 state とする。

```tsx
const [stage, setStage] = useState<"idle" | "merge-confirm" | "merge-final" | "dismiss">("idle");
const [optimisticMerged, setOptimisticMerged] = useState(false);
const [optimisticDismissed, setOptimisticDismissed] = useState(false); // ← 追加（dismiss 用・merge と分離）
const [mergeReason, setMergeReason] = useState("");
const [dismissReason, setDismissReason] = useState("");
```

### (2) `onDismiss` 差し替え（L77-81）

既存の `onDismiss` を以下の確定コードに置き換える。

```tsx
const onDismiss = () => {
  setOptimisticDismissed(true); // optimistic: 即座に row を消す
  void dismissMutation
    .trigger({ reason: dismissReason.trim() })
    .catch(() => {
      setOptimisticDismissed(false); // rollback のみ。dismissError は hook が surface 済 / dismissReason は保持
    });
};
```

| 変更点 | 内容 |
|--------|------|
| 追加 | 関数先頭で `setOptimisticDismissed(true)`（同期的に row を消す） |
| 変更 | `.catch` の中身を空コメントから `setOptimisticDismissed(false)` に変更（rollback のみ） |
| 不変 | `trigger` の payload（`{ reason: dismissReason.trim() }`）は変えない |
| 禁止 | `.catch` 内で `setDismissReason("")` 等の理由操作を**しない**（理由保持・clear は success の `onSuccess` のみ） |

### (3) render guard の統合（L92）

既存の dismiss success 経路では `onSuccess` が `setStage("idle")` / `setDismissReason("")` を実行する（L54-57・**変更しない**）。
render guard を merge と OR 合流させる。

```tsx
// 編集前（L92）
if (optimisticMerged) return null;

// 編集後
if (optimisticMerged || optimisticDismissed) return null; // optimistic / success 中は row を DOM から消す
```

> この early return は **すべての hook 呼び出し（`useId` / `useState` ×5 / `useAdminMutation` ×2）より後**に置くこと
> （React hooks ルール: 条件付き early return より前に hook を呼び終えている必要がある）。L92 の位置はこの条件を満たす（すべての hook と
> ハンドラ定義の後）。state は merge / dismiss で**分離**したまま、guard の論理 OR でのみ合流させる（混在 state を作らない）。

---

## 5.4 入力・出力・副作用の定義

### `optimisticDismissed: boolean`（internal state）

| 項目 | 内容 |
|------|------|
| 初期値 | `false` |
| true になる契機 | `onDismiss` 呼び出し（「別人として確定」click） |
| false に戻る契機 | `trigger` reject 時の `.catch`（**rollback のみ**） |
| 公開範囲 | internal state（props として外部に露出しない / VSCPKR-03） |
| merge との関係 | `optimisticMerged` とは**別 state**。render guard でのみ OR 合流 |

### `onDismiss`（「別人として確定」click ハンドラ）

| 項目 | 内容 |
|------|------|
| 入力 | なし（component scope の `dismissReason` を参照） |
| 出力 | なし（`void`） |
| 副作用 1 | `setOptimisticDismissed(true)`（同期的に row 非表示化） |
| 副作用 2 | `dismissMutation.trigger({ reason: dismissReason.trim() })` 発火（async） |
| 副作用 3（success） | hook の `onSuccess`（L54-57）が `setStage("idle")` / `setDismissReason("")` を実行。`optimisticDismissed` は **true 維持**（row は消えたまま） |
| 副作用 4（failure） | `.catch` で `setOptimisticDismissed(false)`（row 復元）。`dismissError` は hook が surface 済で inline 表示。stage は `"dismiss"` のまま維持・`dismissReason` 保持 |

### merge 経路

**副作用変更なし**。`onMerge` / `mergeMutation` / `optimisticMerged` / merge の JSX は一切触らない。

---

## 5.5 ローカル実行コマンド

```bash
# 型チェック（ルートで全 package）
pnpm typecheck

# lint（web package 限定）
pnpm --filter @ubm-hyogo/web lint

# Phase 4 で書いた dismiss optimistic テストが GREEN になることを確認（targeted / FB-UI-02-2）
pnpm --filter @ubm-hyogo/web exec vitest run apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx --root=../.. --config=vitest.config.ts
```

> Phase 5 の完了条件は「TC-DOPT-1/2/3 が GREEN」「merge 既存ケースが PASS のまま（非回帰）」「typecheck / lint green」。
> 既存 dismiss success ケース（payload 検証のみ）の row 可視性整理は Phase 6 §6.1 で行う。

---

## 5.6 不変条件チェック

| 条件 | 確認 |
|------|------|
| AC-4 state 分離 | `optimisticMerged` と `optimisticDismissed` が独立した別 `useState`。guard で OR 合流のみ |
| AC-5 merge 非回帰 | merge 関連の差分が 0（`onMerge` / `optimisticMerged` / merge JSX 不変）。merge 既存テスト PASS |
| AC-8 typecheck + lint green | 上記コマンドが green |
| AC-9 legacy 未参照 | `@/lib/useAdminMutation` を import しない（既存どおり `../../features/admin/hooks` 経由を維持） |
| 不変条件 #2（OKLch token） | HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を追加しない（本変更は JSX 構造に色を追加しないため自動的に満たす） |
| 不変条件 #10 | admin mutation は `@/features/admin/hooks/useAdminMutation` 経由を維持（hook 不変） |

---

## 完了条件

| 項目 | 基準 |
|------|------|
| state 追加 | L29 直後に `optimisticDismissed` を追加（merge と分離） |
| `onDismiss` 差し替え | 先頭 `setOptimisticDismissed(true)` + `.catch(() => setOptimisticDismissed(false))`、payload 不変、理由操作なし |
| guard 統合 | `if (optimisticMerged \|\| optimisticDismissed) return null;`（全 hook 呼出し後） |
| GREEN | TC-DOPT-1/2/3 が green、merge 既存ケース PASS 維持 |
| 品質ゲート | typecheck / lint green（AC-8）、legacy hook 未参照（AC-9） |

## 統合テスト連携（Phase 1-11）

実装した `onDismiss` / render guard / `optimisticDismissed` の挙動は Phase 6 で merge 非回帰・クロス検証・
Playwright E2E（dismiss optimistic + rollback）に拡張、Phase 7 で当該ファイル限定 coverage を実測、
Phase 11 で staging screenshot 証跡を取得する。
