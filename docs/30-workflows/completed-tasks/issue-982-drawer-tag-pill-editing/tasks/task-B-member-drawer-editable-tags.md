# task-B — MemberDrawer 編集可能化 + web API client

[実装区分: 実装仕様書]

`MemberDrawer` の tag pill を disabled 表示から編集可能 UI へ昇格させ、task-A の endpoint に `useAdminMutation` 経由で接続する。

> **実コード照合済み（2026-05-29）**: `useAdminMutation(endpoint, method, options)` は positional 引数。`trigger(payload, endpointOverride?: string)`。`options` に `onOptimistic` は **無い**（楽観更新は component の local state + `onError` rollback で実装）。`treat404AsSuccess` は `false | "silent" | { toast }`。`idempotencyKey` / `successMessage` / `onSuccess` / `onError` / `refreshOnSuccess` あり。TagPill は `apps/web/src/features/admin/components/_shared/TagPill.tsx`。

## 依存

task-A の endpoint（`GET/POST /members/:memberId/tags` → `MemberTagsResponse`、`DELETE` → 204）。

## 変更対象ファイル

| パス | 種別 | 内容 |
| --- | --- | --- |
| `apps/web/src/features/admin/api/members.ts` | 編集 | `fetchMemberTags` / `assignMemberTag` / `unassignMemberTag` + 型追加 |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | 編集 | `ALL_TAGS` 撤去 → available fetch、tag pill 編集可能化 |
| `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tags.spec.tsx` | 新規 | 編集インタラクション spec |

## web API client（`features/admin/api/members.ts`）

```ts
export type AdminTagRef = { tagId: string; code: string; label: string; category: string };
export type MemberTagsResult = { assigned: AdminTagRef[]; available: AdminTagRef[] };

export async function fetchMemberTags(memberId: string): Promise<MemberTagsResult>;
export async function assignMemberTag(memberId: string, tagId: string): Promise<MemberTagsResult>;
export async function unassignMemberTag(memberId: string, tagId: string): Promise<void>;
```

- 既存 admin fetch ラッパー（`apps/web/src/lib/admin/server-fetch.ts` の `fetchAdmin` 等）を踏襲。D1 直接アクセス禁止（invariant #1）。
- `fetchMemberTags` は `MemberDrawer` の GET で使う。POST/DELETE mutation は `useAdminMutation` に endpoint/method/options を渡す標準 fetch 経路を正とし、`Idempotency-Key` は hook の `idempotencyKey` option で付与する。

## useAdminMutation 配線（実シグネチャ / invariant #10）

```ts
import { useAdminMutation } from "@/features/admin/hooks/useAdminMutation";

const [assigned, setAssigned] = useState<AdminTagRef[]>(initialAssigned);
const [available, setAvailable] = useState<AdminTagRef[]>([]);
const [pendingTagId, setPendingTagId] = useState<string | null>(null);

// 付与
const assign = useAdminMutation<MemberTagsResult>(
  `/admin/members/${memberId}/tags`,
  "POST",
  {
    idempotencyKey: () => crypto.randomUUID(),
    onSuccess: (res) => setAssigned(res.assigned),     // 確定
    onError: () => setAssigned(rollbackRef.current),   // rollback
    successMessage: "タグを追加しました",
    refreshOnSuccess: false,                            // drawer local state を正とする
  },
);

// 解除（DELETE は endpointOverride で tagId を path に含める）
const unassign = useAdminMutation<void>(
  `/admin/members/${memberId}/tags`,
  "DELETE",
  {
    idempotencyKey: () => crypto.randomUUID(),
    treat404AsSuccess: "silent",                        // 未存在 404 を静かに成功扱い（冪等）
    onError: () => setAssigned(rollbackRef.current),
    successMessage: "タグを削除しました",
    refreshOnSuccess: false,
  },
);
```

### pill click ハンドラ（楽観更新 + rollback）

```ts
function onToggle(tag: AdminTagRef) {
  if (pendingTagId) return;                              // 二重発火防止
  const selected = assigned.some((a) => a.tagId === tag.tagId);
  rollbackRef.current = assigned;                        // rollback 用に現 state 退避
  setPendingTagId(tag.tagId);
  if (selected) {
    setAssigned((cur) => cur.filter((a) => a.tagId !== tag.tagId));   // 楽観削除
    unassign.trigger(undefined, `/admin/members/${memberId}/tags/${tag.tagId}`)
      .finally(() => setPendingTagId(null));
  } else {
    setAssigned((cur) => [...cur, tag]);                 // 楽観追加
    assign.trigger({ tagId: tag.tagId })
      .finally(() => setPendingTagId(null));
  }
}
```

> `trigger` の第2引数は endpoint override 文字列そのもの。オブジェクト `{ endpointOverride }` は渡さない。

## MemberDrawer 編集化（現状 `MemberDrawer.tsx:158-189` の置換）

1. `ALL_TAGS` ハードコード（`MemberDrawer.tsx:24`）を撤去。
2. drawer open 時 `fetchMemberTags(memberId)` で `{ assigned, available }` 取得 → state 初期化（loading / error state を持つ）。
3. `available` を pill 一覧として描画。`selected = assigned.some(a => a.tagId === t.tagId)`。
4. `<TagPill selected={selected} onClick={() => onToggle(t)} disabled={pendingTagId === t.tagId}>{t.label}</TagPill>`（`disabled` 固定と `title="タグ編集は別タスクで対応予定"` を撤去）。
5. 「タグ管理へ」リンク（`/admin/tags?memberId=...`）は維持。

### TagPill props（`_shared/TagPill.tsx`）

`{ children, selected?, onClick?, disabled?, title? }`。`onClick` を渡し、`disabled` は pending 制御のみ。新規 `<input>` 追加なし（invariant #9 抵触なし）。色は token のみ（invariant #5）。

## テスト方針（task-B 分）

`MemberDrawer.tags.spec.tsx`（Vitest + Testing Library。`fetchMemberTags` と `useAdminMutation` を mock）:

| ID | ケース | expected |
| --- | --- | --- |
| B-T1 | drawer open → available pill 描画 | `available` 件数分の pill。disabled でない |
| B-T2 | 未選択 pill click | POST mutation 発火 + 楽観的に selected 化 |
| B-T3 | 選択済み pill click | DELETE mutation 発火 + 楽観的に非 selected 化 |
| B-T4 | assign 失敗（onError） | rollback（selected 戻る）+ error toast |
| B-T5 | unassign 失敗（onError） | rollback + error toast |
| B-T6 | pending 中の同 pill | disabled（二重発火防止） |
| B-T7 | idempotency-key | mutation の `idempotencyKey` option が truthy（header 付与経路） |
| B-T8 | GET 失敗 | error 表示・クラッシュしない |

> **props/state 区別（VSCPKR-03）**: `assigned` / `available` / `pendingTagId` はすべて `MemberDrawer` の internal state。fetch mock 解決後に pill 操作する。`useAdminMutation` mock は `onError`/`onSuccess` を呼べる形にする。

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer.tags
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## DoD（task-B）

- B-T1〜B-T8 全 PASS
- `MemberDrawer.tsx` から tag pill の `disabled` 固定 + `ALL_TAGS` ハードコードが除去
- `useAdminMutation`（`@/features/admin/hooks/useAdminMutation`）経由（legacy import なし）
- HEX 直書きなし（token gate 通過）
- `pnpm typecheck` / `pnpm lint` green
