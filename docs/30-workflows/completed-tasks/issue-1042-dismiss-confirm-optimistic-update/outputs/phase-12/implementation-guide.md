**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

# Phase 12 / Task 12-1: 実装ガイド（dismiss optimistic update）

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured` / `visualEvidence: VISUAL_ON_EXECUTION`

> 本ガイドは実装すべき識別子・挙動を確定コードとして記述する。本 wave で `grep` 確認し、identifier drift がないことを確認する（W1-02b-3）。本タスクは #988 / #1046（merge optimistic）の dismiss 側 mirror である。

---

## Part 1 — 概念説明（中学生レベル・専門用語なし）

### なぜ必要か（身近な例え）

部屋の片づけをしているとき、いらない紙を「ゴミ箱」に入れると、その紙はすぐ机の上から消えますよね。実はゴミ箱の中身が本当に処分されるのはあとなのですが、机の上は「もう片づいた」とすぐ見せてくれます。だから次の作業にすぐ移れて、待たされる感じがありません。

でも、もし「この紙はやっぱり大事な書類だった」と分かったら、その紙だけゴミ箱から机に戻します。そのとき、紙に書いてあったメモ（あなたが書き足したこと）はそのまま消えずに残っていてほしいですよね。

`/admin/identity-conflicts`（同じ人かもしれない会員のペアを管理者が確認する画面）の「別人マーク」ボタンでも、同じ気配りをしたいのが今回の話です。

### 何をするか

この画面には「この2人は別の人です」と判断する**別人マーク（dismiss）**のボタンがあります。今までは、別人マークを押してから、裏側のコンピューターが「はい、確定しました」と返事をするまで、その行がずっと画面に残っていました。返事を待つ数百ミリ秒のあいだ、管理者は「押せたのかな？」と不安になります。

そこで次のように直します。

1. 別人マークの確認画面で「別人として確定」を押した**その瞬間に**、その行を一覧からスッと消す。
2. 裏側に「別人として確定してね」とお願いを出す。
3. 無事に成功したら、消えたまま（そのままで OK）。
4. もし裏側で失敗したら、消した行を**元に戻して**、「失敗しました」という赤い文字を表示する。そのとき、管理者が入力していた「別人と判断した理由」のメモは**消さずに残す**。

「統合（merge）」ボタンの動きは #1046 ですでにこの形に直してあるので、今回は dismiss を同じ形にそろえるだけです。merge の動きはいっさい変えません。

### 今回作ったもの

- 管理者が押した瞬間に反応が返るので「押せた」という安心感がある。
- 失敗したときだけ元に戻すので、間違って消えっぱなしになることはない。
- 失敗して行が戻っても、入力した理由メモが残っているので、もう一度書き直さずにすむ。
- 一覧の行はそれぞれ独立しているので、ある行の取り消しが別の行に影響することはない。merge と dismiss も別々の仕組みなので、お互いを邪魔しない。

---

## Part 2 — 技術詳細（開発者向け）

### 全体方針

- optimistic state は **コンポーネントローカル**（`IdentityConflictRow` の `useState`）に持つ。`useAdminMutation` hook は不変（後方互換リスク回避・merge と同方針）。
- merge 側の `optimisticMerged` とは**別の** `optimisticDismissed` を持ち、rollback 責務を混在させない（state 分離 = AC-1）。可視性条件だけ render guard で合流させる。
- 各 row が独立した component instance のため、cross-row rollback race は構造的に発生しない。
- page.tsx は Server Component のまま。API contract / D1 schema は不変。

### state 定義（追加するもの）

`IdentityConflictRow.tsx` 冒頭の既存 `useState` 群（`stage` / `optimisticMerged` / `mergeReason` / `dismissReason`）に、独立した boolean を 1 つ追加する。

```tsx
const [optimisticMerged, setOptimisticMerged] = useState(false); // 既存（#1046）
const [optimisticDismissed, setOptimisticDismissed] = useState(false); // 本タスクで追加
```

- 命名は既存規則（camelCase / `optimisticMerged` 対称）を踏襲。
- `stage` union（`"idle" | "merge-confirm" | "merge-final" | "dismiss"`）には**混ぜない**。`stage` は dialog 表示制御、`optimisticDismissed` は row 可視性制御という責務分離を保つ。
- `optimisticMerged` と `optimisticDismissed` を統合した単一 boolean にしない（merge / dismiss の rollback を取り違える drift を回避 = AC-1）。

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

// 本タスクで差し替えるハンドラのシグネチャ（不変）
const onDismiss: () => void;
```

| surface | シグネチャ | 変更 |
| --- | --- | --- |
| endpoint | `POST /api/admin/identity-conflicts/:conflictId/dismiss` | 不変 |
| trigger payload | `{ reason: string }` | 不変 |
| onDismiss | `() => void`（副作用: state 更新 + trigger 発火） | 中身を差し替え（シグネチャ不変） |

### dismiss ハンドラ（確定コード）

既存 `onDismiss`（現在は trigger のみで row を残す）を、以下へ差し替える。merge の `onMerge` と対称形。

```tsx
const onDismiss = () => {
  setOptimisticDismissed(true);
  void dismissMutation.trigger({ reason: dismissReason.trim() }).catch(() => {
    setOptimisticDismissed(false);
    // error は dismissMutation.error / toast 経由で surface。modal は閉じず、dismissReason を保持する。
  });
};
```

| 行 | 役割 |
| --- | --- |
| `setOptimisticDismissed(true)` | trigger より**前**に呼び、押下直後に row を消す（楽観的反映 = AC-2） |
| `.trigger({ reason: dismissReason.trim() })` | 既存 payload（`reason`）のまま。API contract 不変 |
| `.catch(() => setOptimisticDismissed(false))` | server エラー時のみ rollback（row 復元 = AC-3）。`setDismissReason("")` は**呼ばない**ため理由入力が保持される |

> `dismissReason` を catch 内で clear しないことが AC-3（理由保持）の要点。既存 `onSuccess`（`setStage("idle")` / `setDismissReason("")`）は不変なので、success 時のみ理由がクリアされる。

### render 分岐（row の非表示）

コンポーネント本体の return より前の既存ガード節 `if (optimisticMerged) return null;` を、以下へ統合する。

```tsx
if (optimisticMerged || optimisticDismissed) return null;
```

- `optimisticMerged === true` または `optimisticDismissed === true` の間、この row は DOM から外れる（collapsed）。
- state は分離したまま（AC-1）、可視性条件だけ合流させる。
- success 後も `optimisticDismissed` は `true` を維持するため、消えたままになる。server list との最終整合は既存 success フローの `router.refresh()`（applySuccess）が担う。

### 使用例

`IdentityConflictRow` 内での dismiss optimistic state とハンドラの組み合わせ例（実装イメージ）。

```tsx
function IdentityConflictRow({ item }: { item: Row }) {
  const [optimisticMerged, setOptimisticMerged] = useState(false);
  const [optimisticDismissed, setOptimisticDismissed] = useState(false);
  const [dismissReason, setDismissReason] = useState("");

  const dismissMutation = useAdminMutation<DismissIdentityConflictResponse>(
    `/api/admin/identity-conflicts/${encodeURIComponent(item.conflictId)}/dismiss`,
    "POST",
    {
      successMessage: "✓ 別人として確定しました",
      onSuccess: () => { setStage("idle"); setDismissReason(""); },
    },
  );

  const onDismiss = () => {
    setOptimisticDismissed(true);
    void dismissMutation
      .trigger({ reason: dismissReason.trim() })
      .catch(() => setOptimisticDismissed(false)); // rollback。dismissReason は保持
  };

  if (optimisticMerged || optimisticDismissed) return null; // 楽観的に row を非表示
  // ...既存 render（stage === "dismiss" の confirm dialog 等）...
}
```

### success / error / cancel 挙動表

| イベント | `optimisticDismissed` | 既存 mutation 挙動 | 追加挙動 |
| --- | --- | --- | --- |
| dismiss 実行（onDismiss） | `false → true` | trigger 発火 | row を即座に非表示 |
| success（onSuccess） | `true` 維持 | 既存 `setStage("idle")` / `setDismissReason("")` 維持 | `router.refresh()` を後追いで実行し server list を整合 |
| error（.catch） | `true → false` | 既存 `dismissMutation.error` が設定される | row を復元し、既存 `dismissError`（`role="alert"` inline）を surface。`dismissReason` は clear しないため保持 |
| cancel（cancelDismiss） | 変化なし（`false` のまま） | 既存 `setStage("idle")` / `setDismissReason("")` | なし（cancel は dismiss 未発火） |
| merge（onMerge / mergeMutation） | **不変** | 既存 merge optimistic フローのまま | なし（merge は `optimisticMerged` で独立管理） |

### エラーハンドリング（rollback）

- rollback は `.catch` のみで行い、`setOptimisticDismissed(false)` 単独で完結する。`dismissReason` には触れない（AC-3 理由保持）。
- rollback 後、既存の inline error（`dismissError = errorMessage(dismissMutation.error)` を `role="alert"` で表示）が再び見える状態に戻るため、新規のエラー表示 markup は追加しない。
- 既存 `errorMessage` helper（`FetchAuthedError.bodyText` を JSON.parse して `message` / `error` を抽出）が 409 等の業務メッセージを surface する。本タスクで helper は不変。

### エッジケース

| ケース | 仕様 |
| --- | --- |
| optimistic 中（row 非表示中）の再操作 | row 自体が `return null` で DOM から外れるため、dismiss/cancel ボタンへの再アクセスは構造的に不可能。多重 trigger は発生しない |
| trigger 中の連打 | `setOptimisticDismissed(true)` で即座に `return null` するため、同一 row 内の二重押下は次フレームで不可能 |
| cross-row への影響 | 各 row が自身の `optimisticDismissed` を持つため、ある row の rollback が別 row の可視性に波及しない |
| dismiss と merge の同時操作 | merge は `optimisticMerged`、dismiss は `optimisticDismissed` で独立管理。render guard で OR 合流するが state は分離（AC-1 / AC-4）。相互干渉なし |
| rollback 時の理由保持 | `.catch` で `setDismissReason("")` を呼ばないため、入力済み `dismissReason` が残る。再操作で書き直し不要（AC-3） |

### 設定項目と定数一覧

本タスクで追加する設定値・定数・新規トークンは**なし**。`optimisticDismissed` は component-local boolean のみ。OKLch トークンの新規追加もなし（markup 追加が最小のため）。

| 項目 | 値 | 備考 |
| --- | --- | --- |
| `optimisticDismissed` 初期値 | `false` | row 可視（既定） |
| 新規定数 | なし | — |
| 新規トークン | なし | — |

### テスト構成

| レイヤ | ファイル | 追加ケース |
| --- | --- | --- |
| focused vitest | `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | (1) dismiss 実行 click 直後に row が DOM から消える（AC-2）/ (2) trigger reject で row 復元 + `dismissReason` 保持（AC-3）/ (3) success で row 消えたまま / (4) `optimisticDismissed` と `optimisticMerged` が独立（merge を実行しても dismiss 側 state が変わらない・AC-1/AC-4）。merge 既存ケースは不変回帰 |
| Playwright e2e | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | (1) dismiss 後 row が消える（AC-2/AC-5）/ (2) server error mock で row 復元 + inline error + 理由保持（AC-3/AC-5）。既存「成功系: dismiss」は row 消失確認を加えて強化、または別ケース化 |

実行コマンド: `pnpm --filter web exec vitest run src/components/admin/__tests__/IdentityConflictRow.spec.tsx` / `pnpm --filter web exec playwright test admin-identity-conflicts`。

### 不変条件チェック

| 不変条件 | 本タスクでの遵守 |
| --- | --- |
| #1 既存 API のみ | trigger payload（`{ reason }`）・endpoint（`/dismiss`）不変 |
| #2 OKLch トークン正本 | 既存 `var(--ubm-color-*)` のみ。HEX 直書きなし |
| #5 D1 直接アクセス禁止 | `apps/web` から D1 binding に触れない（mutation は既存 API 経由） |
| #9 primitive 経由 | 既存 `Button` / `Textarea` / `Badge` を流用。新規 `<input>` を増やさない |
| #10 useAdminMutation | `../../features/admin/hooks` の `useAdminMutation` を流用。legacy `@/lib/useAdminMutation` 不使用 |

### DoD（Definition of Done）

- `pnpm typecheck` pass / `pnpm lint` pass。
- focused vitest（`IdentityConflictRow.spec.tsx`）の dismiss optimistic / rollback / success-stays-hidden / state 独立ケースが pass。
- Playwright の dismiss optimistic / rollback ケースが pass。
- merge 既存テスト（component + Playwright）が回帰なし。
- AC-1（state 分離）/ AC-2（実行直後 row 消失）/ AC-3（reject 時 row 復元 + reason 保持）/ AC-4（merge 回帰なし）/ AC-5（Playwright dismiss optimistic/rollback）すべて達成。

---

## 視覚証跡

本タスクは VISUAL_ON_EXECUTION（dismiss 押下直後に row が画面から消える視覚変化を伴う）。Phase 11 で以下 2 枚の screenshot を `outputs/phase-11/screenshots/` に**本 wave で取得済み**。canonical 名は phase spec / capture metadata / 本ガイドで一致している（FB-VISUAL-CAP-001）。

| # | ファイル名 | 撮影状態 |
| --- | --- | --- |
| 1 | `identity-conflict-row-dismiss-optimistic-removed.png` | dismiss 実行直後（`optimisticDismissed === true`、該当 row が一覧から消えた状態） |
| 2 | `identity-conflict-row-dismiss-rollback-error.png` | server エラー後の rollback（row 復元 + `role="alert"` inline error 表示 + `dismissReason` 保持） |

> 本ワークフローは implemented_local_evidence_captured 段階のため、local focused Vitest evidence（14 tests）と Playwright screenshot 2 枚は取得済み。
