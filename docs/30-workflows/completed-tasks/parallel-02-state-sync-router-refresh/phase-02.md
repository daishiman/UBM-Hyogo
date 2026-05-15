# Phase 2: 設計

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 設計対象は 2 dialog component の `onSubmit` 内コード差分。本 Phase でシグネチャ・呼び出し順序・failure path を固定し、Phase 6 実装手順で diff 化する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | profile mutation 成功後の RequestPendingBanner 即時反映 |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | completed |

## 目的

Phase 1 で確定した採用案（revalidation = `router.refresh()` / 呼び出し位置 = dialog ローカル / 順序 = refresh → onSubmitted → onClose / failure では呼ばない）に基づき、関数シグネチャ・コード変更 diff・banner 即時反映フロー・race condition 回避戦略を Phase 2 設計成果物として固定する。

## 2-1. revalidation 戦略確定

```
[ dialog onSubmit ]
       │
       ▼
[ client helper: requestVisibilityChange / requestDelete ]
       │
       ▼  HTTP POST /api/me/visibility-request or /api/me/delete-request
[ apps/api Worker (既存・改変なし) ]
       │
       ▼  202 Accepted + QueueAccepted body
[ res.ok branch ]
       │
       ├─ 1) router.refresh()       ← Server Component 再 fetch を schedule
       ├─ 2) onSubmitted(res.accepted) ← parent callback（任意の local state 更新）
       └─ 3) onClose()              ← dialog を閉じて unmount
                │
                ▼
       [ Next.js App Router: /profile を SSR で再実行 ]
                │
                ▼  fetchAuthed<MeProfileResponse>("/me/profile") で新 pendingRequests 取得
       [ ProfilePage Server Component ]
                │
                ▼  props として RequestActionPanel に流入
       [ RequestActionPanel re-render ]
                │
                ▼  visibilityPending / deletePending を再評価
       [ RequestPendingBanner 出現（aria-live="polite"）]
```

`apps/web/app/profile/page.tsx` の `dynamic = "force-dynamic"` + `revalidate = 0` により、`router.refresh()` は ISR cache を経由せず確実に server fetch を起こす（Phase 1 既存資産インベントリで確認済）。

## 2-2. 関数シグネチャ（変更前 / 変更後）

### VisibilityRequestDialog.tsx

#### 変更前（apps/web/app/profile/_components/VisibilityRequestDialog.tsx:66-96 抜粋）

```ts
const onSubmit = async () => {
  if (reason.length > REASON_MAX_LENGTH) {
    setError("INVALID_REQUEST");
    return;
  }
  setPending(true);
  try {
    const res = await requestVisibilityChange({
      desiredState,
      ...(reason.length > 0 ? { reason } : {}),
    });
    if (res.ok) {
      onSubmitted(res.accepted);
      onClose();
    } else {
      if (res.code === "DUPLICATE_PENDING_REQUEST") {
        onSubmitted({
          queueId: "existing-pending",
          type: "visibility_request",
          status: "pending",
          createdAt: new Date().toISOString(),
        });
      }
      setError(res.code);
    }
  } catch (err) {
    setError(err instanceof AuthRequiredError ? "UNAUTHORIZED" : "SERVER");
  } finally {
    setPending(false);
  }
};
```

#### 変更後

import に `useRouter` を追加し、component 関数の冒頭で `const router = useRouter();` を宣言。`onSubmit` の success branch のみ以下のように変更:

```ts
// imports
import { useRouter } from "next/navigation";

// inside component
const router = useRouter();

// onSubmit success branch (変更箇所)
if (res.ok) {
  router.refresh();              // 1) Server Component 再 fetch を schedule
  onSubmitted(res.accepted);     // 2) parent callback（任意の local state 更新）
  onClose();                     // 3) dialog を閉じる（unmount は最後）
}
```

その他の branch（`else` / `catch`）は変更しない。`router.refresh()` を呼ばないことで、failure case では server 往復を発生させない。

### DeleteRequestDialog.tsx

#### 変更前（apps/web/app/profile/_components/DeleteRequestDialog.tsx:59-87 抜粋）

```ts
const onSubmit = async () => {
  if (!confirmed) return;
  if (reason.length > REASON_MAX_LENGTH) {
    setError("INVALID_REQUEST");
    return;
  }
  setPending(true);
  try {
    const res = await requestDelete(reason.length > 0 ? { reason } : {});
    if (res.ok) {
      onSubmitted(res.accepted);
      onClose();
    } else {
      if (res.code === "DUPLICATE_PENDING_REQUEST") {
        onSubmitted({
          queueId: "existing-pending",
          type: "delete_request",
          status: "pending",
          createdAt: new Date().toISOString(),
        });
      }
      setError(res.code);
    }
  } catch (err) {
    setError(err instanceof AuthRequiredError ? "UNAUTHORIZED" : "SERVER");
  } finally {
    setPending(false);
  }
};
```

#### 変更後

VisibilityRequestDialog と同じパターン:

```ts
import { useRouter } from "next/navigation";

const router = useRouter();

// onSubmit success branch
if (res.ok) {
  router.refresh();
  onSubmitted(res.accepted);
  onClose();
}
```

## 2-3. 入出力・副作用

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `VisibilityRequestDialog.onSubmit` | reason (string), desiredState (props) | void | `requestVisibilityChange` HTTP POST / success 時に `router.refresh()` で server fetch / `onSubmitted` 経由 parent state 更新 / `onClose` 経由 dialog unmount |
| `DeleteRequestDialog.onSubmit` | reason (string), confirmed (boolean) | void | `requestDelete` HTTP POST / success 時に `router.refresh()` で server fetch / `onSubmitted` / `onClose` |

## 2-4. race condition 回避（呼び出し順序固定）

| 順序 | 動作 | 理由 |
| --- | --- | --- |
| 1) `router.refresh()` | 同期 API で server re-fetch を scheduling | dialog が mount 中に schedule することで「unmounted component から navigation 呼び出し」warning を回避 |
| 2) `onSubmitted(res.accepted)` | parent callback | `RequestActionPanel.onSubmitted` は accepted response を bridge state として保持し、refresh 完了まで banner を表示する |
| 3) `onClose()` | dialog state を閉じる | unmount は最後。textarea 等の child component から navigation 呼び出しが残存しないことを保証 |

## 2-5. failure path での挙動（CONDITIONAL 解消）

| branch | 条件 | router.refresh 呼び出し | 理由 |
| --- | --- | --- | --- |
| `if (res.ok)` | mutation 成功 | **呼ぶ** | server state を即時反映するため |
| `else if (res.code === "DUPLICATE_PENDING_REQUEST")` | 409 | **呼ばない** | 既に local 側で `onSubmitted({ queueId: "existing-pending", ... })` を injection 済（spec.md line 81-88） |
| `else` | 422 / その他 | **呼ばない** | server state は変化していない |
| `catch (err)` | network error / `AuthRequiredError` | **呼ばない** | server に到達していない / 認可エラー |

## 2-6. banner 即時反映フロー

1. `/me/profile` Server Component が `pendingRequests.visibility` または `pendingRequests.delete` を含む新 response を返す
2. `RequestActionPanel` の `pendingRequests` prop が更新される
3. `visibilityPending` / `deletePending` の memo 評価が走り、object が non-null になる
4. `RequestPendingBanner` が render される
5. `aria-live="polite"` 属性により screen reader が読み上げる

## 2-7. 不変条件確認

| 不変条件 | 影響 | 確認 |
| --- | --- | --- |
| 既存 API endpoint 不変 | endpoint への変更なし | PASS |
| OKLch tokens 無関係 | 色変更なし | PASS |
| D1 直接アクセス禁止 | `apps/web` から D1 binding 呼び出しなし | PASS |
| `apps/web` 限定 | `apps/api` 変更なし | PASS |
| テストファイル拡張子 | 新規は `*.spec.tsx` のみ | PASS |
| 順序固定 | refresh → onSubmitted → onClose | PASS |
| server state 正本 | 楽観的 UI 採用なし | PASS |

## 2-8. 設計判断

| 判断 | 理由 |
| --- | --- |
| dialog ローカルで `useRouter()` を呼ぶ | dialog の成功要件として banner 反映を内包し、parent callback 依存を減らす |
| 呼び出し順序を refresh → onSubmitted → onClose に固定 | `onClose` による unmount 後の navigation API 警告を確実に回避 |
| failure branch では refresh を呼ばない | 不要な server 往復を防ぎ、429 risk を増やさない |
| `RequestActionPanel.tsx` の既存 refresh は削除 | Phase 10 で dialog local refresh に一本化し、parent は bridge state に限定 |
| `useRouter` import は `next/navigation` から（既存 RequestActionPanel と同一） | Next.js App Router 標準 |
| optimistic update は採用しない | spec.md S1 「server state を正本にする」方針に従う |

## 実行タスク

- [ ] Phase 1 採用案 4 件を Phase 2 設計の前提として明記する
- [ ] 変更前 / 変更後の関数シグネチャを 2 dialog 分提示する
- [ ] 呼び出し順序固定の根拠を race condition 観点で記録する
- [ ] failure path で refresh を呼ばない方針を branch ごとに明記する
- [ ] banner 即時反映のシーケンスを ASCII 図で図示する
- [ ] 不変条件 7 件の影響を確認する
- [ ] `outputs/phase-02/design.md` を作成する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/requirements.md | Phase 1 採用案の前提 |
| 必須 | apps/web/app/profile/_components/VisibilityRequestDialog.tsx | 変更前コード |
| 必須 | apps/web/app/profile/_components/DeleteRequestDialog.tsx | 変更前コード |
| 必須 | apps/web/app/profile/_components/RequestActionPanel.tsx | onSubmitted callback の挙動確認 |
| 参考 | https://nextjs.org/docs/app/api-reference/functions/use-router | useRouter API |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/design.md | 設計主成果物（シグネチャ・順序・failure path・不変条件・設計判断） |

## 完了条件

- [ ] 変更前 / 変更後コードが 2 dialog 分明記されている
- [ ] 呼び出し順序固定の根拠が記録されている
- [ ] failure path 4 branch の挙動が表で固定されている
- [ ] 不変条件 7 件への影響が確認されている
- [ ] `outputs/phase-02/design.md` が作成されている

## タスク 100% 実行確認【必須】

- 全実行タスク completed
- 設計判断 6 件が記録されている
- CONDITIONAL（運用性）が failure path で refresh しない設計として解消されている

## 次 Phase

- 次: 3 (設計レビュー)
- 引き継ぎ事項:
  - 設計 GO/NO-GO 判定基準（不変条件 7 件 / 設計判断 6 件 / failure path 4 branch）
  - 重複 `router.refresh()` の Phase 10 申し送り
- ブロック条件: 設計 diff が 2 dialog 分揃っていない場合は Phase 3 に進まない
