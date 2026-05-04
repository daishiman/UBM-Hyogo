# Phase 3: 実装範囲・対象ファイル俯瞰 — task-389-privacy-terms-pages-impl

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 3 / 13 |
| 作成日 | 2026-05-03 |
| taskType | implementation |

## 目的

後続 Phase 5（実装ランブック）のために、変更対象ファイル一覧・変更種別・依存モジュールを俯瞰する。

## 変更対象ファイル一覧

| パス | 種別 | 内容 |
| --- | --- | --- |
| `apps/web/app/privacy/page.tsx` | **編集** | 暫定 OAuth URL ready 文面に、`metadata.alternates.canonical` `metadata.robots`、連絡先、制定日/最終改定日を追加 |
| `apps/web/app/terms/page.tsx` | **編集** | 暫定 OAuth URL ready 文面に、`metadata.alternates.canonical` `metadata.robots`、連絡先、制定日/最終改定日を追加 |
| `apps/web/app/privacy/__tests__/page.test.tsx` | **新規** | semantic render + 必須セクション存在テスト |
| `apps/web/app/terms/__tests__/page.test.tsx` | **新規** | semantic render + 必須セクション存在テスト |
| `apps/web/app/privacy/page.tsx`（公開日コメント） | 編集 | 改定日 `2026-05-03` を本文末尾に追記 |
| `apps/web/app/terms/page.tsx`（同上） | 編集 | 同上 |

## 影響を受けない領域（明示）

- `apps/api/**` — 変更なし
- `apps/web/app/(admin)` `(member)` `(public)` — 変更なし
- `apps/web/app/layout.tsx` — 変更なし（Provider 構成への影響なし）
- D1 schema / migrations — 変更なし

## 関数・型シグネチャ（確定値）

```ts
// apps/web/app/privacy/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata;
export default function PrivacyPage(): JSX.Element;
```

```ts
// apps/web/app/terms/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata;
export default function TermsPage(): JSX.Element;
```

## 依存パッケージ

- `next` (既存)
- `vitest` / `@testing-library/react` / `@testing-library/jest-dom`（既存 — apps/web の test 依存）

新規追加依存なし。

## 完了条件

- [ ] 変更対象ファイルが網羅されている
- [ ] 影響を受けない領域が明記されている
- [ ] `outputs/phase-03/main.md` を作成する
