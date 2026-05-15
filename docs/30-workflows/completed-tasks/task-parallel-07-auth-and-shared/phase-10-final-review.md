# Phase 10: 最終レビュー

> Phase: 10 / 13
> 名称: 最終レビュー（DoD 判定ゲート）

---

## 10.1 DoD チェックリスト（元仕様 §8 + 本タスク追加）

| # | 項目 | 判定 | 証跡 |
|---|------|------|------|
| D1 | `/login/error.tsx` Card layout + focus 管理実装 | pass | `apps/web/app/login/error.tsx` / `apps/web/app/login/__tests__/login-error.component.spec.tsx` |
| D2 | `/login/loading.tsx` 新規作成、OKLch skeleton | pass | `apps/web/app/login/loading.tsx` / `login-error.component.spec.tsx` |
| D3 | Root `error.tsx` に focus 管理追加 | pass | `apps/web/app/error.tsx` / `apps/web/app/__tests__/error.component.spec.tsx` |
| D4 | `/profile/loading.tsx` 統一 skeleton 実装 | pass | `apps/web/app/profile/loading.tsx` / `apps/web/app/profile/__tests__/profile-loading.component.spec.tsx` |
| D5 | OKLch token 完全性確認、HEX 直書き 0 | pass | Phase 11 `manual-test-result.md` grep evidence |
| D6 | jest-axe violations 0 | pass | component specs の `axe(container)` assertions |
| D7 | TypeCheck / ESLint clean | pass | Phase 11 local command evidence |
| D8 | Playwright smoke pass | pass | `apps/web/playwright/tests/auth-and-shared.spec.ts` |
| D9 | Phase 11 スクリーンショット 8 枚 | pass | `outputs/phase-11/*.png` |
| D10 | `not-found.tsx` ブランディング検証ログ記録 | pass | Phase 11 `manual-test-result.md` |
| D11 | `verify-design-tokens` CI gate pass | pass | Phase 11 local command evidence |
| D12 | test suffix policy | pass | New component specs use `.spec.tsx`; Playwright uses `.spec.ts` |

---

## 10.2 不変条件再確認

| # | 不変条件 | 状況 |
|---|---------|------|
| I1 | OKLch token のみ（HEX 0） | Q6/Q7 で enforce |
| I2 | 既存 API endpoint surface のみ | 本 PR 差分に `apps/api/**` 変更なし |
| I3 | `apps/web` から D1 直接アクセス禁止 | 該当差分なし |
| I4 | 既存 primitive のみ | `Card` / `CardContent` のみ import |
| I5 | `.spec.tsx` 必須 | Q9 で enforce |
| I6 | `motion-safe:` prefix | spec U9 / A9 で検証 |

---

## 10.3 MINOR / MAJOR 残課題

| 種別 | 内容 | 対応 |
|------|------|------|
| MINOR | C1（SkeletonBar 抽出）/ C3 / C4 | 過剰抽象化として同サイクル却下。backlog 化なし |
| MAJOR | なし | — |

---

## 10.4 判定

D1〜D12 は green。Phase 11 PNG の物理存在確認と command evidence は Phase 11 / Phase 12 compliance check で扱う。

---

## 10.5 次フェーズへの引き継ぎ

Phase 11 で VISUAL タスクとしてスクリーンショットを 8 枚取得し、Phase 12 ドキュメント更新へ進む。
