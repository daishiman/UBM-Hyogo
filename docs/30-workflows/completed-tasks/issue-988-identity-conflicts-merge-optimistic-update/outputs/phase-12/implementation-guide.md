# Phase 12 / Task 12-1: 実装ガイド（merge optimistic update）

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured` / `visualEvidence: VISUAL_ON_EXECUTION`

> 本ガイドは実装済みの識別子・挙動を記録する。Phase 12 Task 12-6 で `grep` 確認し、identifier drift がないことを確認する（W1-02b-3）。

---

## Part 1 — 概念説明（中学生レベル・専門用語なし）

### なぜ必要か（身近な例え）

ネットショップで気になる商品を見つけて「カゴに入れる」ボタンを押したとき、画面はその瞬間に「カゴに入りました」と表示してくれます。本当は裏側でお店のコンピューターと通信していて、ほんの少し時間がかかっているのですが、私たちを待たせないために「もう入ったことにして」先に見せてくれているのです。

もしレジに進んだときに「ごめんなさい、ちょうど売り切れでした」と分かったら、そのときだけ商品をカゴから戻します。

`/admin/identity-conflicts`（同じ人かもしれない会員のペアを管理者が確認する画面）でも、同じ気配りをしたいのが今回の話です。

### 何をするか

この画面には「この2人は同じ人です」と判断して**統合（merge）**するボタンがあります。今までは、統合ボタンを押してから、裏側のコンピューターが「はい、統合しました」と返事をするまで、その行がずっと画面に残っていました。返事を待つ数百ミリ秒のあいだ、管理者は「押せたのかな？」と不安になります。

そこで次のように直します。

1. 統合ボタン（2回の確認のあと）を押した**その瞬間に**、その行を一覧からスッと消す。
2. 裏側に「統合してね」とお願いを出す。
3. 無事に成功したら、消えたまま（そのままで OK）。
4. もし裏側で失敗したら、消した行を**元に戻して**、「失敗しました」という赤い文字を表示する。

「別人マーク（dismiss）」のボタンの動きは今まで通りで、いっさい変えません。

### 今回作ったもの（できるようになること）

- 管理者が押した瞬間に反応が返るので「押せた」という安心感がある。
- 失敗したときだけ元に戻すので、間違って消えっぱなしになることはない。
- 一覧の行はそれぞれ独立しているので、ある行の取り消しが別の行に影響することはない。

---

## Part 2 — 技術詳細（開発者向け）

### 全体方針

- optimistic state は **コンポーネントローカル**（`IdentityConflictRow` の `useState`）に持つ。`useAdminMutation` hook は不変（後方互換リスク回避）。
- 各 row が独立した component instance のため、cross-row rollback race は構造的に発生しない。
- page.tsx は Server Component のまま。API contract / D1 schema は不変。

### state 定義（追加するもの）

`IdentityConflictRow.tsx` 冒頭の既存 `useState` 群（`stage` / `mergeReason` / `dismissReason`）に、独立した boolean を 1 つ追加する。

```tsx
// row を楽観的に消したかどうかを表す boolean。
type OptimisticMerged = boolean;
const [optimisticMerged, setOptimisticMerged] = useState<OptimisticMerged>(false);
```

- 命名は既存規則（camelCase）を踏襲。
- `stage` union（`"idle" | "merge-confirm" | "merge-final" | "dismiss"`）には**混ぜない**。`stage` は dialog 表示制御、`optimisticMerged` は row 可視性制御という責務分離を保つ。

### APIシグネチャ

本タスクは新規 API を追加しない。利用する既存 surface のシグネチャは以下のとおり（不変）。

```tsx
// useAdminMutation の戻り値（既存・変更なし）
type UseAdminMutationReturn<T> = {
  trigger: (payload: unknown, endpointOverride?: string) => Promise<T>;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
  abort: () => void;
};

// 本タスクで追加するハンドラのシグネチャ
const onMerge: () => void;
```

| surface | シグネチャ | 変更 |
| --- | --- | --- |
| endpoint | `POST /api/admin/identity-conflicts/:conflictId/merge` | 不変 |
| trigger payload | `{ targetMemberId: string; reason: string }` | 不変 |
| onMerge | `() => void`（副作用: state 更新 + trigger 発火） | 新規差し替え |

### merge ハンドラ（確定コード）

既存 `onMerge`（現在は trigger のみで row を残す）を、以下へ差し替える。

```tsx
const onMerge = () => {
  setOptimisticMerged(true);
  void mergeMutation
    .trigger({ targetMemberId: item.candidateTargetMemberId, reason: mergeReason.trim() })
    .catch(() => {
      setOptimisticMerged(false);
    });
};
```

| 行 | 役割 |
| --- | --- |
| `setOptimisticMerged(true)` | trigger より**前**に呼び、押下直後に row を消す（楽観的反映） |
| `.trigger({ ... })` | 既存 payload（`targetMemberId` / `reason`）のまま。API contract 不変 |
| `.catch(() => setOptimisticMerged(false))` | server エラー時のみ rollback（row 復元） |

### render 分岐（row の非表示）

コンポーネント本体の return より前、ガード節として最上部に追加する。

```tsx
if (optimisticMerged) return null;
```

- `optimisticMerged === true` の間、この row は DOM から外れる（collapsed）。
- success 後も `true` を維持するため、消えたままになる。server list との最終整合は後続の `router.refresh()`（既存 success フロー）が担う。

### 使用例

`IdentityConflictRow` 内での optimistic state と merge ハンドラの組み合わせ例（実装イメージ）。

```tsx
function IdentityConflictRow({ item }: { item: Row }) {
  const [optimisticMerged, setOptimisticMerged] = useState<boolean>(false);
  const mergeMutation = useAdminMutation<MergeIdentityResponse>(
    `/api/admin/identity-conflicts/${encodeURIComponent(item.conflictId)}/merge`,
    "POST",
    { successMessage: "✓ 統合しました", onSuccess: () => { setStage("idle"); setMergeReason(""); } },
  );

  const onMerge = () => {
    setOptimisticMerged(true);
    void mergeMutation
      .trigger({ targetMemberId: item.candidateTargetMemberId, reason: mergeReason.trim() })
      .catch(() => setOptimisticMerged(false));
  };

  if (optimisticMerged) return null; // 楽観的に row を非表示
  // ...既存 render...
}
```

### success / error / cancel 挙動表

| イベント | `optimisticMerged` | 既存 mutation 挙動 | 追加挙動 |
| --- | --- | --- | --- |
| merge 実行（onMerge） | `false → true` | trigger 発火 | row を即座に非表示 |
| success（onSuccess） | `true` 維持 | 既存 `setStage("idle")` / `setMergeReason("")` 維持 | `router.refresh()` を後追いで実行し server list を整合 |
| error（.catch） | `true → false` | 既存 `mergeMutation.error` が設定される | row を復元し、既存 `mergeError`（`role="alert"` inline）を surface |
| cancel（cancelMerge） | 変化なし（`false` のまま） | 既存 `setStage("idle")` / `setMergeReason("")` | なし（cancel は merge 未発火） |
| dismiss（onDismiss） | **不変** | 既存 dismiss フローのまま | なし（dismiss は optimistic 化しない） |

### エラーハンドリング（rollback）

- rollback は `.catch` のみで行い、`setOptimisticMerged(false)` 単独で完結する。
- rollback 後、既存の inline error（`mergeError = mergeMutation.error?.message ?? null` を `role="alert"` で表示）が再び見える状態に戻るため、新規のエラー表示 markup は追加しない。
- toast 等の既存 surface も流用する（mutation hook 側の責務）。

### エッジケース

| ケース | 仕様 |
| --- | --- |
| optimistic 中（row 非表示中）の再操作 | row 自体が `return null` で DOM から外れるため、merge/cancel ボタンへの再アクセスは構造的に不可能。多重 trigger は発生しない |
| trigger 中の連打 | `setOptimisticMerged(true)` で即座に `return null` するため、同一 row 内の二重押下は次フレームで不可能 |
| cross-row への影響 | 各 row が自身の `optimisticMerged` を持つため、ある row の rollback が別 row の可視性に波及しない |
| dismiss と merge の同時操作 | dismiss 側は optimistic 化しないため、相互干渉なし |

### 設定項目と定数一覧

本タスクで追加する設定値・定数・新規トークンは**なし**。`optimisticMerged` は component-local boolean のみ。OKLch トークンの新規追加もなし（markup 追加が最小のため）。

| 項目 | 値 | 備考 |
| --- | --- | --- |
| `optimisticMerged` 初期値 | `false` | row 可視（既定） |
| 新規定数 | なし | — |
| 新規トークン | なし | — |

### テスト構成

| レイヤ | ファイル | 追加ケース |
| --- | --- | --- |
| focused vitest | `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | (1) merge 実行 click 直後に row が DOM から消える / (2) trigger reject で row 復元（rollback）/ (3) success で row 消えたまま（既存 happy assertion を「row 消失」へ更新） |
| Playwright e2e | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | (1) merge 後 row が消える / (2) server error mock で row 復元 + inline error / (3) dismiss 不変 回帰 |

実行コマンド: `pnpm --filter web exec vitest run src/components/admin/__tests__/IdentityConflictRow.spec.tsx` / `pnpm --filter web exec playwright test admin-identity-conflicts`。

### 不変条件チェック

| 不変条件 | 本タスクでの遵守 |
| --- | --- |
| #1 既存 API のみ | trigger payload・endpoint 不変 |
| #2 OKLch トークン正本 | 既存 `var(--ubm-color-*)` のみ。HEX 直書きなし |
| #9 primitive 経由 | 既存 `Button` / `Textarea` / `Badge` を流用。新規 `<input>` を増やさない |
| #10 useAdminMutation | `../../features/admin/hooks` の `useAdminMutation` を流用。legacy `@/lib/useAdminMutation` 不使用 |

---

## 視覚証跡

本タスクは VISUAL_ON_EXECUTION（merge 押下直後に row が画面から消える視覚変化を伴う）。Phase 11 で以下 3 枚の screenshot を `outputs/phase-11/screenshots/` に保存済み。canonical 名は phase spec / capture metadata / 本ガイドで一致させる（FB-VISUAL-CAP-001）。

| # | ファイル名 | 撮影状態 |
| --- | --- | --- |
| 1 | `identity-conflict-row-merge-final.png` | merge 確認 2/2（`merge-final` stage、理由入力済み・merge 実行ボタン押下前） |
| 2 | `identity-conflict-row-optimistic-removed.png` | merge 実行直後（`optimisticMerged === true`、該当 row が一覧から消えた状態） |
| 3 | `identity-conflict-row-rollback-error.png` | server エラー後の rollback（row 復元 + `role="alert"` inline error 表示） |

> 本サイクルは local focused Vitest evidence と Playwright screenshot 3 枚を取得済み。
