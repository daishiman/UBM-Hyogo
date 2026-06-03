# Phase 12 / Task 12-1: 実装ガイド（optimistic row 消失 fade animation）

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured` / `visualEvidence: VISUAL_ON_EXECUTION`

> 本ガイドは Phase 1-3 で確定した設計の識別子・挙動・定数を記録する。実装済み。Phase 12 compliance check で `grep` 確認し identifier drift がないことを確認する（W1-02b-3）。設計核心の識別子（`isExiting` / `exitTimerRef` / `finalizeRemoval` / `onMerge` / `optimisticMerged`）は Phase 2 §2.1 と完全一致させる。

---

## Part 1 — 概念説明（中学生レベル・専門用語なし）

### なぜ必要か（身近な例え）

教室の黒板に貼ってある「やることリスト」を想像してください。終わった項目のカードを、終わった瞬間にパッと一瞬で消すと、「あれ、今のカードどこ行った？ 本当に消えたの？」と一瞬びっくりします。

でも、終わったカードが**すっと薄くなって、ゆっくり消えていく**と、「ああ、今のカードが片付いたんだな」と目で追えて安心します。消える様子が見えるだけで、人は「ちゃんと処理された」と分かるのです。

たとえば、エレベーターのドアがいきなり消えるのではなくスーッと閉じるから安心するのと同じで、「変化の途中が少しだけ見える」と人は迷いません。

`/admin/identity-conflicts`（同じ人かもしれない会員のペアを管理者が確認する画面）でも、この気配りをしたいのが今回の話です。

### 何をするか

この画面には「この2人は同じ人です」と判断して**統合（merge）**するボタンがあります。今は、統合ボタンを押すと、その行が**一瞬でパッと消えます**。連続でいくつも処理していると、「今どの行が消えたんだっけ？」と分かりにくくなります。

そこで次のように直します。

1. 統合ボタン（2回の確認のあと）を押した**その瞬間に**、その行を「消えていく途中」の見た目（うすく薄れていく）にする。
2. 0.2 秒くらいかけてすっと薄れたら、行を一覧から本当に外す。
3. 裏側のコンピューターに「統合してね」とお願いを出す。無事に成功したら、消えたまま（そのままで OK）。
4. もし裏側で失敗したら、薄れていくのを**途中で止めて行を元に戻し**、「失敗しました」という赤い文字を表示する。

「アニメーションは苦手・酔ってしまう」という設定（reduced-motion）を選んでいる人には、薄れる動きを見せず、今まで通りほぼ一瞬で消えるようにします。みんなにやさしい消え方にするのが目的です。

「別人マーク（dismiss）」のボタンの動きは今まで通りで、いっさい変えません。

### 今回作るもの（できるようになること）

- 行が消えるときに「すっと薄れて消える」ので、どの行を処理したか目で追えて安心できる。
- 失敗したときだけ薄れるのを止めて元に戻すので、間違って消えっぱなしになることはない。
- アニメーションが苦手な人には、動きなしでほぼ一瞬で消える（やさしい設定を尊重する）。
- 一覧の行はそれぞれ独立しているので、ある行の取り消しが別の行に影響することはない。

---

## Part 2 — 技術詳細（開発者向け）

### 全体方針

- exiting 相の state は **コンポーネントローカル**（`IdentityConflictRow` の `useState` / `useRef`）に持つ。`useAdminMutation` hook・`page.tsx`（Server Component）・API contract・D1 schema は不変。
- 各 row が独立した component instance のため、cross-row の exiting/rollback race は構造的に発生しない。
- 退場アニメは Tailwind の汎用 transition utility のみで実装し、新規 design token / keyframes を増やさない（不変条件 #2、`verify-design-tokens` gate 非抵触）。

### state 定義（追加するもの）

既存 `useState` 群（`stage` / `optimisticMerged` / `mergeReason` / `dismissReason`）に、独立 boolean と timer ref を 1 つずつ追加する。`stage` union（`"idle" | "merge-confirm" | "merge-final" | "dismiss"`）には**混ぜない**（責務分離: `stage` = dialog 表示制御、`optimisticMerged` = removed 相確定、`isExiting` = 退場アニメ中の可視 fade）。

```tsx
// exiting 相: true で row は可視のまま fade out class を適用（DOM 残存）
const [isExiting, setIsExiting] = useState<boolean>(false);

// exit fallback timer の保持。rollback / アンマウントで clear
const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// 既存（維持）: removed 相。true で `return null`（DOM 除去確定）
const [optimisticMerged, setOptimisticMerged] = useState<boolean>(false);
```

### 型定義（相と state の対応）

```ts
// 相は 3 つの state の組み合わせで表現する（独立 boolean による責務分離）
type RowPhase = "visible" | "exiting" | "removed";

// visible : !optimisticMerged && !isExiting  → 通常 row（opacity-100）
// exiting : !optimisticMerged && isExiting   → row + fade out class（opacity-0）
// removed : optimisticMerged === true        → return null
```

### 設定可能パラメータ / 定数一覧

| 定数 | 値 | 役割 | Tailwind との対応 |
| --- | --- | --- | --- |
| `EXIT_ANIMATION_MS` | `200` | 退場アニメの想定時間（ms） | `duration-200` と一致させる |
| `EXIT_FALLBACK_BUFFER_MS` | `50` | `transitionend` 非発火時の安全 fallback の余白 | — |
| fallback timer 総時間 | `EXIT_ANIMATION_MS + EXIT_FALLBACK_BUFFER_MS = 250`（ms） | `transitionend` が来ない環境でも removed 遷移を保証 | — |
| 新規 design token | なし | — | OKLch token 体系を増やさない（#2） |
| 新規 keyframes | なし | — | Tailwind 汎用 transition utility のみ |

```ts
// 退場アニメの想定時間（ms）。Tailwind の duration-200 と一致させる。
const EXIT_ANIMATION_MS = 200;
// transitionend が来なかった場合の安全 fallback の余白
const EXIT_FALLBACK_BUFFER_MS = 50;
```

### APIシグネチャ（既存・不変）

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

// 本タスクで追加 / 変更するハンドラのシグネチャ
const onMerge: () => void;          // 既存差し替え（exiting 相開始 + timer + trigger）
const finalizeRemoval: () => void;  // 新規（clearTimeout + optimisticMerged=true）
```

| surface | シグネチャ | 変更 |
| --- | --- | --- |
| endpoint | `POST /api/admin/identity-conflicts/:conflictId/merge` | 不変 |
| trigger payload | `{ targetMemberId: string; reason: string }` | 不変 |
| `onMerge` | `() => void`（副作用: isExiting=true + timer セット + trigger 発火） | 差し替え |
| `finalizeRemoval` | `() => void`（副作用: clearTimeout + optimisticMerged=true） | 新規 |

### ハンドラ擬似コード（確定設計）

```tsx
const finalizeRemoval = () => {
  if (exitTimerRef.current !== null) {
    clearTimeout(exitTimerRef.current);
    exitTimerRef.current = null;
  }
  setOptimisticMerged(true); // exiting → removed 相へ
};

const onMerge = () => {
  setIsExiting(true); // visible → exiting 相開始（fade out 視覚表現 = optimistic hide）
  // reduced-motion 環境では globals.css が transition-duration≈0 にするため transitionend が
  // ほぼ即時発火する。来ない環境向けに timeout fallback を張る。
  exitTimerRef.current = setTimeout(
    finalizeRemoval,
    EXIT_ANIMATION_MS + EXIT_FALLBACK_BUFFER_MS, // 250ms
  );
  void mergeMutation
    .trigger({ targetMemberId: item.candidateTargetMemberId, reason: mergeReason.trim() })
    .catch(() => {
      // rollback: exit timer を確実に解除し、exiting を解いて row を復元
      if (exitTimerRef.current !== null) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
      setIsExiting(false);
      // optimisticMerged は false のまま。既存 mergeError の inline 表示が surface する
    });
};

// JSX root div: 退場アニメ完了で removed へ
// <div onTransitionEnd={() => { if (isExiting) finalizeRemoval(); }} ... >

// アンマウント時の timer leak 防止
useEffect(() => () => {
  if (exitTimerRef.current !== null) clearTimeout(exitTimerRef.current);
}, []);
```

### 相遷移

| 遷移元相 | 遷移先相 | トリガ | 引き渡し / 副作用 |
| --- | --- | --- | --- |
| visible | exiting | `onMerge()` | `isExiting=true`、`exitTimerRef` セット（250ms）、`mergeMutation.trigger` 発火 |
| exiting | removed | `transitionend` または timeout fallback | `finalizeRemoval()`: `clearTimeout` + `optimisticMerged=true` |
| exiting | visible | `trigger().catch`（error） | `clearTimeout` + `isExiting=false`（`optimisticMerged` は false 維持）、`mergeError` を surface |

```
        onMerge() success path
visible ──────────────────────▶ exiting ──(transitionend / timeout fallback)──▶ removed (return null)
  ▲                                │
  │   error (.catch)               │  error (.catch) — fade 中に失敗が来た場合
  └─────────────────────────────────┘
         clearTimeout + isExiting=false（復元 / rollback）
```

> **設計判断（timer/transitionend 二重化）**: `transitionend` は要素が複数 property（opacity + transform）を transition すると複数回発火しうる。`finalizeRemoval` 内で `clearTimeout` + `optimisticMerged=true` を行い、`optimisticMerged===true` 後は `return null` で再 render されないため、二重発火しても副作用は冪等。timeout fallback は `transitionend` が発火しない環境（要素が DOM detach 等）での removed 遷移を保証する。

### CSS className 設計（design token gate 非抵触）

| 相 | className（Tailwind utility） |
| --- | --- |
| 共通（root div） | 既存 `flex flex-col gap-3 rounded border ... p-4` に `transition-[opacity,transform] duration-200 motion-reduce:transition-none` を追加 |
| visible | 追加 class なし（opacity-100 既定） |
| exiting | `opacity-0 scale-[0.99]`（`isExiting` のとき条件付きで付与） |

- 色は既存 `var(--ubm-color-*)` のまま。**HEX 直書き / inline `style={{}}` を一切追加しない** → `verify-design-tokens` gate green。
- `scale-[0.99]` は collapse 感の補助（任意）。opacity 単独でも AC を満たす（Phase 3 MINOR-1）。height collapse（行高縮小）は flaky リスクのため本タスクでは行わない。

### reduced-motion（3 重保証）

| 機構 | 効果 |
| --- | --- |
| globals.css `@media (prefers-reduced-motion: reduce)`（既存・line 1998-2007） | 全要素の `transition-duration` を `0.001ms !important` 化。fade はほぼ即時完了し `transitionend` が即発火 → removed 即遷移 |
| Tailwind `motion-reduce:transition-none`（component に追加） | row root の transition を明示的に無効化（意図の可読性向上） |
| timeout fallback（`EXIT_ANIMATION_MS + EXIT_FALLBACK_BUFFER_MS` = 250ms） | `transitionend` 非発火環境でも removed 遷移を保証 |

→ reduced-motion 環境では「fade なしでほぼ即時に row が消える」= 旧 `return null` と同等の体感（AC-5 充足）。globals.css は変更しない（既存基盤を流用）。

### jsdom transitionend 制約（テスト）

jsdom は CSS transition を実行せず `transitionend` を自動発火しない。focused Vitest では以下 2 系統で removed 遷移を再現する。

| 系統 | 方法 |
| --- | --- |
| (a) 明示発火 | `fireEvent.transitionEnd(rowEl)` で `onTransitionEnd` を駆動し `finalizeRemoval` を呼ぶ |
| (b) timeout fallback | `vi.useFakeTimers()` + `vi.advanceTimersByTime(EXIT_ANIMATION_MS + EXIT_FALLBACK_BUFFER_MS)` で fallback timer を進める |

> 既存テスト（`IdentityConflictRow.spec.tsx` の line 99 `toBeNull()` / line 155 rollback）は fade 導入で「即 `toBeNull`」が成立しなくなるため、「`isExiting` 適用 → finalizeRemoval（transitionEnd 発火 or timer 進行）で `toBeNull`」へ更新する。

### 使用例（実装イメージ）

```tsx
function IdentityConflictRow({ item }: { item: Row }) {
  const [optimisticMerged, setOptimisticMerged] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finalizeRemoval = () => {
    if (exitTimerRef.current !== null) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    setOptimisticMerged(true);
  };

  const onMerge = () => {
    setIsExiting(true);
    exitTimerRef.current = setTimeout(finalizeRemoval, EXIT_ANIMATION_MS + EXIT_FALLBACK_BUFFER_MS);
    void mergeMutation
      .trigger({ targetMemberId: item.candidateTargetMemberId, reason: mergeReason.trim() })
      .catch(() => {
        if (exitTimerRef.current !== null) {
          clearTimeout(exitTimerRef.current);
          exitTimerRef.current = null;
        }
        setIsExiting(false);
      });
  };

  useEffect(() => () => {
    if (exitTimerRef.current !== null) clearTimeout(exitTimerRef.current);
  }, []);

  if (optimisticMerged) return null; // removed 相

  return (
    <div
      onTransitionEnd={() => { if (isExiting) finalizeRemoval(); }}
      className={[
        "flex flex-col gap-3 rounded border ... p-4",
        "transition-[opacity,transform] duration-200 motion-reduce:transition-none",
        isExiting ? "opacity-0 scale-[0.99]" : "",
      ].join(" ")}
    >
      {/* ...既存 render... */}
    </div>
  );
}
```

### success / error / cancel 挙動表

| イベント | `isExiting` | `optimisticMerged` | 追加挙動 |
| --- | --- | --- | --- |
| merge 実行（`onMerge`） | `false → true` | `false` 維持 | row を exiting 相（fade out）にし、250ms fallback timer をセット、trigger 発火 |
| 退場完了（`transitionend` / timeout） | （`finalizeRemoval` で参照解除） | `false → true` | row を DOM から除去（removed 相） |
| success（onSuccess） | exiting → removed 済み | `true` 維持 | 既存 `setStage("idle")` / `setMergeReason("")` 維持。`router.refresh()` が server list を後追い整合 |
| error（`.catch`） | `true → false` | `false` 維持 | `clearTimeout` で timer 解除し row を復元。既存 `mergeError`（`role="alert"` inline）を surface |
| cancel（cancelMerge） | 変化なし（`false`） | 変化なし（`false`） | なし（cancel は merge 未発火） |
| dismiss（onDismiss） | **不変** | **不変** | なし（dismiss は exiting / fade を適用しない） |

### エラーハンドリング（rollback）

- rollback は `.catch` のみで行い、`clearTimeout(exitTimerRef.current)` + `setIsExiting(false)` で完結する。`optimisticMerged` は false のまま（removed へ進ませない）。
- rollback 後、既存の inline error（`mergeError = errorMessage(mergeMutation.error)` を `role="alert" aria-live="polite"` で表示）が再び見える状態に戻るため、新規のエラー表示 markup は追加しない。
- `errorMessage` helper は `FetchAuthedError.bodyText` を JSON.parse して API body の業務メッセージ（409 等）を surface する既存実装をそのまま流用する。

### エッジケース

| ケース | 仕様 |
| --- | --- |
| exiting 中（fade 中）の再操作 | exiting 相でも row は可視だが、merge ボタンは `merge-final` stage 内にあり click は trigger 済み。二重 trigger は `isExiting` 即 true により実質発生しない |
| `transitionend` の複数回発火（opacity + transform） | `finalizeRemoval` が冪等（clearTimeout + optimisticMerged=true）。removed 後は `return null` で再 render されず副作用なし |
| `transitionend` 非発火（DOM detach 等） | 250ms timeout fallback が `finalizeRemoval` を呼び removed を保証 |
| error が fade 中に到着 | `.catch` が timer を clear し `isExiting=false`。row が復元され removed に進まない |
| reduced-motion 環境 | transition-duration≈0 で `transitionend` 即発火 → ほぼ即時 removed。timeout fallback は冗長保証 |
| アンマウント中の timer 残留 | `useEffect` cleanup が `clearTimeout` し leak を防止 |
| cross-row への影響 | 各 row が独立 instance で自身の `isExiting` / `optimisticMerged` / `exitTimerRef` を持つため波及しない |
| dismiss と merge の同時操作 | dismiss は exiting / fade を適用しないため相互干渉なし |

### テスト構成

| レイヤ | ファイル | 追加 / 更新ケース |
| --- | --- | --- |
| focused Vitest | `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | (1) merge 実行 click で exiting 開始（fade class 付与） / (2) transitionEnd or fallback timer で removed（`toBeNull`） / (3) trigger reject で exiting キャンセル + row 復元（rollback） / (4) reduced-motion で即時 removed / (5) success で row 消えたまま |
| Playwright e2e | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | (1) merge 後 animation 完了の安定状態で row 消失（stable locator state を待つ） / (2) server error mock で row 復元 + inline error / (3) dismiss 不変 回帰 |

実行コマンド: `pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` / `ADMIN_IDENTITY_CONFLICTS_EVIDENCE=1 PLAYWRIGHT_ISSUE1043_SCREENSHOT_DIR=../../docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/outputs/phase-11/screenshots pnpm --filter @ubm-hyogo/web exec playwright test --project=desktop-chromium playwright/tests/admin-identity-conflicts.spec.ts`。

### 不変条件チェック

| 不変条件 | 本タスクでの遵守 |
| --- | --- |
| #1 既存 API のみ | trigger payload・endpoint 不変 |
| #2 OKLch トークン正本 | 既存 `var(--ubm-color-*)` のみ。HEX 直書き / inline style / 新規 token / keyframes なし |
| #9 primitive 経由 | 既存 `Button` / `Textarea` / `Badge` を流用。新規 `<input>` を増やさない |
| #10 useAdminMutation | `../../features/admin/hooks` の `useAdminMutation` を流用。legacy `@/lib/useAdminMutation` 不使用 |

---

## 視覚証跡

本タスクは VISUAL（`VISUAL_ON_EXECUTION`。merge 押下直後に row が fade out して消える視覚変化を伴う）。Phase 11 で以下 3 枚の screenshot を `outputs/phase-11/screenshots/` に取得済み。canonical 名は phase-1 spec（§1.9）/ capture metadata / 本ガイドで一致させる（FB-VISUAL-CAP-001、identifier drift 防止）。

| # | canonical ファイル名 | 撮影状態 | capture 状態 |
| --- | --- | --- | --- |
| 1 | `identity-conflict-row-exiting-fade.png` | merge 実行直後（`isExiting === true`、row が fade out 中・opacity が下がった可視状態） | captured |
| 2 | `identity-conflict-row-removed-stable.png` | 退場アニメ完了後（`optimisticMerged === true`、該当 row が一覧から消えた安定状態） | captured |
| 3 | `identity-conflict-row-rollback-restored.png` | server エラー後の rollback（exiting キャンセル → row 復元 + `role="alert"` inline error 表示） | captured |

> two-tier evidence: local jsdom render（exiting 相の class 付与 / removed の `toBeNull` / rollback 復元）を focused Vitest で記録し、local Playwright fixture で visual screenshot を記録する。
> 親 #988 の `identity-conflict-row-optimistic-removed.png` は「即時削除」時点の証跡であり、本 #1043 では挙動が「fade 後の安定 removed」に変わるため意味が drift する。#988 成果物は越境編集せず、本 #1043 側の capture metadata に注記して新 canonical screenshot を撮る（Phase 3 MINOR-2）。
