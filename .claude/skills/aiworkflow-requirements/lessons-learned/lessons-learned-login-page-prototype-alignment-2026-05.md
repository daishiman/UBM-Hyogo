# Lessons learned: login-page-prototype-alignment（2026-05-23）

> workflow root: `docs/30-workflows/completed-tasks/login-page-prototype-alignment/`
> 関連 spec: `docs/00-getting-started-manual/specs/13-mvp-auth.md`
> artifact inventory: [`workflow-login-page-prototype-alignment-artifact-inventory.md`](../references/workflow-login-page-prototype-alignment-artifact-inventory.md)

既存 `/login` route を prototype LoginPage に整合させ、Magic Link primary / OR / Google secondary / brand block / sent state を MVP 正本化した実装サイクルで得た苦戦箇所と再発防止策。

## L-LOGIN-001: Playwright `page.screenshot({ path })` は `PLAYWRIGHT_EVIDENCE_DIR` env だけでは制御できない

### 症状

`process.env.PLAYWRIGHT_EVIDENCE_DIR` を export しても、spec 内で `await page.screenshot({ path: '...' })` の保存先は変わらず、旧 path (`task-13-login-rebuild/outputs/phase-11/...`) に書かれ続けた。

### 原因

`page.screenshot({ path })` は引数の path を絶対視する。env 経由で保存先を切り替えるには spec 内で `path.resolve(process.env.PLAYWRIGHT_EVIDENCE_DIR, ...)` を組み立てる必要がある。

### 再発防止

- evidence 保存 path は spec 内の **`const EVIDENCE_DIR = path.resolve(...)`** を SSOT とし、workflow root と一緒に move した際に必ず手動更新する。
- artifact inventory に `playwright spec EVIDENCE_DIR` 行を明示。

## L-LOGIN-002: Next.js dev tools overlay (`nextjs-portal`) が screenshot に写り込む

### 症状

local dev (`next dev`) で取得した Phase 11 screenshot に Next 16 のデバッグ overlay (右下 toolbar) が写り込み、visual regression と区別がつかない状態になった。

### 原因

`page.screenshot()` は viewport の全 DOM をキャプチャし、`nextjs-portal` / `nextjs-toast` 等の dev overlay も含む。

### 再発防止

screenshot 取得前に以下 helper を呼ぶ:

```ts
async function hideDevOverlay(page: Page) {
  await page.addStyleTag({
    content: `
      nextjs-portal,
      [data-nextjs-toast],
      [data-nextjs-dialog-overlay],
      #__next-build-watcher,
      .__next-dev-overlay-mount,
      [data-nextjs-dev-tools-button] { display: none !important; }
    `,
  });
}
```

`task-specification-creator/references/phase-template-phase11.md` の Phase 11 screenshot 取得テンプレに同等 snippet を追加すること。

## L-LOGIN-003: `page.goto({ waitUntil: 'load' })` は dev mode で不安定

### 症状

`waitUntil: 'load'` 待ちが HMR / dev overlay の network idle 待ちで 30s timeout を頻発した。

### 再発防止

login smoke / visual gate では **`waitUntil: 'domcontentloaded'`** を既定とする。Server Component の初期 HTML が DOM に到達すれば screenshot 取得には十分。`load` イベントは追加 fetch / dev overlay により遅延するため避ける。

## L-LOGIN-004: Icon glyph の Unicode 文字 → SVG 一斉移植

### 症状

`send` icon が prototype で必要だったが、Unicode 単一文字で表現できる候補がなく、既存の Unicode glyph 方式と一貫性が崩れた。

### 再発防止

- `apps/web/src/components/ui/Icon.tsx` を **lucide 互換 inline SVG（`stroke="currentColor"` / `viewBox="0 0 24 24"`）に一本化**。新規 icon は SVG path で追加。
- `icons.ts` の icon name union は SVG path map で管理し、新規追加時は既存 7 種との見た目の整合を `Icon.stories.tsx` 等でチェックする（次回課題）。

## L-LOGIN-005: Google brand 1-tone vs 4-tone のトレードオフ

### 症状

prototype は Google brand 4-tone icon (red/blue/yellow/green) を想定していたが、`design-tokens.md` の OKLch token 不変条件 (`bg-[#xxx]` / `text-[#xxx]` 禁止) と衝突する。

### 暫定解と post-MVP 課題

- MVP では `currentColor` の 1-tone SVG で許容（コンセント色だけ token-driven）。
- 4-tone は `design-tokens.md` に **brand-color exempt path**（特定 svg asset path のみ HEX 直書きを許容）を新設する必要があり、FU-LOGIN-001 として `docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-001-google-brand-4tone-icon.md` に切り出した。

## L-LOGIN-006: Card primitive と auth-card variant の拡張方式

### 症状

auth-card 固有の `box-shadow` / `border-radius` / `inner padding` を実装する際、新 primitive (`AuthCard`) を増やすか既存 `Card` を上書きするかでトレードオフが発生。

### 採用方針

**新 primitive を生やさず `auth-card.ui-card` の二重 selector で既存 `Card` を上書き拡張**。UI prototype alignment の不変条件 #3 (`新規 primitive を生やさない`) を遵守。

### 副次効果

`auth.css` 内に「auth- 接頭辞で page-local style を完結させる」パターンを確立。今後のページ固有 styling は同じパターンを踏襲する。

## L-LOGIN-007: sent state の `<b>{email}</b>` 強調と token 駆動 color の連携

### 内容

sent state で受信先メールを `<b>{email}</b>` で強調しつつ、色は OKLch token (`var(--ubm-color-text-primary)`) で当てる構造を採用。`.auth-status b` selector で token を bind することで、コンポーネント側に HEX/RGB を書かずに済む。

## L-LOGIN-008: brand mark の暫定 "兵" 文字運用

### 内容

UBM 公式ロゴ画像が未入稿のため `.brand-mark` には「兵」一文字を暫定使用。post-MVP で公式ロゴアセットに差し替える必要があり、FU-LOGIN-002 として切り出し済。

## 横断的な再発防止

- **artifact inventory の `Implementation Targets` 表**に Playwright spec の `EVIDENCE_DIR` 行と CSS の page-local style ファイルを明示する（path drift の早期検知）。
- **Phase 11 screenshot 取得手順**を `task-specification-creator/references/phase-template-phase11.md` に統一テンプレ化し、`hideDevOverlay()` / `domcontentloaded` 既定を含める。
- **OKLch token 不変条件の brand-color exempt** は `design-tokens.md` の議論が必要な独立スコープ（FU-LOGIN-001）として unassigned-task で管理。

## 関連 link

- [[task-workflow-active]]（§login-page-prototype-alignment 2026-05-23）
- [[quick-reference]]（§login-page-prototype-alignment）
- [[resource-map]]（Login page prototype alignment row）
- [[workflow-login-page-prototype-alignment-artifact-inventory]]
