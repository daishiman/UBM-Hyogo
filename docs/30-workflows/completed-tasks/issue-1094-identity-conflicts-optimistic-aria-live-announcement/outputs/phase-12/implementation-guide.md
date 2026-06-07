# Phase 12 / Task 12-1: 実装ガイド（optimistic 消失時の aria-live アナウンス最適化）

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured` / `visualEvidence: NON_VISUAL`

> 本ガイドは Phase 1-3 で確定した設計の識別子・型・定数を記録する。automation-30 改善で実コードへ反映済み。識別子は SSOT（`index.md` §主要シグネチャ）と実コード（`IdentityConflictAnnouncer.tsx` / `identityConflictAnnouncements.ts` / `IdentityConflictRow.tsx`）で一致している。

---

## Part 1 — 概念説明（中学生レベル・専門用語なし）

### なぜ必要か（身近な例え）

体育の集合で、先生が「3班、移動しました」「5班、移動しました」と**1回ずつ、順番に、はっきり**言ってくれると、目をつぶっていても誰がどう動いたか分かります。これがもし、近くの人の肩を**ぐいっと引っぱって**「ほら、こっち向いて」と無理やり注目させてから伝えてきたら、自分が今やっていた作業の手が止まってしまって嫌ですよね。

たとえば、駅のアナウンスは、あなたが切符を買っている最中でも、あなたの体を動かしたりはせず、スピーカーから「電車が来ます」と1回だけ流れます。あなたは作業を続けながら、耳でその知らせを受け取れます。「相手の作業を邪魔せず、放送だけで伝える」のがやさしいやり方です。

`/admin/identity-conflicts`（同じ人かもしれない会員のペアを管理者が確認する画面）には、**画面を見ないで操作する人**（読み上げソフトを使う人）がいます。その人にも「今の操作はちゃんと終わったよ」を、作業の手を止めさせずに、1回だけ、順番に伝えたい——これが今回やりたいことです。

### 今はどうなっているか（困りごと）

この画面には「この2人は同じ人だから1つにまとめる（merge）」ボタンと「これは別人だと確定する（別人マーク・dismiss）」ボタンがあります。

今のやり方には次の困りごとがあります。

1. 操作が終わると、その行を「お知らせ用の見えない札」に置き換えて、**読み上げソフトのカーソルを無理やりその札に飛ばして**読ませています。これは肩を引っぱるのと同じで、利用者がやっていた手の場所を奪ってしまいます。
2. いくつもの行を**続けて**処理すると、お知らせ同士がぶつかって、「あれ、今のは読まれた？ 消えた？」と取りこぼしが起きやすいです。
3. 「まとめました」「別人にしました」という読み上げ文が、行のあちこちに**ばらばらに**書かれていて、直すときに食い違いが起きやすいです。

### 何をするか

そこで次のように直します。

1. お知らせを言う場所を、行の中ではなく**画面に1つだけ**用意します（見えない「放送スピーカー」です）。これを `IdentityConflictAnnouncer`（アナウンス係）と呼びます。
2. 操作が終わったら、行は自分で読み上げず、放送スピーカーに「これを読んで」と**1回だけ**お願いします。カーソルは奪いません（肩を引っぱるのをやめます）。
3. 続けて何件処理しても、お知らせは**1件ずつ別々の紙きれ**としてスピーカーに足していくので、順番に全部読まれます。取りこぼしません。読み終わるころに紙きれは自動で片付きます（散らからないように）。
4. 読み上げ文（「merge を実行しました…」「別人として確定しました…」）は**1か所の表**（`IDENTITY_CONFLICT_ANNOUNCEMENTS`）にまとめ、そこから取り出します。直すときも1か所だけ直せばよくなります。
5. もし裏側の処理が**失敗**したら、行は元に戻り、これまで通り赤い文字（`role="alert"`）で「失敗しました」と知らせます。ここは一切変えません。

### 今回作るもの（できるようになること）

- 画面を見ない利用者に、操作結果が**1回だけ・順番に・カーソルを奪わずに**伝わる。
- 行を続けて何件処理しても、お知らせが競合せず、欠落しない。
- 読み上げ文が1か所から作られるので、文言の食い違いがなくなる。
- 失敗時の赤い文字（エラー通知）は今まで通りで、こわれない。
- **画面の見た目は何も変わりません**（変えるのは「見えないお知らせ」の仕組みだけ）。だから今回はスクリーンショットを撮りません。

---

## Part 2 — 技術詳細（開発者向け）

### 全体方針（current contract）

- **責務分離**: 「発火源 = row / 読み上げ先 = 親の単一 region」。`page.tsx`（Server Component）が `<ul>` を新規 client wrapper `IdentityConflictAnnouncer` でラップし、`page.tsx` 自体は client 化しない（data fetch は Server に残す）。
- live region は **sr-only**（視覚変化なし）。新規 design token / HEX / inline `style` を一切増やさない（不変条件 #2、`verify-design-tokens` gate 非抵触）。
- 既存 API contract / D1 schema / `useAdminMutation` hook は不変（不変条件 #1 / #5 / #10）。`@/lib/useAdminMutation`（legacy）は参照しない。
- 各 row は独立 component instance のため、cross-row の announce race は構造的に発生しない。連続処理の競合回避は単一 region への **append-children** で担保する。

### 状態所有権テーブル（state ownership）

| 状態 / 値 | 所有者 | 役割 |
| --- | --- | --- |
| `messages: { id: number; text: string }[]` | `IdentityConflictAnnouncer`（client） | live region 内 child の集合。append-children の本体 |
| TTL timers（`Map`/`Set`） | `IdentityConflictAnnouncer` | 各 message の自動除去 timer。TTL 到達・unmount で全 clear |
| `announce: AnnounceFn` | `IdentityConflictAnnouncer`（context 経由提供） | row から呼ばれる副作用関数。provider 外では no-op fallback |
| `hasAnnouncedRef: useRef<boolean>` | `IdentityConflictRow` | mutation resolve 後の成功 announce を同一 row で1回だけに固定。rollback で reset |
| `IDENTITY_CONFLICT_ANNOUNCEMENTS` / `announcementFor` | `identityConflictAnnouncements.ts`（pure module） | 文言の単一導出。副作用なし |

### 新規ファイル 1: `identityConflictAnnouncements.ts`（pure module・文言の単一導出）

```ts
// apps/web/src/components/admin/identityConflictAnnouncements.ts
// 文言の単一導出（AC-4）。副作用なし・依存なしの pure module。

export type IdentityConflictAction = "merge" | "dismiss";

export const IDENTITY_CONFLICT_ANNOUNCEMENTS: Record<IdentityConflictAction, string> = {
  merge: "merge を実行しました。候補を一覧から非表示にしました。",
  dismiss: "別人として確定しました。候補を一覧から非表示にしました。",
};

export function announcementFor(action: IdentityConflictAction): string {
  return IDENTITY_CONFLICT_ANNOUNCEMENTS[action];
}
```

- `Record<IdentityConflictAction, string>` によりキー網羅性を**コンパイル時に保証**する（action 追加時は map も型エラーで強制される）。現行の row 内インライン三項（`IdentityConflictRow.tsx:74-79`）を本関数に置換する。
- 文言は現行コード（`IdentityConflictRow.tsx:76,78`）と**逐語一致**させ、意味 drift を起こさない。

### 新規ファイル 2: `IdentityConflictAnnouncer.tsx`（client・単一 live region + context）

```tsx
// apps/web/src/components/admin/IdentityConflictAnnouncer.tsx
"use client";

// === 設定定数 ===
// announce された child を DOM から自動除去するまでの猶予（ms）。
// SR は live region 変化を即座にキューへ取り込むため、除去後も読み上げは継続する。
// 長すぎると DOM 肥大、短すぎると読み上げ途中で除去されうるトレードオフ値（Phase 3 MINOR-1）。
export const ANNOUNCE_TTL_MS = 1000;

type AnnounceFn = (message: string) => void;

// provider 外では no-op fallback（null で初期化し、reader 側で fallback を返す）。
// → announcer で wrap しない render（既存テスト等）でも throw せず非破壊（AC-5 / 既存テスト回帰）。
const IdentityConflictAnnounceContext = createContext<AnnounceFn | null>(null);

export function useIdentityConflictAnnounce(): AnnounceFn {
  const ctx = useContext(IdentityConflictAnnounceContext);
  // provider 外: no-op（カーソルも DOM も触らない）
  return ctx ?? (() => {});
}

export function IdentityConflictAnnouncer({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [messages, setMessages] = useState<{ id: number; text: string }[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const announce = useCallback<AnnounceFn>((text) => {
    const id = ++idRef.current;
    // append-children: 既存 message を上書きせず、新 child を末尾に追加する（AC-3）。
    setMessages((prev) => [...prev, { id, text }]);
    // ANNOUNCE_TTL_MS 後に当該 id を除去し DOM 肥大を防ぐ。
    const timer = setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      timersRef.current.delete(id);
    }, ANNOUNCE_TTL_MS);
    timersRef.current.set(id, timer);
  }, []);

  // unmount 時に全 timer を clear（leak 防止）。
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
    };
  }, []);

  return (
    <IdentityConflictAnnounceContext.Provider value={announce}>
      {children}
      {/* 単一・永続の live region。sr-only のため視覚変化なし（NON_VISUAL）。 */}
      <div role="status" aria-live="polite" className="sr-only">
        {messages.map((m) => (
          <p key={m.id}>{m.text}</p>
        ))}
      </div>
    </IdentityConflictAnnounceContext.Provider>
  );
}
```

> import は `import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";`。`role="status"` + `aria-live="polite"` の sr-only node を**1つだけ**永続描画し、children の後に配置する。

### 公開シグネチャ（型定義つき）

```ts
// 文言モジュール（pure）
export type IdentityConflictAction = "merge" | "dismiss";
export const IDENTITY_CONFLICT_ANNOUNCEMENTS: Record<IdentityConflictAction, string>;
export function announcementFor(action: IdentityConflictAction): string;

// announcer モジュール（client）
export const ANNOUNCE_TTL_MS = 1000;
type AnnounceFn = (message: string) => void;
export function useIdentityConflictAnnounce(): AnnounceFn; // provider 外は no-op
export function IdentityConflictAnnouncer(props: { children: React.ReactNode }): JSX.Element;
```

| surface | シグネチャ | 種別 |
| --- | --- | --- |
| `IdentityConflictAction` | `"merge" \| "dismiss"` | **新規 export 型** |
| `IDENTITY_CONFLICT_ANNOUNCEMENTS` | `Record<IdentityConflictAction, string>` | **新規 export const** |
| `announcementFor` | `(action: IdentityConflictAction) => string` | **新規 export 関数** |
| `IdentityConflictAnnouncer` | `(props: { children: ReactNode }) => JSX.Element` | **新規 export component** |
| `useIdentityConflictAnnounce` | `() => AnnounceFn` | **新規 export hook**（context reader） |
| `ANNOUNCE_TTL_MS` | `1000`（const） | **新規 export 定数** |
| `announce`（内部） | `(message: string) => void` | context value（公開は hook 経由） |

### 編集ファイル: `IdentityConflictRow.tsx` 差分の要点

```ts
// === 撤去するもの ===
// - optimisticStatusRef（line 35）: row-local status node への ref
// - optimisticStatus インライン三項（line 74-79）: 文言の個別定義
// - focus useEffect（line 81-84）: optimisticStatusRef.current?.focus() による focus 奪取
// - row-local status node 置換ブロック（line 136-148）: <p role="status" ...>{optimisticStatus}</p>

// === 追加するもの ===
const announce = useIdentityConflictAnnounce();
const hasAnnouncedRef = useRef(false);
const announceOnce = useCallback((action: IdentityConflictAction) => {
  if (hasAnnouncedRef.current) return;
  hasAnnouncedRef.current = true;       // 同一 row で1回だけ（AC-3 の取りこぼし防止）
  announce(announcementFor(action));    // 単一 region へ放送（focus を奪わない・AC-2）
}, [announce]);

// onMerge / onDismiss の mutation resolve 後にだけ成功文言を announce する。
// trigger(...).then(() => announceOnce("merge" | "dismiss")).catch(rollback)

// 除去確定: status <p> ブロックの代わりに row 自体を消す
if (optimisticMerged || optimisticDismissed) return null;
```

```ts
// === rollback catch での reset（成功文言を出さず、再アナウンス可能化）===
// onMerge() の .catch（現行 111-116）/ onDismiss() の .catch（現行 121-124）に追記:
.catch(() => {
  // ...既存の rollback（setIsExiting(false) / setOptimisticMerged(false) など）...
  hasAnnouncedRef.current = false; // rollback 後に再度成功した場合に再アナウンスできるようにする
});
```

> `optimisticMerged` / `optimisticDismissed` / `isExiting` / `onMerge` / `onDismiss` は現行コードの既存識別子。本タスクは row-local status node と focus 奪取を**撤去**し、mutation 成功後の announce 呼び出しへ置換するのが主作業（surface の削減主体）。失敗時は成功文言を出さず既存 `role="alert"` へ委譲する。

### 編集ファイル: `page.tsx`（Server Component が client wrapper に children を渡す）

```tsx
// apps/web/app/(admin)/admin/identity-conflicts/page.tsx（Server Component・client 化しない）
// 現行 <ul aria-label="..."> ... </ul> を IdentityConflictAnnouncer でラップする。
import { IdentityConflictAnnouncer } from "@/components/admin/IdentityConflictAnnouncer";

// ...data fetch（Server 側に残す）...
return (
  <IdentityConflictAnnouncer>
    <ul aria-label="...">
      {items.map((item) => (
        <li key={item.conflictId}>
          <IdentityConflictRow item={item} />
        </li>
      ))}
    </ul>
  </IdentityConflictAnnouncer>
);
```

> Next.js App Router の確立パターン: Server Component から client component（`"use client"`）へ children を props として渡せる。client 化は wrapper に閉じ、data fetch は Server 側に残る。

### 設定可能パラメータ / 定数一覧

| 定数 / 設定 | 値 | 役割 | 備考 |
| --- | --- | --- | --- |
| `ANNOUNCE_TTL_MS` | `1000` | announce child を自動除去するまでの猶予（ms） | Phase 3 MINOR-1 のトレードオフ値。Phase 8 で実測調整余地。本タスク内で完結 |
| `aria-live` | `"polite"` | 割り込まず順番に読み上げ（focus 不動） | WAI-ARIA 標準用法。`assertive` は使わない |
| `aria-atomic` | 未指定（既定 = `false`） | 追加された差分 child のみ読み上げ | Phase 3 MINOR-2。append-children では既定が望ましい。明示付与は任意 |
| 新規 design token | なし | — | sr-only のため色 token 不要（#2） |
| 新規 keyframes | なし | — | 視覚変化なし |

### announce / context / TTL の副作用

| 機構 | 副作用 |
| --- | --- |
| `announce(message)` | `messages` に新 child を append（上書きしない）。`ANNOUNCE_TTL_MS` 後に当該 id を除去する timer を登録 |
| append-children | 各 message が個別 DOM mutation となり SR が順番に読み上げる。同一 tick 上書き / 文言 collapse を回避（AC-3） |
| TTL 自動除去 | `ANNOUNCE_TTL_MS` 経過で child を `messages` から filter 除去し DOM 肥大を防ぐ。timer は `timersRef`（Map）で集約 |
| unmount cleanup | `useEffect` の cleanup で全 timer を `clearTimeout` し、`timersRef` を clear（leak 防止） |
| context fallback no-op | provider 外で `useIdentityConflictAnnounce()` を呼ぶと `() => {}` を返す。announcer で wrap しない render（既存テスト）でも throw せず DOM / focus を触らない |
| `hasAnnouncedRef` | mutation resolve 後の成功 announce を同一 row で1回に固定。rollback の `.catch` で `false` に reset し、再成功時に再アナウンス可能化 |

### エラーハンドリング（rollback 非回帰・AC-5）

- merge / dismiss 失敗時の rollback は現行 `.catch`（`onMerge` 111-116 / `onDismiss` 121-124）に `hasAnnouncedRef.current = false;` を追記する。成功文言は `.then(() => announceOnce(action))` に閉じるため、reject 時には live region へ入らない。
- rollback 後は `optimisticMerged` / `optimisticDismissed` が `false` に戻り `return null` 条件を外れて row が復元され、既存の inline error（`role="alert" aria-live="polite"`・merge 248-257 / dismiss 296-305）が surface する。**この markup は一切変更しない**。
- `errorMessage` helper（`FetchAuthedError.bodyText` を JSON.parse して業務メッセージを surface）も現行のまま流用する。

### エッジケース

| ケース | 仕様 |
| --- | --- |
| announcer 外で row を render（既存テスト等） | `useIdentityConflictAnnounce()` が no-op fallback を返す。announce は実質無発火だが throw せず非破壊 |
| 同一 row で成功処理が複数回走る | `hasAnnouncedRef` で1回に固定。mutation resolve 後に再評価されても二重 announce しない |
| 複数 row を連続 merge / dismiss | 各 row が独立に `announce` を呼ぶ。announcer 側 append-children で順番に child 追加され、SR が順次読み上げる（AC-3） |
| rollback 後に再成功 | `.catch` で `hasAnnouncedRef` を reset 済みのため、再度 mutation が成功すると announce が再発火する |
| TTL 経過前に多数 announce | child が一時的に複数並ぶが、各 child の timer が個別に除去する。`timersRef` で全 timer 管理 |
| unmount 中の timer 残留 | `useEffect` cleanup が全 timer を clearTimeout |
| reduced-motion | 本タスクは視覚アニメを持たない（sr-only）。reduced-motion とは無関係 |

### テスト構成（NON_VISUAL・focused Vitest 主証跡）

| レイヤ | ファイル | 追加 / 更新ケース |
| --- | --- | --- |
| focused Vitest（新規） | `apps/web/src/components/admin/__tests__/IdentityConflictAnnouncer.spec.tsx` | (1) live region 単一性（`role="status"` が1つ） / (2) append-children で連続 announce が競合せず順番に child 追加 / (3) `ANNOUNCE_TTL_MS` 経過で child 除去（`vi.useFakeTimers` + `advanceTimersByTime`） / (4) `announcementFor` 単一導出（merge / dismiss の文言一致） / (5) provider 外 `useIdentityConflictAnnounce` が no-op |
| focused Vitest（更新） | `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | focus-steal assertion（現行 342-344 付近）を **非 focus-steal + 単一 region 経由** assertion へ更新（`document.activeElement` が status node にならない／row-local status node 非存在）。連続処理 / rollback 非アナウンス（rollback で再 announce されない→再成功で再 announce）ケース追加。`renderWithAnnouncer` helper 導入 |
| Playwright（任意・軽微） | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 単一 `aria-live` region の DOM 存在 + row-local status node 非存在の構造非回帰のみ。**screenshot は撮らない**（NON_VISUAL）。SR 実読み上げは CI で検証不可（Phase 3 MINOR-3） |

実行コマンド（実装着手時）:
`pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/admin/__tests__/IdentityConflictAnnouncer.spec.tsx apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`

### 不変条件チェック

| 不変条件 | 本タスクでの遵守 |
| --- | --- |
| #1 既存 API のみ | trigger payload / endpoint 不変。新規 endpoint・D1 schema 変更なし |
| #2 OKLch トークン正本 | live region は `sr-only` のみ。HEX 直書き / inline style / 新規 token / keyframes なし → `verify-design-tokens` gate green |
| #5 D1 直接アクセス禁止 | component-local state + context のみ。D1 binding 参照なし |
| #9 primitive 経由 | 視覚 primitive を増やさない。announcer は admin 範囲内の live region 機構（新規 primitive ではない） |
| #10 useAdminMutation | 既存 `../../features/admin/hooks` の `useAdminMutation` 流用。legacy `@/lib/useAdminMutation` 不使用（grep 0 件） |

---

## 視覚証跡

本タスクは **NON_VISUAL**。変更は sr-only live region（`role="status"` + `aria-live="polite"`）とアナウンス挙動のみで、**画面ピクセルの変化なし**。

→ **UI/UX 変更なし（sr-only live region）のため Phase 11 スクリーンショット不要。**

代替証跡（NON_VISUAL ルール）として以下を主証跡とする（2026-06-05 に local 取得済み。手動 SR のみ user-gated）:

| 区分 | 参照先 | 内容 |
| --- | --- | --- |
| 最終レビュー結果 | `outputs/phase-10/final-review-result.md`（無ければ `outputs/phase-10/phase-10.md`） | acceptance criteria（AC-1〜AC-8）の充足判定・blocker 判定 |
| 手動テスト結果 | `outputs/phase-11/manual-test-result.md` | focused Vitest 件数・結果（live region 単一性 / 非 focus-steal / 連続非競合 / TTL / rollback 非アナウンス）と、VoiceOver / NVDA での実読み上げ確認手順ノート（two-tier evidence・Phase 3 MINOR-3）。screenshot を作らない理由を明記する |

> Phase 3 MINOR-3 のとおり、SR の実読み上げは CI（ヘッドレス・SR 非搭載）で検証不可。Phase 11 は (a) focused Vitest（source-level PASS）+ (b) 手動 SR 検証ノートの two-tier 記録で代替する。source-level PASS と環境制約（SR 非搭載）は `manual-test-result.md` 内で別カテゴリに分離して記録する（WEEKGRD-01）。
