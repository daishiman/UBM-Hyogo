# 実装ガイド — integration-fixes-i04-homepage-cta-implementation

## Part 1: 中学生レベル説明

ホームページの一番下に、「メンバー情報を載せたい人は Google フォームに答えてください」と案内する黒い帯（ダーク背景の目立つボックス）を新しく置きました。中には「FOR MEMBERS」というラベル・見出し・説明文・「回答フォームを開く」ボタンが並んでいます。ボタンを押すと外部の Google フォームが**別のタブ**で開く仕組みです。これまでこの帯はホームページから抜け落ちていたので、もう一度元の設計図（プロトタイプ）どおりに戻したかたちです。

## Part 2: 開発者向け

### 変更ファイル

| Path | 種別 | 内容 |
|------|------|------|
| `apps/web/src/lib/constants/form.ts` | 新規 | `FORM_RESPONDER_URL` 定数（CLAUDE.md 固定値） |
| `apps/web/src/lib/constants/__tests__/form.spec.ts` | 新規 | URL 値の正本一致テスト |
| `apps/web/src/components/public/CallToActionCTA.tsx` | 新規 | dark variant CTA component |
| `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx` | 新規 | コンポーネントテスト 9 ケース |
| `apps/web/app/page.tsx` | 編集 | `CallToActionCTA` の import + mount |
| `apps/web/src/styles/legacy-public.css` | 編集 | `[data-component="call-to-action-cta"]` の dark variant style |

### TypeScript interface

```ts
export interface CallToActionCTAProps {
  readonly responderUrl: string;
  readonly heading?: string;
  readonly body?: string;
  readonly ctaLabel?: string;
}
```

### 使用例

```tsx
import { CallToActionCTA } from "@/components/public/CallToActionCTA";
import { FORM_RESPONDER_URL } from "@/lib/constants/form";

<CallToActionCTA responderUrl={FORM_RESPONDER_URL} />
```

### 設定可能パラメータ

| prop | 必須 | default |
|------|------|---------|
| `responderUrl` | 必須 | — |
| `heading` | 任意 | "メンバー情報の掲載をお願いします" |
| `body` | 任意 | 「最新の Google フォームから…」の標準文言 |
| `ctaLabel` | 任意 | "回答フォームを開く" |

### error handling

- 状態管理・API call なし（pure な component）
- `responderUrl=""` でも runtime crash しない（anchor は空 href で render される）
- 外部リンク安全属性は固定で `target="_blank" rel="noopener noreferrer"`
- CTA 内に `Icon name="external-link"` を表示し、外部リンクであることを視覚的にも示す

### token マッピング（実装上の注意）

phase-2.md の CSS は `var(--space-*)` / `var(--text-xs)` / `var(--ubm-color-text)` 等を参照していたが、
正本 `apps/web/src/styles/tokens.css` の prefix は `--ubm-*` のため、実装時に以下へマッピング:

| 仕様書表記 | 実装時 token |
|------------|--------------|
| `--space-8` / `--space-6` / `--space-2` | `--ubm-space-8` / `--ubm-space-6` / `--ubm-space-2` |
| `--space-10` | `--ubm-space-12`（最も近い既存値） |
| `--text-xs` / `--radius-lg` | `--ubm-text-xs` / `--ubm-radius-lg` |
| `--ubm-color-text` | `--ubm-color-text-primary` |
| `--ubm-color-panel` | `--ubm-color-surface-panel` |

### 検証

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx \
  apps/web/src/lib/constants/__tests__/form.spec.ts
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

すべて PASS（10 tests, typecheck clean）。

### Acceptance Criteria 充足

| AC | 状態 |
|----|------|
| AC-1 dark variant render | PASS |
| AC-2 MemberGrid 後 mount + 常時表示 | PASS |
| AC-3 target/rel | PASS（テスト確認） |
| AC-4 responderUrl が CLAUDE.md 固定値 | PASS（form.spec.ts） |
| AC-5 `data-component="call-to-action-cta"` | PASS |
| AC-6 component test PASS | PASS（9 ケース） |
| AC-7 typecheck | PASS |
| AC-8 HEX 直書きなし | PASS（grep 0 件） |
| AC-9 dev server 目視 / screenshot | PASS（Phase 11 に 3 PNG 保存） |
| AC-10 parent spec DoD 整合 | PASS |

## 視覚証跡

`outputs/phase-11/screenshots/` に以下 3 件を保存済み。

| Screenshot | 内容 |
|------------|------|
| `homepage-call-to-action-cta-desktop.png` | desktop CTA crop |
| `homepage-call-to-action-cta-mobile.png` | mobile CTA crop |
| `homepage-full-with-cta-desktop.png` | desktop full-page |

撮影時に CTA link の `href` / `target="_blank"` / `rel="noopener noreferrer"` も Playwright で検証済み。
