# Phase 3: 影響範囲・依存マップ

[実装区分: 実装仕様書]

## 1. 変更対象ファイル俯瞰

| spec | 種別 | path |
|------|------|------|
| spec-01 | runbook 追加 | `docs/30-workflows/task-staging-auth-secret-binding-recovery-001/specs/spec-01-immediate-recovery.md`（仕様書） |
| spec-02 | 編集 | `apps/api/src/middleware/require-admin.ts` |
| spec-02 | 編集 | `apps/api/src/env.ts` |
| spec-02 | 新規/編集 | `apps/api/src/middleware/require-admin.spec.ts` |
| spec-02 | 編集 | `apps/api/src/env.spec.ts` |
| spec-03 | 編集 | `.github/workflows/backend-ci.yml` |
| spec-03 | 編集 | `scripts/smoke/runtime-attendance-provider.sh` |
| spec-03 | 新規/編集 | `scripts/smoke/__tests__/runtime-attendance-provider.test.sh` |
| spec-04 | 編集 | `scripts/cf.sh` |
| 関連 | 編集 | `apps/api/src/routes/admin/members.contract.spec.ts`（auth misconfigured body shape 検証追加） |
| 関連 lessons | 編集 | `docs/30-workflows/completed-tasks/task-runtime-smoke-admin-members-500-recovery-001/outputs/lessons-learned-auth-secret-true-cause.md`（新規 1 ファイル / 当該 workflow 内完結） |

## 2. 依存マップ

```
┌───────────────────────────────────────────┐
│ 1Password: op://Vault/UBM-Hyogo-Staging/  │
│            AUTH_SECRET (値の正本)         │
└────────────┬──────────────────────────────┘
             │ scripts/cf.sh secret put (spec-04 で empty guard)
             ▼
┌───────────────────────────────────────────┐
│ Cloudflare Secrets (ubm-hyogo-api-staging)│
│   ▲ secret list で name 確認              │
└────────────┬──────────────────────────────┘
             │ wrangler binding
             ▼
┌───────────────────────────────────────────┐
│ apps/api/src/env.ts (spec-02 zod 検証)   │
│   ▲ boot 時 AUTH_SECRET 必須              │
└────────────┬──────────────────────────────┘
             │ c.env.AUTH_SECRET
             ▼
┌───────────────────────────────────────────┐
│ require-admin.ts (spec-02 構造化ログ)     │
│   ▲ falsy 時 logError + 500               │
└────────────┬──────────────────────────────┘
             │
             ▼
┌───────────────────────────────────────────┐
│ /admin/* endpoint                         │
└────────────┬──────────────────────────────┘
             │
             ▼
┌───────────────────────────────────────────┐
│ runtime-attendance-provider.sh            │
│   (spec-03 auth misconfigured 検知分岐)   │
└────────────┬──────────────────────────────┘
             │
             ▼
┌───────────────────────────────────────────┐
│ backend-ci.yml                            │
│   deploy-staging → auth-gate smoke        │
│   → runtime smoke staging (spec-03)       │
└───────────────────────────────────────────┘
```

## 3. 既存テスト・CI への影響

- `require-admin.spec.ts`: 既存テストがあれば 3 ケース（undefined / "" / valid）の matrix に再構成
- `members.contract.spec.ts`: PR #854 で追加された defensive 系テストは維持。auth misconfigured shape 検証を 1 ケース追加
- `backend-ci.yml`: 新規 step は failure mode を明確化（auth-gate smoke の fail は AUTH_SECRET binding 起因と即時判定可能）
- `scripts/cf.sh`: 既存呼び出し（d1 / deploy 等）は影響なし、`secret put` のみ guard 追加

## 4. spec 並列実行可能性

- spec-01 は **user 明示承認後の運用作業**（コード変更なし） → 並列で実装着手しても commit 対象は仕様書のみ
- spec-02 / spec-03 / spec-04 は独立した path のため**並列実装可能**
- 統合確認は Phase 7 ローカル検証 + Phase 8 staging 検証で行う

## 5. Phase 3 DoD

- 変更対象ファイル一覧が確定
- 1Password → Cloudflare Secrets → env.ts → middleware → endpoint → smoke → CI の依存連鎖が図示済み
- spec 並列性が明示
