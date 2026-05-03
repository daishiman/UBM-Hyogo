# Phase 13: PR 作成 — 実行記録（テンプレート）

## 実装区分

[実装区分: 実装仕様書]

## Status

- State: `pending_user_approval`
- approval gate: user 明示 GO がない限り commit / push / PR を実行しない

## approval gate チェックリスト

- [ ] Phase 10 GO/NO-GO が GO
- [ ] Phase 11 manual evidence が `outputs/phase-11/` に揃う（screenshot 3 / curl matrix / wrangler tail / axe）
- [ ] Phase 12 strict 7 files が `outputs/phase-12/` に揃う
- [ ] user 明示 GO

## 必要 outputs

- `outputs/phase-13/local-check-result.md` — typecheck / lint / test の実測 exit code
- `outputs/phase-13/change-summary.md` — 追加 / 変更 / DDL / docs を実ファイル単位で列挙
- `outputs/phase-13/pr-info.md` — PR タイトル / 本文 / Refs #194 / Test plan
- `outputs/phase-13/pr-creation-result.md` — `gh pr create` 結果 URL

## PR template（再掲）

```markdown
## Summary
- 03b で残った EMAIL_CONFLICT を admin 手動 merge で解消する経路を追加
- /admin/identity-conflicts に候補一覧 / 二段階確認 / dismiss UI を実装
- POST /admin/identity-conflicts/:id/merge は D1 transactional batch で identity_aliases と audit ledger を atomic に記録
- identity_merge_audit / identity_aliases / identity_conflict_dismissals DDL を追加し audit_log と二重記録

Refs #194

## Test plan
- [ ] unit (identity-conflict-detector / maskResponseEmail)
- [ ] integration (identity-merge transaction / dismiss UNIQUE)
- [ ] contract (/admin/identity-conflicts response shape)
- [ ] authorization (admin / non-admin)
- [ ] manual smoke + screenshot（PII マスク確認）
```

## 境界

本ファイルは PR 実行前の template として保持する。実 PR URL は user GO 後に
`pr-creation-result.md` に追記する。
