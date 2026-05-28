# System spec update summary

本タスクが正本仕様 (`docs/00-getting-started-manual/specs/`) に与える影響。

## 影響する spec

| spec file | 影響 | 更新要否 | 根拠 |
|-----------|------|---------|------|
| `docs/00-getting-started-manual/specs/00-overview.md` | 機能数・スコープ不変 | **不要** | 既存 `/admin/identity-conflicts` route の UI 整合と staging 404 修復のみ。新規機能なし |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | API endpoint surface 不変 (`ListIdentityConflictsResponse` 既存型をそのまま使用) | **不要** | 不変条件「既存 API のみ接続」遵守 |
| `docs/00-getting-started-manual/specs/02-auth.md` | 認証フロー (Auth.js + admin gate) 不変 | **不要** | (B) 修復は admin auth を変更しない (Phase 9 §3) |
| `docs/00-getting-started-manual/specs/08-free-database.md` | D1 schema / migration 仕様 不変 | **不要** | (B) H3 (migration 未適用) が真因でも既存 migration の **再適用** であり schema 追加なし |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md` | MVP 認証方針 不変 | **不要** | identity-conflicts は admin 機能で MVP 認証 scope 外 |
| `docs/00-getting-started-manual/specs/design-tokens.md` | OKLch token / primitive 不変 (既存 token のみ参照) | **不要** | (A) は既存 `AdminPageHeader` / `EmptyState` / `AdminSectionErrorClient` primitive を流用 |

## 正本 spec 更新総括

**N/A (本サイクルでは specs/ の正本更新を伴わない)**

理由:

1. (A) UI 改修は既存 primitive (`AdminPageHeader`) への置換であり、design language の正本 (`design-tokens.md` / `claude-design-prototype/`) は既に他 admin route で確立済
2. (B) 404 修復は infrastructure / proxy 層の bugfix であり API schema / auth / D1 schema を変更しない
3. identity-conflicts 機能の **存在** は既に `01-api-schema.md` / `02-auth.md` の admin route 一覧に内包されており追加宣言不要

## aiworkflow-requirements skill への影響 (same-wave 実施済)

- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` に本 workflow root を 1 行追加済
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` に同上追加済
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` に entry 追加済
- `.claude/skills/aiworkflow-requirements/references/workflow-admin-identity-conflicts-prototype-alignment-and-404-fix-artifact-inventory.md` を新規作成済
- `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` に追記済
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json` / `topic-map.md` は差分肥大化を避け本 wave では再生成しない。手動導線 5 点で正本到達性を確保

## 不変条件への影響

| CLAUDE.md 不変条件 | 影響 | 対応 |
|--------------------|------|------|
| #3 responseEmail は system field | 影響なし | UI で raw email 表示 0 件 (Phase 9 §2) |
| #4 admin-managed data 分離 | 影響なし | identity-conflicts は admin-managed のまま |
| #5 D1 直接アクセス禁止 | 影響なし | `safeServerFetch` 経由維持 (Phase 9 §1) |
| #10 admin mutation hook 統一 | 影響なし | `@/features/admin/hooks/useAdminMutation` 維持 |
| #11 auth fail-closed (`getAuthEnv()` safeParse) | 影響なし | (B) 修復で auth 経路変更なし |

## skill feedback への影響

`skill-feedback-report.md` で扱う (本ファイルは正本 spec の話のみに集中)。
