# Phase 2: 設計

`[実装区分: 実装仕様書]` / `implementation_mode: new`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1094-identity-conflicts-optimistic-aria-live-announcement` |
| phase | 2（設計） |
| 入力 | `phase-1/phase-1.md`（要件定義 / AC-1〜AC-8） |
| 出力 | アーキテクチャ topology・state 所有権・主要シグネチャ・競合回避設計・timer 安全性・回帰方針 |

## 目的

Phase 1 の AC を満たす実装の設計を確定する。具体的には optimistic 消失アナウンスを「row-local `role="status"` ノード + focus 奪取」から、「**ページレベル単一 live region**（`IdentityConflictAnnouncer`）+ **announce context**（row が文字列を流し込むだけ）」へ責務分離する topology と、append-children による連続処理競合回避、TTL timer の安全管理、focus stealing 撤去の a11y 妥当性、既存テスト回帰の方針を設計する。

## 2.0 要件レビュー（一次結論 / skill 要件レビュー思考法）

| 観点 | 結論 |
| --- | --- |
| **真の論点** | optimistic 消失の読み上げを「focus 奪取に頼る row-local status node」から「focus を動かさず確実に読み上げる単一 region」へ移す。連続処理時の競合・欠落を構造的に防ぎ、文言を単一導出に統一すること |
| **依存・責務境界** | `IdentityConflictAnnouncer`（messages state 所有 + region 描画）/ `IdentityConflictRow`（optimistic hide と mutation success 後の `announceOnce(action)` を担う）/ `page.tsx`（wrapper 配置のみ）。announce 文言の生成は `announcementFor()` pure module に一元化 |
| **価値とコスト** | 価値 = focus を奪わず複数 row 連続処理でも読み上げが欠落しない運用者 a11y。最大コスト = 同一 tick の複数 announce が単一テキストノードを上書きして読み上げが collapse する事故 → append-children で構造的に断つ。次点 = TTL timer の leak（unmount 時の clear 漏れ） |
| **改善優先順位** | (1) 連続 announce 競合の構造的回避（append-children）> (2) timer leak 安全設計 > (3) focus stealing 撤去による操作起点維持 |
| **4条件評価** | 価値性○（運用者 a11y）/ 実現性○（新規 2 component + context、1 サイクル）/ 整合性○（API/hook/page contract 不変・row state 責務分離）/ 運用性○（react-aria LiveAnnouncer 類似の確立パターン） |

### 因果ループ（最低 1 本ずつ）

- **バランスループ（競合の遮断）**: row-local region 増加 → 同時発火 → 単一 tick での DOM 上書き → 読み上げ collapse・欠落（強化リスク）。これを **「単一 region への集約 + append-children」** が打ち消す。region が 1 つに集約され、各 announce は独立 child node として追加されるため、同時発火しても上書きが起きず順番に読み上げられる → 欠落しない。
- **強化ループ（運用者の確信度向上）**: 確実な読み上げ → 運用者が処理済み候補を聴覚で確認 → 連続処理の確信度向上 → 誤操作減少 → さらにテンポよく連続処理可能。

### 意思決定権の所在

- **announce の発火**は各 row instance（component-local）が持つが、**読み上げ resource（live region DOM）の所有**は `IdentityConflictAnnouncer` に集約する。row は「いつ何を読み上げるか」だけを決め、「どこへどう描画するか」は announcer が一元管理する。page.tsx（Server Component）は wrapper を置くだけで state を持たない。

## 2.1 アーキテクチャ設計（topology）

「発火源 = row / 読み上げ先 = 親の単一 region」へ責務分離する。Server Component（page.tsx）が client wrapper（`IdentityConflictAnnouncer`）へ `<ul>` を children として渡し、wrapper が context provider と単一 live region を提供する。

```
app/(admin)/admin/identity-conflicts/page.tsx  [Server Component]
└─ <IdentityConflictAnnouncer>                  [Client Component — "use client"]
   │   ├─ Context.Provider value={announce}     ← announce(text) を子へ供給
   │   │   └─ <ul aria-label="Identity 重複候補一覧">  (children = Server Component 由来)
   │   │        └─ <li><IdentityConflictRow item /> ...  [複数・各 instance]
   │   │             └─ useIdentityConflictAnnounce() → announce(announcementFor(action))
   │   │                  optimistic 確定時に return null（row 自身の status node は撤去）
   │   │
   │   └─ <div role="status" aria-live="polite" className="sr-only">  ← 単一・永続
   │        {messages.map(m => <div key={m.id}>{m.text}</div>)}        ← append-children
   │        （各 message は ANNOUNCE_TTL_MS 後に自動除去）
   │
   └─ ※ region は children の「後」に 1 度だけ描画。row が何個でも region は常に 1 つ。

  読み上げフロー:
   row(A) merge 確定 ──announce("merge を実行…")──┐
   row(B) dismiss 確定 ─announce("別人として確定…")─┼─▶ messages に push ─▶ 別 child node 追加
                                                   │     ─▶ SR が順番に読み上げ（欠落なし）
                                                   └─▶ 各 child は TTL 後 messages から除去
```

- **focus は一切動かさない**。row は `announce()` を呼ぶだけで、操作起点（merge / dismiss トリガーボタン近傍）にカーソルが留まる。
- region は `sr-only`（視覚非表示）。画面ピクセル変化なし → **NON_VISUAL**。

## 2.2 state 所有権テーブル（核心）

| state / resource | 所有者 | 役割 | 備考 |
| --- | --- | --- | --- |
| `messages: { id: number; text: string }[]` | `IdentityConflictAnnouncer` | live region 内に描画される読み上げメッセージ列。announce ごとに push、TTL 後に該当 id を除去 | 単一 source of truth。row は触らない |
| `timers: Set<ReturnType<typeof setTimeout>>`（または Map<id, timer>） | `IdentityConflictAnnouncer` | 各 message の TTL 除去 timer。unmount で全 clear | leak 防止の解放責務リソース |
| `announce: (message: string) => void` | `IdentityConflictAnnouncer`（context 経由で供給） | row が呼ぶ唯一の API。内部で `messages` に push | provider 外では no-op fallback |
| `hasAnnouncedRef: boolean`（`useRef`） | `IdentityConflictRow`（各 instance） | 同一 optimistic 確定に対し announce を 1 回だけにするガード。rollback で reset | row-local。messages には触れない |
| `optimisticMerged` / `optimisticDismissed` / `isExiting` / `stage` | `IdentityConflictRow`（既存・不変） | 除去確定・退場アニメ・dialog 制御 | #1042/#1043 既存 state を維持 |
| announce 文言 | `identityConflictAnnouncements.ts`（pure module） | `IDENTITY_CONFLICT_ANNOUNCEMENTS` map + `announcementFor()` | state ではなく純粋導出 |

> **責務分離の核心**: `messages` / `timers` は **announcer のみ**が所有する。row が複数あっても region は 1 つ・state は 1 箇所であるため、cross-row の DOM 上書き race が構造的に発生しない。

### 因果ループ補足（バランス装置 = TTL）

- **バランスループ（DOM 肥大の抑制）**: announce 増加 → message child 増加 → DOM ノード肥大（強化リスク）。これを `ANNOUNCE_TTL_MS`（=1000ms）後の自動除去が打ち消す。読み上げに十分な時間 child を残し、その後除去して DOM を一定サイズに保つ。

## 2.3 主要シグネチャ詳細

### (a) 文言の単一導出 — `identityConflictAnnouncements.ts`（pure module）

```ts
// apps/web/src/components/admin/identityConflictAnnouncements.ts
export type IdentityConflictAction = "merge" | "dismiss";

export const IDENTITY_CONFLICT_ANNOUNCEMENTS: Record<IdentityConflictAction, string> = {
  merge: "merge を実行しました。候補を一覧から非表示にしました。",
  dismiss: "別人として確定しました。候補を一覧から非表示にしました。",
};

export function announcementFor(action: IdentityConflictAction): string {
  return IDENTITY_CONFLICT_ANNOUNCEMENTS[action];
}
```

- **単一導出**: merge / dismiss / 将来 action を 1 つの map から導出する（AC-4）。現行 `IdentityConflictRow.tsx:74-79` のインライン三項（`optimisticDismissed ? "..." : optimisticMerged ? "..." : null`）を関数化して置換する。
- `Record<IdentityConflictAction, string>` 型により、将来 action を `IdentityConflictAction` union へ追加すると map のキー漏れが **コンパイルエラー**で検出される（網羅性保証）。
- 文言は現行コードと **byte 一致**させる（陳腐化なし・既存の読み上げ内容を維持）。

### (b) ページレベル単一 region + context — `IdentityConflictAnnouncer.tsx`（"use client"）

```tsx
// apps/web/src/components/admin/IdentityConflictAnnouncer.tsx
"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const ANNOUNCE_TTL_MS = 1000;

type AnnounceFn = (message: string) => void;

// provider 外では no-op fallback（テスト・SSR・誤用時に throw しない）
const IdentityConflictAnnounceContext = createContext<AnnounceFn>(() => {});

export function useIdentityConflictAnnounce(): AnnounceFn {
  return useContext(IdentityConflictAnnounceContext);
}

export function IdentityConflictAnnouncer({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<{ id: number; text: string }[]>([]);
  const nextIdRef = useRef(0);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const announce = useCallback<AnnounceFn>((message) => {
    const id = nextIdRef.current++;
    setMessages((prev) => [...prev, { id, text: message }]);  // append-children
    const timer = setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));   // TTL 自動除去
      timersRef.current.delete(timer);
    }, ANNOUNCE_TTL_MS);
    timersRef.current.add(timer);
  }, []);

  // unmount 時に全 timer を clear（leak 防止）
  useEffect(() => () => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current.clear();
  }, []);

  return (
    <IdentityConflictAnnounceContext.Provider value={announce}>
      {children}
      <div role="status" aria-live="polite" className="sr-only">
        {messages.map((m) => (
          <div key={m.id}>{m.text}</div>
        ))}
      </div>
    </IdentityConflictAnnounceContext.Provider>
  );
}
```

- **append-children パターン**: `announce()` ごとに新しい child node（`{id, text}`）を `messages` へ追加 → 各メッセージが**個別 DOM mutation**となり SR が順番に読み上げる（AC-3）。
- **context fallback no-op**: provider 外（テストの単体 row render / SSR）では `() => {}` が呼ばれ throw しない。これにより既存テストのうち announcer を wrap しないケースが壊れない。
- **TTL 自動除去**: `ANNOUNCE_TTL_MS`（=1000）後に該当 id を除去し DOM 肥大を防ぐ。
- region は children の **後**に 1 つだけ永続描画（単一性・AC-1）。

### (c) row 側 — `IdentityConflictRow.tsx`（差分の要点）

```ts
// 撤去: optimisticStatusRef（line 35）/ focus useEffect（line 81-84）/
//        optimisticStatus 三項（line 74-79）/ row-local status <p> ブロック（line 136-148）
const announce = useIdentityConflictAnnounce();
const hasAnnouncedRef = useRef(false);

const announceOnce = useCallback((action: IdentityConflictAction) => {
  if (hasAnnouncedRef.current) return;
  hasAnnouncedRef.current = true;
  announce(announcementFor(action));
}, [announce]);

// onMerge / onDismiss:
// trigger(...).then(() => announceOnce("merge" | "dismiss")).catch(rollback)

// 除去確定: status <p> ブロック（136-148）を置換
//   if (optimisticMerged || optimisticDismissed) return null;
//   ※ #1043 の isExiting 退場アニメは merge 経路で維持（finalizeRemoval で optimisticMerged=true）。
//      success announce は mutation resolve 後に 1 回発火し、rollback 時は発火しない。

// rollback catch（merge onMerge.catch / dismiss onDismiss.catch）に併記:
//   hasAnnouncedRef.current = false;   ← 再アナウンス可能化
```

- **`hasAnnouncedRef` の rollback reset**: rollback（server error）で `optimisticMerged` / `optimisticDismissed` が false へ戻った後、再操作で再び確定したときに announce が再発火するよう、`.catch` 内で `hasAnnouncedRef.current = false` を併記する。これがないと「一度 rollback した row は二度と読み上げられない」事故になる。
- **`role="alert"` inline error（248-257 / 296-305）は不変**（AC-5）。announce 撤去対象は row-local **status** node のみで、error alert は触らない。

## 2.4 連続処理競合回避の設計根拠

| 機構 | 効果 |
| --- | --- |
| **単一 region 集約** | row が N 個あっても live region は `IdentityConflictAnnouncer` の 1 つだけ。各 row の同時発火が別々の region を生んで競合する事態を構造的に排除 |
| **append-children** | `announce()` ごとに `messages` へ新 child を push。**同一テキストノードの上書きではなく独立ノードの追加**であるため、同一 tick で 2 件発火しても後勝ちで文言が collapse しない。SR は追加されたノードを順番に読み上げる |
| **TTL 個別管理** | 各 message が独立 id + 独立 timer を持つため、A の除去が B の読み上げに干渉しない |

> **設計判断（react-aria LiveAnnouncer 類似）**: 単一の永続 live region に対しメッセージを **追加ノードとして流し込む**手法は、`@react-aria/live-announcer` の `announce()` が採る確立パターンと同型である。単一テキストノードの `textContent` 上書きは「同一 tick の連続更新で SR が最後の値しか読まない / 同一文字列の連続で読み上げが起きない」既知問題があるため、本設計では **append-children** を採用して回避する（AC-3 の構造的根拠）。

## 2.5 focus stealing 撤去の a11y 妥当性

| 観点 | 旧（撤去対象） | 新（本設計） |
| --- | --- | --- |
| 読み上げ機構 | row-local `role="status"` `<p>` を描画し `ref.focus()` で焦点移動 → SR が focus 先を読む | ページレベル単一 `aria-live="polite"` region に message を追加 → SR が live region 変化を読む |
| 操作起点 | merge / dismiss ボタンから sr-only `<p>`（`tabIndex={-1}`）へカーソルが飛ぶ | **トリガーボタン近傍に留まる**（focus を動かさない） |
| a11y 妥当性 | focus 奪取は「次の操作対象を見失う」「キーボード操作者の位置感覚を壊す」リスク。row が消えると焦点が宙に浮く | `aria-live="polite"` は焦点を移さず非同期に読み上げる WAI-ARIA 標準。操作位置を保持したまま結果を通知でき、連続処理に適する |

→ focus stealing 撤去により、運用者は merge / dismiss を連続実行しても操作起点（リスト内の次の候補近傍）を失わない（AC-2）。これは `aria-live` region の本来の用法であり a11y 上正しい。

## 2.6 timer 安全性（解放経路）

`timersRef`（`Set` または `Map`）を「解放責務のあるリソース」として全経路で clear する。

| 経路 | clear 箇所 |
| --- | --- |
| 正常（TTL 到達による除去） | `setTimeout` callback 内で `timersRef.current.delete(timer)` |
| announcer unmount | `useEffect` cleanup で `for (const t of timersRef.current) clearTimeout(t)` + `clear()` |
| row 側 announce 済みフラグ | row の rollback `.catch` で `hasAnnouncedRef.current = false`（announcer の timer とは独立。row unmount 時は React が effect cleanup を担保） |

> **設計判断**: TTL timer を `Set`（または `Map<id, timer>`）で集約管理することで、unmount 時に「現存する全 timer を一括 clear」できる。個々の timer を ref に持つ #1043 の `exitTimerRef`（単一）とは異なり、本タスクは **同時に複数 message が in-flight になりうる**ため集合管理が必要。

## 2.7 既存テスト回帰の設計

| 既存テスト（`IdentityConflictRow.spec.tsx`） | 影響 | 対応 |
| --- | --- | --- |
| dismiss optimistic 非表示 + focus 移動（line 325-345・特に `expect(document.activeElement).toBe(status)` line 344） | focus stealing 撤去で **focus assertion が成立しなくなる**。row-local status node も消える | **focus-steal assertion を撤去**し、(1) announce が呼ばれること（mock announce）/ (2) `document.activeElement` が status node に**ならない**こと / (3) ページレベル単一 region 経由で文言が読み上げられること、へ更新。`renderWithAnnouncer` helper で `<IdentityConflictAnnouncer>` ラップ render を提供 |
| merge optimistic 非表示（#1043 fade 後 `return null`） | row が `return null` する点は不変。row-local status `<p>` は消える | row 消失 assertion（`queryByText("conflict: c_1")` が null）は維持。status node 取得系 assertion は単一 region 側へ移す |
| merge / dismiss rollback（`role="alert"` 残存） | **不変**（AC-5） | 変更なし。error alert は触らない |
| dismiss / merge endpoint 送信内容 | 不変 | 変更なし |

> **`renderWithAnnouncer` helper（新規）**: テスト内で `render(<IdentityConflictAnnouncer><IdentityConflictRow item={item} /></IdentityConflictAnnouncer>)` を行う薄い helper。これにより row が context 経由で実 region へ読み上げる経路を統合検証できる。announcer を wrap しない単体 render は context fallback no-op で throw せず動く（既存テストの非破壊を担保）。

## 2.8 不変条件遵守表

| 不変条件 | 遵守内容 |
| --- | --- |
| #1（既存 API のみ） | merge / dismiss endpoint・contract・D1 schema は一切変更しない。本タスクは UI / a11y のみ |
| #2（OKLch token 正本・HEX 直書き禁止） | live region は `sr-only` のみ。色 token / HEX / inline style を追加しない |
| #5（D1 直接アクセス禁止） | `apps/web` から D1 binding 参照なし（既存通り API proxy 経由） |
| #9（admin primitive 範囲内・新規 primitive を生やさない） | 新規は announcer（live region wrapper）と pure module のみ。視覚 primitive（Button/Badge/Textarea 等）は増やさない |
| #10（admin mutation は `@/features/admin/hooks` 経由） | `useAdminMutation`（`../../features/admin/hooks`）を継続使用。legacy `@/lib/useAdminMutation` 不参照 |

## 2.9 Server Component → client wrapper への children 受け渡し（Next.js App Router）

| 観点 | 妥当性 |
| --- | --- |
| パターン | Server Component（`page.tsx`）が `"use client"` の `IdentityConflictAnnouncer` を呼び、`<ul>...</ul>`（中身は Server Component が map した `<li><IdentityConflictRow/></li>`）を **children prop として渡す** |
| App Router 上の妥当性 | Next.js App Router の確立パターン。Client Component は children として渡された Server Component サブツリーを **そのまま描画**できる（children は親 Server Component 側で評価済の React element として渡る）。client 化が wrapper に閉じ、`<ul>` 配下の row（既に `"use client"`）も従来通り動く |
| 利点 | page.tsx の Server Component 性（`force-dynamic` / `safeServerFetch`）を維持したまま、context provider と live region だけを client 境界に追加できる。データ取得・admin gate は Server 側のまま不変 |
| 注意 | `IdentityConflictAnnouncer` は state（`messages`）を持つため `"use client"` 必須。children 自体は Server で評価されるので、row の data fetch が client へ降りることはない |

## 実行タスク

1. アーキテクチャ topology（page → announcer → context/region、発火源 = row / 読み上げ先 = 単一 region）を確定する（§2.1）。
2. state 所有権（messages/timers = announcer、hasAnnouncedRef = row）を確定する（§2.2）。
3. 主要シグネチャ（announcementFor / announcer + context / row 差分）を確定する（§2.3）。
4. append-children による連続処理競合回避の根拠を確定する（§2.4）。
5. focus stealing 撤去の a11y 妥当性と timer 安全性を確定する（§2.5 / §2.6）。
6. 既存テスト回帰方針（focus-steal assertion 更新・`renderWithAnnouncer`）を確定する（§2.7）。
7. Server → client children 受け渡しパターンの妥当性を確定する（§2.9）。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| Phase 1 要件 | `../phase-1/phase-1.md` | AC-1〜AC-8 |
| SSOT 設計正本 | `../../index.md` | 設計方針・主要シグネチャの正本 |
| 既存実装 | `apps/web/src/components/admin/IdentityConflictRow.tsx` | 設計対象（line 35 / 74-84 / 136-148 / 248-257 / 296-305） |
| list page | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`（line 76-82） | wrapper 配置先 |
| 既存テスト | `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`（line 325-345） | 回帰対象 |
| design tokens | `docs/00-getting-started-manual/specs/design-tokens.md` | HEX 直書き禁止根拠 |

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-2/phase-2.md` | 設計書（要件レビュー / topology / state 所有権 / 因果ループ / 主要シグネチャ / 競合回避 / focus 撤去 a11y / timer 安全性 / 回帰方針 / Server→client children） |

## 統合テスト連携

- §2.7 の既存テスト回帰（line 325-345 focus-steal assertion）と `renderWithAnnouncer` helper が Phase 4 のテスト設計の前提になる。
- §2.3 のシグネチャと §2.4 の append-children が Phase 4 の TC-SINGLE-REGION / TC-NO-FOCUS-STEAL / TC-CONCURRENT / TC-TTL / TC-ROLLBACK-NO-ANNOUNCE の期待値根拠。

## 完了条件（Phase 2）

- アーキテクチャ topology（単一 region + announce context）と state 所有権を確定した。
- 因果ループ（バランス: 単一 region 集約で競合遮断 / 強化: 確実読み上げで確信度向上）を最低 1 本ずつ示した。
- 主要シグネチャ（`announcementFor` / `IdentityConflictAnnouncer` + context fallback / row の `hasAnnouncedRef` rollback reset）を確定した。
- append-children の連続処理競合回避根拠（react-aria LiveAnnouncer 類似）を示した。
- focus stealing 撤去の a11y 妥当性と TTL timer の解放経路を確定した。
- 既存テスト回帰方針（focus-steal assertion 更新・`renderWithAnnouncer`）と Server→client children 受け渡しの妥当性を確定した。
- index.md の SSOT と矛盾しないことを確認した。
- Phase 4（テスト作成）へ進行可能な設計を確定した。
