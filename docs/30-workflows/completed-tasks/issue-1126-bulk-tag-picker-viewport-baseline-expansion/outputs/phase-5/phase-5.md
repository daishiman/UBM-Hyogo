# Phase 5: 実装手順

`[実装区分: 実装仕様書]` / `implementation_mode: edit` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

Issue #1126「bulk tag picker visual baseline の viewport 拡張（mobile/tablet/wide）」の実装手順。
採用設計 **B案**（既存 spec 内で `page.setViewportSize()` を切替して各 viewport で baseline 取得）の
最小差分を確定する。新規ファイル 0 件、編集 2 件。CONST_005（変更対象ファイルの明示）を必須記載とする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1126-bulk-tag-picker-viewport-baseline-expansion` |
| issue | #1126（CLOSED 維持 / `Refs #1126`） |
| phase | 5（実装手順） |
| implementation_mode | edit |
| 新規作成ファイル | **0 件** |
| 修正ファイル | **2 件**（§1 表） |
| 採用設計 | B案（spec 内 viewport 切替 + 各 viewport で `toHaveScreenshot`） |

## 目的

既存 desktop baseline（無 suffix 2 枚）を温存したまま、mobile / tablet / wide の 3 viewport ×
assign/unassign 2状態 = 新規 6 baseline を追加する。read-only（tag 非 apply）を維持し、
fixture には `wide` を additive 追加するのみ（既存 viewport 定義は不変）。

## 1. 変更対象ファイル一覧

| 区分 | パス | 変更種別 | 概要 |
| --- | --- | --- | --- |
| 修正 | `apps/web/playwright/fixtures/viewports.ts` | 編集 | `VIEWPORTS` に `wide: { width: 1920, height: 1080 }` を additive 追加（既存 desktop/tablet/mobile 不変） |
| 修正 | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts` | 編集 | 既存 desktop capture（無 suffix 2 枚）を温存し、`VIEWPORTS` 由来の responsive 3 test（mobile/tablet/wide × assign/unassign = 6 枚）を追加。各 test 末尾で read-only assertion（`bulk-tag-result` count 0）を維持 |

> **変更なし（参照のみ）**: `.github/workflows/playwright-staging-visual-authenticated.yml`（CI 無改修）/
> `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx`（回帰保証・無改修）/
> Playwright project 定義（`staging-visual-authenticated` の default viewport 1280×800 は不変）。

## 2. viewports.ts 差分

`wide` を additive 追加する。既存の 3 定義（desktop / tablet / mobile）と `ViewportName` 型導出は不変。

### before

```ts
export const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
} as const

export type ViewportName = keyof typeof VIEWPORTS
```

### after

```ts
export const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
  wide: { width: 1920, height: 1080 },
} as const

export type ViewportName = keyof typeof VIEWPORTS
```

> `as const` 維持により `ViewportName` に `"wide"` が自動で型追加される。既存 3 viewport の値は 1 文字も変えない。
> fixture 追加は他 spec へ波及しない（additive・既存 key は不変）。

## 3. spec 差分（核心）

既存 spec の desktop capture（`SNAP.assign` / `SNAP.unassign` の `toHaveScreenshot` 2 枚）は**変更せず保持**し、
その後に responsive viewport ループを追加する。viewport を切り替えるのは desktop の 2 枚を取り終えた後とし、
desktop baseline が viewport 変更の影響を受けないことを構造的に保証する。

### 3.1 module スコープへ responsive viewport 配列を追加

`SNAP` 定数の近傍に、fixture `VIEWPORTS` から responsive 対象だけを束ねた配列を追加する。

```ts
const RESPONSIVE_VIEWPORTS = [
  { name: "mobile", ...VIEWPORTS.mobile },
  { name: "tablet", ...VIEWPORTS.tablet },
  { name: "wide", ...VIEWPORTS.wide },
] as const;
```

> viewport の数値正本は `viewports.ts` に集約する。spec 側は snapshot suffix に使う `name` と fixture 値の対応だけを持つ。

### 3.2 既存 desktop capture の直後に responsive ループを追加

既存 desktop test は `SNAP.assign` / `SNAP.unassign` を維持する。responsive は viewport ごとに別 test を生成し、
各 test が fresh page load から「assign capture → 解除モードへ → unassign capture」を行う。

```ts
for (const vp of RESPONSIVE_VIEWPORTS) {
  test(`staging /admin/members bulk tag picker assign/unassign baselines (${vp.name})`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });

    const bulkRegion = await prepareBulkRegion(page);
    await expect(bulkRegion).toHaveScreenshot(`bulk-tag-picker-assign-mode-${vp.name}.png`, {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });

    await switchToUnassignMode(page);
    await expect(bulkRegion).toHaveScreenshot(`bulk-tag-picker-unassign-mode-${vp.name}.png`, {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });

    await expect(page.getByTestId("bulk-tag-result")).toHaveCount(0);
  });
}
```

> `prepareBulkRegion(page)` は viewport 設定後に実行する。各 responsive test が fresh page load から始まるため、
> 前 viewport の解除 mode が次 viewport に漏れない。
> 起点 spec が呼ぶ `page.addStyleTag({ content: disableAnimations })` は document へ inject 済みのため
> viewport 変更後も有効に残る（§5 でリスクとして再点検）。

### 3.3 read-only assertion を各 test 末尾に配置

desktop test と各 responsive test の末尾で、tag を一切 apply していないことを確認する。

```ts
// 全 viewport で read-only（capture のみ・apply なし）。result panel は出ていない。
await expect(page.getByTestId("bulk-tag-result")).toHaveCount(0);
```

> viewport 別 test に分割したため、read-only assertion も test 単位に閉じる。

## 4. 入力・出力・副作用

| 区分 | 内容 |
| --- | --- |
| 入力 | staging `/admin/members`（認証済み admin storageState）+ staging tag master に最低1タグ + member 2行以上 |
| 出力 | 新規 6 baseline PNG（`bulk-tag-picker-{assign,unassign}-mode-{mobile,tablet,wide}.png`）。既存 desktop 2 枚は不変 |
| 副作用 | **なし（read-only）**。tag を apply せず（`bulk-tag-result` count 0）、staging データへの mutation ゼロ |

## 5. エラーハンドリング / flaky 対策

| リスク | 対策 |
| --- | --- |
| mobile で picker が画面外に出て capture が欠ける | `bulkRegion` 全体を `toHaveScreenshot` 対象とする。viewport より大きい場合も要素 screenshot の clip で取得する |
| viewport 変更直後の reflow 未完了で中間レイアウトを撮る | `setViewportSize` 後に `prepareBulkRegion(page)` を実行し、region / picker 可視化 assertion と animation 無効化を通してから capture する |
| `addStyleTag` の animation 無効化が viewport 変更後に失効していないか | 起点 spec の `disableAnimations` は `page.addStyleTag` で document head に inject され、`setViewportSize` では DOM を再構築しないため有効に残る。万一 navigation を挟む場合のみ再 inject を検討（本タスクは navigation を挟まないため再 inject 不要）。`toHaveScreenshot` 側でも `animations: "disabled"` を併用する |
| diff 許容しきい値 | `maxDiffPixelRatio: 0.05` を既存 desktop と同値で据え置く（viewport ごとに変えない） |
| desktop baseline への波及 | viewport ループを desktop 2 枚の取得**後**に置くことで、desktop capture 時は project default（1280×800）のまま。既存 baseline 名・内容ともに不変 |
| 初回 baseline 未生成 | 新規 6 枚は初回 `--update-snapshots`（user-gated）で生成。生成前の通常実行は「baseline が無い」で fail するのが正常（CONST_007: skip で先送りしない） |

## 6. 実装順序

1. `apps/web/playwright/fixtures/viewports.ts` に `wide` を additive 追加（§2）。
2. 起点 spec に `VIEWPORTS` import、`RESPONSIVE_VIEWPORTS` 配列、responsive 3 test、read-only assertion を反映（§3）。
3. ローカル検証（実 capture なし）:
   - `mise exec -- pnpm typecheck`
   - `mise exec -- pnpm lint`
   - 回帰保証: `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx`
4. **user-gated**: staging secrets を注入して baseline 確定（ユーザー承認後のみ）:
   - 初回 baseline 生成: `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated --update-snapshots`
   - 確定後の比較実行: `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated`

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| 編集対象 spec | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts` | desktop capture 後にループ追加 |
| 編集対象 fixture | `apps/web/playwright/fixtures/viewports.ts` | `wide` additive 追加 |
| Phase 2 設計 | `../phase-2/phase-2.md` | B案 viewport 切替設計 / locator 再利用 |
| Phase 4 テスト計画 | `../phase-4/phase-4.md` | 新規 6 + 既存 2 baseline・read-only 前提 |
| CI ワークフロー | `.github/workflows/playwright-staging-visual-authenticated.yml` | 無改修（既存 job が新 baseline 包含） |

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-5/phase-5.md` | 変更 2 ファイルの差分方針（`viewports.ts` の `wide` additive 追加 before/after、spec の `VIEWPORTS` import + `RESPONSIVE_VIEWPORTS` 配列 + responsive 3 test）、入力/出力/副作用、flaky 対策（fresh page load / reflow 待ち / addStyleTag 失効点検 / maxDiffPixelRatio 据置 / desktop 不変保証）、実装順序 |

## 統合テスト連携

- 実装後、ローカルで `typecheck` / `lint` / `BulkActionBar.spec.tsx` が green であること。
- 新規 6 baseline の生成・比較は Phase 11 で user-gated capture（VISUAL_ON_EXECUTION）。
- 既存 desktop 2 baseline が不変であることを Phase 6 の visual assertion 列挙で固定する。
- CI（`playwright-staging-visual-authenticated.yml`）は無改修で新 baseline を自動比較対象に取り込む。

## 完了条件（Phase 5）

- 新規 0 件 / 修正 2 件のファイル一覧を CONST_005 準拠で確定した。
- `viewports.ts` の `wide` additive 追加を before/after で確定した。
- spec の `VIEWPORTS` import・`RESPONSIVE_VIEWPORTS` 配列・responsive 3 test（assign/unassign × mobile/tablet/wide）・read-only assertion の差分方針を擬似実装で確定した。
- 入力 / 出力 / 副作用（read-only）と flaky 対策（fresh page load / reflow 待ち / addStyleTag 失効点検 / maxDiffPixelRatio 0.05 据置 / desktop 不変）を確定した。
- 実装順序（fixture → spec → ローカル検証 → user-gated baseline 確定）を確定した。
