**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

# Phase 5: 実装

Phase 4 で RED にしたテストを GREEN にするための実装フェーズ。
`IdentityConflictRow.tsx` に dismiss 側の optimistic update を追加する。**dismiss 経路のみ**変更し、
merge（`optimisticMerged`）/ hook（`useAdminMutation`）は一切変更しない。

merge 側（#1046）で確立済みの optimistic / rollback パターン（実コード L29, L64-75, L92）を
dismiss 側に対称コピーする。

---

## 5.1 新規作成 / 修正ファイル一覧（Feedback RT-03）

| 区分 | パス | 内容 |
|------|------|------|
| 修正 | `apps/web/src/components/admin/IdentityConflictRow.tsx` | `optimisticDismissed` state 追加・`onDismiss` 差し替え・既存 `return null` 分岐へ条件統合 |

> **新規作成ファイルなし**。本タスクは既存 1 ファイルの修正のみ。
> `useAdminMutation`（`apps/web/src/features/admin/hooks/useAdminMutation.ts`）は変更しない（不変条件 #10 維持）。
> Server Component（`/admin/identity-conflicts` page）は参照のみ・変更しない。

---

## 5.2 canUseTool / SDK callback

**N/A**。本タスクは Next.js client component の state 追加であり、Claude Agent SDK の
`canUseTool` / callback とは無関係。

---

## 5.3 差分方針（具体的な挿入位置・before/after）

実コードの行番号を基準にする（編集前の `IdentityConflictRow.tsx`）。変更は **3 箇所のみ**。

### (1) `useState` 追加（既存 `optimisticMerged` state の隣・line 29-31 付近）

dismiss 用 optimistic state を `dismissReason` の隣（または `optimisticMerged` の直後）に追加する。

before:

```tsx
const [optimisticMerged, setOptimisticMerged] = useState(false);
const [mergeReason, setMergeReason] = useState("");
const [dismissReason, setDismissReason] = useState("");
```

after:

```tsx
const [optimisticMerged, setOptimisticMerged] = useState(false);
const [optimisticDismissed, setOptimisticDismissed] = useState(false); // ← 追加
const [mergeReason, setMergeReason] = useState("");
const [dismissReason, setDismissReason] = useState("");
```

### (2) `onDismiss` 差し替え（line 77-81）

既存の `onDismiss` を merge と対称の確定コードに置き換える。

before:

```tsx
const onDismiss = () => {
  void dismissMutation.trigger({ reason: dismissReason.trim() }).catch(() => {
    // 同上: 失敗時に modal を閉じない。
  });
};
```

after:

```tsx
const onDismiss = () => {
  setOptimisticDismissed(true); // optimistic: 即座に row を消す
  void dismissMutation
    .trigger({ reason: dismissReason.trim() })
    .catch(() => {
      setOptimisticDismissed(false); // rollback。dismissError は hook が surface 済。dismissReason は clear しない。
    });
};
```

| 変更点 | 内容 |
|--------|------|
| 追加 | 関数先頭で `setOptimisticDismissed(true)`（同期的に row を消す） |
| 変更 | `.catch` の中身（空コメント）を `setOptimisticDismissed(false)` に変更 |
| 不変 | `trigger` の payload（`{ reason: dismissReason.trim() }`）は変えない。`dismissReason` は **clear しない**（保持） |

### (3) `return null` 分岐への条件統合（line 92）

既存の merge optimistic early return に dismiss 条件を OR で統合する。**新規の early return を増やさない**。

before:

```tsx
if (optimisticMerged) return null;
```

after:

```tsx
if (optimisticMerged || optimisticDismissed) return null;
```

| 変更点 | 内容 |
|--------|------|
| 変更 | 既存 early return の条件に `|| optimisticDismissed` を追加 |
| 不変 | 配置位置（全 hook 呼び出しの後・`return (` JSX の直前）は変えない |

> `if (...) return null;` は **すべての hook 呼び出し（`useId` / `useState` / `useAdminMutation`）より後**に
> 置く（React hooks ルール）。既存配置（line 92）はこの条件を満たすため、配置を動かさず条件のみ拡張する。

---

## 5.4 入力・出力・副作用の定義

### `optimisticDismissed: boolean`（internal state）

| 項目 | 内容 |
|------|------|
| 初期値 | `false` |
| true になる契機 | `onDismiss` 呼び出し（別人として確定 click） |
| false に戻る契機 | `trigger` reject 時の `.catch`（rollback のみ） |
| 公開範囲 | internal state（props として外部に露出しない / VSCPKR-03） |

### `onDismiss`（別人として確定 click ハンドラ）

| 項目 | 内容 |
|------|------|
| 入力 | なし（component scope の `dismissReason` を参照） |
| 出力 | なし（`void`） |
| 副作用 1 | `setOptimisticDismissed(true)`（同期的に row 非表示化） |
| 副作用 2 | `dismissMutation.trigger({ reason: dismissReason.trim() })` 発火（async） |
| 副作用 3（success） | hook の `onSuccess` が `setStage("idle")` / `setDismissReason("")` を実行。`optimisticDismissed` は true 維持。`router.refresh()`（hook 既存挙動）が server list を後追い整合 |
| 副作用 4（failure） | `.catch` で `setOptimisticDismissed(false)`（row 復元）。`dismissReason` は clear せず保持。`dismissError` は hook が surface 済で inline 表示。stage は `dismiss` のまま |

### merge 経路

**副作用変更なし**。`onMerge` / `mergeMutation` / merge の JSX / `optimisticMerged` は一切触らない（AC-4）。

---

## 5.5 ローカル実行コマンド

```bash
# 型チェック（ルートで全 package）
mise exec -- pnpm typecheck

# lint（web package 限定）
mise exec -- pnpm --filter @ubm-hyogo/web lint

# Phase 4 で書いたテストが GREEN になることを確認
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/components/admin/__tests__/IdentityConflictRow.spec.tsx
```

> Phase 5 の完了条件は「TC-DIS-1/2/3 が GREEN」「既存 merge ケース全件 PASS（AC-4）」「typecheck / lint green」。
> 既存 dismiss ケース（payload 検証 / 409 alert）が optimistic 化で重複・整理対象になる場合は Phase 6 で扱う。

---

## 5.6 不変条件チェック

| 条件 | 確認 |
|------|------|
| AC-1 state 分離 | `optimisticDismissed` が `optimisticMerged` と独立した別 `useState` であること |
| AC-4 merge 不変 | merge 関連（`optimisticMerged` / `onMerge` / merge JSX）の差分が 0 であること |
| typecheck + lint green | 上記コマンドが green |
| 不変条件 #9 | dismiss の form input は既存 `FormField` 系（`Textarea`）を維持。直接 `<input>` を増やさない |
| 不変条件 #10 | `@/lib/useAdminMutation` を import しない（既存どおり `../../features/admin/hooks` 経由を維持） |
| 不変条件 #2（OKLch token） | HEX 直書き / `bg-[#xxx]` を追加しない（本変更は JSX 構造に色を追加しないため自動的に満たす） |
