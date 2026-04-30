# implementation-guide.md — 06a 公開層実装ガイド

## Part 1: 中学生レベルの説明

### なぜこのタスクが必要か（日常の例え）

学校で「クラスの自己紹介ページ」を作ることを想像してください。1 枚の紙に全員の名前・趣味・自己紹介を貼っておけば、知りたい人がすぐに探せて便利ですよね。今回のタスクは、UBM 兵庫支部会のメンバーを、誰でも見られる Web サイト 4 ページに整理することです。

### どんな困りごとを解決するか

- これまで「メンバー一覧」を見るには Google スプレッドシートを開く必要があった
- どこに住んでいるか・何のお仕事か・どんなゾーン (0→1, 1→10, 10→100) のメンバーかが、一目で分からなかった
- 登録したい人が「どこから始めればよいか」迷っていた

### 解決後の状態

- 誰でも `/members` で一覧を見られる（スマホでもパソコンでも）
- 名前で探したい・地域で絞りたいなど、URL に検索条件が残るので「リンクを共有」できる
- 登録したい人は `/register` から Google フォームへすぐ進める

### 専門用語のミニ辞典

- **App Router**: Next.js でページを作る仕組み。フォルダ名がそのまま URL になる
- **Server Component**: ページの中身をサーバ側で組み立てて、ブラウザに HTML を送る仕組み。表示が速く、SEO にも良い
- **Client Component**: ブラウザで動く部分。検索ボックスのように「ユーザーの操作」がいる場所で使う
- **URL query**: URL の `?` の後ろにつく検索条件（例 `?q=hello&zone=0_to_1`）
- **revalidate**: ページの内容を「何秒ごとに作り直すか」の設定。短いと最新だがサーバ負荷↑、長いと負荷↓だが古くなる
- **stableKey**: フォーム項目の「不変の名前」。Google フォームを編集しても消えない目印

---

## Part 2: 開発者・技術者レベル

### 概要

`apps/web` の (public) ルートグループに 4 ルート (`/`, `/members`, `/members/[id]`, `/register`) を Next.js App Router (16) + RSC + `@opennextjs/cloudflare` で実装。検索状態は URL query を正本とし、`localStorage` / `window.UBM` を使わない。

### ディレクトリ

```
apps/web/
├── app/
│   ├── page.tsx                                 # /
│   ├── error.tsx                                # 共通 error boundary
│   ├── not-found.tsx                            # 共通 404
│   └── (public)/
│       ├── layout.tsx                           # 既存
│       ├── members/
│       │   ├── page.tsx                         # /members
│       │   ├── _components/
│       │   │   ├── MembersFilterBar.client.tsx  # Client
│       │   │   └── MemberList.tsx               # Server
│       │   └── [id]/page.tsx                    # /members/[id]
│       └── register/page.tsx                    # /register
└── src/
    ├── lib/
    │   ├── fetch/public.ts
    │   └── url/members-search.ts
    └── components/
        ├── feedback/EmptyState.tsx
        └── public/{Hero,StatCard,MemberCard,Timeline,ProfileHero,FormPreviewSections}.tsx
```

### URL query contract

```ts
// apps/web/src/lib/url/members-search.ts
export const membersSearchSchema = z.object({
  q: z.string().transform(s => s.trim().replace(/\s+/g, " ").slice(0, 200)).catch(""),
  zone: z.enum(["all", "0_to_1", "1_to_10", "10_to_100"]).catch("all"),
  status: z.enum(["all", "member", "non_member", "academy"]).catch("all"),
  tag: z.array(z.string().min(1)).transform(arr => arr.slice(0, 5)).catch([]),
  sort: z.enum(["recent", "name"]).catch("recent"),
  density: z.enum(["comfy", "dense", "list"]).catch("comfy"),
});

export type MembersSearch = z.infer<typeof membersSearchSchema>;
export function parseSearchParams(sp): MembersSearch;
export function toApiQuery(s: MembersSearch): URLSearchParams;
```

エラーハンドリング: 不正値は `catch` で初期値にフォールバック (AC-6)。`q` は trim + 連続空白を 1 つに正規化 + 200 文字 truncate。`tag` は repeated query で AND 検索 (AC-5)、5 件 truncate。

### fetcher

```ts
// apps/web/src/lib/fetch/public.ts
export async function fetchPublic<T>(path: string, options?: { revalidate?: number, ...RequestInit }): Promise<T>;
export class FetchPublicNotFoundError extends Error {}
export async function fetchPublicOrNotFound<T>(path, options): Promise<T>; // 404 を独自 error で throw
```

### revalidate 設定

| route | revalidate | 理由 |
| --- | --- | --- |
| `/` | 60s | stats / featured members の鮮度バランス |
| `/members` | 30s | 検索結果は鮮度優先 |
| `/members/[id]` | 60s | プロフィール変更追従 |
| `/register` | 600s | form schema は cron sync、長め |

### ESLint 設計（placeholder）

```js
{
  rules: {
    "no-restricted-globals": ["error", { name: "UBM", message: "window.UBM 禁止 (#6)" }],
    "no-restricted-syntax": [
      "error",
      { selector: "Literal[value=/^[0-9a-fA-F]{20,}$/]", message: "questionId 直書き禁止 (#1, AC-8)" },
      { selector: "MemberExpression[object.name='localStorage']", message: "localStorage を正本にしない (#8, AC-9)" },
    ],
  },
}
```

### 実行・検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web typecheck   # error 0
mise exec -- pnpm vitest run apps/web/src/lib/url/__tests__/members-search.test.ts   # 10 passed
mise exec -- pnpm --filter @ubm-hyogo/web build       # production build
mise exec -- pnpm --filter @ubm-hyogo/web dev         # local dev (要 PUBLIC_API_BASE_URL)
```

### Phase 11 evidence

ローカル smoke は `outputs/phase-11/evidence/` に保存する。

| 種別 | 保存先 |
| --- | --- |
| curl HTML / status | `outputs/phase-11/evidence/curl/` |
| スクリーンショット | `outputs/phase-11/evidence/screenshot/` |
| command log | `outputs/phase-11/evidence/cmd/` |

2026-04-29 の再検証では、`wrangler dev` が esbuild host / binary version mismatch で起動できなかったため、04a public API と同じ response shape の local mock API を port 8787 で起動して `/`, `/members`, `/members/M001`, `/members/UNKNOWN`, `/register` を確認した。実 D1 + Workers の staging smoke は 08b / 09a の後続検証で扱う。

### 環境変数

| 変数 | 区分 | 例 | 配置 |
| --- | --- | --- | --- |
| `PUBLIC_API_BASE_URL` | public var | `http://localhost:8787` (local), `https://api-staging.ubm-hyogo.workers.dev` | wrangler vars |
| `GOOGLE_FORM_RESPONDER_URL` | public const | spec 固定値 | コード内 const |

### 拡張ガイド

- **density 値追加**: `members-search.ts` の enum に追記 → FilterBar の DENSITY_OPTIONS に追加 → MemberCard の density 分岐に対応 → 04a 側で受理する density に追加
- **tag chips 追加**: `MembersFilterBar.client.tsx` に Chip リストを追加し、`onTagToggle` を呼ぶ
- **新規 sort 追加**: `members-search.ts` の `SORT_VALUES` を拡張 → 04a 側 `applyOrder` に対応
- **04a endpoint 追加**: `fetchPublic<T>` に新 path を渡すだけ。型は `packages/shared` から import

### AC-1〜AC-12 への対応箇所

| AC | 実装ファイル / 機能 |
| --- | --- |
| AC-1 | 4 page.tsx + `notFound()` + `not-found.tsx` |
| AC-2 | `<a href>` + `router.replace` |
| AC-3 | `parseSearchParams` + `toApiQuery` (`q` max 200) |
| AC-4 | enum DENSITY_VALUES |
| AC-5 | `tag.append()` + zod array |
| AC-6 | `.catch()` |
| AC-7 | コードに `window.UBM` 参照ゼロ |
| AC-8 | stableKey 経由の KVList |
| AC-9 | URL query 正本、`localStorage` 不参照 |
| AC-10 | `publicSections` のみ render |
| AC-11 | `RegisterPage` + `FALLBACK_RESPONDER_URL` + `FormPreviewSections` |
| AC-12 | 09-ui-ux 検証は 08b Playwright で確定 |

### 不変条件への対応

- #1: stableKey のみ参照、questionId 直書きなし
- #5: D1 直接 import なし、`fetchPublic` 経由のみ
- #6: `window.UBM` 参照ゼロ
- #8: density / sort / tag / q / zone / status は URL query 正本
- #9: `/no-access` ルート不在
- #10: revalidate 30〜600s + 04a Cache-Control
