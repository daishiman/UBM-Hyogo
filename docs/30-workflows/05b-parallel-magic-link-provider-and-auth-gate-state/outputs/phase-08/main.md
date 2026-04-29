# Phase 8 — DRY / naming Before/After

## 1. AuthGateState の集約

| Before | After |
|---|---|
| use-case 各所で string literal を散在 ("unregistered" 等) | `resolveGateState` 戻り値の discriminated union 1 箇所で集中管理。zod schema (`GateStateResponseZ`) も同集合。 |

## 2. SessionUser の重複定義回避

| Before | After |
|---|---|
| `packages/shared/src/types/auth.ts` で再定義しかけた SessionUser/AuthGateState が viewmodel と衝突 | viewmodel 側 (branded) を正本とし、auth.ts は `SessionUserAuthGateState` alias のみ。 |

## 3. mail sender 構築

| Before | After |
|---|---|
| route 層で env 参照しつつ MailSender を構築 → handler 単位でテスト困難 | `createAuthRoute({resolveMailSender})` factory に env を渡す pattern。test では in-memory sender を注入。 |

## 4. apps/web proxy

| Before | After |
|---|---|
| 各 route で `process.env["INTERNAL_API_BASE_URL"]` を直書き想定 | `resolveApiBase()` を 3 ファイルで同形に揃え、fallback と trailing-slash 正規化を統一。 |

## naming 整合

- `MagicLinkRequestZ` / `MagicLinkResponseZ` / `GateStateResponseZ` / `VerifyMagicLinkRequestZ` / `VerifyMagicLinkResponseZ` / `ResolveSessionRequestZ` / `ResolveSessionResponseZ` の Z suffix で zod schema を統一。
- `POST_MAGIC_LINK_EMAIL_LIMIT` / `GET_GATE_STATE_IP_LIMIT` / `POST_MAGIC_LINK_WINDOW_MS` のような <method>_<endpoint>_<dim>_<unit> 形式の定数命名で意図を明示。
