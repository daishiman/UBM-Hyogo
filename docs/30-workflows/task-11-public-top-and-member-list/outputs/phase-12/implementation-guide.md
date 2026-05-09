# task-11 implementation guide

## Part 1: 中学生レベル

このタスクは、学校の掲示板を見やすく作り直す作業に近い。入口には「どんな学校か」をひと目で伝える大きな案内を置き、次に人数や最近の活動を見せ、さらに名簿を探しやすくする。見たい人が「名前で探す」「並び順を変える」「表で見る」を選んでも、ページの住所にその選び方が残るので、もう一度開いても同じ見え方になる。

なぜ必要かというと、画面の並びや探し方がばらばらだと、見る人も作る人も迷うため。

先にこれを決める理由は、画面を作る人がそれぞれ違う作り方をすると、見た目や探し方がばらばらになるため。やることは、公開トップと会員一覧だけに絞り、既にあるデータの入口を使って、見やすく安全な画面へ組み立て直すこと。

何をするかは、公開トップと会員一覧の約束を決め、後で実装した人が同じ確認をできるように証拠の置き場所までそろえること。

### 今回作ったもの

- 公開トップと会員一覧の実装仕様
- Phase 1-13 の実行手順
- Phase 12 の 7 つの確認ファイル
- 実行時の証拠を置く場所

| 用語 | 日常語での言い換え |
| --- | --- |
| API | データを受け取る窓口 |
| URL query | ページの住所に付く検索メモ |
| density | 一覧の詰め方 |
| token | 色や余白の決まり |
| evidence | 作業ができた証拠 |

## Part 2: 技術者レベル

対象は `apps/web/app/page.tsx`、`apps/web/app/(public)/layout.tsx`、`apps/web/app/(public)/members/page.tsx`、`apps/web/src/components/public/**`、`apps/web/src/lib/api/public.ts`、`apps/web/src/lib/url/members-search.ts`、focused Vitest、`apps/web/playwright/tests/public-top-and-list.spec.ts`。

### TypeScript 型定義

主要 interface:

```ts
type Density = "comfy" | "dense" | "list";

type MembersSearch = {
  q: string;
  zone: string;
  status: string;
  tags: string[];
  sort: "recent" | "name";
  density: Density;
  page: number;
  limit: number;
};
```

### APIシグネチャ

API wrapper:

```ts
export async function getStats(options?: { revalidate?: number }): Promise<PublicStatsView>;
export async function listMembers(search: MembersSearch, options?: { revalidate?: number }): Promise<PublicMemberListView>;
export async function getMemberProfile(memberId: string, options?: { revalidate?: number }): Promise<PublicMemberProfile>;
export async function getFormPreview(options?: { revalidate?: number }): Promise<FormPreviewView>;
```

### 使用例

```ts
const stats = await getStats({ revalidate: 60 });
const list = await listMembers(MembersSearchZ.parse({ density: "list", page: 1 }), {
  revalidate: 30,
});
```

### エラーハンドリング

`fetchPublic` の HTTP error は `FetchPublicError` / `FetchPublicNotFoundError` として扱い、route segment の `error.tsx` へ委譲する。レスポンス schema に extra key が混入した場合は `XxxZ.parse()`（strict 定義済み schema） が throw し、false-green にしない。

### エッジケース

- `density=invalid` は `comfy` fallback。
- `tag` は複数 query を `tags[]` として保持する。
- `items.length === 0` は EmptyState と clear link を表示する。
- runtime screenshot / axe / coverage が未取得の間は `PENDING_RUNTIME_EVIDENCE` として扱う。
- screenshot は `outputs/phase-11/evidence/home-screenshot.png`、`members-comfy-screenshot.png`、`members-list-screenshot.png`、`members-empty-screenshot.png` を正本参照にする。

### 設定項目と定数一覧

| item | value |
| --- | --- |
| stats revalidate | 60 seconds |
| members revalidate | 30 seconds |
| request-time rendering | `connection()` |
| density | `comfy`, `dense`, `list` |
| test command | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-top-and-list.spec.ts --project=desktop-chromium` |

### テスト構成

- Vitest: `apps/web/src/lib/url/__tests__/members-search.test.ts`
- Vitest: `apps/web/src/lib/api/__tests__/public.test.ts`
- Vitest: `apps/web/src/components/public/__tests__/{Hero,Stats,MemberCard}.test.tsx`
- Playwright: `apps/web/playwright/tests/public-top-and-list.spec.ts`

### 実装制約

- `apps/web` から `D1Database` / `@cloudflare/workers-types` を import しない。
- `apps/api/src/routes/public/**` は変更せず、既存 `/public/stats` / `/public/members` を消費する。
- fetch result は `@ubm-hyogo/shared` の `XxxZ.parse()`（strict 定義済み schema） で検証する。
- `density=invalid` は `comfy` fallback。`tag` は複数 query を `tags[]` として保持する。
- 色は `var(--ubm-color-*)` / `var(--ubm-color-zone-*)` のみ。HEX / `bg-[#` / `text-[#` は 0 件。
- `revalidate` は stats 60 秒、members 30 秒。
- `dynamic = "force-dynamic"` は使わず、`connection()` で build-time prerender fetch を避ける。

検証コマンド:

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test src/components/public src/lib/url src/lib/api/public
mise exec -- pnpm --filter @ubm-hyogo/web build
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-top-and-list.spec.ts --project=desktop-chromium
```
