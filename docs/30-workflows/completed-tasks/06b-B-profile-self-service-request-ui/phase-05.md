# Phase 5: 実装ランブック — 06b-B-profile-self-service-request-ui

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-B-profile-self-service-request-ui |
| phase | 5 / 13 |
| wave | 06b-fu |
| mode | parallel（実依存は serial） |
| 作成日 | 2026-05-02 |
| taskType | feature（UI 実装スペック） |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 2 設計と Phase 4 テスト戦略をもとに、`apps/web` 上での実装を「触るファイル × 順序 × 検証コマンド」まで一意に決定する。
本仕様書段階では実装コード作成・commit・push・PR を行わない。実装本体は本ランブックに従って後続 task で実施する。

## 実行タスク

1. ファイル新規作成・既存編集の対象を確定し、import 方針・styling 方針・edge runtime 制約を明記する。完了条件: ステップ番号と対象ファイルが 1:1 対応する。
2. 各ステップに「TDD Red → Green」の対応 TC ID を紐付け、テスト先行で進む順序を確定する。完了条件: 全 component / helper に対応 TC が割り当たる。
3. Cloudflare Workers / OpenNext / edge runtime 上で `fetch` cookie 透過を維持するための注意点を明記する。完了条件: helper 実装が `fetchAuthed` を経由し、`Request` インスタンスを直接生成しない。
4. 実装後の typecheck / lint / unit / E2E 起動コマンドと PASS 条件を明記する。完了条件: 全コマンドと期待結果が表で確定する。
5. canUseTool / SDK callback は本タスク非該当のため省略し、代わりに「Server Component → Client Component の境界」を明記する。

## 参照資料

| 資料名 | パス |
| --- | --- |
| Phase 2 設計 | `outputs/phase-02/main.md` |
| Phase 4 テスト戦略 | `outputs/phase-04/main.md` |
| 既存 fetch helper | `apps/web/src/lib/fetch/authed.ts` |
| 既存 me 型 | `apps/web/src/lib/api/me-types.ts` |
| API zod schemas | `apps/api/src/routes/me/schemas.ts` |
| profile page | `apps/web/app/profile/page.tsx` |
| profile components | `apps/web/app/profile/_components/{StatusSummary,ProfileFields,EditCta,AttendanceList}.tsx` |
| Tailwind 設定 | `apps/web/tailwind.config.ts`（既存） |

## 実行手順

### ステップ0: 事前確認（baseline 取得）

```bash
mise exec -- pnpm --filter @ubm/web typecheck
mise exec -- pnpm --filter @ubm/web lint
mise exec -- pnpm --filter @ubm/web test --run
rg -n "request(Visibility|Delete)|RequestActionPanel|VisibilityRequestDialog|DeleteRequestDialog" apps/web/
```

- typecheck / lint / test がすべて GREEN であることを確認する。
- grep が 0 hit であること（既実装なし）。1 件以上 hit する場合は Phase 2 へ差し戻す。

### ステップ1: shared 型 re-export モジュール

| 種別 | パス | 内容 |
| --- | --- | --- |
| 新規 | `apps/web/src/lib/api/me-requests.types.ts` | `VisibilityRequestInput` / `DeleteRequestInput` / `QueueAccepted` / `RequestErrorCode` / `RequestResult` を `apps/api/src/routes/me/schemas.ts` の zod から `z.infer` 経由で再 export |

import 方針:
- `apps/api/src/routes/me/schemas.ts` がまだ `packages/shared` 化されていない場合は、当面 relative path で `import type` のみ参照（型のみ・ランタイム依存ゼロ）。Phase 12 で shared 化を follow-up 候補とする。
- `RequestErrorCode` は zod 由来ではなくこのファイルで定義する union 型（Phase 2 設計表のとおり）。

対応 TC: TC-I-01 / TC-I-02。

### ステップ2: client helper 実装

| 種別 | パス | 内容 |
| --- | --- | --- |
| 新規 | `apps/web/src/lib/api/me-requests.ts` | `requestVisibilityChange(input)` / `requestDelete(input)` を `fetchAuthed` 経由で実装 |
| 新規 | `apps/web/src/lib/api/__tests__/me-requests.test.ts` | TC-U-13..20 / TC-I-03..05 |

実装規約:
- `fetchAuthed<QueueAccepted>("/me/visibility-request", { method: "POST", body: JSON.stringify(input), headers: { "Content-Type": "application/json" } })` を呼ぶ。
- `try/catch` で `FetchAuthedError` を捕捉し、`status` から `RequestErrorCode` に変換して `{ ok: false, code, status }` を返す。
- `AuthRequiredError` は再 throw（Server Component 側で `redirect("/login?redirect=/profile")` が拾う規約と一致）。
- `TypeError` / `fetch failed` 等は `{ ok: false, code: "NETWORK" }`。
- URL は `"/me/visibility-request"` `"/me/delete-request"` の 2 文字列を **constants として定義**せず、helper 内に文字列リテラルで直書きする（不変条件 #11 を grep で検出しやすくするため）。

TDD 順序:
1. TC-U-13 を Red にする
2. helper を最小実装で Green
3. TC-U-14..20、TC-I-03..05 を順次 Red → Green
4. lint で `no-floating-promises` 違反を 0 にする

edge runtime 注意点:
- `fetch` のみ使用し、`node:*` を import しない。
- cookie 透過は `fetchAuthed` 内部に委譲（既存実装は `cookies()` から `Cookie` ヘッダを構築）。
- `Date.now()` 等の決定論性が必要な箇所はないため特殊対処なし。

対応 TC: TC-U-13..20 / TC-I-01..05。

### ステップ3: `RequestErrorMessage` component（共通 error 表示）

| 種別 | パス |
| --- | --- |
| 新規 | `apps/web/app/profile/_components/RequestErrorMessage.tsx`（client） |
| 新規 | `apps/web/app/profile/_components/__tests__/RequestErrorMessage.test.tsx` |

実装:
- props: `{ code: RequestErrorCode; onRetry?: () => void }`。
- `role="alert"` を root に付与。
- code → 文言マッピング表（Phase 2 と一致）を switch で実装。
- `NETWORK` / `SERVER` のみ `onRetry` ボタンを表示。

TDD: TC-U-11 を Red → Green。

### ステップ4: `RequestPendingBanner` component

| 種別 | パス |
| --- | --- |
| 新規 | `apps/web/app/profile/_components/RequestPendingBanner.tsx` |
| 新規 | `apps/web/app/profile/_components/__tests__/RequestPendingBanner.test.tsx` |

実装:
- props: `{ type: "visibility_request" | "delete_request"; createdAt?: string }`。
- `role="status"` + `aria-live="polite"`。
- type ごとに文言切替（Phase 2 表）。

TDD: TC-U-12。

### ステップ5: `VisibilityRequestDialog` component

| 種別 | パス |
| --- | --- |
| 新規 | `apps/web/app/profile/_components/VisibilityRequestDialog.tsx`（client） |
| 新規 | `apps/web/app/profile/_components/__tests__/VisibilityRequestDialog.test.tsx` |

実装:
- props: `{ desiredState: "hidden" | "public"; open: boolean; onClose: () => void; onSubmitted: (accepted: QueueAccepted) => void }`。
- 既存 UI ライブラリは未導入のため、**素の HTML `<dialog>` ではなく** Radix-style な独自 portal 実装か `headlessui/react` 導入を検討。MVP では既存依存に縛られず「軽量な独自 dialog」を実装する（focus trap / esc / overlay click を自前で）。
- form フィールドは `desiredState`（props 固定・hidden input なし）と任意 `reason`（`<textarea maxLength=500>`）のみ。氏名等の本文項目を **絶対に増やさない**（不変条件 #4）。
- submit:
  ```ts
  const [pending, startTransition] = useTransition();
  const onSubmit = () => {
    startTransition(async () => {
      const res = await requestVisibilityChange({ desiredState, reason });
      if (res.ok) { onSubmitted(res.accepted); onClose(); router.refresh(); }
      else { setError(res); }
    });
  };
  ```
- `aria-modal="true"`, `role="dialog"`, `aria-labelledby`, `aria-describedby` を必ず設定。

styling: TailwindCSS。専用 token は使わず既存 utility のみ。色は既存 profile section と統一。

TDD: TC-U-05..08 / TC-U-21。

### ステップ6: `DeleteRequestDialog` component

| 種別 | パス |
| --- | --- |
| 新規 | `apps/web/app/profile/_components/DeleteRequestDialog.tsx` |
| 新規 | `apps/web/app/profile/_components/__tests__/DeleteRequestDialog.test.tsx` |

実装:
- ステップ5 と同等の dialog 骨格 + 「不可逆性に同意」`<input type="checkbox" required>`。
- checkbox 未チェック時は submit button が `disabled`。
- 文言（Phase 2 表）「退会申請は管理者承認後に取り消せません」を `aria-describedby` で submit に関連付け。
- helper は `requestDelete` を呼ぶ。

TDD: TC-U-09 / TC-U-10 / TC-U-21。

### ステップ7: `RequestActionPanel` component

| 種別 | パス |
| --- | --- |
| 新規 | `apps/web/app/profile/_components/RequestActionPanel.tsx`（client） |
| 新規 | `apps/web/app/profile/_components/__tests__/RequestActionPanel.test.tsx` |

実装:
- props: `{ publishState: "public" | "hidden" | "unknown"; rulesConsent: "consented" | "pending" | "rejected" | "unknown" }`。
- `rulesConsent !== "consented"` の場合は panel 自体を return null（または案内メッセージ）。
- `publishState` に応じてボタンを切替（public → 公開停止、hidden → 再公開）。
- 退会ボタンは常時表示（consent 通過時のみ）。
- dialog の open state を 2 つ持つ（visibility / delete）。
- 申請成功時は local state `pendingType` を更新し、`<RequestPendingBanner>` を表示（楽観的更新ではなく「直近送信の受付確認」用途）。

TDD: TC-U-01..06 / TC-U-12。

### ステップ8: `apps/web/app/profile/page.tsx` への組込み

| 種別 | パス | 変更 |
| --- | --- | --- |
| 編集 | `apps/web/app/profile/page.tsx` | `<RequestActionPanel publishState={statusSummary.publishState} rulesConsent={statusSummary.rulesConsent} />` を `<EditCta />` の直後に配置 |

注意:
- `page.tsx` は **Server Component のまま**。`RequestActionPanel` のみが `"use client"`。
- 本文編集 UI は引き続き追加しない（不変条件 #4 を構造で守る）。

### ステップ9: E2E spec 追加

| 種別 | パス |
| --- | --- |
| 新規 | `apps/web/playwright/tests/profile-visibility-request.spec.ts` |
| 新規 | `apps/web/playwright/tests/profile-delete-request.spec.ts` |
| 編集 | 既存の `apps/web/playwright/fixtures/auth.ts`（06b-A 完了後に存在）を再利用 |

route stubbing:
```ts
await page.route("**/me/visibility-request", route =>
  route.fulfill({ status: 202, body: JSON.stringify({ queueId: "q1", type: "visibility_request", status: "pending", createdAt: new Date().toISOString() }) })
);
```

TDD: TC-E-01..09。

### ステップ10: 検証コマンド

```bash
mise exec -- pnpm --filter @ubm/web typecheck
mise exec -- pnpm --filter @ubm/web lint
mise exec -- pnpm --filter @ubm/web test --run
mise exec -- pnpm --filter @ubm/web exec playwright test e2e/profile/
mise exec -- pnpm --filter @ubm/web test --run --coverage
```

PASS 条件:

| コマンド | 期待 |
| --- | --- |
| typecheck | error 0 |
| lint | warning/error 0 |
| vitest | TC-U-01..21 / TC-I-01..05 / TC-A-01..06 全 PASS |
| playwright | TC-E-01..09 全 PASS（mock 経由） |
| coverage | Line ≥ 80%、Branch ≥ 60%、Function ≥ 80% |

### ステップ11: 不変条件 静的 grep（CI gate にも追加）

```bash
rg -n "name=\"(displayName|email|kana|address|phone)\"" apps/web/app/profile/_components/Request*.tsx   # 0 hit
rg -n "cloudflare:d1|D1Database" apps/web/                                                              # 0 hit
rg -n "/me/[^\"]*/[^\"]+" apps/web/src/lib/api/me-requests.ts                                           # 2 endpoints のみ
rg -n "responseId" apps/web/app/profile/_components/Request*.tsx                                        # 0 hit
```

すべて期待結果と一致しない場合は実装を差し戻す。

### ステップ12: 失敗時の自動修復方針（Phase 9 で再実行）

- typecheck 失敗: unused import / null 許容 / `z.infer` 同期破れを最小差分で修正
- lint 失敗: `pnpm lint --fix` を先に試す
- test 失敗: TC ID で原因切り分け、helper を疑う前に dialog form state を疑う
- E2E flaky: `patterns-testing.md` の「E2E 安定性 3 層」を適用（waitForSelector / waitForTimeout 100ms / domcontentloaded）

## 統合テスト連携

| Phase | 役割 |
| --- | --- |
| Phase 4 | TC ID 採番 |
| Phase 6 | 異常系シナリオ |
| Phase 9 | coverage / quality gate 評価 |
| Phase 11 | 実 staging に対する smoke と visual evidence |

## 多角的チェック観点（AIが判断）

- ステップ番号と触るファイルが 1:1 で対応しているか
- 各 component が "use client" の有無を明示しているか
- helper が `fetchAuthed` を経由し、`fetch` を直接呼んでいないか
- 不変条件 #4 / #5 / #11 の grep を CI gate 化しているか
- Server Component（`page.tsx`）境界を壊していないか
- 楽観的更新を導入していないか（不採用が正解）
- canUseTool / SDK callback は本タスク非該当である旨が明記されているか
- 未実装/未実測を PASS と扱っていないか

## サブタスク管理

- [ ] ステップ 0..12 を確定
- [ ] 各ステップに対応 TC ID を割当
- [ ] 検証コマンド表を確定
- [ ] 不変条件 grep を CI gate 計画に追加
- [ ] `outputs/phase-05/main.md` を作成

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 実装ランブック | `outputs/phase-05/main.md` | ステップ詳細 / TC 紐付け / 検証コマンド / grep gate |

## 完了条件

- [ ] ステップ 1..10 で触るファイルが全て確定している
- [ ] 各ステップに対応 TC ID が割り当たっている
- [ ] typecheck / lint / vitest / playwright / coverage コマンドが書かれている
- [ ] 不変条件 #4 / #5 / #11 の grep が記載されている
- [ ] Server Component → Client Component の境界が明示されている
- [ ] 本 Phase 内の全タスクを 100% 実行完了

## タスク100%実行確認【必須】

- [ ] 必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく未反映 UI の実装ランブックになっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 6 へ、各ステップの error mapping、retry 経路、role=alert / aria-live 配置、不変条件 grep を渡す。
