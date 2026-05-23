---
phase: 13
title: Commit / PR Draft
workflow_id: ut-25-deriv-02-sa-key-expiry-monitoring
status: draft
---

# Phase 13: Commit / PR Draft — SA key 失効監視

[実装区分: 実装仕様書]

## 1. ブランチ命名

- `feat/ut-25-deriv-02-sa-key-expiry-monitoring`

## 2. コミット分割案

CONST_007（1 サイクル完了前提）に基づき、レビュー容易性と revert 容易性のバランスから以下 3 コミットを推奨:

1. `feat(api/monitoring): add sheets-auth classifier and structured logger` — step-01 / step-02 + spec
2. `feat(api/monitoring): healthcheck cron piggyback and sync job injection` — step-03 / step-04 / step-05 + spec
3. `feat(api/monitoring): alert-relay sheets-auth payload + rollback runbook cross-ref` — step-06 / step-07

各コミットの末尾に:

```
Refs: #243
Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

## 3. PR 草案

### 3.1 base / head

- base: `dev`
- head: `feat/ut-25-deriv-02-sa-key-expiry-monitoring`

### 3.2 タイトル

```
feat(api/monitoring): SA key expiry detection via Sheets 401/403 classifier and alert-relay
```

### 3.3 本文テンプレ

```md
## Summary

- Sheets API 401（key 無効）/ 403（権限剥奪）を区別する純関数 classifier と構造化 logger を新設
- 既存 `*/15 * * * *` cron に sheets-auth-healthcheck を相乗り実装（**新規 cron 追加なし**、free plan 3 本上限維持）
- alert-relay payload に `category: 'sheets-auth'` を拡張し、UT-25 rollback-runbook への逆参照を埋め込み

Refs: #243
Workflow: `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/`

## Scope

| 含む | 含まない |
| --- | --- |
| classifier / logger / healthcheck / sync ジョブ catch injection / alert-relay payload 拡張 / rollback-runbook 逆参照 | rotation SOP (UT-25-DERIV-01)、Secrets 監査ログ (UT-25-DERIV-03)、quota 監視 (UT-26+) |

## 不変条件

- [x] `apps/api/wrangler.toml` の `crons` 配列を 3 本のまま維持（diff で確認）
- [x] 401 / 403 を error code レベルで区別
- [x] 既存 throw 経路を破壊しない（catch → log → rethrow）
- [x] `scripts/cf.sh` 経由のみ。`wrangler` 直接実行なし
- [x] 新規 test は `*.spec.ts` のみ

## Test plan

- [ ] `mise exec -- pnpm typecheck`
- [ ] `mise exec -- pnpm lint`
- [ ] `mise exec -- pnpm --filter @ubm/api test`
- [ ] `bash scripts/verify-pr-ready.sh`
- [ ] staging で意図的失効による 401 / 403 alert 発火を確認
- [ ] staging で 500 / 404 が alert 対象外であることを確認
- [ ] production deploy 後 24 時間誤陽性なし観測

## Evidence

`docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/` 配下:
- typecheck.log / lint.log / vitest-api.log
- staging-tail-401.log / staging-tail-403.log / staging-tail-other.log
- alert-received.md / rollback-runbook.diff / deriv-01-handoff.md
- wrangler-cron.diff（要素数 3 のまま）

## Rollback

異常検知時は本 PR の revert + `bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env production` を実行。secrets 自体は変更しないため secret rollback は不要。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 4. PR 作成コマンド（user 承認後のみ）

```bash
gh pr create --base dev --head feat/ut-25-deriv-02-sa-key-expiry-monitoring \
  --title "feat(api/monitoring): SA key expiry detection via Sheets 401/403 classifier and alert-relay" \
  --body-file docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-13/pr-body.md
```

## 5. ガード

- 本ワークフロー仕様作成段階では **commit / push / PR 作成は実行しない**
- 実装 commit / PR は user 明示承認後のみ
- production deploy は PR merge 後の手動 step
