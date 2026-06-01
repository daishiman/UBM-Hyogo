# Phase 1: 要件定義

**[実装区分: 実装仕様書]** / **task_classification: NON_VISUAL** / **implementation_mode: new**

## 1. 目的（What / Why）

`getAuthView()` が解決する `AuthView`（guest / member / admin）は、実 auth module
（`apps/web/src/lib/auth.ts` の `buildAuthConfig().callbacks.session`）が生成する `session.user` の
field（`memberId` / `isAdmin`）に依存している。現状この 2 側は独立にテストされ、橋渡しの契約テストが
ない。session augmentation が field 名・型を変えても両側テストは緑のまま production が壊れる
（member/admin が公開ヘッダーで `guest` 表示に倒れる）。

本タスクは、**実 session callback の出力を `resolveAuthView()` / `getAuthView()` に連鎖**させる
integration-level 契約テストを 1 ファイル追加し、この drift をローカル CI で早期検知する。

## 2. P50 前提確認チェック

| 確認項目                              | 結果 | 対応                                                         |
| ------------------------------------- | ---- | ----------------------------------------------------------- |
| current branch に実装が存在する       | No   | `authViewSessionContract.integration.spec.ts` は不在（`find` で 0 件確認） |
| upstream（dev）にマージ済み           | No   | 本ブランチで新規追加として扱う                              |
| 前提タスク（依存タスク）が完了済み    | Yes  | 親 `public-header-session-aware-auth-view-base` は completed-tasks に存在 |

→ `implementation_mode: "new"`。Phase 4 で新規 integration spec を RED→GREEN で作成、Phase 5 で diff 確認。

## 3. 現状コード contract（調査結果 / current facts）

| ファイル | 役割 | 本タスクでの扱い |
| --- | --- | --- |
| `apps/web/src/lib/auth-view/getAuthView.ts` | `getAuth().auth()` → `SessionLike` → `resolveAuthView()`。catch で guest fail-closed | 変更しない（被テスト対象） |
| `apps/web/src/lib/auth-view/resolveAuthView.ts` | pure: `session.user.memberId?.trim()` 無し→guest / `isAdmin===true`→admin / else member | 変更しない（被テスト対象） |
| `apps/web/src/lib/auth-view/types.ts` | `AuthView` discriminated union / `SessionLike { user?: { memberId?, isAdmin? } }` | 変更しない（契約 source） |
| `apps/web/src/lib/auth.ts:174` `buildAuthConfig(e, fetchImpl, providerFactories)` | **export 済**。`callbacks.session({ session, token })` が `session.user.memberId = (t.memberId as string) ?? ""` / `isAdmin = t.isAdmin === true` を構築 | 変更しない（実 contract source） |
| `apps/web/src/lib/auth.spec.ts:540` `describe("callbacks.session")` | token → `session.user` shape を既にテスト（`memberId`/`isAdmin`/`email`/`name`） | 変更しない（既存・regression 保護対象） |
| `apps/web/src/lib/auth-view/__tests__/getAuthView.spec.ts` | mock-only（`@/lib/auth` を mock）member/admin/null/fail-closed | 変更しない（既存・regression 保護対象） |
| `apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts` | pure unit 9 ケース | 変更しない（既存・regression 保護対象） |

### 命名規則（既存コード分析）

- テストファイル: `<camelCaseSubject>.spec.ts`（mock-only）と `<PascalCase>.spec.ts`。本タスクは integration 系のため
  Issue 原案の `authViewSessionContract.integration.spec.ts`（camelCase + `.integration.spec.ts` suffix）を採用。
- `*.spec.{ts,tsx}` のみ許可（不変条件 #8。`*.test.*` は CI reject）。→ `.integration.spec.ts` は許可（`.spec.ts` で終わる）。
- 配置: `apps/web/src/lib/auth-view/__tests__/` 配下（既存 2 spec と同階層）。

## 4. テスト gap（明文化）

| 既存テスト | カバー範囲 | gap |
| --- | --- | --- |
| `getAuthView.spec.ts` | `getAuthView()`（**捏造 session**）→ AuthView | 実 session callback の出力 shape を使っていない |
| `auth.spec.ts` callbacks.session | token → `session.user`（`memberId`/`isAdmin`） | resolveAuthView 側が読む field と接続していない |
| `resolveAuthView.spec.ts` | pure（捏造 SessionLike） | 実 session callback 出力との接続なし |
| **（不在）** | **実 callbacks.session 出力 → resolveAuthView/getAuthView の橋渡し** | **本タスクで追加** |

## 5. 受入条件（AC）

| ID | 受入条件 |
| --- | --- |
| AC-1 | 実 `buildAuthConfig().callbacks.session({ session, token })` の出力 `session.user` を `resolveAuthView()` に渡すと、member token → `{ kind: "member", profileHref: "/profile" }` になる |
| AC-2 | admin token（`isAdmin: true`）→ `{ kind: "admin", profileHref: "/profile", adminHref: "/admin" }` |
| AC-3 | `memberId` 欠落 token（`{}`）→ session callback が `memberId: ""` を返し、`resolveAuthView` が `{ kind: "guest" }` に fail-closed |
| AC-4 | `getAuthView()` を実 callbacks.session 出力相当の `auth()` mock に接続したとき AC-1〜3 と整合 |
| AC-5 | 既存 `getAuthView.spec.ts` / `resolveAuthView.spec.ts` / `auth.spec.ts` が緑のまま（regression なし） |
| AC-6 | `AuthView.kind` は `guest | member | admin` 以外を出さない |

## 6. スコープ確認

- in scope: 新規 integration spec 1 ファイル + 親 workflow FU-001 consumed trace 更新。
- out of scope: production コード変更 / Auth.js provider 変更 / OAuth smoke / staging screenshot / UI 変更 / commit・PR。

## 7. [FB-CRONVL-002 系] 将来 UI 統合経路

本タスクはテスト追加のみで UI 経路を持たない。将来 Auth.js を minor upgrade する際は本 contract test を focused gate に必ず含める旨を Phase 12 skill-feedback に記録する（未タスク化候補ではなく運用ルール）。

## 完了条件（Phase 1）

- [x] P50 チェック記録（implementation_mode = new 確定）
- [x] 現状 contract と test gap の明文化
- [x] 命名規則（`.integration.spec.ts` / `__tests__/` 配置）確定
- [x] 受入条件 AC-1〜6 固定
