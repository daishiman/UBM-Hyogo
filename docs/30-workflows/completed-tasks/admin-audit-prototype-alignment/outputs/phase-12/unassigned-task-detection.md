# Unassigned Task Detection

> workflow: admin-audit-prototype-alignment
> verified_at: 2026-05-27

## Detection 方針

実装スコープ（`apps/web/app/(admin)/admin/audit/**`, `apps/web/src/components/admin/AuditLogPanel*`, `apps/web/src/lib/admin/safe-server-fetch*`, `apps/api/src/index*`, `apps/api/src/routes/admin/audit*`, `apps/web/playwright/tests/visual-staging/admin-audit.spec.ts`）について、以下 2 軸で 2 回検証する。

1. 直接検証: 候補列挙 + scope 妥当性評価
2. 独立 grep: `TODO` / `FIXME` / `describe.skip` / `it.skip` / `test.skip` を scope 内で grep
3. OPEN Issue 関連性: `gh issue list --state open` で `admin audit` / `audit 404` 関連検索

## 候補列挙と判定

| # | 候補 | 判定 | 根拠 |
| --- | --- | --- | --- |
| 1 | staging authenticated `/admin/audit?limit=50` 200 確認 | **out-of-scope（user-gated）** | invariant: Phase 13 commit/push/PR と staging deploy/secret mutation はユーザー承認後。本 workflow の `Gate-C` で明示 |
| 2 | authenticated admin-staging-visual baseline (Linux PNG) 取得 | **out-of-scope（user-gated）** | staging deploy 完了が前提。bot push 後の空コミット retrigger は user gate（既知運用） |
| 3 | `INTERNAL_API_BASE_URL` / `INTERNAL_AUTH_SECRET` staging 設定値検証 | **out-of-scope（user-gated）** | secret mutation 不変条件。`scripts/cf.sh secret list` 実行は user 限定 |
| 4 | `AuditLogPanel` page-local h1 撤去後の他 admin パネルへの横展開 | **no-op（独立 Issue 必要時）** | 本 workflow は `/admin/audit` 単一 page のみ。他 admin pages の page-local h1 監査は別 workflow（`admin-shell-topbar-sidebar-integration` 完了済み）で既に処理済み |
| 5 | identity-conflicts 監査ログ admin UI 表示 (#987) | **既存 OPEN Issue として処理済み** | Issue #987 が起票済み（FU-AIDC-002）。本 workflow scope 外 |

## 独立 grep 結果

```
grep -rn "TODO\|FIXME\|describe.skip\|it.skip\|test.skip" \
  apps/web/app/\(admin\)/admin/audit \
  apps/web/src/components/admin/AuditLogPanel.tsx \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/src/lib/admin/safe-server-fetch.ts \
  apps/api/src/index.spec.ts \
  apps/api/src/routes/admin/audit.ts \
  apps/api/src/routes/admin/audit.contract.spec.ts \
  apps/web/playwright/tests/visual-staging/admin-audit.spec.ts
→ 0 件
```

## OPEN Issue 関連性

- `#987` (FU-AIDC-002 identity-conflicts 監査ログ admin UI 表示): identity-conflicts merge/dismiss の監査ログ表示要件で、本 workflow の `/admin/audit` UI alignment とは独立。
- `#989` (FU-AIDC-005 manualMergeReason schema 拡張): identity-conflicts schema 拡張で、`AdminAuditListResponseZ` には影響しない。

両 Issue とも本 workflow scope 外で、新規起票は不要。

## Filed unassigned tasks（明示起票）

CONST_005（user-gated boundary は未タスクとして起票しない）に従い user-gated 4 候補は Considered But Not Filed として扱う。一方、Task B 仕様 §B.4.1 の「将来の 404 切り分け強化」推奨と、Phase 11 で local 止まりだった authenticated visual baseline の staging 化は、独立スコープの後続改善として今回 2 件 Filed する。

| FU ID | Title | Spec | Issue | Priority | Wave |
| --- | --- | --- | --- | --- | --- |
| FU-AAUDIT-001 | AdminFetchError typed class 導入による 404/500 切り分け強化 | `unassigned-task/followup-001-admin-fetch-error-typed-class.md` | #991 | medium | 2-plus |
| FU-AAUDIT-002 | `/admin/audit` authenticated staging visual baseline spec | `unassigned-task/followup-002-admin-audit-authenticated-staging-visual.md` | #992 | medium | 2-plus |

## Considered But Not Filed

| # | 候補 | Status | 根拠 |
| --- | --- | --- | --- |
| 1 | staging authenticated `/admin/audit?limit=50` 200 確認 | not filed (user-gated execution) | CONST_005: Phase 13 commit/push/PR と staging deploy は user-gated。実行系の未タスク化は禁止 |
| 2 | authenticated admin-staging-visual baseline 取得実行 | not filed (user-gated execution) | bot push 後の空コミット retrigger は user gate 既知運用 |
| 3 | `INTERNAL_API_BASE_URL` / `INTERNAL_AUTH_SECRET` staging 設定値検証 | not filed (user-gated) | secret mutation 不変条件 |
| 4 | 他 admin パネルへの page-local h1 撤去横展開 | not filed (already done) | `admin-shell-topbar-sidebar-integration` 完了済 |
| 5 | identity-conflicts 監査ログ admin UI 表示 (#987) | not filed (existing open issue) | scope 外 |

## 結論

- **未タスク件数: 2（FU-AAUDIT-001 / FU-AAUDIT-002）**
- 2 回検証（candidate enumeration + independent grep）で TODO/FIXME/skip 0 件
- user-gated 候補は CONST_005 に従い not filed
