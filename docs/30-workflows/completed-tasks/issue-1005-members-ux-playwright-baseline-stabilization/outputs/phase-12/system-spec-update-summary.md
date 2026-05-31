<!-- workflow: issue-1005-members-ux-playwright-baseline-stabilization / phase: 12 -->

# System Spec Update Summary — issue-1005-members-ux-playwright-baseline-stabilization

## 結論: 正本仕様への影響なし

本タスクは Playwright の visual baseline test infrastructure のみを変更する。
`docs/00-getting-started-manual/specs/` 配下の正本仕様（API schema / auth / DB / design-tokens 等）への
影響はない。**更新する正本ドキュメントは無し。**

## 影響評価

| 正本ドキュメント | 影響 | 理由 |
| ---------------- | ---- | ---- |
| `specs/01-api-schema.md` | なし | `/members` API の endpoint surface / query / schema を変更しない（INV-1） |
| `specs/02-auth.md` | なし | 認証境界に変更なし |
| `specs/08-free-database.md` | なし | D1 schema / binding に変更なし（INV-4） |
| `specs/design-tokens.md` | なし | OKLch token を変更しない（INV-2） |
| `google-form/` | なし | Google Form 仕様に変更なし |

## UI prototype alignment 不変条件

本タスクは UI prototype alignment の不変条件 INV-1〜INV-4 をいずれも変更しない。

- INV-1（既存 API のみ接続）: 維持。test は既存 `/members` route を撮影するのみ。
- INV-2（OKLch トークン正本化）: 維持。
- INV-3（プロトタイプ正本順位・新規 primitive を生やさない）: 維持。
- INV-4（D1 直接アクセス禁止）: 維持。

## 変更の性質

変更は test infra（`apps/web/playwright.config.ts` / `apps/web/playwright/tests/members-ux-clarity.spec.ts`）に
限定される。production / staging のランタイム挙動・UI component 実装・データ層には一切影響しない。

## DoD

- [ ] 正本仕様への影響なしが明記されている
- [ ] INV-1〜INV-4 を変更しない旨が記載されている
- [ ] 更新する正本ドキュメントが無いことが明記されている
