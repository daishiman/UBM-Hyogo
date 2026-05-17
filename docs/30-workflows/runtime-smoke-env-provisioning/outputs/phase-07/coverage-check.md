# Phase 7: カバレッジ確認

## 対象範囲（局所指定 / Feedback BEFORE-QUIT-002 準拠）

| ファイル | 目標 line | 目標 branch | 理由 |
|---------|-----------|-------------|------|
| `apps/api/src/routes/internal/service-token.ts` | 100% | 100% | 認可境界。HMAC / ts / nonce / kid / rate limit の全分岐を網羅必須 |
| `apps/api/src/lib/hmac.ts` | 100% | 100% | timing-safe 比較の各分岐を網羅 |
| `apps/api/src/lib/service-token-audit.ts` | 100% | 100% | secret 漏洩防止のためメタデータ整形ロジックを完全網羅 |
| `scripts/smoke/runtime-attendance-provider.sh` | n/a（shell） | n/a | shell spec test で env 分岐 / readonly ガードの全 case 確認 |
| `scripts/ci/verify-env-secrets.allowlist` | n/a | n/a | 宣言ファイル。spec test で grep 確認 |

## 対象外（明示）

- `apps/api/src/routes/api/*` 既存 endpoint: 本タスクで変更しないため対象外
- `apps/web/*`: UI 変更なし

## 変更行の保護確認（Feedback 5 準拠）

| 変更箇所 | line | branch | 確認方法 |
|---------|------|--------|---------|
| service-token POST handler | 100% | 100% | vitest coverage report |
| HMAC verify | 100% | 100% | 同上 |
| smoke runner env 分岐 | 全 case | 全 case | shell spec で `case` 全ブランチを叩く |

## 完了条件

- 対象範囲が局所指定されている
- 対象外が明示されている
- 変更行の line / branch 保護が確認方法とともに記録されている

## 成果物

- `outputs/phase-07/coverage-check.md`（本ファイル）

## 次 Phase 入力

- Phase 8: リファクタ候補
