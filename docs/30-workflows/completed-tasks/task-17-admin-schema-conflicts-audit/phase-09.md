# Phase 9: 品質保証

[実装区分: 実装仕様書]

## 目的

CI gate と同等の検査を local で一括実行する。

## 検査項目

| # | 項目 | command | PASS 基準 |
|---|------|--------|---------|
| Q-01 | typecheck | `mise exec -- pnpm -F @ubm-hyogo/web typecheck` | 0 errors |
| Q-02 | lint | `mise exec -- pnpm -F @ubm-hyogo/web lint` | 0 errors / 0 warnings |
| Q-03 | unit + a11y test | `mise exec -- pnpm -F @ubm-hyogo/web test --run src/components/admin/__tests__/SchemaDiffPanel.test.tsx src/components/admin/__tests__/AuditLogPanel.test.tsx src/lib/admin/__tests__/api.test.ts app/\\(admin\\)/admin/audit/page.test.ts` | all green |
| Q-04 | OKLch tokens (HEX 直書きゼロ) | `mise exec -- pnpm verify-design-tokens` | green |
| Q-05 | build (OpenNext Workers webpack) | `mise exec -- pnpm -F @ubm-hyogo/web build` | success |
| Q-06 | grep guard: HEX 直書き | `grep -RnE "#[0-9a-fA-F]{3,8}\\b" apps/web/src/components/admin apps/web/app/\(admin\)/admin/{schema,identity-conflicts,audit}` | 0 件 |
| Q-07 | grep guard: `process.env` 直接参照 | `grep -RnE "process\\.env\\." apps/web/src/components/admin apps/web/app/\(admin\)/admin/{schema,identity-conflicts,audit}` | 0 件 (`getEnv()/getPublicEnv()` 経由のみ) |
| Q-08 | grep guard: 焼き込み URL | `grep -RnE "127\\.0\\.0\\.1|localhost:" apps/web/src/components/admin apps/web/app/\(admin\)/admin/{schema,identity-conflicts,audit}` | 0 件 |
| Q-09 | apps/api 不変 | `git diff origin/dev...HEAD -- apps/api/` | 差分 0 行 |
| Q-10 | canonical import 整合 | route pages が `apps/web/src/components/admin/*` / `apps/web/src/lib/admin/*` を参照している | 確認 |

## 失敗時の方針

- Q-01〜Q-05 fail: 該当 phase に戻って修正
- Q-06〜Q-08 grep guard fail: Phase 5 / 8 へ差し戻し
- Q-09 fail: `apps/api` を `git checkout origin/dev -- apps/api/` で復旧
- Q-10 fail: stale import を canonical admin component/helper path へ補正

## 成果物

- `outputs/phase-09/qa-result.md` — Q-01〜Q-10 の判定 + 失敗時のスクリーン

## DoD

- [ ] Q-01〜Q-10 すべて PASS
- [ ] PASS 証跡が `qa-result.md` に記録された
