# Phase 4: テスト戦略

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 4 |
| task | task-11-public-top-and-member-list |
| state | implemented-local / implementation / VISUAL_ON_EXECUTION |

## 目的

vitest（unit）と Playwright（E2E smoke）の両層で、Phase 2 の設計を網羅する test を定義する。

## 実行タスク

- [ ] 単体テストケース ID（TC-U-XX）と E2E ケース ID（TC-E-XX）を確定する
- [ ] coverage 目標と un-skip 不変条件を記録する

## 参照資料

- Phase 2 §関数シグネチャ
- 一次原典 §5（テスト方針）
- `.claude/skills/task-specification-creator/references/quality-gates.md` §7 テスト常時実行可能性 DoD / §7.5 E2E lines coverage

## 成果物

- `outputs/phase-04/main.md`

## 統合テスト連携

- Vitest と Playwright の対象 spec を本 Phase の test matrix で固定する。
- Phase 9/11 の実行ログを acceptance evidence とする。

## テスト pyramid

| 層 | フレームワーク | 対象 |
| --- | --- | --- |
| 単体 | Vitest + React Testing Library | `members-search.ts` / `lib/api/public.ts` / `Hero.tsx` / `Stats.tsx` / `MemberCard.tsx` |
| 統合 | （本 task 範囲外） | — |
| E2E smoke | Playwright + axe-core | `/`, `/(public)/members`, `?density=list`, `?density=invalid`, `?q=zzz_no_match_zzz` |

## 単体テスト仕様

### `apps/web/src/lib/url/__tests__/members-search.test.ts`

| ID | ケース | 入力 | 期待 |
| --- | --- | --- | --- |
| TC-U-S-01 | 空 searchParams | `{}` | all defaults（q="" / zone="" / status="" / tags=[] / sort="recent" / density="comfy" / page=1 / limit=24） |
| TC-U-S-02 | density=invalid → comfy fallback | `{ density: "weird" }` | `density="comfy"` |
| TC-U-S-03 | tag 配列展開 | `{ tag: ["a", "b"] }` | `tags: ["a", "b"]` |
| TC-U-S-04 | tag 単一値 | `{ tag: "a" }` | `tags: ["a"]` |
| TC-U-S-05 | page=-1 → 1 fallback | `{ page: "-1" }` | `page: 1` |
| TC-U-S-06 | limit=200 → max 60 | `{ limit: "200" }` | `limit: 60` |
| TC-U-S-07 | toApiQuery round-trip | `{ q:"a", tags:["x","y"], density:"list" }` | URLSearchParams に同等の key/value を含む |
| TC-U-S-08 | sort=name 採用 | `{ sort: "name" }` | `sort: "name"` |

### `apps/web/src/lib/api/__tests__/public.test.ts`

| ID | ケース | 入力 | 期待 |
| --- | --- | --- | --- |
| TC-U-A-01 | `getStats` strict parse | mock fetch returns valid JSON | `PublicStatsViewZ.parse（strict 定義済み schema）` 通過、戻り値型一致 |
| TC-U-A-02 | `getStats` extra key で throw | `{ ...stats, unknown: 1 }` | ZodError を throw |
| TC-U-A-03 | `listMembers` query serialize | `{ q:"a", tags:["x","y"], density:"comfy", sort:"name" }` | request URL に `q=a&tag=x&tag=y&sort=name` を含む |
| TC-U-A-04 | 500 → `FetchPublicError` | mock returns 500 | `FetchPublicError` instance、`status === 500` |
| TC-U-A-05 | 404 → `FetchPublicNotFoundError` | mock returns 404 | `FetchPublicNotFoundError` instance |
| TC-U-A-06 | `revalidate` opt 反映 | `getStats({ revalidate: 60 })` | fetch options に `next.revalidate=60` |

### `apps/web/src/components/public/__tests__/Hero.test.tsx`

| ID | ケース | 期待 |
| --- | --- | --- |
| TC-U-H-01 | `<h1>` が 1 個 | `getAllByRole("heading", { level: 1 })` length === 1 |
| TC-U-H-02 | primaryCta href が `<a>` に反映 | `getByRole("link", { name: /メンバー一覧/ })` の href 一致 |
| TC-U-H-03 | secondaryCta が無い場合 render しない | secondaryCta=undefined で 1 link のみ |
| TC-U-H-04 | `data-component="hero"` anchor | `container.querySelector('[data-component="hero"]')` truthy |

### `apps/web/src/components/public/__tests__/Stats.test.tsx`

| ID | ケース | 期待 |
| --- | --- | --- |
| TC-U-ST-01 | 4 枚の StatCard が `data-stat` で識別 | `total / public / zones / sync` の 4 anchor が DOM に存在 |
| TC-U-ST-02 | zone 空配列でも crash しない | `zoneBreakdown: []` で render が throw しない |
| TC-U-ST-03 | lastSync.responseSync が null でも render | `lastSync: { responseSync: null, schemaSync: null }` で「未同期」表示 |

### `apps/web/src/components/public/__tests__/MemberCard.test.tsx`

| ID | ケース | 期待 |
| --- | --- | --- |
| TC-U-MC-01 | density=comfy で comfy class | className に comfy 識別子 |
| TC-U-MC-02 | density=dense で dense class | className に dense 識別子 |
| TC-U-MC-03 | nickname 空でも crash しない | `nickname: ""` で render |
| TC-U-MC-04 | role="article" を持つ | `getByRole("article")` 取得可能 |

mock 方針:

```ts
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock("@/lib/env", () => ({
  getEnv: () => ({ PUBLIC_API_BASE_URL: "http://localhost:8787" }),
  getPublicEnv: () => ({ PUBLIC_API_BASE_URL: "http://localhost:8787" }),
}));
```

## E2E smoke 仕様

ファイル: `apps/web/playwright/tests/public-top-and-list.spec.ts`

| ID | ケース | 期待 |
| --- | --- | --- |
| TC-E-01 | `/` 200 + `<h1>` visible + `[data-stat="total"]` visible + axe critical=0 | navigation status=200, headings + stat anchor visible, axe.violations.filter(critical) length=0 |
| TC-E-02 | `/members` 200 + filters form visible + (MemberGrid \| EmptyState) visible + axe critical=0 | `[data-page="members"]` 内に form, grid or empty-state |
| TC-E-03 | `/members?density=list` 200 + `<table>` visible | `getByRole("table")` visible |
| TC-E-04 | `/members?density=invalid` 200 + MemberGrid (comfy) visible | fallback 動作確認、`<table>` 不在 |
| TC-E-05 | `/members?q=zzz_no_match_zzz` 200 + EmptyState visible | `[data-role="empty-state"]` または title「該当するメンバーがいません」 visible |

production 流入 guard:

```ts
test.beforeAll(() => {
  const url = process.env.PLAYWRIGHT_BASE_URL ?? "";
  if (/production|prod\.workers\.dev/.test(url)) {
    throw new Error(`[public-smoke] BASE URL must not be production: ${url}`);
  }
});
```

## a11y 個別検証

- MemberFilters のラジオ切替 / tag pill switch を keyboard（Tab + Space）で操作可能
- `<label htmlFor>` が全 input に紐付くこと（vitest で getByLabelText 確認）
- focus ring は token `var(--ubm-color-focus)`（CSS computed style 確認は scope 外、grep gate で token 経由を確認）

## カバレッジ目標

- `lib/url/members-search.ts` — Statement / Branch ≥ 95%
- `lib/api/public.ts` — Statement / Branch ≥ 90%
- `components/public/{Hero,Stats,MemberCard}.tsx` — Statement ≥ 85%
- E2E lines: `coverage/e2e/coverage-summary.json` の total `lines.pct >= 80`

## 完了条件

- [ ] TC-U-S-01〜08 / TC-U-A-01〜06 / TC-U-H-01〜04 / TC-U-ST-01〜03 / TC-U-MC-01〜04 が test files に reify されている
- [ ] TC-E-01〜05 が `apps/web/playwright/tests/public-top-and-list.spec.ts` に reify されている
- [ ] production URL guard が spec 冒頭にある
- [ ] `test.describe.skip` / `test.skip(true)` / `it.skip` が無い
- [ ] coverage 目標が記録されている
