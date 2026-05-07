# Phase 1: 要件定義

実装区分: 実装仕様書（CONST_004 デフォルト適用 — `apps/api/src/repository/_shared/builder.ts` シグネチャ変更 + 新規 middleware + 全 call site 改修 + テスト改修を伴う）

## 真の論点

| # | 論点 | 決定方針 | 決定根拠 |
| --- | --- | --- | --- |
| Q1 | provider 注入手段は ctx / DI container / 引数追加のいずれか | **Hono ctx (`c.var.attendanceProvider`)** を採用 | 引数追加は O(N) 肥大、DI container 導入は依存追加コストが高い。ctx は middleware 1 段で route 群に行き渡る |
| Q2 | builder の第1引数は `c`（HonoContext） / `db`（DbCtx） どちらに揃えるか | **既存 `DbCtx` は変更せず、attendance を読む builder だけ `RepositoryProviderCtx = DbCtx & { var: RepositoryProviderVariables }` を要求する** | 現行 `DbCtx` は `readonly db: D1Db` 正本。`buildPublicMemberProfile` 等の非 attendance builder を壊さず、必要な関数だけ provider var を要求する |
| Q3 | provider 未注入時の振る舞い | **明示的に throw**（テスト正本は `/attendanceProvider not bound/i`） | 起票元で「silent `[]` fallback 廃止」が AC ハイライト。文言完全一致ではなく意味を固定してテスト漏れを抑止 |
| Q4 | middleware の結線範囲 | **me ルート群と admin/members ルート群に限定して結線**。app root には貼らない | unrelated route で provider が `c.set` されるオーバーヘッドを避け、結線意図を明示する |
| Q5 | 型定義の置き場 | `apps/api/src/middleware/repository-providers.ts` に `RepositoryProviderVariables` を export し、各 route で `Variables: SessionGuardVariables & RepositoryProviderVariables` の交差型で合成 | 既存 `SessionGuardVariables` パターンに整合 |
| Q6 | builder.ts の DbCtx 型 | **`DbCtx` 自体は `readonly db: D1Db` のまま維持し、`RepositoryProviderCtx` 合成型を追加** | `DbCtx` の責務拡張を避け、attendance builder だけに provider 依存を閉じ込める |

## 現状ベースライン（既存実装の事実）

| 既存 | パス / 関数 | 本タスクでの扱い |
| --- | --- | --- |
| 関数 | `apps/api/src/repository/_shared/builder.ts#buildMemberProfile(c, mid, deps?)` | `deps?` 削除、`c.var.attendanceProvider` から解決 |
| 関数 | `apps/api/src/repository/_shared/builder.ts#buildAdminMemberDetailView(c, mid, adminNotes, deps?)` | 同上 |
| 関数 | `apps/api/src/repository/_shared/builder.ts#fetchAttendanceFor(mid, provider)` | provider undefined 時の `return []` を `throw` に変更 |
| 関数 | `apps/api/src/repository/attendance.ts#createAttendanceProvider(ctx)` | 変更なし（middleware から呼び出される） |
| route | `apps/api/src/routes/me/index.ts:50` | `Variables` に `RepositoryProviderVariables` 合成、middleware 結線、call site から `{ attendanceProvider: ... }` 削除 |
| route | `apps/api/src/routes/admin/members.ts:305` | 同上 |
| middleware | （新設）`apps/api/src/middleware/repository-providers.ts` | `attendanceProviderMiddleware` を export |
| 型 | `apps/api/src/repository/_shared/builder.ts` 内 builder 用合成型 | `RepositoryProviderCtx = DbCtx & { var: RepositoryProviderVariables }` を追加。既存 `DbCtx` は変更しない |
| test | `apps/api/src/repository/_shared/builder.test.ts` | mock 注入経路を `c.var.attendanceProvider` set に統一 |
| test | `apps/api/src/repository/__tests__/builder.test.ts` | 同上 |

## 不変条件と本タスクの関係

| 不変条件 | 影響 | 守り方 |
| --- | --- | --- |
| #5 D1 直接アクセスは apps/api に閉じる | 該当 | 新規 middleware も apps/api 配下のみで完結 |
| `MemberProfile.attendance` 型契約不変 | 直接該当 | builder の戻り値 type / shape は変更しない（引数のみ縮小） |
| admin gate 中継 | 直接該当 | admin/members ルートでは admin gate middleware の **後段** に provider middleware を結線 |
| silent fallback 禁止（本タスク追加） | 直接該当 | `fetchAttendanceFor` は provider 未注入時 throw |

## automation-30 4条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | 既存 read 契約を維持しつつ、引数経路だけを置換する純粋リファクタ |
| 漏れなし | PASS | builder / middleware / 型 / 全 call site / 既存テスト改修 / ADR を対象化 |
| 整合性あり | PASS | `MemberProfile` interface 不変、D1 schema 変更なし、admin gate 結線順序を尊重 |
| 依存関係整合 | PASS | 上流 02a の `AttendanceProvider` 契約を維持。02b/02c で同パターン再利用が可能 |

## エスカレーション条件

- `RepositoryProviderCtx` 導入時、attendance を読まない builder まで `var.attendanceProvider` を要求しそうになった場合 → `DbCtx` 変更ではなく関数単位の合成型へ戻す
- admin gate middleware の結線順序が未確定 → 既存 `apps/api/src/routes/admin/members.ts` の middleware 順序を正本として踏襲

## 次フェーズへの引き渡し

Phase 2 設計書では以下を成果物化する:
- `outputs/phase-02/middleware-design.md`
- `outputs/phase-02/builder-signature.md`
- `outputs/phase-02/type-extensions.md`
- `outputs/phase-02/changed-files.md`（CONST_005 必須項目を満たす）
