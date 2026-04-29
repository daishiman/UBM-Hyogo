# Phase 8 — DRY 化

## 共通化候補

| 重複 | 共通化先 |
|---|---|
| `interface Env extends AdminGateEnv { readonly DB: D1Database }` | 各 route で再定義（型のため import コストの方が高い → 重複容認） |
| `c.req.json().catch(() => null)` + `safeParse` | route 内で局所化（4 行のため抽象化しない） |
| `auditLog.append({...})` の boilerplate | `apps/api/src/routes/admin/_audit.ts` に `recordAdminAction(c, action, targetType, targetId, before, after)` ヘルパを切り出すのは過剰。inline で OK |
| router factory の `app.use("*", adminGate)` 行 | 各 route の先頭で繰り返す（mount 単位のガード意図を可視化するため重複容認） |

→ 本タスク範囲では「**抽象化しない**」が現時点の最適。3 行未満の重複に helper を作ると意図が見えなくなる。

## 実際に切り出した共通

なし。既存の `_shared/db.ts` の `ctx({ DB })` と `repository/_shared/sql.ts` の `placeholders` を流用するのみ。
