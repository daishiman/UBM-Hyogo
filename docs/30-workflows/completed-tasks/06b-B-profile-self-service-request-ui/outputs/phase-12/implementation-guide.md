# Implementation Guide — 06b-B-profile-self-service-request-ui

> 本ガイドは PR 本文（`/ai:diff-to-pr` の Phase 5.5 で全文コメント投稿）に転載される。

## Part 1: 中学生レベル概念説明

### 1.1 公開停止申請とは何か

#### 日常生活での例え

学校の連絡網で「自分の名前を一旦載せないでほしい」と先生にお願いするようなものです。

たとえば、仕事や家庭の事情で一時的にメンバーディレクトリから自分の名前を出したくない時期があります。そのとき、自分で勝手にデータを消すのではなく、先生（管理者）に「ちょっとの間、表示を止めてほしい」とお願いし、確認してもらってから実際に止まる、という流れです。

#### なぜ必要か

会員ディレクトリは公開ページとも繋がっているため、本人の自由なタイミングで「載せる/載せない」を切り替えられないと困ります。一方で、本人が自由に消せると、間違って消したり、なりすましで消されたりするリスクがあります。だから「申請 → 管理者確認 → 反映」という二段構えにします。

#### この機能でできること

| 機能 | 説明 | 例 |
| ---- | ---- | --- |
| 公開停止申請 | ディレクトリから一時的に名前を引っ込めてほしいと申請する | 仕事が忙しい時期だけ非表示にしたい |
| 再公開申請 | 一度止めた表示を、また載せ直してほしいと申請する | 復帰したから戻したい |

### 1.2 退会申請とは何か

#### 日常生活での例え

図書館の利用カードを返すようなものです。

たとえば、引っ越しや所属の変更で会から離れる時、データを残したまま放置するのではなく、きれいに会員リストから抜きたいことがあります。そんな時に使います。

#### なぜ必要か

退会は本人にとっても運営にとっても大事な手続きです。本人が一方的にいきなりデータを消せるようにすると、間違いで消えてしまっても元に戻せません。だから「申請 → 管理者確認 → 退会扱い」という流れを取ります。

#### この機能でできること

| 機能 | 説明 | 例 |
| ---- | ---- | --- |
| 退会申請 | 会から離れたいと管理者に伝える | 引っ越しで活動できなくなった |
| 任意の理由欄 | なぜ退会するかを書ける（書かなくても OK） | 「事情があり…」など |

### 1.3 なぜ二重申請を防ぐのか

#### 日常生活での例え

同じ宅配便を 2 回頼むと、配達員さんがどちらを届けて良いか分からず混乱しますよね。

たとえば、ボタンを 2 回連続で押してしまうと、申請が 2 件登録されてしまい、管理者は「どちらを処理すれば良いの？」と困ります。

#### なぜ必要か

申請を受け付ける管理者の手間を減らし、誤って 2 回処理されることを防ぐためです。

#### この機能でできること

| 機能 | 説明 |
| ---- | ---- |
| 重複検知 | 既に「処理待ち」の申請がある場合、新しい申請を受け付けない |
| ユーザー通知 | 「もう受け付けています。管理者の対応をお待ちください」と画面で伝える |
| ボタン disable | 同じボタンを押せないようにして、誤操作を防ぐ |

---

## Part 2: 開発者レベル技術詳細

### 2.1 Summary

`/profile` に `RequestActionPanel` を 1 つ差し込み、以下を追加する。

- `VisibilityRequestDialog`（公開停止/再公開申請）
- `DeleteRequestDialog`（退会申請）
- `RequestPendingBanner`（pending 表示）
- `RequestErrorMessage`（エラー表示）
- 2 つの client helper（`requestVisibilityChange` / `requestDelete`）

### 2.2 Changes（追加/変更ファイル）

| ファイル | 種別 |
| --- | --- |
| `apps/web/app/profile/page.tsx` | 変更（panel 差し込みのみ） |
| `apps/web/app/profile/_components/RequestActionPanel.tsx` | 追加 |
| `apps/web/app/profile/_components/VisibilityRequestDialog.tsx` | 追加 |
| `apps/web/app/profile/_components/DeleteRequestDialog.tsx` | 追加 |
| `apps/web/app/profile/_components/RequestPendingBanner.tsx` | 追加 |
| `apps/web/app/profile/_components/RequestErrorMessage.tsx` | 追加 |
| `apps/web/src/lib/api/me-requests.ts` | 追加（client helper） |
| `apps/web/src/lib/api/me-requests.types.ts` | 追加（型定義） |
| `apps/web/app/api/me/visibility-request/route.ts` | 追加（同一 origin proxy → API Worker） |
| `apps/web/app/api/me/delete-request/route.ts` | 追加（同一 origin proxy → API Worker） |
| `apps/web/src/__tests__/static-invariants.test.ts` | 変更（S-04 を本文項目限定 grep に再構成 + S-04b 追加） |
| `apps/web/playwright/tests/profile-visibility-request.spec.ts` | 追加（`describe.skip`、Phase 11 で活性化） |
| `apps/web/playwright/tests/profile-delete-request.spec.ts` | 追加（`describe.skip`、Phase 11 で活性化） |
| `docs/00-getting-started-manual/specs/05-pages.md` | 変更 |
| `docs/00-getting-started-manual/specs/07-edit-delete.md` | 変更 |
| `docs/00-getting-started-manual/specs/09-ui-ux.md` | 変更 |

### 2.3 API contract

| Endpoint | Method | Request body | Success | Errors |
| --- | --- | --- | --- | --- |
| `/me/visibility-request` | POST | `{ desiredState: "hidden" \| "public", reason?: string }` | `202 { queueId, type, status: "pending", createdAt }` | 401 / 403 RULES_CONSENT_REQUIRED / 409 DUPLICATE_PENDING_REQUEST / 422 INVALID_REQUEST / 429 RATE_LIMITED |
| `/me/delete-request` | POST | `{ reason?: string }` | 同上（`type=delete_request`） | 同上 |

### 2.4 型定義（C12P2-1）

```ts
// apps/web/src/lib/api/me-requests.types.ts
export type VisibilityRequestInput = {
  desiredState: "hidden" | "public";
  reason?: string;
};
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
```

### 2.5 API シグネチャ（C12P2-2）

```ts
// apps/web/src/lib/api/me-requests.ts
export async function requestVisibilityChange(
  input: VisibilityRequestInput,
): Promise<RequestResult>;
export async function requestDelete(
  input: DeleteRequestInput,
): Promise<RequestResult>;
```

### 2.6 使用例（C12P2-3）

```tsx
// VisibilityRequestDialog.tsx 抜粋（実装版）
const [pending, setPending] = useState(false);
const onSubmit = async () => {
  setPending(true);
  try {
    const res = await requestVisibilityChange({ desiredState, reason });
    if (res.ok) {
      onSubmitted(res.accepted);
      onClose();
    } else {
      setError(res.code);
    }
  } finally {
    setPending(false);
  }
};
```

> **実装デルタ**: 当初 `useTransition` を採用したが、jsdom + `act()` 環境で
> `startTransition` 内部 async コールバックの state flush タイミングが安定せず
> 409/422 系テストが flaky になったため `useState` の単純 pending フラグへ置換した。
> ユーザー体感は同等（送信中 disable + spinner 文言）。

### 2.7 エラー処理（C12P2-4）

| HTTP / 例外 | code | UI 文言 | UI 挙動 |
| --- | --- | --- | --- |
| 202 | — | 「申請を受け付けました」 | dialog close + banner |
| 409 | DUPLICATE_PENDING_REQUEST | 「既に申請を受け付けています。」 | dialog alert + 同一 session 中の pending banner + 該当ボタン disabled |
| 422 | INVALID_REQUEST | 「入力内容を確認してください。」 | dialog 内 inline error |
| 403 | RULES_CONSENT_REQUIRED | 「会則同意の更新が必要です。」 | panel 非表示 + 案内 |
| 429 | RATE_LIMITED | 「短時間に申請が集中しています。」 | dialog 内 alert |
| 401 | UNAUTHORIZED | （表示せず） | `/login?redirect=/profile` |
| network | NETWORK | 「通信に失敗しました。」 | retry ボタン |
| 5xx | SERVER | 「サーバーで問題が発生しました。」 | retry ボタン |

### 2.8 設定可能パラメータ（C12P2-5）

| 項目 | 値 |
| --- | --- |
| `REASON_MAX_LENGTH` | 500（client zod / server zod 共通） |
| `VISIBILITY_REQUEST_URL` | browser: `/api/me/visibility-request` / upstream API Worker: `/me/visibility-request` |
| `DELETE_REQUEST_URL` | browser: `/api/me/delete-request` / upstream API Worker: `/me/delete-request` |
| 自動 retry | なし（user 操作のみ） |

### 2.9 Test coverage

| レイヤ | 対象 | tool |
| --- | --- | --- |
| unit | `me-requests.ts` の正常/異常分岐、各 dialog の form validation | Vitest |
| integration | `RequestActionPanel` の pending banner / disabled 分岐 | Vitest + Testing Library |
| E2E | S1 visibility hide / S2 visibility public / S3 delete / S4 duplicate 409 | Playwright |
| a11y | role=dialog / focus trap / esc close | Playwright + axe |

### 2.10 Screenshots（Phase 11 出力）

> **Runtime evidence boundary**: 下記は Phase 11 実測時の保存先契約であり、現時点では取得済み PASS 証跡ではない。`outputs/phase-11/screenshots/`、PNG、trace、video、HAR、metadata JSON は未作成のため、runtime capture 完了まで `IMPLEMENTED_AWAITING_VISUAL_CAPTURE` を維持する。

| ファイル | 状態 |
| --- | --- |
| `outputs/phase-11/screenshots/TC-01-request-panel-default-public-light.png` | public 会員の申請パネル |
| `outputs/phase-11/screenshots/TC-02-request-panel-default-hidden-light.png` | hidden 会員の再公開申請パネル |
| `outputs/phase-11/screenshots/TC-03-visibility-dialog-open-light.png` | 公開停止 dialog 表示 |
| `outputs/phase-11/screenshots/TC-04-delete-dialog-open-light.png` | 退会 dialog 表示 |
| `outputs/phase-11/screenshots/TC-06-duplicate-409-light.png` | 二重申請 409 表示 |

> Phase 11 実測時に `outputs/phase-11/screenshot-plan.json` / `phase11-capture-metadata.json` / `screenshot-coverage.md` を揃え、FB-UT-UIUX-001 ハードゲートをクリアする。dark mode は本タスクで provide しないため N/A とし、light theme の TC-01..TC-09 を正本 evidence とする。

### 2.11 Invariants（不変条件）

| # | 維持方法 |
| --- | --- |
| #4 profile body edit forbidden | dialog の input は `desiredState` / `reason` のみ。本文項目（氏名等）の `<input name="...">` は構造上書けない。Phase 4 で grep 監査 |
| #5 apps/web D1 direct access forbidden | `apps/web` で `cloudflare:d1` import / `D1Database` 参照 0 件を grep 監査 |
| #11 member self-service boundary | browser route は `/api/me/visibility-request` / `/api/me/delete-request`、upstream API Worker route は `/me/visibility-request` / `/me/delete-request` の 2 本に閉じ、`:memberId` を一切付加しない |

### 2.12 Out of scope

- プロフィール本文（氏名 / 所属など）のアプリ内編集 UI（不変条件 #4 を維持）
- admin request queue の管理画面側 UI 再設計
- 楽観的更新（管理者承認後反映の意味論を壊すため）
- pending banner の sticky 化（reload で消えない仕様）— follow-up 起票候補

### 2.13 ドキュメント drift チェック

```bash
rg -n "Google Form のみ|Form 再回答のみ" docs/00-getting-started-manual/specs/
rg -n "RequestActionPanel|VisibilityRequestDialog|DeleteRequestDialog" docs/00-getting-started-manual/specs/
rg -n "計画|予定|TODO|保留として記録" docs/30-workflows/completed-tasks/06b-B-profile-self-service-request-ui/outputs/phase-12/
```
