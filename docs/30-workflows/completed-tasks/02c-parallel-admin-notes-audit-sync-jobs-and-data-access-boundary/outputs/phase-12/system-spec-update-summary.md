# system-spec-update-summary

02c の決定が正本仕様にどう反映されたかをまとめる。旧 `doc/00-getting-started-manual/specs/` への追記提案だけでは stale になるため、本 Phase 12 で `.claude/skills/aiworkflow-requirements/references/database-admin-repository-boundary.md` を追加し、実装済み repository と境界を正本仕様へ同期した。

| spec ファイル | 影響 | 反映内容 | 状態 |
| --- | --- | --- | --- |
| `database-admin-repository-boundary.md` | admin repository / D1 boundary の正本 | `adminUsers` / `adminNotes` / `auditLog` / `syncJobs` / `magicTokens`、apps/web 境界、下流入口を新規仕様化 | 反映済み |
| `database-implementation.md` family | D1 repository 実装詳細 | 新規 detail spec を parent として紐付け | 反映済み |
| auth 系仕様 | admin gate / Magic Link | admin gate は `adminUsers.isActiveAdmin`、Magic Link は `magicTokens.issue/verify/consume` を使う前提を新規 detail spec に集約 | 反映済み |
| admin management 系仕様 | admin notes / audit log | adminNotes は public/member view に混ぜず、auditLog は append-only と明記 | 反映済み |

## 共通 Note 候補（README または specs/ 共通頭書）

> apps/web から D1 への直接アクセスは現時点では `scripts/lint-boundaries.mjs` で禁止し、dependency-cruiser CI gate は 09a / Wave 2 統合で有効化する。データ取得は必ず `apps/api` の Hono endpoint 経由。

## 影響なし（再確認）

- `00-overview.md`、`01-api-schema.md`、`03-...` 等は今回の 02c で変更なし。
- secret 一覧は無変更（02c では新規 secret なし、Magic Link HMAC key は 05b で導入）。
