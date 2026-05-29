<!-- workflow: members-list-ux-clarity / task: C / phase: 2 -->

[実装区分: 実装仕様書]

# Phase 2 — 設計 (Task C: page-integration-and-visual-baseline)

> 前提: [phase-1-requirements.md](./phase-1-requirements.md)

## 1. 設計方針

| 原則 | 適用 |
| ---- | ---- |
| 薄い integration layer | page.tsx は prop 受け渡しのみで、UI ロジックは保有しない |
| 既存 Server Component 構造維持 | `await connection()` → `safeServerFetch` → JSX render の流れを変更しない |
| URL query SSOT 不変 | `search` parse 経路には触れない |
| 加法的拡張 | `MemberFilters` 呼び出しに 2 prop 追加するのみ |
| 二重 announce 回避 | `<p data-role="pagination-meta">` を data-only 化し、live region は `<output>` 1 箇所のみ |
| Visual baseline isolation | `members-ux-clarity.spec.ts` を独立 spec file として配置し、既存 `members-prototype-alignment.spec.ts` の baseline と名前空間を分離する |

## 2. page.tsx 差分方針

### 2.1 差分 (diff スケッチ)

```diff
       <MemberFilters
         initial={search}
         topTags={listResult.ok ? listResult.data.topTags : []}
+        totalCount={listResult.ok ? listResult.data.pagination.total : 0}
+        displayedCount={listResult.ok ? listResult.data.items.length : 0}
       />
       ...
-      <p data-role="pagination-meta">
+      <p data-role="pagination-meta" aria-hidden="true">
         {listResult.ok
           ? `${listResult.data.pagination.total} 件中 ${listResult.data.items.length} 件表示`
           : "メンバー件数を読み込めませんでした"}
       </p>
```

### 2.2 件数 0 件時 / 不正系の挙動

| listResult | totalCount | displayedCount | `<output data-role="result-count">` 表示 |
| ---------- | ---------- | -------------- | ---------------------------------------- |
| `ok` かつ items 0 件 | 0 | 0 | "該当者なし" (Task B 側で 0 件判定) |
| `ok` かつ items 1 件以上 | total | items.length | "X 件中 Y 件を表示しています" |
| `!ok` (fetch エラー) | 0 | 0 | "該当者なし" を表示 (page.tsx 側で `SectionError` も併せて描画) |

### 2.3 `pagination-meta` の縮退理由

| 案 | 評価 |
| -- | ---- |
| A: `aria-hidden="true"` を付与 (採用) | SR は MemberFilters 側の `<output>` のみ読む。視認 DOM は維持されるため Phase 11 screenshots 上の構造変化が最小 |
| B: 完全削除 | `data-role="pagination-meta"` を参照している既存 spec / observability hook が壊れる可能性あり |
| C: visually-hidden 化 | CSS 経路が増え legacy-public.css 改修が必要。本 task のスコープ外 |

採用: A (`aria-hidden="true"` 付与のみ、視覚表示は維持)。

## 3. page.spec.tsx 期待値更新方針

### 3.1 更新点

| 種別 | 内容 |
| ---- | ---- |
| 追加 | `MemberFilters` 呼び出し props に `totalCount` / `displayedCount` が含まれることを確認 (mock した `MemberFilters` の引数を vi.fn で記録するか、`render` 後に `data-role="result-count"` 要素のテキストを assertion) |
| 追加 | `getByRole("status")` または `[data-role="result-count"]` の出現と内容を 1 件以上 assertion |
| 修正 | `data-role="pagination-meta"` を期待する既存 assertion は維持。ただし `aria-hidden="true"` 属性の存在を追加検証 (regression gate) |
| 不変 | h1 テキスト "メンバー一覧" / `data-role="lead"` / `data-page="members"` の expect は変更しない |

### 3.2 件数 0 件 ケース

- 既存 spec が `EmptyState` の出現を確認している場合は維持
- 新規: `<output data-role="result-count">` が "該当者なし" を含むこと（Task B 側挙動依存。本 task では存在のみ確認）

## 4. Playwright spec 構成

### 4.1 ファイル配置

| パス | 配置理由 |
| ---- | -------- |
| `apps/web/playwright/tests/members-ux-clarity.spec.ts` | 既存 `members-prototype-alignment.spec.ts` と同 dir / 同 project (`visual-chromium`) で動作させる。public route は storageState 不要 |

### 4.2 project と snapshotPathTemplate

Task C の visual baseline は **既存 `visual-chromium` project** をそのまま使う。public ルートは `storageState` 不要のため admin-staging-visual-* のような新規 project は不要。

ただし 4 viewport × 3 density × 2 state を 1 spec ファイルで網羅するため、spec 内で `test.describe.parallel` + `for-of` ループで 24 個の test を生成し、各 test で `page.setViewportSize` してから `toHaveScreenshot` を呼ぶ。

snapshotPathTemplate は既存 `visual-chromium` の default (`{testDir}/{testFileName}-snapshots/{arg}-{projectName}{ext}`) を採用し、PR レビュー時に diff が読みやすい形にする。

### 4.3 spec 構造 (擬似コード)

```ts
import { test, expect } from "@playwright/test";

const VIEWPORTS = {
  mobile:  { width: 375, height: 812 },
  tablet:  { width: 768, height: 1024 },
  desktop: { width: 1024, height: 768 },
  wide:    { width: 1440, height: 900 },
} as const;

const DENSITIES = ["comfy", "dense", "list"] as const;

const STATES = [
  { id: "empty",    query: "?q=__none__" },
  { id: "filtered", query: "?q=&zone=0_to_1" },
] as const;

for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
  for (const density of DENSITIES) {
    for (const state of STATES) {
      test(`members-ux-clarity ${vpName} ${density} ${state.id}`, async ({ page }) => {
        await page.setViewportSize(vp);
        const url = `/members${state.query}${state.query.includes("?") ? "&" : "?"}density=${density}`;
        await page.goto(url);
        await page.waitForSelector('[data-page="members"]');
        await expect(page).toHaveScreenshot(
          `members-ux-clarity-${vpName}-${density}-${state.id}.png`,
          {
            fullPage: true,
            mask: [
              page.locator('[data-role="pagination-meta"]'),
              page.locator("time"),
            ],
            maxDiffPixelRatio: 0.01,
          },
        );
      });
    }
  }
}
```

### 4.4 マスク対象

| selector | 理由 |
| -------- | ---- |
| `[data-role="pagination-meta"]` | 件数表示の動的値（テストデータ更新で揺れる）。視認用は `result-count` 側で baseline 化済 |
| `time` | 日時表示（メンバー登録日など）が seed 依存で揺れる |
| `[data-role="result-count"]` | (検討) 件数値が揺れる場合はマスク。ただし baseline で値を凍結したい場合はマスクしない（Phase 4 で決定） |

`result-count` は seed データが安定していれば mask 不要、揺れがあれば mask する。Phase 4 で seed の決定論性を確認してから最終決定。

### 4.5 viewport 一覧

| name | width × height | 用途 |
| ---- | -------------- | ---- |
| mobile | 375 × 812 | iPhone 12-15 相当 |
| tablet | 768 × 1024 | iPad portrait |
| desktop | 1024 × 768 | 標準デスクトップ最小 |
| wide | 1440 × 900 | 通常モニター |

## 5. D'+0 リセット運用 / both-or-none preflight

| 観点 | 適用方針 |
| ---- | -------- |
| D'+0 リセット | baseline PNG 生成は Linux runner で初回撮影。ローカル macOS では PNG を commit しない（CI 撮影分のみが正本） |
| both-or-none preflight | `members-ux-clarity.spec.ts` の追加 commit と baseline PNG commit を **同一 PR / 同一 push 内** で完結させる。spec のみ commit / baseline 未撮影状態の中間 commit は行わない |
| baseline 不在時の動作 | Linux runner では `--update-snapshots` の手動オペレーションを user-gated で実行（Gate-C で承認後） |
| retry policy | `visual-chromium` project の既存 retry policy (`retries: process.env.CI ? 2 : 0`) を踏襲。本 task では project の追加変更は行わない |

## 6. 既存 spec 影響 (`members-prototype-alignment.spec.ts`)

- Task B で `SelectedTagsBar` が `SelectedFiltersBar` に rename される場合のみ selector 追従が必要
- Phase 5 で `git grep -n SelectedTagsBar apps/web/playwright/` を実行して影響範囲を確定する
- 追従が必要な場合の差分: `data-component="selected-tags-bar"` → `data-component="selected-filters-bar"`、import 名 rename

## 7. data-* / selector 一覧 (本 task 側)

| selector | 用途 |
| -------- | ---- |
| `[data-page="members"]` | page.tsx ルート (既存・不変) |
| `[data-role="pagination-meta"]` | 機械可読件数 metadata (`aria-hidden="true"` 付与) |
| `[data-role="result-count"]` | Task B 提供の live region (本 task で expect する) |

## 8. open questions (Phase 3 で解消する論点)

- `result-count` を mask するか / baseline で値を凍結するか
- `<p data-role="pagination-meta" aria-hidden="true">` を本当に DOM に残すべきか（完全削除 vs 残す）
- empty state の URL クエリを `?q=__none__` で固定して良いか（seed 依存）

## DoD

- [x] page.tsx 差分方針が記述されている
- [x] page.spec.tsx 更新方針が記述されている
- [x] Playwright spec 構造（パス命名・viewport・state・density 軸）が記述されている
- [x] マスク対象が一覧化されている
- [x] D'+0 リセット運用と both-or-none preflight 方針が明示されている
- [x] open questions が phase-3 への引継ぎ事項として列挙されている
