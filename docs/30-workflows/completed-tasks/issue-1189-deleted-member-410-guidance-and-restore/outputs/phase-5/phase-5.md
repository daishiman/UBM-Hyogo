# Phase 5: 実装（CONST_005 必須項目）

> **本フェーズは実装記録。** C1（/profile 410 文言/CTA）と C2（MemberDrawer 復元ボタン配線）は local code に反映済み。
> `apps/api` / D1 / Google Form は**一切変更しない**（既存 `POST /admin/members/:memberId/restore` の配線のみ）。

## 参照資料

| 種別 | パス | 用途 |
|------|------|------|
| WF SSOT | `docs/30-workflows/completed-tasks/issue-1189-deleted-member-410-guidance-and-restore/index.md` | DoD 概要・不変条件・CONST_007 宣言 |
| C1 編集対象 | `apps/web/app/(member)/profile/_lib/session-error-display.ts`（全 61 行） | 410 分岐（34-42 行）の Before |
| C1 描画側（不変） | `apps/web/app/(member)/profile/page.tsx:58-65` | `retryHref`/`actionHref`/`actionLabel` を条件 spread 済み → **page.tsx の編集は不要** |
| C1 表示コンポーネント（不変） | `apps/web/src/components/member/SectionError.tsx` | `actionHref`/`actionLabel` props 既存対応 |
| C2 編集対象 | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`（694 行・DELETED セクション 273-289 行） | 復元ボタン配線先 |
| C2 hook（不変） | `apps/web/src/features/admin/hooks/useAdminMutation.ts` | `useAdminMutation<T>(endpoint, "POST", options)` → `{ trigger, isLoading }`。`FetchAuthedError` re-export（L67） |
| C2 endpoint 形式の前例 | `MemberDrawer.tsx:649-667`（`NotificationOptOutToggle`） | `/api/admin/members/${encodeURIComponent(memberId)}/...` 形式 + 同居コンポーネントパターン |
| C2 confirm 前例 | `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx:52-56` | `globalThis.confirm(...)` ガード |
| C2 Button（不変・import 済み） | `apps/web/src/components/ui/Button.tsx` | props spread で `data-testid`/`disabled` 透過 |
| API 実体（不変・非接触） | `apps/api/src/routes/admin/member-delete.ts:121-168` | `POST /admin/members/:memberId/restore` の契約根拠 |
| catch-all proxy（不変） | `apps/web/app/api/admin/[...path]/route.ts` | POST 対応済み（新規 route 追加不要） |
| テスト設計 | `outputs/phase-4/phase-4.md`（T-01〜T-12） | RED→GREEN の対象テスト |

## 5.1 変更対象ファイル一覧

| # | パス | 種別 | concern |
|---|------|------|---------|
| 1 | `apps/web/app/(member)/profile/_lib/session-error-display.ts` | 編集 | C1: 410 分岐の文言/CTA 変更 |
| 2 | `apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts` | 編集 | C1: T-01〜T-05（410 期待値更新 + 他分岐回帰） |
| 3 | `apps/web/app/(member)/profile/page.spec.tsx` | 編集 | C1: T-06（既存 410 アサーション L107-117 付近を更新） |
| 4 | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | 編集 | C2: `DeletedMemberSection` 追加 + DELETED セクション置換 |
| 5 | `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.restore.spec.tsx` | 新規 | C2: T-07〜T-12 |

> 削除ファイルなし。`apps/web/src/lib/admin/api.ts` の `restoreMember` は**使わない・触らない**（非接触・現状維持。live 使用 0 件のまま）。
> `page.tsx` / `SectionError.tsx` / catch-all proxy も編集不要（既存実装が 410 の `actionHref`/`actionLabel` をそのまま描画する）。

## 5.2 C1: `mapProfileSessionErrorToDisplay` の 410 分岐 Before/After

### Before（現行 34-42 行・実コード）

```ts
  if (code === "MEMBER_SESSION_410") {
    return {
      title: "セッション情報を取得できませんでした",
      detail:
        "アカウントの利用状態を確認できませんでした。管理者に確認してください。",
      retryHref: "/profile",
      dataCause: "session-410",
    };
  }
```

### After（確定文言・完全コード）

```ts
  if (code === "MEMBER_SESSION_410") {
    return {
      title: "このアカウントは退会済みです",
      detail:
        "退会手続きが完了しているため、マイページを表示できません。誤って退会された場合や利用再開をご希望の場合は、支部会の運営（管理者）にお問い合わせください。",
      actionHref: "/",
      actionLabel: "公開サイトのトップへ戻る",
      dataCause: "session-410",
    };
  }
```

### C1 変更ルール（厳守）

| 項目 | ルール |
|------|--------|
| `title` | 「このアカウントは退会済みです」へ変更（他 3 分岐の「セッション情報を取得できませんでした」は不変） |
| `detail` | 上記確定文言（一字一句この通り） |
| `retryHref` | **削除**（無意味な「再読み込み」リンクの根絶。`page.tsx:63` の条件 spread により描画されなくなる） |
| `actionHref` / `actionLabel` | `"/"` / `"公開サイトのトップへ戻る"` を追加（`SectionError` が既存 props で描画） |
| `dataCause` | `"session-410"` **維持**（page.spec.tsx の data-cause 検証・診断識別子の互換） |
| 型 | `ProfileSessionCause` / `ProfileSessionErrorDisplay` は**変更しない** |
| 他分岐 | 404（24-32 行）/ 5xx（44-52 行）/ FAILED（54-60 行）は**変更しない** |

## 5.3 C2: MemberDrawer の DELETED セクション After（完全コード）

### 推奨構造: `DeletedMemberSection` のファイル内コロケーション

`MemberDrawer.tsx` 内に新規ローカルコンポーネント **`DeletedMemberSection`** を切り出す
（`NotificationOptOutToggle`（643 行〜）/ `MemberTagsEditor`（332 行〜）と同様の同居パターン。**別ファイルは作らない**）。
理由: 復元の状態管理（error state / isLoading / confirm）を `MemberDrawerBody` の JSX から分離しつつ、
drawer 専用 UI を export 面に増やさない。

### Step A: import 追記（ファイル先頭・既存 import 行の変更）

```ts
// 変更前
import { useAdminMutation } from "../../hooks/useAdminMutation";
// 変更後（FetchAuthedError は useAdminMutation.ts L67 で re-export 済み）
import { FetchAuthedError, useAdminMutation } from "../../hooks/useAdminMutation";
```

> `Button` は既に import 済み（L32）。追加 import はこの 1 箇所のみ。

### Step B: 呼び出し側（現行 273-289 行の置換）

```tsx
      {/* DELETED */}
      {detail.status.isDeleted ? (
        <DeletedMemberSection
          memberId={memberId}
          onRestored={() =>
            onUpdated({ status: { ...detail.status, isDeleted: false } })
          }
        />
      ) : null}
```

> `onUpdated` は `MemberDrawerBody` の既存 props（L110）。`{ status: { ...detail.status, isDeleted: false } }`
> の patch で親 `MemberDrawer` の `data` が更新され、**退会済みセクションが消滅**し
> `MemberStateChipRow`（L138-141）/ IDENTITY の `isDeleted` 表示（L268）も即時更新される。

### Step C: 新規ローカルコンポーネント（`MemberDrawerBody` の後方・`NotificationOptOutToggle` の並びに追加）

```tsx
interface DeletedMemberSectionProps {
  readonly memberId: string;
  readonly onRestored: () => void;
}

const RESTORE_CONFIRM_MESSAGE =
  "この会員を復元しますか？復元すると退会前の状態に戻ります。";
const RESTORE_ERROR_CONFLICT =
  "すでに復元済みの可能性があります。画面を再読み込みしてください。";
const RESTORE_ERROR_GENERIC =
  "復元に失敗しました。時間をおいて再度お試しください。";

/**
 * issue-1189: 退会済み（論理削除）セクション + 管理者復元ボタン。
 *   - 既存 POST /admin/members/:memberId/restore を useAdminMutation 経由で配線（不変条件 #10）。
 *   - globalThis.confirm 確認後のみ trigger。成功時は onRestored で drawer 表示を即時復元状態へ。
 */
function DeletedMemberSection({ memberId, onRestored }: DeletedMemberSectionProps) {
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const { trigger, isLoading } = useAdminMutation<{
    id: string;
    restoredAt: string;
  }>(`/api/admin/members/${encodeURIComponent(memberId)}/restore`, "POST", {
    successMessage: "会員を復元しました",
    onSuccess: () => {
      setRestoreError(null);
      onRestored();
    },
    onError: (error) => {
      if (error instanceof FetchAuthedError && error.status === 409) {
        setRestoreError(RESTORE_ERROR_CONFLICT);
        return;
      }
      setRestoreError(RESTORE_ERROR_GENERIC);
    },
    refreshOnSuccess: false,
  });

  const handleRestore = (): void => {
    if (isLoading) return; // 二重発火防止（disabled と二重ガード）
    if (!globalThis.confirm(RESTORE_CONFIRM_MESSAGE)) return;
    setRestoreError(null);
    void trigger({}).catch(() => {
      // エラー表示は onError で restoreError へ反映済み（unhandled rejection 抑止のみ）
    });
  };

  return (
    <section
      aria-labelledby="drawer-deleted-heading"
      className="rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-danger)] bg-[var(--ubm-color-danger-soft)] p-3"
    >
      <h3
        id="drawer-deleted-heading"
        className="text-xs font-semibold uppercase tracking-wide text-[var(--ubm-color-danger)]"
      >
        退会済み
      </h3>
      <p className="mt-1 text-sm text-[var(--ubm-color-text-secondary)]">
        この会員は退会済み（論理削除）です。復元すると、公開設定やプロフィールが退会前の状態に戻ります。
      </p>
      {restoreError ? (
        <p role="alert" className="mt-2 text-sm text-[var(--ubm-color-danger)]">
          {restoreError}
        </p>
      ) : null}
      <div className="mt-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          data-testid="member-restore-button"
          disabled={isLoading}
          loading={isLoading}
          onClick={handleRestore}
        >
          この会員を復元する
        </Button>
      </div>
    </section>
  );
}
```

### C2 変更ルール（厳守）

| 項目 | ルール |
|------|--------|
| mutation 経路 | `@/features/admin/hooks/useAdminMutation` のみ（不変条件 #10。legacy `@/lib/useAdminMutation` / `lib/admin/api.ts` の `restoreMember` は使わない） |
| endpoint | `/api/admin/members/${encodeURIComponent(memberId)}/restore`・`"POST"`（`NotificationOptOutToggle` の形式踏襲。catch-all proxy `apps/web/app/api/admin/[...path]/route.ts` が POST 対応済み） |
| confirm | `globalThis.confirm("この会員を復元しますか？復元すると退会前の状態に戻ります。")` で OK のときだけ `trigger` |
| 成功時 | toast `successMessage: "会員を復元しました"` + `onRestored()` → `onUpdated({ status: { ...detail.status, isDeleted: false } })` |
| 失敗時 | セクション内 `role="alert"`（色は `var(--ubm-color-danger)` トークンのみ）。409 `member_not_deleted` は平易文言へマップ |
| loading | `isLoading` 中はボタン `disabled`（`Button` は props spread で透過） |
| testid | `data-testid="member-restore-button"`（リポジトリ内で一意） |
| 説明文 | 「この会員は退会済み（論理削除）です。復元すると、公開設定やプロフィールが退会前の状態に戻ります。」へ更新（旧「復元する場合は管理者にお問い合わせください。」は削除） |
| section 構造 | `aria-labelledby="drawer-deleted-heading"` / 枠色・背景・見出しのクラスは現行どおり維持 |

## 5.4 入力・出力・副作用の定義

### POST restore の request/response 契約（API 側・不変）

| 区分 | 内容 |
|------|------|
| Request | `POST /api/admin/members/:memberId/restore`（web）→ proxy → `POST /admin/members/:memberId/restore`（api）。body は `{}`（payload 不要） |
| 200 | `{ id: string, restoredAt: string }`（`member_status.is_deleted=0` + `deleted_members` 行削除） |
| 404 | member 不存在 → `FetchAuthedError(404)` → 汎用エラー文言 |
| 409 | `member_not_deleted`（既に非削除）→ `FetchAuthedError(409)` → 「すでに復元済みの可能性があります。画面を再読み込みしてください。」 |
| 実装根拠 | `apps/api/src/routes/admin/member-delete.ts:121-168`（contract test `member-delete.contract.spec.ts` 済み） |

### 副作用

| 副作用 | 設計判断 |
|--------|---------|
| audit ログ | **API 側で `admin.member.restored` を自動記録**（web 側の追加実装は不要・してはならない） |
| toast | `useAdminMutation` の `successMessage` 経由で「会員を復元しました」を表示（既存 Toast 基盤） |
| drawer 状態 | `onUpdated` patch で client state を即時更新（refetch 不要） |
| `router.refresh` | **不要**（`refreshOnSuccess: false`）。drawer は client state 駆動で、背後の members 一覧の鮮度は既存の drawer close 時挙動に委ねる。`refreshOnSuccess: true` にすると drawer の開閉状態と RSC 再描画が競合しうるため採用しない |
| memberId 露出 | 新規ログ出力なし。endpoint URL 内の memberId は admin 画面内の既存露出範囲と同一（不変条件 #11 維持） |

## 5.5 テスト方針（T-01〜T-12・RED→GREEN）

Phase 4 設計の T-01〜T-12 に対応する。**先にテストを After 期待値へ書き換え/新規作成して RED を確認し、実装で GREEN にする。**

| ID | ファイル | 検証内容 |
|----|---------|---------|
| T-01 | `session-error-display.spec.ts`（編集） | 410 → `title` が「このアカウントは退会済みです」 |
| T-02 | 同上 | 410 → `detail` が確定文言（退会完了 + 運営問い合わせ案内） |
| T-03 | 同上 | 410 → `actionHref === "/"`・`actionLabel === "公開サイトのトップへ戻る"`・`retryHref` が `undefined` |
| T-04 | 同上 | 410 → `dataCause === "session-410"` 維持 |
| T-05 | 同上 | 404 / 5xx（例 503）/ FAILED の 3 分岐が既存期待値のまま不変（回帰） |
| T-06 | `page.spec.tsx`（編集・既存 410 アサーション L107-117 付近を grep して更新） | `FetchAuthedError(410)` で alert に退会済み文言・`data-cause="session-410"`・「公開サイトのトップへ戻る」リンク（`href="/"`）あり・「再読み込み」導線なし |
| T-07 | `MemberDrawer.restore.spec.tsx`（新規） | `isDeleted: true` の detail で `member-restore-button` と新説明文が表示される |
| T-08 | 同上 | confirm OK → `POST .../restore` が発火し、成功（200 `{id, restoredAt}`）で退会済みセクションが消滅する（`onUpdated` patch 反映） |
| T-09 | 同上 | confirm キャンセル → restore fetch が発火しない |
| T-10 | 同上 | 409 `member_not_deleted` → セクション内 `role="alert"` に「すでに復元済みの可能性があります。画面を再読み込みしてください。」 |
| T-11 | 同上 | その他失敗（5xx）→ `role="alert"` に「復元に失敗しました。時間をおいて再度お試しください。」 |
| T-12 | 同上 | `isDeleted: false` の detail では退会済みセクション・restore ボタンが描画されない |

### 新規 spec の実装パターン

- fetch mock は既存 `__tests__/MemberDrawer.tags.spec.tsx` のパターンを踏襲（drawer 初期 GET `/api/admin/members/:id` + tags GET を URL 分岐で stub し、restore POST を捕捉する）。
- confirm は `vi.spyOn(globalThis, "confirm")` で `mockReturnValue(true | false)`（`afterEach` で `mockRestore`）。
- toast / router は `MemberDrawer.tags.spec.tsx` と同じ mock 構成を再利用する。
- ファイル名は `*.spec.tsx`（不変条件 #8。`*.test.*` 禁止）。

## 5.6 ローカル実行・検証コマンド（repo root で実行）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  "apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts" \
  "apps/web/app/(member)/profile/page.spec.tsx" \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.restore.spec.tsx"
git diff --name-only dev...HEAD -- apps/api   # 出力が空であること（= AC-7）
```

> focused vitest は monorepo root 基準の `--root=. --config=vitest.config.ts` + ファイル直指定が必須
> （`--filter web exec` やパッケージ内直実行は include glob 不一致で "No test files found" になる既知の罠）。

## 5.7 DoD（Definition of Done）

1. **AC-1**: 410 分岐の `title`/`detail` が §5.2 の確定文言と一致する。
2. **AC-2**: 410 分岐に `actionHref:"/"` / `actionLabel:"公開サイトのトップへ戻る"` があり、`retryHref` が存在しない（/profile に「再読み込み」導線が出ない）。
3. **AC-3**: `dataCause:"session-410"` 維持・`ProfileSessionErrorDisplay` 型と 404/5xx/FAILED 分岐が不変。
4. **AC-4**: `MemberDrawer` の退会済みセクションに `data-testid="member-restore-button"` の復元ボタンと更新済み説明文が表示される。
5. **AC-5**: 復元は `useAdminMutation` POST 経由のみ（不変条件 #10）で、`globalThis.confirm` OK 時のみ発火する。
6. **AC-6**: 成功時に toast「会員を復元しました」+ `onUpdated` patch で退会済みセクション消滅・`MemberStateChipRow` 更新。
7. **AC-7**: `git diff --name-only dev...HEAD -- apps/api` が**空**（apps/api / D1 / Google Form 非接触）。
8. **AC-8**: 失敗時にセクション内 `role="alert"` 表示（409 は平易文言マップ）・`isLoading` 中はボタン disabled。
9. **AC-9**: 色は `var(--ubm-*)` トークンのみ（HEX 直書き 0）・`verify:tokens` PASS。
10. **AC-10**: T-01〜T-12 全 GREEN + §5.6 全コマンド exit 0 + **既存 MemberDrawer specs 4 本**（`components/__tests__/MemberDrawer.spec.tsx` / `_members/__tests__/MemberDrawer.{identityLabels,tags,tagInlineCreate}.spec.tsx`）回帰なし。

## 5.8 実装手順（step-by-step・C1→C1テスト→C2→C2テスト）

### Step 1: C1 テストを After 期待値へ更新（RED）

`session-error-display.spec.ts` の 410 ケースを T-01〜T-04 期待値へ書き換え、T-05（他分岐回帰）を維持・補強。
`page.spec.tsx` の既存 410 アサーション（`grep -n "session-410" "apps/web/app/(member)/profile/page.spec.tsx"` で特定）を T-06 期待値へ更新。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  "apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts" \
  "apps/web/app/(member)/profile/page.spec.tsx"   # ここでは FAIL（RED）が正
```

### Step 2: C1 実装（GREEN）

`session-error-display.ts` の 410 分岐を §5.2 After へ置換（他分岐・型は非接触）。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  "apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts" \
  "apps/web/app/(member)/profile/page.spec.tsx"   # PASS（GREEN）
mise exec -- pnpm typecheck
```

### Step 3: C2 テストを新規作成（RED）

`__tests__/MemberDrawer.restore.spec.tsx` を新規作成し T-07〜T-12 を記述（§5.5 パターン）。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.restore.spec.tsx"   # FAIL（RED）が正
```

### Step 4: C2 実装（GREEN）

`MemberDrawer.tsx` へ §5.3 Step A〜C を適用（import 追記 → 呼び出し側置換 → `DeletedMemberSection` 追加）。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.restore.spec.tsx"   # PASS（GREEN）
```

### Step 5: 全体検証

§5.6 の 5 コマンドを全て実行し、既存 MemberDrawer specs 4 本も合わせて回帰確認する。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  "apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx" \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.identityLabels.spec.tsx" \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tags.spec.tsx" \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tagInlineCreate.spec.tsx"
```

## 実行タスク

- [ ] Step 1: C1 テスト更新（T-01〜T-06 を After 期待値へ・RED 確認）
- [ ] Step 2: C1 実装（§5.2 After 適用・GREEN + typecheck）
- [ ] Step 3: C2 テスト新規作成（T-07〜T-12・RED 確認）
- [ ] Step 4: C2 実装（§5.3 Step A〜C 適用・GREEN）
- [ ] Step 5: §5.6 全 5 コマンド + 既存 MemberDrawer specs 4 本の回帰確認

## 完了条件

- [ ] DoD AC-1〜AC-10（§5.7）が全て充足している。
- [ ] §5.6 の 5 コマンドが全て exit 0（`git diff ... -- apps/api` は出力空）。
- [ ] 変更ファイルが §5.1 の 5 件（編集 4 + 新規 1）に収まっている。
- [ ] `restoreMember`（`lib/admin/api.ts`）への新規参照・legacy `@/lib/useAdminMutation` への新規参照が 0 件。

## 成果物

- 本ファイル `outputs/phase-5/phase-5.md`（実装仕様: 変更一覧 / Before・After 完全コード / 入出力・副作用 / テスト方針 / 検証コマンド / DoD / 手順）
- §5.1 の編集 4 ファイル + 新規 spec 1 ファイル（実装済み）
