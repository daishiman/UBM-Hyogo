# Phase 2 成果物: 設計

## monorepo 構造図（Mermaid）

```mermaid
graph TD
  Root[pnpm workspace root]
  Root --> AppsWeb[apps/web<br/>Next.js + @opennextjs/cloudflare]
  Root --> AppsApi[apps/api<br/>Hono + Workers]
  Root --> PkgShared[packages/shared<br/>types + zod schema 雛形]
  Root --> PkgIntg[packages/integrations/google<br/>Forms client 雛形]
  AppsWeb -->|import| PkgShared
  AppsApi -->|import| PkgShared
  AppsApi -->|import| PkgIntg
  AppsWeb -.X.->|禁止 (#5)| AppsApi
  AppsWeb -.X.->|禁止 (#5)| D1[(D1 binding)]
  AppsApi -->|許可| D1
  PkgIntg -->|外部 API| GForms[Google Forms API]
```

## 依存マトリクス（package 単位）

| 依存元 ↓ \ 依存先 → | apps/web | apps/api | packages/shared | packages/integrations/google |
|---|:---:|:---:|:---:|:---:|
| apps/web | - | NG (#5) | OK | NG |
| apps/api | NG | - | OK | OK |
| packages/shared | NG | NG | - | NG |
| packages/integrations/google | NG | NG | OK | - |

## UI Primitives 15 種 API 仕様

| # | コンポーネント | 主要 props | a11y 要件 |
|---|--------------|-----------|----------|
| 1 | Chip | tone: ChipTone, children | - |
| 2 | Avatar | memberId, name, size | role="img", aria-label=name |
| 3 | Button | loading, disabled, children | aria-busy=loading |
| 4 | Switch | checked, onChange, label | role="switch", aria-checked |
| 5 | Segmented | options, value, onChange | role="radiogroup" |
| 6 | Field | id, label, hint, children | htmlFor ↔ id |
| 7 | Input | describedBy, ...HTMLInputAttrs | aria-describedby |
| 8 | Textarea | describedBy, ...HTMLTextareaAttrs | aria-describedby |
| 9 | Select | options, describedBy | aria-describedby |
| 10 | Search | value, onChange, placeholder | clear button aria-label |
| 11 | Drawer | open, onClose, title, children | role="dialog", Escape close |
| 12 | Modal | open, onClose, title, children | role="dialog", focus trap |
| 13 | Toast | (Provider + useToast hook) | aria-live="polite" |
| 14 | KVList | items: KVItem[] | dl/dt/dd 構造 |
| 15 | LinkPills | links: LinkPill[] | rel="noopener noreferrer" |

## 型 4 層 placeholder 設計

```ts
// packages/shared/src/types/ids.ts
declare const __brand: unique symbol;
export type Brand<T, B> = T & { [__brand]: B };
export type MemberId = Brand<string, "MemberId">;
export type ResponseId = Brand<string, "ResponseId">;
export type ResponseEmail = Brand<string, "ResponseEmail">;
export type StableKey = Brand<string, "StableKey">;

// packages/shared/src/types/{schema,response,identity,viewmodel}/index.ts
// 各 01b で実装。Wave 0 では export {} のみ
```

## ESLint Rule placeholder

```
no-d1-from-web: apps/web/src/** 配下での @cloudflare/workers-types から D1Database import を error
no-localstorage-in-primitives: apps/web/src/components/ui/** 配下での localStorage/sessionStorage 参照を warn
```

## 環境変数一覧

このタスクは scaffold のみで env / secret を一切扱わない。後続 Wave で順次導入。

## tones.ts signature と mapping

```ts
export type ChipTone = "stone" | "warm" | "cool" | "green" | "amber" | "red";
export function zoneTone(zone: string): ChipTone;
export function statusTone(status: string): ChipTone;
```

| zone | tone |
|------|------|
| 0_to_1 | cool |
| 1_to_10 | warm |
| 10_to_100 | amber |
| その他 | stone |

| status | tone |
|--------|------|
| member | green |
| academy | cool |
| その他 | stone |
