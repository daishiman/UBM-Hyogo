# Phase 2: 設計 — 06b-B-profile-self-service-request-ui

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-B-profile-self-service-request-ui |
| phase | 2 / 13 |
| wave | 06b-fu |
| mode | parallel（実依存は serial） |
| 作成日 | 2026-05-02 |
| taskType | feature |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 1 で確定した AC を満たす最小責務な UI / client helper / 状態管理設計を確定する。
不変条件 #4 / #5 / #11 を構造的に守る配置とする。

## 実行タスク

1. コンポーネント分解（責務 / props / 状態 owner）を確定する。完了条件: 各 component の入出力契約が表で確定する。
2. client helper のシグネチャと型を `apps/api/src/routes/me/schemas.ts` から再利用可能な形で定義する。完了条件: shared 型と DRY が成立する。
3. 状態管理戦略（client component の useState + Server Action / `useTransition`）を選定し理由を記す。完了条件: 楽観的更新の有無を明文化する。
4. エラーハンドリング（409 / 422 / 401 / 5xx / network）の UI 表示マッピングを完成する。完了条件: ユーザー文言と code が 1:1 になる。
5. 不変条件 #4 / #5 / #11 を構造で守るためのファイル配置と禁止事項を明記する。

## 参照資料

| 資料名 | パス |
| --- | --- |
| Phase 1 成果物 | `outputs/phase-01/main.md` |
| 既存 fetch helper | `apps/web/src/lib/fetch/authed.ts`（`fetchAuthed` / `AuthRequiredError` / `FetchAuthedError`） |
| /me schemas | `apps/api/src/routes/me/schemas.ts` |
| 既存 profile component | `apps/web/app/profile/_components/{StatusSummary,ProfileFields,EditCta,AttendanceList}.tsx` |
| UI/UX 仕様 | `docs/00-getting-started-manual/specs/09-ui-ux.md` |

## 実行手順

### 1. コンポーネント分解

| Component | 種別 | 責務 | 主要 props | 状態 owner |
| --- | --- | --- | --- | --- |
| `RequestActionPanel` | client | 公開停止/再公開/退会の各トリガボタンを束ねる panel | `publishState`, `pendingTypes: ("visibility_request" \| "delete_request")[]` | 自身（dialog 開閉のみ） |
| `VisibilityRequestDialog` | client | 確認ダイアログ + reason 任意入力 + submit | `desiredState: "hidden" \| "public"`, `open`, `onClose`, `onSubmitted` | 自身（form state, submitting, error） |
| `DeleteRequestDialog` | client | 二段確認ダイアログ（チェック必須）+ reason 任意 + submit | `open`, `onClose`, `onSubmitted` | 自身 |
| `RequestPendingBanner` | server-friendly client | pending 中である旨を表示しボタンを disable させる | `type: "visibility_request" \| "delete_request"` | propsのみ |
| `RequestErrorMessage` | client | code → 文言マッピング表示（`role=alert`） | `code`, `retry?: () => void` | propsのみ |

ファイル配置:

```
apps/web/app/profile/_components/
  RequestActionPanel.tsx        // 新規（client）
  VisibilityRequestDialog.tsx   // 新規（client）
  DeleteRequestDialog.tsx       // 新規（client）
  RequestPendingBanner.tsx      // 新規
  RequestErrorMessage.tsx       // 新規
apps/web/src/lib/api/
  me-requests.ts                // 新規 client helper
  me-requests.types.ts          // 新規（shared schema 由来 type 再 export）
```

`page.tsx` には Server Component から `RequestActionPanel` を 1 つ差し込むだけにし、本文編集 UI が「構造上書けない」ようにする（不変条件 #4 を構造で担保）。

### 2. client helper 設計

```ts
// apps/web/src/lib/api/me-requests.ts
import { fetchAuthed } from "../fetch/authed";

export type VisibilityRequestInput = { desiredState: "hidden" | "public"; reason?: string };
export type DeleteRequestInput = { reason?: string };
export type QueueAccepted = {
  queueId: string;
  type: "visibility_request" | "delete_request";
  status: "pending";
  createdAt: string;
};
export type RequestErrorCode =
  | "DUPLICATE_PENDING_REQUEST"
  | "INVALID_REQUEST"
  | "RULES_CONSENT_REQUIRED"
  | "RATE_LIMITED"
  | "UNAUTHORIZED"
  | "NETWORK"
  | "SERVER";

export type RequestResult =
  | { ok: true; accepted: QueueAccepted }
  | { ok: false; code: RequestErrorCode; status?: number };

export async function requestVisibilityChange(
  input: VisibilityRequestInput,
): Promise<RequestResult>;

export async function requestDelete(
  input: DeleteRequestInput,
): Promise<RequestResult>;
```

- 実装は `fetchAuthed<QueueAccepted>("/me/visibility-request", { method: "POST", body: JSON.stringify(input) })` 等を呼び、`FetchAuthedError.status` から code を導出する。
- 401 は `AuthRequiredError` を再 throw し、Server Component と同じく `/login?redirect=/profile` への遷移は呼び出し側の component が `router.push` で行う。
- 型 `VisibilityRequestInput` / `DeleteRequestInput` は `apps/api/src/routes/me/schemas.ts` の `MeVisibilityRequestBody` / `MeDeleteRequestBody` と field シグネチャを 1:1 で同期。同期破れ防止のため Phase 4 で `expectTypeOf` 互換テストを追加する。

### 3. 状態管理戦略

| 観点 | 選定 | 理由 |
| --- | --- | --- |
| Form 状態 | 各 dialog 内 `useState`（`reason`, `submitting`, `error`, `accepted`） | 単一画面・フォーム数 2 個で context は過剰 |
| 送信処理 | `useTransition` + client helper 直接呼び出し | Server Action 化すると Workers/OpenNext の動的境界が増えるだけで利得なし |
| 楽観的更新 | 行わない | 申請は管理者承認後反映で、UI 即時反映すると state と DB の乖離を生む。代わりに 202 後 `router.refresh()` を呼び `RequestPendingBanner` を表示 |
| pending 検知 | サーバ側 GET `/me/profile` の statusSummary には現状 pending フラグ無し → MVP では 202 受信後の client local state でバナー表示。reload で消える前提を docstring に明記し、Phase 12 で sticky 化を follow-up 候補とする |
| 二重送信防止 | `submitting` ref + button `disabled` |

### 4. エラーマッピング

| HTTP / 例外 | code | 文言 | UI 挙動 |
| --- | --- | --- | --- |
| 202 | — | 「申請を受け付けました」 | dialog close + banner |
| 409 `DUPLICATE_PENDING_REQUEST` | DUPLICATE_PENDING_REQUEST | 「既に申請を受け付けています。管理者の対応をお待ちください。」 | banner + ボタン disabled |
| 422 `INVALID_REQUEST` | INVALID_REQUEST | 「入力内容を確認してください。」 | dialog 内 inline error（reason 長さ） |
| 403 `RULES_CONSENT_REQUIRED`（middleware） | RULES_CONSENT_REQUIRED | 「会則同意の更新が必要です。」 | panel 自体非表示 + 案内 |
| 429 | RATE_LIMITED | 「短時間に申請が集中しています。時間を置いて再度お試しください。」 | dialog 内 alert |
| 401 | UNAUTHORIZED | （表示せずリダイレクト） | `/login?redirect=/profile` |
| network failure | NETWORK | 「通信に失敗しました。再試行してください。」 | retry ボタン |
| 5xx | SERVER | 「サーバーで問題が発生しました。」 | retry ボタン |

### 5. 不変条件適合の構造的担保

| 不変条件 | 守り方（構造） |
| --- | --- |
| #4 本文編集禁止 | `_components/Request*Dialog.tsx` は `desiredState` と任意 `reason` 以外の field を一切持たない。`<input name="...">` を profile 本文項目（氏名等）に対して書かないことを Phase 4 lint テスト（grep）で固定 |
| #5 D1 直接禁止 | `apps/web` から `cloudflare:d1` import / `D1Database` 参照を一切しない。client helper は `fetchAuthed` のみ経由 |
| #11 self-service 境界 | API path に `:memberId` を一切付加しない。client helper の URL を `"/me/visibility-request"` `"/me/delete-request"` の 2 箇所に閉じる |

### 6. dependency / ownership

| モジュール | owner | co-owner |
| --- | --- | --- |
| `apps/web/src/lib/api/me-requests.ts` | 06b-B（本タスク） | 06b-C（visual evidence） |
| `apps/web/app/profile/_components/Request*` | 06b-B | 06b-C |
| `MeVisibilityRequestBodyZ` / `MeDeleteRequestBodyZ` | 04b（既存） | 06b-B（参照のみ） |

## 統合テスト連携

| 判定項目 | 基準 |
| --- | --- |
| typecheck | `pnpm typecheck` 緑 |
| lint | `pnpm lint` 緑 |
| unit（client helper / dialog） | Vitest line 80%+ |
| E2E（S1/S2/S3/S4） | Playwright 100% / 80%+ |

## 多角的チェック観点

- a11y: `role=dialog` / focus trap / esc close / `aria-describedby` で破壊的操作を説明
- i18n: 文言テーブルを Phase 1 と一致させる
- security: reason の最大長 500 を client zod でも検証
- 不変条件 #4 / #5 / #11 を構造で守れているか
- 楽観的更新を導入していないか（導入しないが正解）

## サブタスク管理

- [ ] component 分解表を完成
- [ ] client helper シグネチャを TypeScript で固定
- [ ] error mapping 表を完成
- [ ] 不変条件 構造的担保表を完成
- [ ] `outputs/phase-02/main.md` を作成

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 設計書 | `outputs/phase-02/main.md` | コンポーネント / helper / 状態 / error / 配置 |

## 完了条件

- [ ] component 5 種の責務と props が確定している
- [ ] client helper 2 関数のシグネチャが確定している
- [ ] エラーマッピング表が完成している
- [ ] 不変条件 #4 / #5 / #11 の構造的担保が説明されている
- [ ] ファイル配置が `apps/web/app/profile/_components/` と `apps/web/src/lib/api/` に閉じている
- [ ] 本 Phase 内の全タスクを 100% 実行完了

## タスク 100% 実行確認【必須】

- [ ] 設計が AC-1..AC-7 を全て覆っている
- [ ] 本文編集 UI を追加する設計になっていない
- [ ] D1 直接アクセスを必要とする設計になっていない
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 3 へ、component / helper / state / error / 配置 / ownership 表を渡す。
