# Phase 8 — DRY 化レビュー

## 重複ロジック抽出

| 観点 | 検出 | 対応 |
| --- | --- | --- |
| JWT 検証 | apps/web (Auth.js 内部) と apps/api (`requireAdmin`) | Auth.js 自体は内部で getToken を使うが、API 側は `@ubm-hyogo/shared` の `verifySessionJwt` を共通利用。AUTH_SECRET さえ揃えば両者で同じ署名を検証できる |
| SessionUser / SessionJwtClaims 型 | 両 worker が同じ型を必要 | `packages/shared/src/auth.ts` に集約。`AuthSessionUser` / `SessionJwtClaims` / `GateReason` / `SessionResolveResponse` を export |
| email 正規化 | session-resolve と signIn callback で `.trim().toLowerCase()` | 両所に明示。helper 化は MVP では over-abstraction として保留 |
| Bearer / Cookie 抽出 | `requireAdmin` のみ。Auth.js 側は内部 helper | 単一実装で済むため `extractJwt` を export しておく（require-admin.ts） |
| internalAuth と admin-gate のテンプレ | 似た構造 (header verify → 401) | middleware factory 化はせず、各々独立の意味づけ（INTERNAL_AUTH_SECRET vs SYNC_ADMIN_TOKEN）を保持。命名と secret を別にして役割分離 |

## 命名整理

| 旧 | 新 | 理由 |
| --- | --- | --- |
| `adminGate` (Bearer SYNC_ADMIN_TOKEN) | `requireSyncAdmin` (alias `adminGate` を deprecated 維持) | 人間 admin と sync 系を意味的に分離 (phase-02 D8) |
| `SessionUser` in shared | `AuthSessionUser` (Auth.js 用) / `SessionUser` (me/* viewmodel) を共存 | 既存 `me/*` viewmodel を破壊せず Auth.js callback 用最小型を分離 |

## 不変条件 #4/#7/#11 の DRY

- JWT に `responseId` / `profile` / `notes` を絶対に載せないことを **型で強制** (`SessionJwtClaims` の readonly フィールドのみ)
- snapshot test で payload の key set を unit test (S-07) で検証

## 取捨選択

- `extractJwt` を `@ubm-hyogo/shared` に上げるかは保留。現状 apps/api でしか使わない (web は Auth.js が暗黙に処理)
- `signSessionJwt` は本タスクでは API から呼ばれないが、test でモック JWT 生成に必要なため shared に置く
