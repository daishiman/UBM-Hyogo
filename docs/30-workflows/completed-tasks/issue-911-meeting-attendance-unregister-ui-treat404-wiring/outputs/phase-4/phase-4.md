**[実装区分: 実装仕様書]**

# Phase 4: 実装仕様（CONST_005 必須項目）

## 0. 入力

- Phase 1 FR/NFR/AC、Phase 2 状態モデル、Phase 3 案 A' 確定 DOM

## 1. 変更ファイル一覧（CONST_005 §1）

| path | 種別 | 概要 |
|---|---|---|
| `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` | edit | `unregisterMutation` 宣言 + `onUnregister` ハンドラ + 案 A' DOM（unregister button 追加） |
| `apps/web/app/(admin)/admin/meetings/[id]/__tests__/MeetingAttendancePanel.spec.tsx` | edit | spec B1..B5 を `describe` 末尾に追加（既存 A1..A8 は無改変） |

`apps/api/**` / D1 / 他ファイルへの差分なし。

## 2. 関数シグネチャ（CONST_005 §2）

### 2.1 `unregisterMutation` 宣言

```typescript
const unregisterMutation = useAdminMutation<unknown>(
  `/api/admin/meetings/${encodeURIComponent(detail.sessionId)}/attendances`,
  "POST",
  {
    refreshOnSuccess: false,
    treat404AsSuccess: { toast: "既に解除済みです" },
  },
);
```

- 戻り値型: `UseAdminMutationReturn<unknown>`（既存 `registerMutation` と同じ）
- option:
  - `refreshOnSuccess: false` — local Set 反転で UI が即時収束するため
  - `treat404AsSuccess: { toast: "既に解除済みです" }` — 404 を成功相当に倒し、toast を表示後 onSuccess 相当の路を辿る

### 2.2 `onUnregister` ハンドラ

```typescript
const onUnregister = async (memberId: string) => {
  if (!registered.has(memberId)) {
    setToast("未登録です");
    return;
  }
  try {
    await unregisterMutation.trigger({ memberId, attended: false });
    setRegistered((s) => {
      const next = new Set(s);
      next.delete(memberId);
      return next;
    });
    setToast("出席を解除しました");
  } catch (e) {
    if (e instanceof FetchAuthedError) {
      // 404 はここに到達しない（treat404AsSuccess で吸収済み）
      setToast(`解除に失敗 (${e.status})`);
      return;
    }
    setToast(`解除に失敗 (unknown)`);
  }
};
```

**重要**: `treat404AsSuccess` 適用時の `useAdminMutation.ts:240-246` の挙動を再確認すると、404 ブランチでは `policy.toast` を `toast()` に渡したあと `await options?.onSuccess?.(undefined as T)` を呼び、`return undefined as T` で resolve する。したがって 404 経路は `await trigger(...)` が **resolve** する（reject しない）。一方、`useAdminMutation` の `toast` は内部の `useToast()` から取得されており、`MeetingAttendancePanel` 側の `setToast` とは **別系統** である。

これは設計上の課題: `treat404AsSuccess.toast` は `useToast()` 経由で出力され、panel 側の `data-testid="toast"` を持つ `<p role="status">` には現れない。spec の B2 で `screen.findByText("既に解除済みです")` を assert する場合、`useToast()` の DOM 表現を考慮する必要がある。

### 2.3 toast チャネル統合の方針

`apps/web/src/components/ui/Toast.tsx` の `useToast()` 実装を Phase 4 で再確認し、以下のいずれかを採用する:

- 方針 α: `useToast()` のレンダリング先（`<ToastViewport>` 等）が DOM 内に存在し `screen.findByText` で取得可能なら、B2 は `useToast` 側の toast を assert する。
- 方針 β: `useToast()` の toast が test 環境で reachable でない場合、`unregisterMutation` の `onSuccess` callback で `setToast("既に解除済みです")` を panel local state にも反映させる。具体実装:

```typescript
const unregisterMutation = useAdminMutation<unknown>(
  endpoint,
  "POST",
  {
    refreshOnSuccess: false,
    treat404AsSuccess: { toast: "既に解除済みです" },
    onSuccess: () => {
      // 200 経路で呼ばれる + treat404AsSuccess で 404 経路でも呼ばれる
      // local toast は呼び出し側で setToast するため、ここでは何もしない
    },
  },
);
```

ただし `useAdminMutation.ts:243` で `onSuccess` は 200 経路でも呼ばれるため、404 ブランチ専用の hook が必要。Phase 4 実装時に以下のシンプル戦略を採用する:

**最終採用戦略**: `onUnregister` 内で 200 経路の toast を `setToast` で出す。404 経路は `treat404AsSuccess.toast` で `useToast()` 経由で出る + `useAdminMutation` の `onSuccess` callback 内で **`registered` Set の削除と panel local toast を引き起こす**。

```typescript
const unregisterMutation = useAdminMutation<unknown>(
  `/api/admin/meetings/${encodeURIComponent(detail.sessionId)}/attendances`,
  "POST",
  {
    refreshOnSuccess: false,
    treat404AsSuccess: { toast: "既に解除済みです" },
    onSuccess: () => {
      // 200 でも 404-as-success でも呼ばれる。lastTriggered memberId を ref で保持する戦略
      // → panel 側でラップし trigger 直前に latest memberId を ref に書く
    },
  },
);
```

**簡素化**: `useAdminMutation` の `treat404AsSuccess.toast` が `useToast()` 経由で表示される事実を尊重し、panel 側の `data-testid="toast"` には 200 / 5xx のみを書く。spec B2 では `useToast()` のレンダリング DOM を `screen.findByText` で拾う。これは `useToast` の実装次第のため、**Phase 4 実装時に最初に `Toast.tsx` を Read して `getByText` 経由で reachable か確認する** ことを DoD に追加する。

## 3. 入出力契約（CONST_005 §3）

### 3.1 unregister mutation の入出力

| input | output |
|---|---|
| `payload: { memberId: string, attended: false }` | 200: `{ ok: true, attended: false }` |
|  | 404: `treat404AsSuccess` で `undefined` を resolve（toast 副作用あり） |
|  | 5xx / network: `FetchAuthedError` を throw |

### 3.2 UI 状態変化

| event | `registered` Set | toast |
|---|---|---|
| unregister 200 | `delete(memberId)` | `"出席を解除しました"` (panel local) |
| unregister 404 | `delete(memberId)`（`onSuccess` 経由） | `"既に解除済みです"` (`useToast` 経由) |
| unregister 5xx | 不変 | `"解除に失敗 (${status})"` (panel local) |

## 4. spec B1..B5 完全骨子（CONST_005 §4）

既存 spec の末尾（line 145 直前、`describe` 内）に以下を追加する。

```tsx
  it("B1: 出席解除 button click で POST attended:false 発火 + Set 削除 + toast", async () => {
    fetchMock.mockResolvedValueOnce(ok());
    render(<MeetingAttendancePanel detail={detail} />);
    const m2Unreg = screen
      .getAllByTestId("attendance-unregister")
      .find((b) => (b as HTMLElement).getAttribute("data-member") === "m2")!;
    fireEvent.click(m2Unreg);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/meetings/s1/attendances",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"attended":false'),
        }),
      );
    });
    expect(await screen.findByText("出席を解除しました")).toBeTruthy();
    // m2 行の register button が data-registered="false" に反転
    const m2Reg = screen
      .getAllByTestId("attendance-register")
      .find((b) => (b as HTMLElement).getAttribute("data-member") === "m2")!;
    await waitFor(() => {
      expect(m2Reg.getAttribute("data-registered")).toBe("false");
    });
  });

  it("B2: 解除 404 で『既に解除済みです』 toast + Set 削除（treat404AsSuccess）", async () => {
    fetchMock.mockResolvedValueOnce(err(404, "attendance_not_found"));
    render(<MeetingAttendancePanel detail={detail} />);
    const m2Unreg = screen
      .getAllByTestId("attendance-unregister")
      .find((b) => (b as HTMLElement).getAttribute("data-member") === "m2")!;
    fireEvent.click(m2Unreg);
    expect(await screen.findByText("既に解除済みです")).toBeTruthy();
    const m2Reg = screen
      .getAllByTestId("attendance-register")
      .find((b) => (b as HTMLElement).getAttribute("data-member") === "m2")!;
    await waitFor(() => {
      expect(m2Reg.getAttribute("data-registered")).toBe("false");
    });
  });

  it("B3: 解除 500 で『解除に失敗 (500)』 toast + Set 不変", async () => {
    fetchMock.mockResolvedValueOnce(err(500));
    render(<MeetingAttendancePanel detail={detail} />);
    const m2Unreg = screen
      .getAllByTestId("attendance-unregister")
      .find((b) => (b as HTMLElement).getAttribute("data-member") === "m2")!;
    fireEvent.click(m2Unreg);
    expect(await screen.findByText("解除に失敗 (500)")).toBeTruthy();
    const m2Reg = screen
      .getAllByTestId("attendance-register")
      .find((b) => (b as HTMLElement).getAttribute("data-member") === "m2")!;
    expect(m2Reg.getAttribute("data-registered")).toBe("true");
  });

  it("B4: register mutation は treat404AsSuccess を持たない（404 が failure を維持）", async () => {
    fetchMock.mockResolvedValueOnce(err(404, "member_not_found"));
    render(<MeetingAttendancePanel detail={detail} />);
    const m1Reg = screen
      .getAllByTestId("attendance-register")
      .find((b) => (b as HTMLElement).getAttribute("data-member") === "m1")!;
    fireEvent.click(m1Reg);
    expect(await screen.findByText("開催日または会員が見つかりません")).toBeTruthy();
    // 既に解除済みです が出ないことも確認（隔離契約）
    expect(screen.queryByText("既に解除済みです")).toBeNull();
  });

  it("B5: registered=false 行に unregister button が存在しない（案 A' 確定）", () => {
    render(<MeetingAttendancePanel detail={detail} />);
    const unregs = screen.queryAllByTestId("attendance-unregister");
    // 初期は m2 のみ registered=true → unregister button は 1 個だけ
    expect(unregs).toHaveLength(1);
    expect(unregs[0].getAttribute("data-member")).toBe("m2");
  });
```

## 5. MeetingAttendancePanel.tsx 完全 after コード（差分の正本）

`useToast` reachability を Phase 4 着手時に確認し、panel local `setToast` で 404 も同期する保険を入れる。最終コードは以下を base とする:

```tsx
"use client";
import { useState } from "react";
import { useAdminMutation } from "../../../../../src/features/admin/hooks/useAdminMutation";
import { FetchAuthedError } from "../../../../../src/lib/fetch/errors";

interface Candidate { memberId: string; fullName: string; isDeleted?: boolean; }
interface Detail {
  sessionId: string; title: string; heldOn: string;
  candidates: Candidate[]; attendees: Array<{ memberId: string }>;
}

export function MeetingAttendancePanel({ detail }: { readonly detail: Detail }) {
  const [registered, setRegistered] = useState<Set<string>>(
    new Set(detail.attendees.map((a) => a.memberId)),
  );
  const [toast, setToast] = useState<string | null>(null);
  const endpoint = `/api/admin/meetings/${encodeURIComponent(detail.sessionId)}/attendances`;

  const registerMutation = useAdminMutation<unknown>(endpoint, "POST", { refreshOnSuccess: false });

  const unregisterMutation = useAdminMutation<unknown>(endpoint, "POST", {
    refreshOnSuccess: false,
    treat404AsSuccess: { toast: "既に解除済みです" },
    onSuccess: () => {
      // 200 / 404-as-success の双方で呼ばれる。memberId は ref 経由
      const mid = lastUnregisterRef.current;
      if (mid) {
        setRegistered((s) => { const n = new Set(s); n.delete(mid); return n; });
      }
    },
  });
  const lastUnregisterRef = useRef<string | null>(null);

  const onRegister = async (memberId: string) => { /* 既存実装 無改変 */ };

  const onUnregister = async (memberId: string) => {
    if (!registered.has(memberId)) { setToast("未登録です"); return; }
    lastUnregisterRef.current = memberId;
    try {
      await unregisterMutation.trigger({ memberId, attended: false });
      // 200 で到達。404-as-success も resolve するためここに来るが、文言を分離する必要がある
      // 判定: useToast 側の "既に解除済みです" は別 channel。ここでは 200 のときだけ "出席を解除しました"
      // → trigger の戻り値（200 = data, 404 = undefined）で判定不可（両者 undefined）
      // → 解決策: Set 削除は onSuccess で済むため、setToast はここで 200 用に出すと 404 でも出てしまう
      // → 最終戦略: panel local toast を 200 用に setToast、404 は useToast 側で表示。
      //   ただし spec B2 が panel toast を見るため、`useToast` を panel 内でも render させるか、
      //   `treat404AsSuccess.toast` の文言を panel setToast に二重書きする必要あり。
      // 簡素化: 404 status の検出を useAdminMutation 戻り値で不可なため、
      //   onSuccess callback 内で `if (last response was 404) setToast(...)` の方法も不可。
      // → 採用: treat404AsSuccess を解除し、catch ブロックで status===404 を判定し setToast する。
      setToast("出席を解除しました");
    } catch (e) {
      if (e instanceof FetchAuthedError) {
        if (e.status === 404) { /* unreachable: treat404AsSuccess で resolve */ }
        setToast(`解除に失敗 (${e.status})`);
        return;
      }
      setToast(`解除に失敗 (unknown)`);
    }
  };

  return (
    <section aria-labelledby="meeting-detail-h">
      <h1 id="meeting-detail-h">{detail.heldOn} — {detail.title}</h1>
      {toast && <p role="status" data-testid="toast">{toast}</p>}
      <ul data-testid="admin-meetings-table">
        {detail.candidates.filter((c) => !c.isDeleted).map((c) => (
          <li key={c.memberId} data-testid="attendance-candidate" data-member={c.memberId}>
            {c.fullName} ({c.memberId})
            <button type="button" data-testid="attendance-register" data-member={c.memberId}
              data-registered={registered.has(c.memberId) ? "true" : "false"}
              onClick={() => onRegister(c.memberId)}>
              {registered.has(c.memberId) ? "登録済" : "出席登録"}
            </button>
            {registered.has(c.memberId) && (
              <button type="button" data-testid="attendance-unregister" data-member={c.memberId}
                onClick={() => onUnregister(c.memberId)}>出席解除</button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

### 5.1 設計判断: panel local toast 二重化

`treat404AsSuccess.toast` が `useToast()` 経由で表示されるが、panel 内に `<ToastViewport>` がない場合 spec から見えない。最終採用は **panel 内で 404 専用パスを `setToast` で表示する** ため、`treat404AsSuccess` を spec から検証可能にする以下の戦略を採る:

- `treat404AsSuccess` を **使わず**、`onUnregister` catch ブロックで `e.status === 404` のとき panel local `setToast("既に解除済みです")` + Set 削除を行う、というシンプル戦略に切り替える。

これは issue 元設計の「`treat404AsSuccess` policy を caller へ配線」とは異なる実装になるが、**機能要件としては等価**（404 → success-relaxation, idempotent sink 化）。Phase 4 実装時に `Toast.tsx` の reachability を再確認し、`useToast` が spec から見えるなら `treat404AsSuccess` 採用、見えないなら catch-side 実装を採用する。**両戦略の AC への影響は同一**（B1..B5 が全 pass する）。

`treat404AsSuccess` 採用を強く優先する（issue #911 趣旨に合致）。Phase 4 着手時に最初に `apps/web/src/components/ui/Toast.tsx` を Read することを DoD §7-(0) として明記する。

## 6. 実行コマンド（CONST_005 §5）

```bash
# Phase 4 実装後の検証コマンド
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- MeetingAttendancePanel

# diff 確認
git diff --stat apps/api/                                                         # 0 lines 期待
git diff --stat apps/web/app/\(admin\)/admin/meetings/\[id\]/                     # 2 ファイル
```

## 7. DoD（CONST_005 §6）

| ID | 完了条件 |
|---|---|
| DoD-0 | Phase 4 着手時に `apps/web/src/components/ui/Toast.tsx` を Read し、`useToast()` の DOM reachability を確認した上で戦略（treat404AsSuccess vs catch-side）を確定する |
| DoD-1 | `MeetingAttendancePanel.tsx` に `unregisterMutation` と `onUnregister` が追加されている |
| DoD-2 | 案 A' の DOM（registered=true 行にのみ unregister button）が描画されている |
| DoD-3 | 既存 `registerMutation` / `onRegister` / 既存 button DOM が無改変 |
| DoD-4 | `MeetingAttendancePanel.spec.tsx` に B1..B5 が追加されている |
| DoD-5 | 既存 A1..A8 spec が全件 pass のまま |
| DoD-6 | `pnpm typecheck` が 0 error |
| DoD-7 | `pnpm lint` が 0 error |
| DoD-8 | `pnpm --filter @ubm-hyogo/web test -- MeetingAttendancePanel` が 0 fail（13 ケース all pass） |
| DoD-9 | `git diff --stat apps/api/` が 0 lines |
| DoD-10 | `git diff --stat apps/web/` の差分が 2 ファイル（panel + spec） |
| DoD-11 | AC-1..AC-9 すべて Phase 9 evidence で green |

## 8. Phase 4 完了条件

- [x] CONST_005 §1 変更ファイル一覧（2 ファイル / `apps/api` 無差分）を確定
- [x] §2 関数シグネチャ（unregisterMutation 宣言 + onUnregister ハンドラ）を確定
- [x] §3 入出力契約（200 / 404 / 5xx の UI 状態変化）を確定
- [x] §4 spec B1..B5 完全骨子を提示
- [x] §5 実行コマンド一覧
- [x] §6 DoD-0..DoD-11 を確定
- [x] toast チャネル課題（useToast vs panel local）を識別し DoD-0 で着手時確認を必須化

## 9. 次 Phase への引き継ぎ

Phase 5 では本 Phase 確定の after コードを base に、(a) DoD-0 の `Toast.tsx` reachability 確認、(b) `treat404AsSuccess` 採用 / catch-side fallback の最終確定、(c) 実装適用、(d) 既存 A1..A8 + 新規 B1..B5 の vitest 実行で all green を確認、までを実施する。Gate-B 提示は Phase 9 で行う。
