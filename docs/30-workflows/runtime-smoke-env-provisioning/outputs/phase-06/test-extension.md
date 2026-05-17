# Phase 6: テスト拡充

## 追加 fail path

| # | テストケース | 配置先 |
|---|-------------|--------|
| TC-ST-U-13 | `SERVICE_TOKEN_SHARED_SECRET` 未設定で起動時に明示エラー | service-token.spec.ts |
| TC-ST-U-14 | `JWT_SIGNING_KEY` 未設定で 500 + 監査ログに記録 | service-token.spec.ts |
| TC-ST-U-15 | KV namespace 未配線で nonce 永続化失敗時 500 | service-token.spec.ts |
| TC-ST-U-16 | 同時並列リクエスト 20 件で rate limit が正確に発動 | service-token.spec.ts |
| TC-SR-06 | `SMOKE_READONLY=0` を production で渡しても強制的に readonly になる（防御的ガード） | runtime-attendance-provider.spec.sh |
| TC-SR-07 | smoke runner が curl 失敗（5xx）時に非ゼロで exit | runtime-attendance-provider.spec.sh |
| TC-AL-05 | allowlist 行の trailing whitespace / 大文字小文字差で誤マッチしない | verify-env-secrets.spec.sh |

## 回帰 guard

| # | 内容 | 配置先 |
|---|------|--------|
| REG-1 | staging 既存ジョブの挙動が production 拡張後も変わらない | 既存 staging spec 全件実行 |
| REG-2 | `scripts/smoke/provision-runtime-smoke-secrets.sh staging` が旧 `provision-staging-secrets.sh` と同じ secret 投入計画を生成する | shell snapshot test |
| REG-3 | Auth.js 既存 JWT 経路が影響を受けない（`auth.ts` のテスト全件 PASS） | 既存 `apps/api/src/lib/__tests__/auth.spec.ts` を回帰確認 |

## 補助 command

| 用途 | command |
|------|---------|
| service-token をローカルで発行（dry-run） | `bash scripts/smoke/issue-service-token.sh --env staging --role admin --dry-run`（新規 helper、optional） |
| nonce 重複検証用 KV クリア | `bash scripts/cf.sh kv:key delete --namespace-id <id> nonce:<kid>:<nonce>` |

## 完了条件

- fail path テスト 7 件追加
- 回帰 guard 3 件定義
- 補助 command 2 件定義

## 成果物

- `outputs/phase-06/test-extension.md`（本ファイル）

## 次 Phase 入力

- Phase 7: coverage 対象範囲とゴール
