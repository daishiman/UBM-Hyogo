# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | magic-link-provider-and-auth-gate-state |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| 作成日 | 2026-04-26 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | pending |

## 目的

命名 / 型 / path / endpoint を整理し、apps/web ・ apps/api ・ packages/shared に重複や名称ゆれが残らない状態にする。Before / After 表で変更を可視化する。

## 実行タスク

1. 型 / interface 重複の整理
2. endpoint path / method 命名統一
3. environment variable 名称統一
4. file path / module 名整理

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/architecture.md | module 構成 |
| 必須 | outputs/phase-02/api-contract.md | I/O |
| 参考 | doc/00-getting-started-manual/specs/04-types.md | 型 4 層 |

## 実行手順

### ステップ 1: Before / After（型）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| AuthGateState | `LoginGate` / `AuthState` 等の揺れ候補 | `AuthGateState` (06-member-auth.md と一致) | spec 統一 |
| SessionUser | `MeSession` / `Session` 等 | `SessionUser` (04-types.md) | type 4 層 |
| GateStateResolverInput | `{email}` 単発 vs 複数 | `{email: string, db: D1Database}` | 純関数化 |
| MagicTokenRow | `MagicToken` vs `magicTokens.row` | `MagicTokenRow` (DB row 型) | repository naming |

### ステップ 2: Before / After（endpoint）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| 判定 endpoint | `GET /auth/state` / `GET /me/gate` | `GET /auth/gate-state` | api-contract 確定 |
| 発行 endpoint | `POST /auth/email-login` | `POST /auth/magic-link` | spec 用語 |
| callback | `GET /auth/verify` | `GET /api/auth/callback/email`（Auth.js 標準） | EmailProvider 規約 |

### ステップ 3: Before / After（env）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| mail key | `RESEND_API_KEY` | `MAIL_PROVIDER_KEY` | provider 中立 |
| 送信元 | `MAIL_FROM` | `MAIL_FROM_ADDRESS` | 単位明示 |
| auth url | `NEXTAUTH_URL` | `AUTH_URL` (Auth.js v5) | 公式更新 |

### ステップ 4: Before / After（file path）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| resolver | `apps/api/src/auth/state.ts` | `apps/api/src/services/auth/gate-state-resolver.ts` | layer 分離 |
| issuer | `apps/api/src/auth/issuer.ts` | `apps/api/src/services/auth/magic-token-issuer.ts` | 役割明示 |
| Auth.js config | `apps/web/src/auth.ts` | `apps/web/lib/auth/config.ts` | next-auth v5 慣例 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | 命名統一後の lint / typecheck pass |
| 08a | contract test の path / 型一致確認 |

## 多角的チェック観点

- 不変条件 #2: consent キーは `publicConsent` / `rulesConsent` であり `consent` 単独に縮めない
- 不変条件 #5: `apps/web` 配下に `repository/` `services/` が混入しない（apps/api 専用）
- 不変条件 #7: `responseId` と `memberId` を別 type で持つ（兼用しない）
- 認可境界: gate-state-resolver の output に `memberId` を含めない（leakage 防止）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 型 Before / After | 8 | pending | 4 件 |
| 2 | endpoint Before / After | 8 | pending | 3 件 |
| 3 | env Before / After | 8 | pending | 3 件 |
| 4 | file path Before / After | 8 | pending | 3 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | Before / After 表 |
| メタ | artifacts.json | phase 8 status |

## 完了条件

- [ ] 型・endpoint・env・file path の 4 種で Before / After 表が完成
- [ ] spec 用語との一致を全行で確認
- [ ] 不変条件 #2, #5, #7 への配慮が明記

## タスク100%実行確認【必須】

- 全 4 サブタスクが completed
- outputs/phase-08/main.md 配置
- 全完了条件にチェック
- 次 Phase へ命名規約を引継ぎ

## 次 Phase

- 次: 9 (品質保証)
- 引き継ぎ事項: 命名統一案を typecheck / lint の入力に
- ブロック条件: spec 用語と不一致な命名が残る場合は進まない
