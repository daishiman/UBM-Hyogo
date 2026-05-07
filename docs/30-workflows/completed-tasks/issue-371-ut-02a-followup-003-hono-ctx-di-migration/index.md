# issue-371-ut-02a-followup-003-hono-ctx-di-migration — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Hono ctx / DI container への repository 注入経路移行 |
| タスクID | task-imp-issue-371-ut-02a-followup-003-hono-ctx-di-001 |
| ディレクトリ | docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration |
| Issue | #371（state: CLOSED — closed のまま spec を作成） |
| 親タスク | ut-02a-attendance-profile-integration |
| 兄弟タスク | ut-02a-followup-001-attendance-write-operations / ut-02a-followup-002 / 004 |
| Wave | 2 (follow-up / architecture refactor) |
| 実行種別 | sequential（builder の漸進移行が必須のため並列化しない） |
| 作成日 | 2026-05-06 |
| 担当 | spec drafted on this branch |
| 状態 | implemented-local / evidence captured（Issue は closed のまま） |
| タスク種別 | implementation / NON_VISUAL |
| 実装区分 | local implementation（`apps/api/src/repository/_shared/builder.ts` の引数縮小、provider middleware、型境界、call site、テスト改修を反映済み） |
| 優先度 | priority:low |
| 発見元 | ut-02a-attendance-profile-integration Phase 12 unassigned-task-detection |

## purpose

`buildMemberProfile(c, mid, deps?)` / `buildAdminMemberDetailView(c, mid, adminNotes, deps?)` の optional 第N引数 DI を撤去し、
**Hono context の `c.var.attendanceProvider`（および将来の write/tag/note provider）** 経由で解決する経路に置換する。

- builder シグネチャを `buildMemberProfile(c, mid)` / `buildAdminMemberDetailView(c, mid, adminNotes)` に復元する
- `apps/api/src/middleware/repository-providers.ts`（新設）で `c.set("attendanceProvider", createAttendanceProvider(c))` を実施する
- `HonoEnv.Variables` に `RepositoryProviderVariables` を追加し、admin / me ルート群に middleware を結線する
- 暗黙の `[]` フォールバックを撤去し、provider 未注入時は **明示的に throw** する（silent fallback 禁止）
- ADR `outputs/phase-03/adr-di-strategy.md` で 3 alternatives（引数注入 / ctx 注入 / DI container）を比較し、ctx 注入採用根拠を残す

本タスクは **既存 read 契約 / `MemberProfile.attendance` 型契約を一切破壊しない**。
追加の repository 抽象（write/tag/note provider）は導入せず、既存の `AttendanceProvider` 1 件のみを ctx 経路へ移行することで、後続 02b/02c で同パターンを再利用できる土台を作る。

## scope in / out

### scope in

- `apps/api/src/repository/_shared/builder.ts`
  - `fetchAttendanceFor` の fallback 撤去（`provider === undefined` で throw）
  - `buildMemberProfile(c, mid)` / `buildAdminMemberDetailView(c, mid, adminNotes)` の引数縮小
  - 内部での `c.var.attendanceProvider` 解決
- `apps/api/src/middleware/repository-providers.ts`（新設）
  - `attendanceProviderMiddleware`: `c.set("attendanceProvider", createAttendanceProvider(c))`
- `apps/api/src/env.ts` または `apps/api/src/middleware/types.ts`
  - `RepositoryProviderVariables` type 追加（`{ attendanceProvider: AttendanceProvider }`）
- `apps/api/src/routes/me/index.ts` / `apps/api/src/routes/admin/members.ts`
  - `Variables` 型に `RepositoryProviderVariables` を合成
  - middleware を `app.use("*", attendanceProviderMiddleware)` で結線
  - `buildMemberProfile` / `buildAdminMemberDetailView` 呼び出しから `{ attendanceProvider: ... }` を削除
- `apps/api/src/repository/_shared/builder.test.ts` / `apps/api/src/repository/__tests__/builder.test.ts`
  - mock 注入経路を「ctx 直接 set」または「test fixture middleware」に統一
- ADR: `outputs/phase-03/adr-di-strategy.md`（3 alternatives 比較）

### scope out

- write/tag/note provider 等の新規 repository 抽象追加（本タスクは AttendanceProvider 1 件のみ移行し、パターン確立に集中）
- 大規模 DI フレームワーク（tsyringe / inversify）導入
- `MemberProfile` / `AdminMemberDetailView` interface の構造変更（02a 確定済み契約を保護）
- D1 schema 変更
- production deploy（09a / 09b 責務）
- public profile builder（`buildPublicMemberProfile`）への適用 — 現状 attendance を含まないため対象外（必要時は別タスクで追従）

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | ut-02a-attendance-profile-integration | `AttendanceProvider` / `createAttendanceProvider` / read path 契約の正本 |
| 上流 | 05a admin auth gate | admin 系 middleware 結線順序を尊重（admin gate 後に provider middleware を入れる） |
| 参照 | ut-02a Phase 03 alternatives-comparison.md | ctx 注入 / DI container を選ばなかった当時の判断記録 |
| 参照 | issue-371 本文（Refs #107） | 起票元 |
| external gate | なし | コード内完結 |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件全般 |
| 必須 | docs/00-getting-started-manual/specs/01-api-schema.md | API schema / repository 契約 |
| 必須 | docs/00-getting-started-manual/specs/13-mvp-auth.md | admin gate 方針 |
| 必須 | docs/30-workflows/completed-tasks/ut-02a-attendance-profile-integration/ut-02a-followup-003-hono-ctx-or-di-container-migration.md | 起票元スタブ（要件正本） |
| 必須 | apps/api/src/repository/_shared/builder.ts | 修正対象 |
| 必須 | apps/api/src/repository/attendance.ts | `AttendanceProvider` / `createAttendanceProvider` 提供元（参照のみ） |
| 必須 | apps/api/src/routes/me/index.ts | call site / middleware 結線対象 |
| 必須 | apps/api/src/routes/admin/members.ts | call site / middleware 結線対象 |
| 参考 | apps/api/src/middleware/session-guard.ts | middleware 実装パターン参考 |

## Acceptance Criteria

| ID | 内容 |
| --- | --- |
| AC-1 | `buildMemberProfile(c, mid)` / `buildAdminMemberDetailView(c, mid, adminNotes)` の引数列が縮小し、`deps?` parameter が消えている |
| AC-2 | `attendanceProvider` は **`c.var.attendanceProvider`** から解決される（builder 内に直接 `createAttendanceProvider` import なし） |
| AC-3 | `apps/api/src/middleware/repository-providers.ts` に `attendanceProviderMiddleware` が新設され、me / admin/members ルートで結線済み |
| AC-4 | `HonoEnv.Variables`（または `RepositoryProviderVariables`）に `attendanceProvider: AttendanceProvider` が型として定義されている |
| AC-5 | provider 未注入時の暗黙 `[]` フォールバックは廃止され、明示的に throw する。テスト正本は `/attendanceProvider not bound/i` |
| AC-6 | 全 call site（`apps/api/src/routes/me/index.ts` / `apps/api/src/routes/admin/members.ts`）から `{ attendanceProvider: ... }` 引数が削除されている |
| AC-7 | 既存 read path テスト regression なし（`pnpm --filter @ubm-hyogo/api test` 全 PASS） |
| AC-8 | `pnpm typecheck` / `pnpm lint` / `pnpm build` 全通過 |
| AC-9 | ADR `outputs/phase-03/adr-di-strategy.md` に 3 alternatives 比較と ctx 注入採用理由が記録されている |
| AC-10 | Phase 11 で local implementation evidence を `outputs/phase-11/evidence/` に配置する。builder unit / middleware 結線確認 / route smoke は `test.log` の pass summary に含める。runtime smoke は下流 gate として残す |
| AC-11 | Phase 12 implementation-guide / unassigned-task-detection / skill-feedback / compliance check 7 ファイルが揃っている |

## phase index

| Phase | ファイル | 概要 |
| --- | --- | --- |
| 1 | [phase-01.md](phase-01.md) | 要件定義（真の論点 / 4条件評価 / 不変条件） |
| 2 | [phase-02.md](phase-02.md) | 設計（middleware / 型 / builder シグネチャ / changed-files） |
| 3 | [phase-03.md](phase-03.md) | 代替案比較 ADR（引数注入 / ctx 注入 / DI container） |
| 4 | [phase-04.md](phase-04.md) | テスト戦略（builder / middleware / route / regression） |
| 5 | [phase-05.md](phase-05.md) | 実装ランブック（漸進移行手順） |
| 6 | [phase-06.md](phase-06.md) | コードレビュー観点 |
| 7 | [phase-07.md](phase-07.md) | 静的解析・型チェック |
| 8 | [phase-08.md](phase-08.md) | 単体・統合テスト実行 |
| 9 | [phase-09.md](phase-09.md) | 不変条件・契約整合性検査 |
| 10 | [phase-10.md](phase-10.md) | リスク再評価 |
| 11 | [phase-11.md](phase-11.md) | contract evidence（NON_VISUAL） |
| 12 | [phase-12.md](phase-12.md) | implementation-guide / unassigned 検出 / skill feedback / compliance |
| 13 | [phase-13.md](phase-13.md) | commit / PR 承認ゲート |
