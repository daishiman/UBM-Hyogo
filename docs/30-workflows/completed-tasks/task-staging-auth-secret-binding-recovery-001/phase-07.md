# Phase 7: ローカル検証

[実装区分: 実装仕様書]

## 1. 検証コマンドと期待値

| コマンド | 期待値 | 証跡 |
|----------|--------|------|
| `mise exec -- pnpm typecheck` | exit 0 | `outputs/phase-07/typecheck.log` |
| `mise exec -- pnpm lint` | exit 0 | `outputs/phase-07/lint.log` |
| `mise exec -- pnpm --filter @ubm-hyogo/api test` | 全 spec PASS（TC-MW-01〜03 / TC-ENV-01〜02 / TC-CONTRACT-01 含む） | `outputs/phase-07/test.log` |
| `bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh` | TC-SMOKE-01/02 PASS | `outputs/phase-07/smoke-test.log` |
| `echo -n "" \| bash scripts/cf.sh secret put AUTH_SECRET --env staging --dry-run` | exit 78 + stderr "refusing empty stdin" | `outputs/phase-07/cfsh-empty.log` |
| `echo -n "validvalue" \| bash scripts/cf.sh secret put AUTH_SECRET --env staging --dry-run` | exit 0 | `outputs/phase-07/cfsh-valid.log` |

## 2. カバレッジ範囲

- 対象: `apps/api/src/middleware/require-admin.ts`（line 100-110 周辺 + AUTH_SECRET 関連 branch）
- 対象: `apps/api/src/env.ts`（AUTH_SECRET schema branch）
- 対象外: 既存の JWT verify / cookie 抽出 logic（変更なし）

[Feedback BEFORE-QUIT-002] 全ファイル一律 coverage ではなく、変更行の line + branch coverage を実測し evidence に残す。

## 3. Phase 7 DoD

- 全コマンド exit 0（cfsh-empty のみ exit 78 期待）
- coverage 実測値が evidence に記録されている
- 変更行の line / branch カバレッジ 100%
