**[実装区分: 実装仕様書 / 状態: implemented_local_runtime_pending]**

# Phase 5: 実装

Phase 4 で RED にしたテストを GREEN にするための実装フェーズ。
Task A（proxy transport 統一・404 修正）と Task B（出席管理 UI/UX 改善）を 1 サイクルで実装する。
**本仕様書のコードは「実装仕様としての差分例」であり、実際の編集は後続 03.実装.md が行う**（本 Phase ではコードを書かない）。

apps/api / D1 schema / Google Form 仕様 / `useAdminMutation` hook / `api.ts` の attendance パスは**一切変更しない**（不変条件 #1）。

---

## 5.1 新規作成 / 修正ファイル一覧

| 区分 | パス | 内容 | Task |
|---|---|---|---|
| 修正 | `apps/web/app/api/admin/[...path]/route.ts` | `proxy()` を service binding 優先 transport へ統一。`logAdminTransport` 追加 | A |
| 修正 | `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx` | `candidates` から `nameOf` Map を構築し出席者を氏名表示 | B1 |
| 修正 | `apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx` | 出席人数バッジ + 見出し button の aria-label。`attendedCounts` prop 追加 | B2/B3 |
| 修正 | `apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx` | `attendedCounts` 配線 + 運用導線テキスト | B2/B4 |
| 編集 | `apps/web/app/api/admin/[...path]/route.spec.ts` | binding 分岐ケース追加（Phase 4） | A |
| 新規 | `apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx` | 氏名表示テスト（Phase 4） | B1 |
| 編集 | `apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx` | バッジ / aria テスト（Phase 4） | B2/B3 |
| 新規（任意） | `apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx` | 導線テキストテスト（Phase 4） | B4 |

> **新規実装ファイル（プロダクションコード）なし**。既存 4 ファイルの修正のみ。新規 component / primitive / hook / API / env アクセサはゼロ（不変条件 #1/#9）。

---

## 5.2 差分方針（before / after・行番号基準）

### (A) `route.ts` — transport 統一（行番号は編集前の現行ファイル基準）

#### A-1: `logAdminTransport` ヘルパを追加（`apiBase()` 定義の前後・line 26 付近）

`server-fetch.ts:100-108` と同一形式のログ関数を追加する。

after（追加する関数）:

```ts
function logAdminTransport(
  transport: "service-binding" | "http-fallback",
  path: string,
  status: number,
): void {
  console.log({
    transport,
    scope: "admin-proxy",
    path: path.split("?")[0],
    status,
  });
}
```

> `scope` は server-fetch の `"admin"` と区別するため `"admin-proxy"` とする（観測時に GET=server-fetch / mutation=proxy を識別可能にする）。文字列値はログのみで挙動に影響しない。

#### A-2: binding 取得を追加（`proxy()` 内・`const base = apiBase();`（line 59）の直前）

before（line 58-59）:

```ts
  const { path } = await ctx.params;
  const base = apiBase();
```

after:

```ts
  const { path } = await ctx.params;
  const binding = getAuthEnv().API_SERVICE;
  const base = apiBase();
```

#### A-3: fail-fast 条件を「binding も base も無い」に拡張（line 60-69）

before:

```ts
  const base = apiBase();
  if (base === null) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "internal_api_base_url_missing",
        message: "INTERNAL_API_BASE_URL is not configured for this environment",
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
```

after（binding があれば 500 を出さない）:

```ts
  const base = apiBase();
  if (!binding && base === null) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "internal_api_base_url_missing",
        message: "INTERNAL_API_BASE_URL is not configured for this environment",
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
```

#### A-4: upstream fetch を transport 分岐に置換（line 96-107）

before（HTTP fetch のみ・`target` は `${base}/admin/...`）:

```ts
  const init: RequestInit = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "DELETE") {
    init.body = await req.text();
  }
  const upstream = await fetch(target, init);
  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
```

after（binding 優先・HTTP fallback。`pathWithSearch` は path + search を 1 度だけ構築）:

```ts
  const init: RequestInit = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "DELETE") {
    init.body = await req.text();
  }
  const pathWithSearch = `/admin/${path.join("/")}${url.search}`;
  let upstream: Response;
  if (binding) {
    upstream = await binding.fetch(`https://service-binding.local${pathWithSearch}`, init);
    logAdminTransport("service-binding", pathWithSearch, upstream.status);
  } else {
    upstream = await fetch(`${base}${pathWithSearch}`, init);
    logAdminTransport("http-fallback", pathWithSearch, upstream.status);
  }
  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
```

> HTTP fallback の URL は従来 `target = `${base}/admin/${path.join("/")}${url.search}``（line 71）と同一。`pathWithSearch` に集約することで binding/HTTP 両経路の path 構築を統一する。`target`（line 70-71）は `pathWithSearch` 導入後に不要になるため削除する（HTTP 経路は `${base}${pathWithSearch}` で同値）。
>
> `binding` 型は `getAuthEnv().API_SERVICE`（`AuthEnv.API_SERVICE?: { fetch: typeof fetch }`・`env.ts:42,58`）。`binding.fetch(url, init)` は server-fetch.ts:557 と同一シグネチャ。

| 変更点 | 内容 |
|---|---|
| 追加 | `logAdminTransport`（server-fetch 同型）、`const binding = getAuthEnv().API_SERVICE` |
| 変更 | fail-fast 条件 `base === null` → `!binding && base === null`、upstream fetch を binding/HTTP 分岐へ |
| 不変 | `requireAdmin`（403・line 55-56）/ `needsSyncAdminBearer`（line 79-92）/ ヘッダ中継（line 73-94）/ body 中継（line 97-99）/ status・content-type 返却（line 102-107）/ GET=POST=PATCH=DELETE export（line 110-113） |

> `getAuthEnv` は既に import 済み（`route.ts:8`）。新 import 不要。`process.env` 直参照は追加しない（CLAUDE.md env 不変条件・既存の `apiBase()` 内 `process.env` 判定は不変）。

### (B1) `MeetingAttendanceDrawer.tsx` — 出席者氏名表示（line 1-2, 112-138）

#### B1-1: `useMemo` を import（line 2）

before:

```tsx
import { useState } from "react";
```

after:

```tsx
import { useMemo, useState } from "react";
```

#### B1-2: `nameOf` Map を構築（`useState` 群の直後・line 39 付近）

after（`const editNote` の後に追加）:

```tsx
  const nameOf = useMemo(
    () => new Map(candidates.map((c) => [c.memberId, c.fullName])),
    [candidates],
  );
```

#### B1-3: 出席者表示を氏名へ（line 123）

before:

```tsx
                <span>{mid}</span>
```

after:

```tsx
                <span>{nameOf.get(mid) ?? mid}</span>
```

> 補助 memberId 表示が必要な場合は `<span className="text-muted">{mid}</span>` を併記できるが、`text-muted` は既存トークン utility（HEX 直書き禁止・#2）。最小実装では氏名 fallback のみで AC-B1 を満たす。`data-member={mid}` 属性（line 120）は不変（テスト・回帰用）。

### (B2/B3) `MeetingTimeline.tsx` — 人数バッジ + aria（line 6-11, 39-47）

#### B2-1: `attendedCounts` prop を追加（Props interface・line 6-11）

before:

```tsx
interface Props {
  readonly items: ReadonlyArray<MeetingItem>;
  readonly selectedId: string | null;
  readonly onSelect: (sessionId: string) => void;
  readonly renderRowExtra?: (item: MeetingItem) => ReactNode;
}
```

after:

```tsx
interface Props {
  readonly items: ReadonlyArray<MeetingItem>;
  readonly selectedId: string | null;
  readonly onSelect: (sessionId: string) => void;
  readonly renderRowExtra?: (item: MeetingItem) => ReactNode;
  readonly attendedCounts?: Record<string, number>;
}
```

destructure（line 13）も `attendedCounts` を追加:

```tsx
export function MeetingTimeline({ items, selectedId, onSelect, renderRowExtra, attendedCounts }: Props) {
```

#### B2-2: バッジ + aria-label を見出し button へ（line 39-47）

before:

```tsx
              <button
                type="button"
                className="admin-timeline__heading"
                onClick={() => onSelect(m.sessionId)}
                aria-expanded={isSelected}
              >
                <span className="admin-timeline__date">{m.heldOn}</span>
                <span className="admin-timeline__title">{m.title}</span>
              </button>
```

after（`map` 内 `const isSelected` の隣に `count` を算出）:

```tsx
              <button
                type="button"
                className="admin-timeline__heading"
                onClick={() => onSelect(m.sessionId)}
                aria-expanded={isSelected}
                aria-label={`${m.title}（${m.heldOn}）の出席を記録・編集`}
              >
                <span className="admin-timeline__date">{m.heldOn}</span>
                <span className="admin-timeline__title">{m.title}</span>
                <span
                  className="admin-timeline__count"
                  data-testid={`meeting-attendance-count-${m.sessionId}`}
                >
                  {(attendedCounts?.[m.sessionId] ?? 0) > 0
                    ? `${attendedCounts?.[m.sessionId] ?? 0} 名出席`
                    : "出席 未登録"}
                </span>
              </button>
```

> `admin-timeline__count` class は `tokens.css` / `globals.css` の既存 admin token utility で配色する（HEX 直書き禁止・#2）。新 class が必要な場合は token 変数経由でのみ追加し、`verify-design-tokens` gate に抵触させない。バッジは `attendedCounts` 未指定時 `?? 0` で「出席 未登録」を安全に表示する。

### (B2/B4) `MeetingsClientShell.tsx` — 配線 + 導線テキスト（line 215-274）

#### B4-1: `attendedCounts` を `attended` state から導出（`stats` 算出の前後・line 215 付近）

after（`computeMeetingStats` 呼び出しの直前に追加）:

```tsx
  const attendedCounts: Record<string, number> = Object.fromEntries(
    meetings.map((m) => [m.sessionId, attended[m.sessionId]?.size ?? 0]),
  );
```

> カウントは最新 `attended: Record<sessionId, Set<memberId>>` state 由来（出席追加/削除で更新済み）。`MeetingItem.attendance`（初期値・stale 化し得る）には依存しない（Phase 2 §2.3 設計固定）。

#### B4-2: `MeetingTimeline` へ `attendedCounts` を配線（line 252-256）

before:

```tsx
        <MeetingTimeline
          items={meetings}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
```

after:

```tsx
        <MeetingTimeline
          items={meetings}
          selectedId={selectedId}
          attendedCounts={attendedCounts}
          onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
```

#### B4-3: 運用導線テキストを追加（`AdminSectionCard`（line 251）内 / timeline の直前）

after（`AdminSectionCard` の開きタグ直後に補助 `<p>` を追加）:

```tsx
      <AdminSectionCard title={`開催日一覧 (${meetings.length} 件)`}>
        {meetings.length > 0 ? (
          <p className="admin-section__hint">
            各開催日を選択すると出席を記録・編集できます
          </p>
        ) : null}
        <MeetingTimeline
```

> `admin-section__hint` は既存トークン utility（補助テキスト色）。新 class が要る場合は token 変数経由（HEX 禁止・#2）。開催 0 件時は `AdminEmptyState`（timeline 内）に委譲し導線テキストは出さない（AC-B4: 1 件以上のとき表示）。

---

## 5.3 入力・出力・副作用の定義

### Task A — `proxy()`（route handler）

| 項目 | 内容 |
|---|---|
| 入力 | `NextRequest`（method / url / headers / body）、`ctx.params.path: string[]` |
| transport 選択 | `getAuthEnv().API_SERVICE` あり → binding.fetch / 無く `INTERNAL_API_BASE_URL` あり → HTTP fetch / どちらも無し → 500 |
| 出力 | upstream の status と content-type をそのまま返す（binding / HTTP で同一） |
| 副作用 1 | `logAdminTransport(transport, pathWithSearch, status)` の console 出力（observability のみ） |
| 副作用 2 | upstream（apps/api）への mutation 中継。binding / HTTP どちらでも apps/api 側の効果は同一 |
| 不変 | admin gate（403）/ sync bearer 注入 / ヘッダ・body 中継 |

### Task B — components

| 対象 | 入力 | 出力 / 副作用 |
|---|---|---|
| `MeetingAttendanceDrawer` | `candidates` / `attended` / `meeting` / callbacks | `nameOf` Map（useMemo・純導出）で氏名表示。副作用なし（callback は既存どおり） |
| `MeetingTimeline` | + `attendedCounts?` | 見出しに人数バッジ・aria-label を描画。副作用なし |
| `MeetingsClientShell` | 既存 | `attendedCounts` を `attended` から導出して timeline へ渡す。導線テキスト描画。新 state・新 mutation なし |

---

## 5.4 ローカル実行コマンド

```bash
# 型チェック（ルートで全 package）
mise exec -- pnpm typecheck

# lint
mise exec -- pnpm lint

# Phase 4 で書いたテストが GREEN になることを確認（targeted・ルートから config 明示）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  "apps/web/app/api/admin/[...path]/route.spec.ts" \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx
```

> Phase 5 完了条件: TC-A1/A2/A3/A4/A5 + TC-B1-* + TC-B2-* + TC-B3-* + TC-B4-1 が GREEN、既存 timeline / route ケース全件 PASS、typecheck / lint green、HEX 直書きなし。

---

## 5.5 不変条件チェック表

| 不変条件 | 確認内容 |
|---|---|
| #1（既存 API のみ） | apps/api endpoint / D1 schema / Google Form を変更しない。proxy は経路のみ変更し、転送先 path（`/admin/<path>`）は不変。`api.ts` の attendance パスも不変 |
| #2（OKLch トークン正本） | 追加する `admin-timeline__count` / `admin-section__hint` / 補助 memberId 表示は token utility / 変数経由で配色。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を追加しない。`verify-design-tokens` gate を通す |
| #5（D1 直接アクセス禁止） | transport 修正は binding 経由で apps/api Worker を呼ぶのみ。`apps/web` から D1 binding を直接触らない |
| #8（test suffix） | 新規テストは `*.spec.{ts,tsx}` のみ（`MeetingAttendanceDrawer.spec.tsx` / `MeetingsClientShell.spec.tsx`）。`*.test.*` を作らない |
| #9（FormField / primitive） | drawer の入力は既存 `FormField` / `Input` / `Button` を維持。新規 `<input>` を `apps/web/src/components/admin/` 配下に増やさない。新 primitive を生やさない |
| #10（admin mutation hook） | `MeetingsClientShell` は既存 `@/features/admin/hooks/useAdminMutation` のまま。legacy `@/lib/useAdminMutation` を新規参照しない |
| env 不変条件 | proxy の env 参照は `getAuthEnv()`（既存 import）経由のみ。`process.env.*` の新規直参照を追加しない |
