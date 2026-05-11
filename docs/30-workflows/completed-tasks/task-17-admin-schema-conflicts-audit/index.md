# task-17: admin-schema-conflicts-audit — 実装仕様書 (Phase 1-13)

> 元タスク: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/07-screens-admin/task-17-w6-par-admin-schema-conflicts-audit.md`
> 改訂日: 2026-05-10
> 実装区分: **実装仕様書** (既存 admin UI の contract hardening / 不足補強)
> implementation_mode: **existing-admin-contract-hardening-with-e2e-fixture-fix** (該当 route/component は現行実装あり。新設ではなく整合監査 + E2E 証跡補強)
> workflow_state: **implemented-local** / taskType: **implementation** / visualEvidence: **VISUAL_ON_EXECUTION**

## 概要

UBM 兵庫支部会 admin の **データ整合性 / ガバナンス系 3 画面** を current API contract に合わせて hardening する:

- `/admin/schema` — Google Form schema diff + stableKey 割当 + apply
- `/admin/identity-conflicts` — 同一人物候補ペア比較 + merge/dismiss
- `/admin/audit` — 監査ログ FilterBar + Timeline + cursor pagination

API は `apps/api/src/routes/admin/{schema,sync-schema,identity-conflicts,audit}.ts` に既存。**新 endpoint 追加禁止**。web 側は現行 `apps/web/app/(admin)/admin/*` route、`apps/web/src/components/admin/*`、`apps/web/src/lib/admin/*` を正本として整合させる。

## 不変条件

1. **D1 直アクセス禁止** — `apps/web` から `/api/admin/*` proxy / `fetchAdmin()` / `apps/web/src/lib/admin/api.ts` 経由のみ。
2. **OKLch tokens 専用** — HEX 直書き 0 件 (CI gate `verify-design-tokens`)。
3. **新 endpoint 追加禁止** — `apps/api/src/routes/admin/` の app.* 行を増やさない。
4. **task-15 layout merge 後着手** — `apps/web/app/(admin)/layout.tsx` は task-15 確定担当 (R/編集禁止)。
5. **MVP 制約** — identity-conflicts は candidate 2 件のみ。CSV export は disabled + tooltip。

## Phase ステータス

| Phase | 名称 | 成果物 | ステータス |
|------|------|------|------|
| 1 | 要件定義 | `phase-01.md` + `outputs/phase-01/` | completed |
| 2 | 設計 | `phase-02.md` + `outputs/phase-02/` | completed |
| 3 | 設計レビュー | `phase-03.md` + `outputs/phase-03/` | completed |
| 4 | テスト作成 (Red) | `phase-04.md` | completed |
| 5 | 実装 | `phase-05.md` | completed |
| 6 | テスト拡充 | `phase-06.md` | completed |
| 7 | カバレッジ確認 | `phase-07.md` | completed |
| 8 | リファクタリング | `phase-08.md` | completed |
| 9 | 品質保証 | `phase-09.md` | completed |
| 10 | 最終レビュー | `phase-10.md` | completed |
| 11 | 手動テスト | `phase-11.md` | completed |
| 12 | ドキュメント更新 | `phase-12.md` + `outputs/phase-12/` strict 7 | completed |
| 13 | PR 作成 | `phase-13.md` | blocked (user 承認後実行) |

## 関連

- 元 workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/`
- スコープ: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md`
- specs: `docs/00-getting-started-manual/specs/11-admin-management.md`
- 並列タスク: task-16 (tags/meetings/requests)
- 依存: task-09 (Tailwind), task-10 (UI primitives), task-15 (admin layout/dashboard/members)
- 後続: task-18 (Playwright smoke / `verify-design-tokens` / a11y regression)
