# Implementation Guide

## Part 1: 中学生レベル

申請ボタンを押したあと、画面の「申請を受け付けました」という札がすぐ出ないと、使う人は「本当に届いたのかな」と不安になります。これは、郵便を出したのに受付票がすぐ渡されない状態に似ています。

今回の修正では、申請が成功したら先に画面へ「最新情報を取りに行って」と合図し、そのあと受付票を表示して、最後に小さな入力画面を閉じます。失敗したときは最新情報を取りに行きません。すでに申請中だった場合だけは、申請中の札も表示して、重複申請のエラーを一緒に見せます。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| mutation | 申請を送ること |
| router.refresh() | 最新情報を取り直す合図 |
| dialog | 前面に出る小さな入力画面 |
| server state | 共有元にある本当の状態 |
| banner | 画面に出るお知らせ札 |

## Part 2: 技術契約

| 項目 | 内容 |
| --- | --- |
| 変更対象 | `VisibilityRequestDialog.tsx`, `DeleteRequestDialog.tsx`, `RequestActionPanel.tsx` |
| success branch | `router.refresh(); onSubmitted(res.accepted); onClose();` |
| failure branch | `router.refresh()` を呼ばない |
| 409 branch | accepted response 相当を `onSubmitted` へ渡し、refresh なしで banner bridge と重複エラーを表示 |
| parent callback | `RequestActionPanel` は `QueueAccepted` を受け、server `pendingRequests` が到着するまで local bridge state を使う |
| API / D1 | 変更なし |

## Part 3: 変更ファイル一覧（CONST_005）

| 種別 | パス | 行数変更 | 役割 |
| --- | --- | --- | --- |
| modified | `apps/web/app/profile/_components/VisibilityRequestDialog.tsx` | +2 / -0 | `useRouter` import + 宣言 + success branch 先頭に `router.refresh()` 追加 |
| modified | `apps/web/app/profile/_components/DeleteRequestDialog.tsx` | +2 / -0 | 同上 |
| modified | `apps/web/app/profile/_components/RequestActionPanel.tsx` | +28 / -8 | `router.refresh()` を削除し、`QueueAccepted` を受け取る `acceptedPending` bridge state + `pendingRequests` 到着時の破棄 effect に差し替え |
| modified | `apps/web/app/profile/_components/VisibilityRequestDialog.component.spec.tsx` | +41 / -1 | `useRouter` mock 追加 + TC-RR-01 / TC-RR-02 追加（409 の `refresh not called` を含む） |
| modified | `apps/web/app/profile/_components/DeleteRequestDialog.component.spec.tsx` | +59 / -0 | `useRouter` mock 追加 + TC-RR-03 / TC-RR-04 追加 |
| modified | `apps/web/app/profile/_components/RequestActionPanel.component.spec.tsx` | +68 / -1 | TC-U-12（bridge 表示） / TC-U-13（server snapshot 到着で bridge 破棄）追加 |

> 新規ファイル: なし（既存 6 ファイルの modification のみ）。
> `apps/api` / D1 schema / OKLch token / page directive (`dynamic = "force-dynamic"`) は変更なし。

## Part 4: 主要関数シグネチャ（変更前後）

### VisibilityRequestDialog.tsx / DeleteRequestDialog.tsx — `onSubmit` success branch

```ts
// before
if (res.ok) {
  onSubmitted(res.accepted);
  onClose();
}

// after
const router = useRouter();
// ...
if (res.ok) {
  router.refresh();        // (1) server state を再取得
  onSubmitted(res.accepted); // (2) parent へ accepted を伝播
  onClose();                 // (3) dialog unmount
}
```

### RequestActionPanel.tsx — `onSubmitted` シグネチャ

```ts
// before
const onSubmitted = () => { router.refresh(); };

// after
const onSubmitted = (accepted: QueueAccepted) => {
  setAcceptedPending((current) =>
    accepted.type === "visibility_request"
      ? { ...current, visibility: accepted }
      : { ...current, delete: accepted },
  );
};

useEffect(() => {
  if (pendingRequests === undefined) return;
  setAcceptedPending((current) => {
    if (!current.visibility && !current.delete) return current;
    const next = { ...current };
    delete next.visibility;
    delete next.delete;
    return next;
  });
}, [pendingRequests]);
```

## Part 5: 入出力・副作用

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `VisibilityRequestDialog.onSubmit` | `reason`, `desiredState`（state） | `Promise<void>` | success 時のみ `router.refresh()` 経由で `/profile` server component 再 fetch → `onSubmitted(accepted)` → `onClose()` |
| `DeleteRequestDialog.onSubmit` | `reason`, `confirmed`（state） | `Promise<void>` | 同上（`requestDelete` 経由） |
| `RequestActionPanel.onSubmitted` | `accepted: QueueAccepted` | `void` | `acceptedPending` local state に `visibility` または `delete` を格納（次の `pendingRequests` 到着まで保持） |
| `RequestActionPanel` useEffect | `pendingRequests` 変化 | `void` | server snapshot 到着時に bridge state を破棄して二重表示を防止 |

副作用なし: D1 / Cloudflare Secrets / wrangler binding / 外部 API。

## Part 6: テスト方針（spec 名 + assertion 一覧）

| spec | テスト ID | assertion 要旨 |
| --- | --- | --- |
| `VisibilityRequestDialog.component.spec.tsx` | TC-RR-01 | 202 success 時に `routerMock.refresh` が 1 回呼ばれる / 呼び出し順序が `refresh < onSubmitted < onClose` |
| 同上 | TC-RR-02（既存 409 拡張） | 409 時に `routerMock.refresh` が呼ばれない / accepted-shape を `onSubmitted` に渡す / `data-code="DUPLICATE_PENDING_REQUEST"` |
| 同上 | TC-U-05..11（既存） | non-regression |
| `DeleteRequestDialog.component.spec.tsx` | TC-RR-03 | 202 success 時の refresh 呼び出し + 順序固定 |
| 同上 | TC-RR-04 | 409 時 `routerMock.refresh` not called + alert 表示 |
| 同上 | TC-U-09 / TC-U-10 / TC-A-06（既存） | non-regression |
| `RequestActionPanel.component.spec.tsx` | TC-U-12 | dialog accepted を受けて banner (`role="status"`) が即時表示・hide button disabled |
| 同上 | TC-U-13 | `pendingRequests={}` rerender 後に bridge state が破棄され、`data-pending-type='visibility_request'` が消える |
| 同上 | TC-U-01..04 / TC-U-08..11（既存） | non-regression |
| Playwright `playwright/tests/profile-state-sync-router-refresh.spec.ts` | 5 screenshots | mutation 前 / dialog open / submit 直後 / banner 表示 / 退会同様の VISUAL evidence |

## Part 7: ローカル実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- VisibilityRequestDialog
mise exec -- pnpm --filter @ubm-hyogo/web test -- DeleteRequestDialog
mise exec -- pnpm --filter @ubm-hyogo/web test -- RequestActionPanel
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e -- profile-state-sync-router-refresh
```

## Part 8: 設計判断

| 判断 | 採用案 | 理由 |
| --- | --- | --- |
| `router.refresh()` の所在 | dialog ローカル（Option A） | dialog の成功要件として server 再 fetch を内包し、parent との二重 refresh を排除（spec.md S1） |
| 呼び出し順序 | `refresh → onSubmitted → onClose` 固定 | dialog unmount 後の `useRouter` 呼び出しによる React warning と race condition を回避 |
| bridge state の導入 | `RequestActionPanel` に `acceptedPending` を追加 | `router.refresh()` 完了までの空白フレームで banner が消える問題を解消。server snapshot 到着時に effect で自動破棄 |
| 409 例外時の挙動 | `refresh` を呼ばず、accepted-shape を `onSubmitted` に渡して duplicate error alert と pending banner を併存表示 | 不要な server 往復 / 429 risk を増やさず、既に pending 状態にあることをユーザーに即時提示 |
| 楽観的 UI | 採用しない | spec.md S1「server state を正本」方針を維持。bridge state は accepted response の限定的 echo であり、server snapshot で必ず破棄される |
| 共通 hook 化 | 行わず各 dialog で個別に `useRouter()` 呼び出し | React idiom に従う。bundle 影響は無視可能 |

## Part 9: 検証手順

1. `mise exec -- pnpm typecheck` → PASS（`QueueAccepted` import 追加 / `useRouter` 削除 / `useEffect` import 追加が型エラーなし）
2. `mise exec -- pnpm lint` → PASS（unused import なし）
3. `mise exec -- pnpm --filter @ubm-hyogo/web test` → 全 spec green（新規 TC-RR-01..04 / TC-U-12 / TC-U-13 含む）
4. `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e -- profile-state-sync-router-refresh` → screenshot 5 枚出力 (`apps/web/playwright/test-results/` → `outputs/phase-11/screenshots/` へ commit)
5. 手動検証（テストアカウント `manju.manju.03.28@gmail.com`）:
   - `/profile` 遷移 → banner 非表示
   - 公開停止 → 申請送信 → banner が page reload なしで即時表示
   - 退会申請も同様
   - 連続送信 (409) → duplicate error alert と pending banner が同時表示、`router.refresh` が呼ばれない（Network タブで確認）

## Part 10: ロールバック手順

| 範囲 | 手順 |
| --- | --- |
| コード | `git revert <merge_commit_hash>` で 6 ファイルを一括 revert（`apps/web/app/profile/_components/` 配下のみで自己完結） |
| 副作用 | `apps/api` / D1 / Cloudflare Secrets / wrangler 設定への変更なし。コード revert のみで完全に元状態に戻る |
| 部分 rollback | dialog 側の `router.refresh()` のみを残し、`RequestActionPanel` の bridge state のみを revert する選択肢も可。ただし banner の空白フレームが復活するため非推奨 |
| 検証 | revert 後に `pnpm typecheck && pnpm lint && pnpm --filter @ubm-hyogo/web test` を再実行し既存テストが green に戻ることを確認 |

## Part 11: DoD（Definition of Done）

- [x] `VisibilityRequestDialog.tsx` success branch で `router.refresh() → onSubmitted → onClose` 順
- [x] `DeleteRequestDialog.tsx` success branch で同様
- [x] failure branch（409 / 422 / network error）で `router.refresh()` が呼ばれない
- [x] `RequestActionPanel.tsx` から `router.refresh()` 呼び出しを削除し、`QueueAccepted` bridge state へ再構成
- [x] `pendingRequests` 到着時に bridge state を破棄する `useEffect` を追加
- [x] TC-RR-01 / TC-RR-02 / TC-RR-03 / TC-RR-04 / TC-U-12 / TC-U-13 green
- [x] 既存テスト non-regression（VisibilityRequestDialog 6 / DeleteRequestDialog 既存 / RequestActionPanel 12）green
- [ ] `mise exec -- pnpm typecheck` PASS（PR 作成時に再確認）
- [ ] `mise exec -- pnpm lint` PASS（PR 作成時に再確認）
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test` PASS（PR 作成時に再確認）
- [x] Playwright screenshot 5 枚取得（`outputs/phase-11/screenshots/`）
- [ ] PR 本文に screenshot 参照と本ガイド Part 3 / 8 / 9 / 10 を転記

## Test Commands

```bash
pnpm --filter @ubm-hyogo/web test -- RequestActionPanel.component.spec.tsx
pnpm typecheck
pnpm lint
```

Playwright screenshot evidence は `outputs/phase-11/screenshots/` に保存する。
