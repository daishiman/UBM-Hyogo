# Phase 1: 要件定義

> Phase: 1 / 13
> implementation_mode: `new`
> taskType: `implementation`
> task classification: UI task
> visualEvidence: `VISUAL`
> workflow_state: `implemented_local_runtime_pending`

---

## 目的

Prototype の visual feedback 3 点（G3-1/2/3）を実装側に翻訳するための要件・スコープ・既存実装インベントリを固定する。

---

## P50 前提確認チェック

| 項目 | 結果 | 対応 |
|------|------|------|
| current branch に実装が存在するか | No | 通常 `new` モード |
| upstream マージ済みか | N/A | — |
| 前提タスク完了済みか | task-08（design-tokens spec）/ task-09（tokens.css）/ task-18（verify-design-tokens gate） | 既存運用済み |

---

## In-scope

- G3-1: `MemberFilters.client.tsx` の active tag button に `aria-pressed` / `data-selected` / `data-component="tag-pill"` 付与し、CSS で塗りつぶし配色
- G3-2: `MemberCard.tsx`（既存 `data-component="member-card"`）に hover/focus transition CSS を `globals.css` で追加
- G3-3: `MemberDetailSections.tsx` の `<section>` に `data-visibility` 属性を付与し、`FormPreviewSections.tsx` の既存 `data-role="visibility"` と合わせて左ボーダー + icon を CSS で表現
- CSS に加えて semantic/data 属性と local type を変更対象に含める。API / D1 / public response contract は変更しない。

## Out-of-scope

- `apps/api` の endpoint surface 変更
- D1 schema / Google Form 仕様変更
- section に対する API 側 `visibility` field 追加（MVP では `"public"` 固定運用）
- 新規 primitive コンポーネント追加
- tokens.css の値変更

---

## 既存実装インベントリ（read-only 確認結果）

| ファイル | 確認内容 |
|---------|---------|
| `apps/web/src/components/public/MemberCard.tsx:18` | `data-component="member-card"` 既存 |
| `apps/web/src/components/public/MemberFilters.client.tsx:78` | `data-component="member-filters"` あり。active tag button には未付与 |
| `apps/web/src/components/public/MemberDetailSections.tsx` | `<section>` に `data-visibility` 未付与 |
| `apps/web/src/components/public/FormPreviewSections.tsx` | `data-role="visibility"` 持ち span あり、CSS 装飾未適用 |
| `apps/web/src/styles/globals.css` | `@layer components` に G3-1/2/3 規則未追加 |
| `apps/web/src/styles/tokens.css` | OKLch 正本（`--ubm-color-text-primary` / `--ubm-color-surface-panel` / `--ubm-color-border-strong` / `--ubm-shadow-sm` / `--ubm-color-ok` / `--ubm-color-zone-b` / `--ubm-color-danger` / `--ubm-dur-fast` / `--ubm-ease-standard`） |
| `apps/api/src/routes/public/members.ts` | section 定義に `visibility` field なし（MVP fixed `"public"`） |
| Prototype | `docs/00-getting-started-manual/claude-design-prototype/styles.css ℓ824-828` |

---

## 命名規則

- React component: PascalCase（既存）
- file: PascalCase + `.tsx` / `.client.tsx`
- data 属性: `data-component`（既存）/ `data-visibility`（新規）/ `data-role`（既存）
- spec file: `*.spec.tsx`（`*.test.*` 禁止）
- CSS layer: `@layer components`（既存）

---

## 受入条件（DoD）

1. Tag pill 選択時に背景塗りつぶしで視認可能
2. Member card hover で border-color / box-shadow が transition
3. Profile section に visibility marker（左ボーダー + icon）表示
4. OKLch token のみで実装、HEX 直書き 0 件
5. `verify-design-tokens` CI gate `completed (exit 0)`
6. `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/web test` `completed (exit 0)`
7. axe a11y violations 0
8. Playwright smoke 既存ケース `completed (exit 0)`

---

## targeted test ファイル列挙

- `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx`
- `apps/web/src/components/public/__tests__/MemberDetailSections.component.spec.tsx`
- `apps/web/src/components/public/__tests__/FormPreviewSections.component.spec.tsx`（必要時）
- Playwright: `apps/web/playwright/tests/visual/visual-feedback.spec.ts` に task 固有の visual smoke を追加
