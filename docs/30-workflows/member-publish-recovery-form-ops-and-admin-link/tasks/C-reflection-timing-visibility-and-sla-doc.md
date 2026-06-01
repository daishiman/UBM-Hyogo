# タスク C — 反映タイミングの可視化 + 反映 SLA ドキュメント

**[実装区分: 実装仕様書]**

親ワークフロー: `member-publish-recovery-form-ops-and-admin-link`
責務（単一責務）: 「Google Form 登録から**何分で**反映されるか」「**どこに**反映されるか（公開一覧 / 本人プロフィール）」を、(1) 公開一覧 `/members` と本人マイページ `/profile` の UI 上に**反映タイミングとして可視化**し、(2) `docs/00-getting-started-manual/specs/03-data-fetching.md` に**反映 SLA セクションを追記**して恒久的にドキュメント化する。

> 本タスクは **read-only 表示の追加** と **既存 endpoint 由来データの再利用** のみで完結する。新規 D1 migration / Google Form schema 変更 / cron 間隔変更は行わない（不変条件・親 SCOPE 準拠）。

---

## 1. 目的 / 受け入れ条件（AC）

### 目的

会員・来訪者・管理者が「フォーム送信後どれくらいで一覧 / マイページに反映されるか」を**毎回問い合わせずに自力で把握**できるようにする。反映には複数の遅延段（cron 同期待ち + ISR キャッシュ）が積み重なるため、(a) UI 上に最終同期時刻と反映目安を表示し、(b) 仕様書に SLA を明文化して、サポート問い合わせと誤解（「壊れている / 反映されない」）を減らす。

### 反映の時系列（確定事実・本タスクの根拠）

```text
[1] フォーム送信
  -> [2] response sync cron `*/15 * * * *`（最大約15分待ち）
        apps/api/wrangler.toml:14, apps/api/src/index.ts:477
  -> [3] runResponseSync() が D1 へ upsert（member_responses / identity / consent snapshot）
        apps/api/src/index.ts:481
  -> [4] auto-publish 判定（MEMBERS_AUTO_PUBLISH_ON_CONSENT が true のとき member_only→public 昇格）
  -> [5] Web ISR revalidate（/members は 30 秒）
        apps/web/app/(public)/members/page.tsx:30 `export const revalidate = 30`
  -> [6] 表示
```

- 一般的（`*/15` 同期）: 送信 → 最大約 **15 分 + 30 秒** で `/members` 反映。
- 最悪ケース（互換経路の毎時 scheduled sync `0 * * * *` を待つ運用時）: 約 **15〜45 分**。
- 本人マイページ `/profile` は ISR キャッシュ無し（`force-dynamic` / `revalidate=0`、`cache:"no-store"`）のため、律速は **cron sync 完了のみ**（ステップ[5]を経由しない）。

### 受け入れ条件

| ID | 受け入れ条件 |
|----|-------------|
| AC-C1 | `/members`（公開一覧）に「最終同期時刻（JST）」と「反映目安（送信後最大約 15 分 + キャッシュ最大 30 秒）」が表示される。最終同期時刻は既存 `GET /public/stats` の `lastSync.responseSyncFinishedAt` を表示する（API 拡張なし）。`responseSyncFinishedAt` が `null`（未同期）／stats 取得失敗時はフォールバック文言を表示し、`/members` 全体は描画を止めない。 |
| AC-C2 | `/profile`（本人マイページ）に「最終反映時刻（= 直近 response sync 成功時刻、JST）」と、「**公開状態に関係なく本人の最新データが反映される**」旨が表示される。最終反映時刻は `GET /public/stats` の `lastSync.responseSyncFinishedAt`（global な直近同期成功時刻）を流用する（`/me` 系は同期時刻を返さないため）。stats 取得失敗時はフォールバック文言を出し、profile 本体描画は止めない。 |
| AC-C3 | `docs/00-getting-started-manual/specs/03-data-fetching.md` に「反映 SLA」セクションが追記され、(a) 反映の時系列テーブル、(b) `/members`（公開条件 3 件必須・ISR 30 秒）と `/profile`（公開状態に関係なく反映・キャッシュ無し）の違い、(c) 最悪ケースのレイテンシ目安が明文化される。 |
| AC-C4 | 「**本人プロフィールは公開状態に関係なく反映される / 公開一覧は公開条件（public_consent=consented AND publish_state=public AND is_deleted=0）を満たす場合のみ反映される**」という差異が、**doc（03-data-fetching.md）と UI（`/members` と `/profile` の表示文言）の両方**で明示される。 |

---

## 2. 設計判断 — 最終同期時刻のデータソース（API 拡張は不要）

「最終同期時刻」を UI に出すためのデータソースを既存 endpoint surface のみで満たせるか調査した結論。

| 候補 | 公開可否 | 最終同期時刻フィールド | 採否 |
|------|---------|----------------------|------|
| `GET /public/stats` | 公開（無認証） | **あり**: `lastSync.responseSyncFinishedAt`（`string \| null`）/ `lastSync.schemaSyncFinishedAt`（`string \| null`）/ `lastSync.responseSync`（`"ok"\|"running"\|"failed"\|"never"`） | **採用** |
| `GET /admin/diagnostics/forms-pipeline` | admin 専用（`requireAdmin`） | あり: `lastSuccessfulSyncAt` / `latestSyncRuns[].finishedAt` | 不採用（公開 `/members` / 本人 `/profile` では admin auth を要求できない） |
| `/me`・`/me/profile` | 本人認証 | **なし**（同期時刻フィールドを返さない） | 流用不可 |

### 結論: 既存 `GET /public/stats` をそのまま使う（不変条件 #5 を満たす）

- `GET /public/stats` の view-model は **既に最終同期時刻を含む**。`apps/api/src/use-cases/public/get-public-stats.ts:71-76` で `lastSync.responseSyncFinishedAt = responseJob?.finishedAt ?? null` を返し、shared zod schema `PublicStatsViewZ.lastSync`（`packages/shared/src/zod/viewmodel.ts:107-112`、`.strict()`）にも `responseSyncFinishedAt` / `schemaSyncFinishedAt` が定義済み。
- Web 側 `getStats()`（`apps/web/src/lib/api/public.ts:41-49`）はこの schema で `.parse()` 済みのため、`PublicStatsView.lastSync.responseSyncFinishedAt` を**追加実装なしで型安全に参照可能**。
- `/members` は既に `getStats()` を呼んでいる（`apps/web/app/(public)/members/page.tsx:58-65`、`statsResult`）。**新規 fetch は不要**で、取得済み `statsResult.data.lastSync` を表示コンポーネントへ渡すだけ。
- `/profile` は現在 stats を呼んでいないため、`getStats()` を**並列追加 fetch**する（`/me` と同時 `Promise.all`）。stats は公開・無認証で取得でき、失敗しても profile 本体描画は継続する（fail-soft）。

> よって **apps/api の拡張（stats への lastSyncAt 追加 / 専用 read endpoint 新設）は不要**。本タスクは「既存 API のみ接続」の不変条件を素直に満たす。`forms-pipeline.ts` は admin 認証必須のため公開/本人ページからは呼ばない（不変条件 #5・親 SCOPE）。
> （調査メモ: `apps/api/src/diagnostics/forms-pipeline.ts:266-273` の snapshot には `lastSuccessfulSyncAt` フィールドが存在するが、web 側 mirror schema `apps/web/src/features/admin/diagnostics/types.ts` の `FormsPipelineSnapshotSchema` 側には当該フィールドが未定義。本タスクでは公開 `/public/stats` を使うため、この admin snapshot 系には依存しない。）

---

## 3. 変更対象ファイル一覧

| ファイル | 変更種別 | 内容 |
|---------|---------|------|
| `apps/web/src/components/public/ReflectionTimingNote.tsx` | 新規 | 反映タイミングを表示する read-only Server Component（最終同期時刻 + 反映目安 + どこに反映されるかの差異文言）。公開層 primitive（`Banner` 等）で構成し新規 primitive を生やさない。 |
| `apps/web/app/(public)/members/page.tsx` | 編集 | 取得済み `statsResult.data.lastSync` を `ReflectionTimingNote` に渡して `header` 直下 or 一覧上部に配置（surface=`members`）。 |
| `apps/web/app/(member)/profile/page.tsx` | 編集 | `getStats()` を `/me` と並列 fetch（fail-soft）。取得結果の `lastSync.responseSyncFinishedAt` を `ReflectionTimingNote`（surface=`profile`）へ渡して配置。 |
| `docs/00-getting-started-manual/specs/03-data-fetching.md` | 編集 | 「反映 SLA」セクションを追記（§9 のドラフト本文を採用）。 |
| `apps/web/src/components/public/__tests__/ReflectionTimingNote.spec.tsx` | 新規 | コンポーネントの分岐（surface 別文言 / null・取得失敗時フォールバック / JST フォーマット）を検証（`*.spec.tsx` のみ・不変条件 #8）。 |

> 上記以外は変更しない。D1 schema / API endpoint / Google Form 仕様 / cron 間隔は変更しない。`apps/api` への変更は**発生しない**（§2 の結論）。

---

## 4. コンポーネント / 関数 / 型シグネチャ

### 4-1. 反映目安の定数（コンポーネント内に集約）

cron 間隔と ISR revalidate を「定数の単一情報源」としてコンポーネント先頭に定義する（マジックナンバー散在を避ける）。

```ts
// 反映目安の根拠値（CLAUDE.md / wrangler.toml / members page と一致させる）
const RESPONSE_SYNC_MAX_DELAY_MINUTES = 15; // response sync cron `*/15 * * * *`
const MEMBERS_ISR_MAX_SECONDS = 30;         // /members の export const revalidate = 30
const WORST_CASE_MAX_MINUTES = 45;          // 互換 hourly scheduled sync `0 * * * *` を待つ最悪ケース
```

### 4-2. `ReflectionTimingNote` の props / シグネチャ

```tsx
// apps/web/src/components/public/ReflectionTimingNote.tsx
import type { JSX } from "react";

export type ReflectionTimingSurface = "members" | "profile";

export interface ReflectionTimingNoteProps {
  /** 表示面。文言・反映先の説明を切り替える。 */
  readonly surface: ReflectionTimingSurface;
  /**
   * 直近 response sync 成功時刻（ISO 文字列）。
   * 公開 `GET /public/stats` の `lastSync.responseSyncFinishedAt` を渡す。
   * 未同期（never）/ stats 取得失敗時は null を渡す。
   */
  readonly lastSyncAt: string | null;
  /**
   * 反映の最大遅延（分）。既定は RESPONSE_SYNC_MAX_DELAY_MINUTES(=15)。
   * テスト・将来の cron 間隔変更に追随できるよう prop で上書き可能にする。
   */
  readonly maxDelayMinutes?: number;
  /** stats 自体の取得に失敗したか（true なら最終同期時刻を「取得できませんでした」と表示）。 */
  readonly statsUnavailable?: boolean;
}

export function ReflectionTimingNote(
  props: ReflectionTimingNoteProps,
): JSX.Element { /* ... */ }
```

### 4-3. 表示文言（確定）

JST 整形は既存 helper `formatJstDateTime(iso)`（`apps/web/src/lib/format/datetime.ts:11`）を再利用する（新規フォーマッタを作らない）。

| 状態 | 表示文言（例） |
|------|---------------|
| `lastSyncAt` あり | 「最終同期: {formatJstDateTime(lastSyncAt)}（JST）」 |
| `lastSyncAt === null`（未同期） | 「最終同期: まだ同期されていません」 |
| `statsUnavailable === true` | 「最終同期時刻を取得できませんでした」 |
| 反映目安（surface=`members`） | 「Google Form 送信後、最大約 {maxDelayMinutes} 分で同期され、一覧反映まで最大 {MEMBERS_ISR_MAX_SECONDS} 秒のキャッシュ待ちがあります（最大約 {WORST_CASE_MAX_MINUTES} 分）。」 |
| 反映目安（surface=`profile`） | 「Google Form 送信後、最大約 {maxDelayMinutes} 分で同期されます。マイページはキャッシュを使わないため、同期完了後ただちに反映されます。」 |
| 反映先の差異（surface=`members`） | 「この一覧には、公開許可（公開同意 + 公開設定 + 未削除）を満たすメンバーのみ表示されます。」 |
| 反映先の差異（surface=`profile`） | 「マイページには公開状態に関係なく、あなたの最新の回答内容がすべて反映されます。」 |

- 色・余白は公開層 primitive（`Banner` tone=`info` など、`apps/web/src/components/public/AllHiddenFallback.tsx` と同パターン）の data-tone / tokens.css 経由のみで表現し、HEX 直書き・`bg-[#xxx]`・inline `style` を導入しない（OKLch トークン正本化）。
- `data-region="reflection-timing"` と `data-surface={surface}` を root に付与し、テスト・将来の visual baseline で参照できるようにする。

### 4-4. `/members/page.tsx` への配置（編集箇所）

既存の `statsResult`（`members/page.tsx:58-65`）を再利用する。新規 fetch は追加しない。

```tsx
// header の直後、MemberFilters の前後いずれか（一覧上部）に配置
<ReflectionTimingNote
  surface="members"
  lastSyncAt={statsResult.ok ? statsResult.data.lastSync.responseSyncFinishedAt : null}
  statsUnavailable={!statsResult.ok}
/>
```

### 4-5. `/profile/page.tsx` への配置（編集箇所）

`/me` 取得（`profile/page.tsx:38-47`）に `getStats()` を**並列追加**する。stats は公開・無認証で取得でき、失敗しても profile を止めない。

```tsx
// 既存 import に追加
import { getStats } from "@/lib/api/public";

// meResult 取得と同じ段で stats を並列取得（fail-soft）
const statsResult = await safeServerFetch(
  () => getStats(),
  { codePrefix: "PUBLIC_FETCH" }, // rethrowOn は付けない（失敗しても profile を継続）
);

// 認証済み描画ツリー内（ProfileHeader / StatusBanner 付近）に配置
<ReflectionTimingNote
  surface="profile"
  lastSyncAt={statsResult.ok ? statsResult.data.lastSync.responseSyncFinishedAt : null}
  statsUnavailable={!statsResult.ok}
/>
```

> 注意: profile は `force-dynamic` / `revalidate=0`（`profile/page.tsx:32-33`）。`getStats()` 自体は `revalidate=60` の public fetch だが、profile ページが dynamic のため、毎リクエストで stats を読みつつ public 側のキャッシュを利用する形になる（追加負荷は最小）。`getStats()` を `Promise.all` で `/me` と束ねてもよいが、`/me` は `AuthRequiredError` を rethrow する必要があるため、まず `/me` を解決してから stats を取得する（または `/me` だけ try/catch で囲み stats は別行で取得する）。実装では既存の `/me` 認証フロー（rethrow on `AuthRequiredError`）を壊さないことを優先する。

---

## 5. 入出力・副作用

| 項目 | 内容 |
|------|------|
| 入力 | `ReflectionTimingNoteProps`（`surface` / `lastSyncAt` / `maxDelayMinutes?` / `statsUnavailable?`）。 |
| データソース | `lastSyncAt` の値は **公開 `GET /public/stats` の `lastSync.responseSyncFinishedAt`**（`apps/api/src/use-cases/public/get-public-stats.ts:71-76` 由来、shared `PublicStatsViewZ.lastSync`（`.strict()`）でバリデート済み）。`/members` は既存 `statsResult` を流用、`/profile` は `getStats()` を新規並列 fetch。 |
| 出力（描画） | `<section data-region="reflection-timing" data-surface=...>` 内に `Banner`（tone=info）で最終同期時刻 + 反映目安 + 反映先差異文言を表示。 |
| 副作用 | なし（read-only 表示）。DOM 書き込み・state・effect・ブラウザ API・D1 / API への書き込みは一切なし。 |
| フォールバック | `lastSyncAt === null` → 「まだ同期されていません」。`statsUnavailable === true` → 「取得できませんでした」。いずれの場合も `/members` / `/profile` 本体は描画を継続する（fail-soft）。 |
| データ層 | D1 直接アクセスなし（不変条件 #5）。Google Form schema / cron / publish_state ロジックは不変。 |

---

## 6. テスト方針

新規 `apps/web/src/components/public/__tests__/ReflectionTimingNote.spec.tsx`（`*.spec.tsx` のみ・不変条件 #8）。既存の public component spec と同じ vitest + jsdom + Testing Library 構成に従う。Server Component だが副作用のない純表示のため、props を直接渡して `render()` で検証する。

| テストケース | 期待 |
|-------------|------|
| `lastSyncAt` あり / surface=members | 「最終同期:」+ `formatJstDateTime(lastSyncAt)` の JST 文字列が表示され、反映目安に「最大約 15 分」「最大 30 秒」「最大約 45 分」が含まれる。 |
| `lastSyncAt` あり / surface=profile | 反映目安に「最大約 15 分」と「キャッシュを使わない」旨が含まれ、`/members` 用の「30 秒」キャッシュ文言は**含まれない**。 |
| `lastSyncAt === null` | 「まだ同期されていません」を表示し、ISO 文字列や `Invalid Date` を表示しない。 |
| `statsUnavailable === true` | 「取得できませんでした」を表示する（最終同期時刻欄を時刻として描画しない）。 |
| 反映先の差異 / surface=members | 「公開許可（公開同意 + 公開設定 + 未削除）を満たすメンバーのみ表示」旨の文言を含む。 |
| 反映先の差異 / surface=profile | 「公開状態に関係なく…すべて反映されます」旨の文言を含む。 |
| `maxDelayMinutes` 上書き | `maxDelayMinutes={20}` を渡すと「最大約 20 分」と表示される（既定 15 の上書きが効く）。 |
| `data-region` / `data-surface` | root に `data-region="reflection-timing"` と `data-surface={surface}` が付く。 |

> `formatJstDateTime` は実 helper をそのまま使用（モック不要）。タイムゾーンは helper 内で `Asia/Tokyo` 固定のため、テスト環境の TZ 設定に依存しない。

---

## 7. ローカル実行・検証コマンド

リポジトリルートで `mise exec --` 経由で実行（CLAUDE.md「よく使うコマンド」準拠）。

```bash
# 型チェック（ReflectionTimingNoteProps / page 配線 / PublicStatsView.lastSync 参照の型整合）
mise exec -- pnpm typecheck

# Lint（boundaries / verify:no-inline-style / eslint。HEX 直書き・inline style 混入を検出）
mise exec -- pnpm lint

# 新規/関連 spec のみ実行
mise exec -- pnpm exec vitest run apps/web/src/components/public/__tests__/ReflectionTimingNote.spec.tsx

# デザイントークン回帰（OKLch 正本・HEX 禁止 gate）
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens

# 新規 test ファイルの suffix 検査（*.test.* 混入禁止 / 不変条件 #8）は lefthook / CI gate で自動実行
```

> `pnpm lint`（ルート）は `verify:no-inline-style` を含むため、`ReflectionTimingNote` に `style={{...}}` を書かない（className トークン変数で表現する）。

---

## 8. DoD（Definition of Done）

- [ ] `ReflectionTimingNote.tsx` が新規作成され、`surface`（members/profile）/ `lastSyncAt` / `maxDelayMinutes?` / `statsUnavailable?` の props を受け取り、§4-3 の文言を表示する。
- [ ] `/members` が既存 `statsResult.data.lastSync.responseSyncFinishedAt` を `ReflectionTimingNote`（surface=members）に渡して表示する（新規 fetch を追加していない）。
- [ ] `/profile` が `getStats()` を fail-soft で並列取得し、`ReflectionTimingNote`（surface=profile）に最終反映時刻を渡して表示する。stats 取得失敗時も profile 本体が描画される。既存 `/me` の `AuthRequiredError` rethrow フローを壊していない。
- [ ] `03-data-fetching.md` に「反映 SLA」セクション（§9 ドラフト本文）が追記され、時系列テーブル + `/members`・`/profile` の違い + 最悪ケース目安が明文化されている。
- [ ] 「本人プロフィールは公開状態に関係なく反映 / 公開一覧は公開条件 3 件必須」の差異が **doc と UI の両方**で明示されている（AC-C4）。
- [ ] 新規 `ReflectionTimingNote.spec.tsx`（`*.spec.tsx`）が §6 のケースを満たし pass する。
- [ ] `pnpm typecheck` / `pnpm lint` / 関連 vitest / `verify-design-tokens` がすべて green。
- [ ] HEX 直書き・`bg-[#xxx]`・inline style を新規追加していない（OKLch トークン正本化）。
- [ ] D1 schema / API endpoint / Google Form 仕様 / cron 間隔を変更していない。`apps/api` に変更が発生していない。

---

## 9. `03-data-fetching.md` に追記する「反映 SLA」セクション ドラフト本文

> 配置: `03-data-fetching.md` 末尾「## 事故を防ぐルール」の**直前**に新規セクションとして挿入する（`## response sync` セクションの下流説明として自然な位置）。既存本文は変更しない（追記のみ）。

```markdown
---

## 反映 SLA（フォーム送信から表示までのレイテンシ）

Google Form の送信内容が画面に反映されるまでには、複数の遅延段が積み重なる。
正本となる遅延要因は (1) response sync cron の実行間隔、(2) Web 側の ISR キャッシュの 2 つである。

### 反映の時系列

| # | ステップ | 遅延要因 | 実装根拠 |
|---|---------|---------|---------|
| 1 | フォーム送信 | — | Google Form |
| 2 | response sync cron 実行 | 最大約 15 分（`*/15 * * * *`） | `apps/api/wrangler.toml` crons / `apps/api/src/index.ts`（`cron === "*/15 * * * *"` で `runResponseSync()`） |
| 3 | D1 へ upsert（member_responses / identity / consent snapshot） | sync 実行時間（通常数秒） | `runResponseSync()` |
| 4 | auto-publish 判定（任意） | sync と同一トランザクション | `MEMBERS_AUTO_PUBLISH_ON_CONSENT` が true のとき member_only→public 昇格 |
| 5 | Web ISR 再生成（公開一覧のみ） | 最大 30 秒（`revalidate = 30`） | `apps/web/app/(public)/members/page.tsx` `export const revalidate = 30` |
| 6 | 表示 | — | — |

### 表示面ごとの反映条件と遅延

| 表示面 | 反映条件 | キャッシュ | 律速 | 目安 |
|--------|---------|-----------|------|------|
| 公開一覧 `/members` | 公開条件 3 件すべて: `public_consent = consented` **かつ** `publish_state = public` **かつ** `is_deleted = false` | ISR 30 秒 | cron 同期 + ISR | 送信後、通常最大約 15 分 + 最大 30 秒。互換の毎時 scheduled sync（`0 * * * *`）を待つ最悪ケースで約 15〜45 分。 |
| 本人マイページ `/profile` | **公開状態に関係なく**本人の最新回答をすべて表示（`public_consent` / `publish_state` を問わない） | なし（`force-dynamic` / `cache: "no-store"`） | cron 同期のみ | 送信後、通常最大約 15 分。キャッシュ待ちはなく、同期完了後ただちに反映。 |

### 公開一覧と本人マイページの違い（重要）

- **本人マイページ `/profile`** は、公開状態（`publish_state`）や公開同意（`public_consent`）に**関係なく**、ログイン本人の最新データを反映する。`force-dynamic` でキャッシュを持たないため、律速は cron 同期の完了のみである。
- **公開一覧 `/members`** は、上記の公開条件 3 件をすべて満たすメンバーだけを表示する。1 件でも条件を欠けば（例: 公開同意済みでも `publish_state` が `member_only`）一覧には現れない。

> 「マイページには出るのに一覧に出ない」場合、原因は遅延ではなく**公開条件の不足**（多くは `publish_state ≠ public`）であることが多い。管理画面の診断（`GET /admin/diagnostics/forms-pipeline`）と公開状態 backfill を確認する。

### 最終同期時刻の確認方法

- 公開 `GET /public/stats` の `lastSync.responseSyncFinishedAt`（直近 response sync 成功時刻）で最終同期時刻を確認できる。`/members` と `/profile` の UI 上部にも表示する。
- 管理者は `GET /admin/diagnostics/forms-pipeline` の `lastSuccessfulSyncAt` / `latestSyncRuns` で詳細な同期履歴を確認できる。
```

---

## 10. 実コード根拠（行番号付き）

- response sync cron 間隔: `apps/api/wrangler.toml`（`crons = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]` を `[env.staging]` / `[env.production]` で定義、`wrangler.toml:14`）。`*/15 * * * *` ブランチで `runResponseSync()`（`apps/api/src/index.ts:477`、`ctx.waitUntil(runResponseSync(env, { trigger: "cron", client }))` は同 481）。互換の毎時 sync は `cron === "0 * * * *"` ブランチ（同 537-538）。
- 公開一覧 ISR: `apps/web/app/(public)/members/page.tsx:30`（`export const revalidate = 30;`）。stats 取得は同 58-65（`statsResult`）で既に存在。
- 公開条件 3 件 AND: `apps/api/src/repository/publicMembers.ts:37-39`（`public_consent='consented' AND publish_state='public' AND is_deleted=0`）。
- `/profile` のキャッシュ無し: `apps/web/app/(member)/profile/page.tsx:32-33`（`export const dynamic = "force-dynamic";` / `export const revalidate = 0;`）。本人データは `/me/profile`（`apps/web/.../profile/page.tsx:63-66`）。認証 fetch は `fetchAuthed`（`cache:"no-store"`、`apps/web/src/lib/fetch/authed.ts`）。`/me`・`/me/profile` のレスポンス（`apps/api/src/routes/me/index.ts:78-142`）には**同期時刻フィールドが無い**ことを確認済み。
- 公開 stats の最終同期時刻フィールド（採用データソース）:
  - use-case: `apps/api/src/use-cases/public/get-public-stats.ts:71-76`
    ```ts
    lastSync: {
      schemaSync: mapJobStatus(schemaJob),
      responseSync: mapJobStatus(responseJob),
      schemaSyncFinishedAt: schemaJob?.finishedAt ?? null,
      responseSyncFinishedAt: responseJob?.finishedAt ?? null,
    },
    ```
  - shared zod（`.strict()`）: `packages/shared/src/zod/viewmodel.ts:107-112`（`lastSync.responseSyncFinishedAt: z.string().nullable()`）。
  - web wrapper: `apps/web/src/lib/api/public.ts:41-49`（`getStats()` が `PublicStatsViewZ.parse(raw)` を返す）。
  - route の Cache-Control: `apps/api/src/routes/public/stats.ts:18`（`Cache-Control: public, max-age=60`）。
- admin 診断 snapshot（不採用・参考）: `apps/api/src/diagnostics/forms-pipeline.ts:266-273`（`lastSuccessfulSyncAt`）/ `:141-155`（`latestSyncRuns`）。web mirror schema `apps/web/src/features/admin/diagnostics/types.ts:12-46`（`FormsPipelineSnapshotSchema` には `lastSuccessfulSyncAt` 未定義）。`requireAdmin` 必須（`forms-pipeline.ts:386`）のため公開/本人ページからは利用しない。
- JST 整形 helper（再利用）: `apps/web/src/lib/format/datetime.ts:11`（`formatJstDateTime(iso)`、内部 `timeZone: "Asia/Tokyo"`）。
- 公開層 Banner 既存パターン（primitive 再利用の参照）: `apps/web/src/components/public/AllHiddenFallback.tsx:14-50`（`Banner tone="info"` + tokens.css）。
- SLA 追記先（現状 SLA 記述なし）: `docs/00-getting-started-manual/specs/03-data-fetching.md`（`## response sync`:86-105、公開条件:143-148、末尾「## 事故を防ぐルール」:224-231）。
- 不変条件: #5（D1 直接アクセスは `apps/api` に閉じる）/ #8（`*.spec.{ts,tsx}` のみ）/ OKLch トークン正本化（HEX 禁止）/ 親 SCOPE「既存 API のみ接続・新 endpoint 追加禁止」は CLAUDE.md 準拠。
```
