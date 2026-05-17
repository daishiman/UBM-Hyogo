# Phase 8: リファクタリング

## 対象 / Before / After / 理由

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `scripts/smoke/runtime-attendance-provider.sh` の env 分岐 | `if [ "$ENV" = "staging" ]` の早期 return | `case "$ENV" in ... esac` の明示分岐 | production 追加で分岐対称性が必要 |
| `scripts/smoke/provision-staging-secrets.sh` | staging 固有の関数名 / 変数名 | `provision-runtime-smoke-secrets.sh` の env 引数化 | 名称が staging 限定だと production scope での流用性が低い |
| `apps/api/src/routes/` ディレクトリ構造 | `routes/api/*` のみ | `routes/internal/*` を新設 | 公開 API（OAuth / 認証経由）と internal（HMAC 経由）の責務分離 |
| audit_log metadata 整形 | endpoint 内インライン | `service-token-audit.ts` に集約 | secret 混入リスクを単一箇所に局所化 |

## navigation drift 除去

- 旧 `provision-staging-secrets.sh` への参照（runbook / workflow / README）を `grep -rn "provision-staging-secrets"` で全件洗い出し、新名称に統一する手順を `phase-05/implementation-plan.md` に明記済み

## duplicate 排除

- HMAC 検証ロジックを各 handler に書かず `hmac.ts` 1 箇所に集約
- audit log 書き込みも `service-token-audit.ts` 1 箇所に集約

## 完了条件

- リファクタ対象が表形式で記録されている
- navigation drift / duplicate 排除方針が明記されている

## 成果物

- `outputs/phase-08/refactoring.md`（本ファイル）

## 次 Phase 入力

- Phase 9: 品質保証ゲート
