# Phase 2: 設計

> 設計書フェーズ。コンポーネント / 関数 / 型シグネチャ・データソース・配置・既存コンポーネント再利用可否を固定する。landed 実装を current facts として記述。

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase 番号 | 2 |
| 名称 | 設計 |
| 種別 | 設計書 |
| implementation_mode | verify_existing（PR #1064 / `745c95115` landed） |
| 依存 | Phase 1（要件定義） |

## 目的

`ReflectionTimingNote` の props / 型シグネチャ・データソース・表示文言・`/members`・`/profile` への配置と fetch 戦略を、landed 実装を current facts として固定する。

## 実行タスク

- 最終同期時刻のデータソースを公開 `GET /public/stats` の `lastSync.responseSyncFinishedAt` に確定（API 拡張不要）する（§1）。
- 既存コンポーネント再利用可否（Banner 不使用・`formatJstDateTime` 再利用）を判断する（§2）。
- props / 型 / root 要素 / 識別子 / 表示文言を固定する（§3）。
- `/members`・`/profile` の配置と fail-soft 並列 fetch 戦略を設計する（§4）。
- 入出力・副作用（read-only / D1 非アクセス）を整理する（§5）。

## 参照資料

- `apps/web/src/components/public/ReflectionTimingNote.tsx`
- `apps/web/src/components/public/__tests__/ReflectionTimingNote.spec.tsx`
- `apps/web/app/(public)/members/page.tsx`
- `apps/web/app/(member)/profile/page.tsx`
- `docs/00-getting-started-manual/specs/03-data-fetching.md`
- `apps/api/src/use-cases/public/get-public-stats.ts` / `packages/shared/src/zod/viewmodel.ts`

## 成果物

- 本 Phase 2 設計記述（データソース判断 / props・型シグネチャ / 表示文言 / 配置・fetch 戦略 / 副作用）。

## 統合テスト連携

本タスクは公開 `GET /public/stats` の `lastSync.responseSyncFinishedAt` を流用する read-only 表示で、新規 API / D1 変更を伴わない。品質担保はコンポーネント単体 spec（`ReflectionTimingNote.spec.tsx` 7 ケース）と既存 `/members`・`/profile` page 統合テスト（fail-soft 経路）で行う。

## 1. 設計判断 — 最終同期時刻のデータソース（API 拡張は不要）

| 候補 | 公開可否 | 最終同期時刻フィールド | 採否 |
|------|---------|----------------------|------|
| `GET /public/stats` | 公開（無認証） | **あり**: `lastSync.responseSyncFinishedAt`（`string \| null`）/ `responseSync`（`"ok"\|"running"\|"failed"\|"never"`） | **採用** |
| `GET /admin/diagnostics/forms-pipeline` | admin 専用（`requireAdmin`） | あり: `lastSuccessfulSyncAt` | 不採用（公開 / 本人ページで admin auth 不可） |
| `/me`・`/me/profile` | 本人認証 | **なし** | 流用不可 |

### 結論: 既存 `GET /public/stats` をそのまま使う（不変条件 #5 を満たす）

- view-model は既に最終同期時刻を含む。`apps/api/src/use-cases/public/get-public-stats.ts` で `lastSync.responseSyncFinishedAt = responseJob?.finishedAt ?? null` を返し、shared zod `PublicStatsViewZ.lastSync`（`packages/shared/src/zod/viewmodel.ts`、`.strict()`）に定義済み。
- Web 側 `getStats()`（`apps/web/src/lib/api/public.ts`）はこの schema で `.parse()` 済みのため、`PublicStatsView.lastSync.responseSyncFinishedAt` を追加実装なしで型安全に参照可能。
- `/members` は既に `getStats()` を呼んでいる（`statsResult`）。**新規 fetch は不要**で、取得済み `statsResult.data.lastSync` を表示コンポーネントへ渡すだけ。
- `/profile` は現在 stats を呼んでいないため、`getStats()` を **並列追加 fetch** する。stats は公開・無認証で取得でき、失敗しても profile 本体描画は継続する（fail-soft）。

> **apps/api の拡張は不要**。本タスクは「既存 API のみ接続」の不変条件を素直に満たす。

## 2. 既存コンポーネント再利用可否（[FB-SDK-07-1]）

| 検討 | 判断 |
|------|------|
| `Banner` primitive を使うか | landed 実装は **生 `<aside>` + token className** を選択（軽量な注記表示のため Banner の tone/icon 構造が過剰）。新規 primitive は生やさない（公開層の既存 token css のみ使用）。 |
| JST 整形 | 既存 helper `formatJstDateTime(iso)`（`apps/web/src/lib/format/datetime.ts`）を再利用（新規フォーマッタを作らない）。 |
| fetch helper | `/members` は既存 `statsResult` を流用。`/profile` は既存 `getStats()` + `safeServerFetch` を再利用。 |

## 3. コンポーネント / 関数 / 型シグネチャ（current facts）

### 3-1. 反映目安の定数（コンポーネント内に集約）

```ts
const RESPONSE_SYNC_MAX_DELAY_MINUTES = 15; // response sync cron `*/15 * * * *`
const MEMBERS_ISR_MAX_SECONDS = 30;         // /members の export const revalidate = 30
const WORST_CASE_MAX_MINUTES = 45;          // 互換 hourly scheduled sync `0 * * * *` を待つ最悪ケース
```

### 3-2. `ReflectionTimingNote` の props / シグネチャ

```tsx
// apps/web/src/components/public/ReflectionTimingNote.tsx
import type { JSX } from "react";
import { formatJstDateTime } from "../../lib/format/datetime";

export type ReflectionTimingSurface = "members" | "profile";

export interface ReflectionTimingNoteProps {
  readonly surface: ReflectionTimingSurface;
  readonly lastSyncAt: string | null;     // GET /public/stats の lastSync.responseSyncFinishedAt
  readonly maxDelayMinutes?: number;        // 既定 = RESPONSE_SYNC_MAX_DELAY_MINUTES(15)・prop で上書き可
  readonly statsUnavailable?: boolean;      // stats 取得失敗時 true
}

export function ReflectionTimingNote(props: ReflectionTimingNoteProps): JSX.Element;
```

### 3-3. root 要素・識別子（landed 実装）

```tsx
<aside
  className="rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-3 text-sm text-[var(--ubm-color-text-secondary)]"
  data-testid={`reflection-timing-${surface}`}
  aria-label="Google Form 反映タイミング"
>
```

- 色・余白は **token css variable の arbitrary value**（`bg-[var(--ubm-color-...)]`）のみで表現。HEX 直書き・`bg-[#xxx]`・inline `style` は導入しない（OKLch トークン正本化）。
- `data-testid="reflection-timing-{surface}"` を root に付与（テスト・将来の visual baseline 参照用）。

### 3-4. 表示文言（確定）

| 状態 | 表示文言 |
|------|---------|
| `lastSyncAt` あり | 「最終同期: {formatJstDateTime(lastSyncAt)}（JST）」 |
| `lastSyncAt === null` | 「最終同期: まだ同期されていません」 |
| `statsUnavailable === true` | 「最終同期時刻を取得できませんでした」 |
| 反映目安（members） | 「Google Form 送信後、最大約 {maxDelayMinutes} 分で同期され、一覧反映まで最大 {MEMBERS_ISR_MAX_SECONDS} 秒のキャッシュ待ちがあります（最大約 {WORST_CASE_MAX_MINUTES} 分）。」 |
| 反映目安（profile） | 「Google Form 送信後、最大約 {maxDelayMinutes} 分で同期されます。マイページはキャッシュを使わないため、同期完了後ただちに反映されます。」 |
| 反映先の差異（members） | 「この一覧には、公開許可（公開同意 + 公開設定 + 未削除）を満たすメンバーのみ表示されます。」 |
| 反映先の差異（profile） | 「マイページには公開状態に関係なく、あなたの最新の回答内容がすべて反映されます。」 |

## 4. 配置設計（current facts）

### 4-1. `/members/page.tsx`（編集）

既存 `statsResult` を再利用。新規 fetch は追加しない。`MemberFilters` の直後に配置。

```tsx
<ReflectionTimingNote
  surface="members"
  lastSyncAt={statsResult.ok ? statsResult.data.lastSync.responseSyncFinishedAt : null}
  statsUnavailable={!statsResult.ok}
/>
```

### 4-2. `/profile/page.tsx`（編集）

`meResult` 解決後、`/me/profile` と `getStats()` を `Promise.all` で並列取得（stats は fail-soft）。`PublicConsentCallout` の直後に配置。

```tsx
import { getStats } from "@/lib/api/public";

const [profileResult, statsResult] = await Promise.all([
  safeServerFetch(
    () => fetchAuthed<MeProfileResponse>("/me/profile"),
    { codePrefix: "MEMBER_FETCH", rethrowOn: [AuthRequiredError] },
  ),
  safeServerFetch(
    () => getStats({ revalidate: 60 }),
    { codePrefix: "PUBLIC_STATS" }, // rethrowOn を付けない → 失敗しても profile 継続
  ),
]);

// 認証済み描画ツリー内（PublicConsentCallout の後）
<ReflectionTimingNote
  surface="profile"
  lastSyncAt={statsResult.ok ? statsResult.data.lastSync.responseSyncFinishedAt : null}
  statsUnavailable={!statsResult.ok}
/>
```

> 注意: profile は `force-dynamic` / `revalidate=0`。`getStats()` 自体は public fetch だが、profile ページが dynamic のため毎リクエストで stats を読みつつ public 側キャッシュを利用する（追加負荷は最小）。`/me/profile` は `AuthRequiredError` を rethrow するため、stats は `rethrowOn` を付けずに fail-soft 化する。

## 5. 入出力・副作用

| 項目 | 内容 |
|------|------|
| 入力 | `ReflectionTimingNoteProps`（`surface` / `lastSyncAt` / `maxDelayMinutes?` / `statsUnavailable?`） |
| データソース | `lastSyncAt` = 公開 `GET /public/stats` の `lastSync.responseSyncFinishedAt`（shared `PublicStatsViewZ.lastSync` `.strict()` でバリデート済み） |
| 出力（描画） | `<aside data-testid="reflection-timing-{surface}" aria-label=...>` 内に最終同期時刻 + 反映目安 + 反映先差異文言 |
| 副作用 | なし（read-only 表示）。DOM 書き込み・state・effect・ブラウザ API・D1 / API への書き込みは一切なし |
| フォールバック | `lastSyncAt === null` → 「まだ同期されていません」。`statsUnavailable === true` → 「取得できませんでした」。いずれも本体描画継続（fail-soft） |
| データ層 | D1 直接アクセスなし（不変条件 #5）。Google Form schema / cron / publish_state ロジックは不変 |

## 完了条件

- [x] データソースを既存 `GET /public/stats` に固定し API 拡張不要を確定した。
- [x] 既存コンポーネント再利用可否（Banner 不使用・formatJstDateTime 再利用）を判断した。
- [x] props / 型 / root 要素 / 識別子 / 表示文言を current facts で固定した。
- [x] `/members`・`/profile` の配置と fetch 戦略（fail-soft 並列）を設計した。
