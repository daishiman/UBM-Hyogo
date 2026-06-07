# Phase 5: 実装（仕様）

`[実装区分: 実装仕様書]` / `implementation_mode: new`

Issue #1094「optimistic 消失時の aria-live アナウンス最適化（FU-AIDC-008）」の実装仕様。
Phase 4 の RED を GREEN にする最小差分を、後続実装者がそのまま着手できる粒度で記録する。

> **重要 — 本サイクルではコード実装を実行しない（user-gated）**。本 Phase は実装手順の**仕様**であり、
> 関数シグネチャ・差分方針・擬似コードを確定するに留める。実際の `apps/web` 編集・commit・PR はすべて
> 後続サイクルでユーザー承認後に行う。`workflow_state` は `spec_created` のまま。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1094-identity-conflicts-optimistic-aria-live-announcement` |
| issue | #1094（FU-AIDC-008・CLOSED 維持） |
| phase | 5（実装 / 仕様） |
| implementation_mode | new |
| 新規作成ファイル | **2 件**（下表） |
| 修正ファイル | **3 件**（下表） |

### 変更対象ファイル一覧（必須記載・index.md inventory と一致）

| 区分 | パス | 変更内容 |
| --- | --- | --- |
| **新規** | `apps/web/src/components/admin/identityConflictAnnouncements.ts` | `IdentityConflictAction` 型 + `IDENTITY_CONFLICT_ANNOUNCEMENTS` map + `announcementFor()`（pure module・文言の単一導出） |
| **新規** | `apps/web/src/components/admin/IdentityConflictAnnouncer.tsx` | `"use client"`。ページレベル単一 live region + `announce` context provider / append-children + TTL 自動除去 / `useIdentityConflictAnnounce()` hook |
| 修正 | `apps/web/src/components/admin/IdentityConflictRow.tsx` | `optimisticStatusRef`（35）/ focus useEffect（81-84）撤去。文言三項（74-79）を mutation success の announceOnce 呼び出しへ。status `<p>` ブロック（136-148）を `if (optimisticMerged \|\| optimisticDismissed) return null;` へ置換。announceOnce + `hasAnnouncedRef` 追加。rollback catch に `hasAnnouncedRef` reset 追記。`role="alert"` は不変 |
| 修正 | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | `<ul aria-label="...">` を `<IdentityConflictAnnouncer>` でラップ。import 追加 |
| 修正 | `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | Phase 4 の TC-ROW-* 追加・line 342-344 置換・`renderWithAnnouncer` 導入（Phase 4 §4.3/§4.5/§4.6） |
| **新規** | `apps/web/src/components/admin/__tests__/IdentityConflictAnnouncer.spec.tsx` | Phase 4 の TC-ANN-01〜06 |

> **変更なし（参照のみ）**: `apps/web/src/features/admin/hooks/useAdminMutation.ts` /
> `apps/web/src/styles/tokens.css` / `globals.css`（sr-only ゆえ視覚変更なし）/ `apps/api/**`（不変条件 #1）。

## 目的

optimistic 消失アナウンスを「発火源 = row / 読み上げ先 = 親の単一 region」へ責務分離し、
focus stealing 非依存・連続処理非競合・文言単一導出を実現する。rollback error（`role="alert"`）は非回帰維持。

## 実行タスク

### 5.1 `identityConflictAnnouncements.ts`（新規・pure module）

index.md「主要シグネチャ（SSOT）」を逐語実装する。`"use client"` 不要（純粋関数・型のみ）。

```ts
// apps/web/src/components/admin/identityConflictAnnouncements.ts
// optimistic 消失時の screen reader アナウンス文言を単一導出する pure module。
// merge / dismiss / 将来 action を 1 本の map から導出し、row 側のインライン三項を関数化する。

export type IdentityConflictAction = "merge" | "dismiss";

export const IDENTITY_CONFLICT_ANNOUNCEMENTS: Record<IdentityConflictAction, string> = {
  merge: "merge を実行しました。候補を一覧から非表示にしました。",
  dismiss: "別人として確定しました。候補を一覧から非表示にしました。",
};

export function announcementFor(action: IdentityConflictAction): string {
  return IDENTITY_CONFLICT_ANNOUNCEMENTS[action];
}
```

- 入力: `action`（`"merge" | "dismiss"`）。出力: 対応する日本語文言（string）。副作用なし。
- 文言は現行 `IdentityConflictRow.tsx:74-79` の三項と**同一文字列**を踏襲する（SR 体験の非回帰）。

### 5.2 `IdentityConflictAnnouncer.tsx`（新規・client）

index.md「主要シグネチャ（SSOT）」を実装する。append-children + TTL 自動除去 + provider 外 no-op fallback。

```tsx
// apps/web/src/components/admin/IdentityConflictAnnouncer.tsx
"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

// child を append してから自動除去するまでの保持時間（ms）。SR が読み上げ後に DOM 肥大を防ぐ。
const ANNOUNCE_TTL_MS = 1000;

type AnnounceFn = (message: string) => void;

// provider 外では no-op fallback（throw しない）。
const AnnounceContext = createContext<AnnounceFn | null>(null);

export function useIdentityConflictAnnounce(): AnnounceFn {
  const fn = useContext(AnnounceContext);
  // provider 外 = no-op（呼んでも安全・例外を投げない）。
  return fn ?? (() => {});
}

interface Message {
  id: number;
  text: string;
}

export function IdentityConflictAnnouncer({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const seqRef = useRef(0);
  // 除去 timer を id 単位で保持し、unmount 時に全 clear（leak 防止）。
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const announce = useCallback<AnnounceFn>((message) => {
    const id = ++seqRef.current;
    // append-children: 既存メッセージを潰さず末尾に追加（連続処理で各々 DOM mutation）。
    setMessages((prev) => [...prev, { id, text: message }]);
    const timer = setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      timersRef.current.delete(id);
    }, ANNOUNCE_TTL_MS);
    timersRef.current.set(id, timer);
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
    };
  }, []);

  return (
    <AnnounceContext.Provider value={announce}>
      {children}
      <div role="status" aria-live="polite" className="sr-only">
        {messages.map((m) => (
          <p key={m.id}>{m.text}</p>
        ))}
      </div>
    </AnnounceContext.Provider>
  );
}
```

- **入力**: `children`（ラップする `<ul>` ツリー）。**出力**: provider + 単一 sr-only region を含む JSX。
- **副作用**: `announce()` は messages へ push（DOM mutation）+ TTL timer 登録のみ。**throw しない**。
- **エラーハンドリング**: announce は副作用のみで失敗経路を持たない。message が空文字でも単に空 `<p>` を append
  （row 側が空文字を渡さない設計のため実害なし）。provider 外 consumer は no-op。
- **region 単一性**: provider が 1 つなら region も 1 つ。`role="status"` + `aria-live="polite"` + `sr-only`
  （AC-1・視覚非露出）。`messages.map` で child を 0..N 個描画（append 順 = 読み上げ順）。

> `aria-live="polite"` region は **空のまま常駐**させ、child の append で SR がアナウンスする
> （region 自体を出し入れしない）。これが連続処理での競合回避（AC-3）の要。

### 5.3 `IdentityConflictRow.tsx` 編集（差分方針）

index.md「主要シグネチャ（SSOT）」差分要点を逐語反映する。dismiss/merge の mutation 呼び出し・stage 遷移・
exiting 相（#1043）・`role="alert"` は不変。

#### import 追加

```ts
// 既存 import に追加
import { useIdentityConflictAnnounce } from "./IdentityConflictAnnouncer";
import { announcementFor, type IdentityConflictAction } from "./identityConflictAnnouncements";
```

#### line 35 `optimisticStatusRef` 削除

```ts
// 削除: const optimisticStatusRef = useRef<HTMLParagraphElement>(null);
// row-local status node を撤去するため ref は不要。
```

#### announce hook + hasAnnouncedRef 追加（component 内・既存 useState 群付近）

```ts
const announce = useIdentityConflictAnnounce();
const hasAnnouncedRef = useRef(false);
```

#### line 74-79 文言三項 → announceOnce へ置換

```ts
// 削除: optimisticStatus の三項（74-79）
// 追加: mutation success handler から action を明示して announcementFor に委譲。
announceOnce("merge");
announceOnce("dismiss");
```

#### line 81-84 focus useEffect 削除 → success announce helper へ置換

```ts
// 削除: optimisticStatusRef.current?.focus() の useEffect（81-84・focus steal）
// 追加: mutation resolve 後に 1 回だけ context 経由でアナウンス（focus は奪わない）。
const announceOnce = useCallback((action: IdentityConflictAction) => {
  if (hasAnnouncedRef.current) return;
  hasAnnouncedRef.current = true;
  announce(announcementFor(action));
}, [announce]);

// onMerge / onDismiss:
// trigger(...).then(() => announceOnce("merge" | "dismiss")).catch(rollback)
```

> 成功文言は `trigger(...).then(() => announceOnce(action))` に閉じる。`catch` の rollback では成功文言を live region へ入れず、既存 `role="alert"` で失敗を surface する。

#### rollback catch に hasAnnouncedRef reset 追記

```ts
// onMerge の .catch（既存 clearExitTimer / setIsExiting(false) / setOptimisticMerged(false) に追記）
.catch(() => {
  clearExitTimer();
  setIsExiting(false);
  setOptimisticMerged(false);
  hasAnnouncedRef.current = false; // 追記: 再実行時に再アナウンス可能化（AC-5）
});

// onDismiss の .catch（既存 setOptimisticDismissed(false) に追記）
.catch(() => {
  setOptimisticDismissed(false);
  hasAnnouncedRef.current = false; // 追記: 再実行時に再アナウンス可能化（AC-5）
});
```

#### line 136-148 status `<p>` ブロック → return null へ置換

```tsx
// 削除: if (optimisticStatus) { return <p ref={optimisticStatusRef} role="status" ... /> }（136-148）
// 追加: row-local status node を撤去し、除去確定時は単に消す（アナウンスは announcer が担当）。
if (optimisticMerged || optimisticDismissed) return null;
```

> `role="alert"`（merge/dismiss inline error・現 248-257 / 296-305）は**一切変更しない**（AC-5・非回帰）。
> exiting 相の root div（`isExiting` className・`onTransitionEnd`・`finalizeRemoval`・#1043 由来）は不変。

### 5.4 `page.tsx` 編集（`<ul>` を Announcer でラップ）

Server Component が client wrapper に children を渡す。`<IdentityConflictAnnouncer>` は client component
（`"use client"`）だが、Server Component から **children を props として渡す**形は RSC で合法。

```tsx
// import 追加
import { IdentityConflictAnnouncer } from "@/components/admin/IdentityConflictAnnouncer";
// （相対 import 規約が prevailする場合は ../../../components/admin/... に合わせる。既存 import 形式に従う）

// 既存:
//   <ul aria-label="...">{items.map((it) => <li key=...><IdentityConflictRow item={it} /></li>)}</ul>
// 変更後: 単一 region を <ul> 群の外側へ常駐させる。
<IdentityConflictAnnouncer>
  <ul aria-label="...">
    {items.map((it) => (
      <li key={it.conflictId}>
        <IdentityConflictRow item={it} />
      </li>
    ))}
  </ul>
</IdentityConflictAnnouncer>
```

> 実 `page.tsx` の現行 JSX 構造（`<ul aria-label>` の正確な属性・wrapper）に合わせてラップする。
> ラップは `<ul>` を囲うだけで、list 構造・aria-label・既存 layout には触れない（NON_VISUAL）。
> region は `<ul>` の**後**（announcer 内 children の後）に描画されるため list の視覚レイアウトに影響しない。

### 5.5 入力・出力・副作用の定義（まとめ）

| 関数 / component | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `announcementFor(action)` | `IdentityConflictAction` | 文言 string | なし（pure） |
| `IdentityConflictAnnouncer` | `children` | provider + 単一 region JSX | messages state mutation / TTL timer（unmount clear） |
| `useIdentityConflictAnnounce()` | なし | `AnnounceFn`（provider 外は no-op） | なし |
| `announce(message)` | message string | void | region への child append + TTL 除去 timer。**throw しない** |
| row の announceOnce | `IdentityConflictAction` | — | mutation resolve 後に `announceOnce(...)` を 1 回（`hasAnnouncedRef` ガード） |

### 5.6 不変条件チェック（#1 / #2 / #5 / #10）

| 不変条件 | 確認 |
| --- | --- |
| #1（既存 API のみ） | merge / dismiss endpoint・payload・`useAdminMutation` 呼び出し shape は無変更。新 endpoint / D1 schema / Form 仕様変更なし |
| #2（OKLch token・HEX 直書き禁止） | sr-only region は色を持たない。HEX 直書き / `bg-[#xxx]` / inline `style={{}}` を追加しない。新規 token 不要 |
| #5（D1 直接アクセス禁止） | `apps/web` から D1 binding 参照なし（component-local + context のみ） |
| #10（admin mutation は `@/features/admin/hooks` 経由） | `useAdminMutation` は既存どおり `../../features/admin/hooks` 経由。legacy `@/lib/useAdminMutation` 参照を増やさない（grep 0 件） |
| #9（admin primitive 範囲・新規 primitive を生やさない） | `IdentityConflictAnnouncer` は admin 専用の announce ユーティリティであり、汎用 design primitive ではない。Badge/Button/Textarea 等は不変 |

### 5.7 実装後の検証コマンド（リポジトリルートから）

```bash
# 型チェック
mise exec -- pnpm typecheck

# web パッケージの lint
mise exec -- pnpm --filter @ubm-hyogo/web lint

# focused Vitest（GREEN 化確認）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/components/admin/__tests__/IdentityConflictRow.spec.tsx \
  src/components/admin/__tests__/IdentityConflictAnnouncer.spec.tsx
```

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| SSOT 設計正本 | `../../index.md` | 主要シグネチャ / 設計方針 / inventory |
| Phase 4 テスト | `../phase-4/phase-4.md` | GREEN 化対象の RED ケース |
| 既存実装 | `apps/web/src/components/admin/IdentityConflictRow.tsx` | 編集対象（35 / 74-84 / 136-148） |
| 構成 reference | `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/outputs/phase-5/phase-5.md` | 差分方針の書式 |
| mutation hook | `apps/web/src/features/admin/hooks/useAdminMutation.ts` | 不変条件 #10（参照のみ） |
| design tokens | `docs/00-getting-started-manual/specs/design-tokens.md` | HEX 直書き禁止根拠（#2） |

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-5/phase-5.md` | 新規 2 / 修正 3 ファイルの差分方針（`identityConflictAnnouncements.ts` / `IdentityConflictAnnouncer.tsx` 全体擬似コード・`IdentityConflictRow.tsx` の ref 削除 / focus useEffect 削除 / 文言三項→announceOnce / status `<p>`→`return null` / announceOnce + `hasAnnouncedRef` / rollback reset・`page.tsx` ラップ）・入出力副作用・不変条件チェック・検証コマンド |

## 統合テスト連携

- 実装後、Phase 4 の focused Vitest が全 GREEN（AC-6）。
- `pnpm typecheck` / `pnpm --filter @ubm-hyogo/web lint` green（AC-7）。
- Phase 6 で fail path（rollback 非アナウンス・TTL 境界・複数 action 混在・provider 外 fallback・aria-live 非回帰）を拡充。
- Phase 11 で NON_VISUAL evidence（focused Vitest 結果 + 手動 SR 検証ノート）を記録（user-gated）。

## 完了条件（Phase 5）

- 新規 2 件 / 修正 3 件のファイル一覧を確定した（index.md inventory と一致）。
- `identityConflictAnnouncements.ts` / `IdentityConflictAnnouncer.tsx` の全体擬似コードを確定した。
- `IdentityConflictRow.tsx` の差分方針（ref 削除 / focus useEffect 削除 / 文言三項→announceOnce / status `<p>`→`return null` / announceOnce + `hasAnnouncedRef` / rollback reset・`role="alert"` 不変）を確定した。
- `page.tsx` の `<IdentityConflictAnnouncer>` ラップ方針を確定した。
- 入出力・副作用・エラーハンドリング（announce は副作用のみ・throw しない）・不変条件チェック（#1/#2/#5/#10）を確定した。
- **本サイクルではコード実装を実行しない（user-gated）**旨を明記し、後続実装者が着手できる粒度であることを確定した。
- 実装後の検証コマンド（typecheck / lint / focused Vitest）を確定した。
